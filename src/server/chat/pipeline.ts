import { computeMissing } from "@/domain/missing";
import { applyCommand, pruneEmptyGroups } from "@/domain/apply";
import { COMMAND_OPS, isFlowCommand, isStructural, parseCommand, toFlowOp } from "@/domain/commands";
import type { FlowOp } from "@/domain/flows";
import { emptyState, type DiagramState, type Warning } from "@/domain/types";
import type { ClefClient, Intent } from "@/server/llm/clef";
import { createJsonlParser } from "@/server/llm/jsonl";
import { createThinkStripper } from "@/server/llm/think";
import type { QwenClient } from "@/server/llm/qwen";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";
import { applyFlowOps, listFlows } from "@/server/flows";

import { SESSION_GONE_MESSAGE, sessionPayload, type ChatEvent, type MessageMeta } from "./events";
import { BUSY_MESSAGE } from "./busy";
import { withDiagramLock } from "./lock";
import { resolveIntent } from "./intent";
import { createMessage, listMessages } from "./messages";
import { normalizeAiCommand } from "./normalize";
import { checkWarnings } from "./warnings";
import { createSkipTally, skipKey } from "./skips";
import { buildMessages, parseMentions } from "./prompt";
import { createSession, getSession, touchSession } from "./sessions";

export interface ChatDeps {
  qwen: QwenClient | null;
  clef: ClefClient;
  /** 차례 전체 상한(기본 240초, 이어 쓰기 포함). 테스트에서만 바꾼다. */
  turnTimeoutMs?: number;
}

/**
 * `busy` 면 잠금을 얻지 못한 것, `session_gone` 이면 잠금을 기다리는 사이 세션이 지워진 것(둘 다 이미 `error`
 * 이벤트를 보냈고 아무것도 저장하지 않았다). 호출자는 409·404 로 바꾼다.
 */
export type ChatTurnResult = { status: "ok" } | { status: "busy" } | { status: "session_gone" };

export { BUSY_MESSAGE };
export const AI_UNAVAILABLE_MESSAGE = "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.";
export const HISTORY_REPLY = "변경 이력은 오른쪽 '이력' 탭에서 보고 되돌릴 수 있어요.";
export const LAYOUT_REPLY = "구성도를 다시 정렬했어요.";
export const TIMEOUT_MESSAGE = "응답 시간이 너무 길어 중단했어요.";
export const GENERIC_ERROR_MESSAGE = "응답을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.";

const TURN_TIMEOUT_MS = 240_000;
/** 출력 한도(finish_reason "length")로 끊긴 명령 차례를 이어 쓰게 하는 최대 횟수. 처음 요청까지 최대 1+2 번 부른다. */
export const MAX_CONTINUATIONS = 2;
export const HISTORY_FETCH = 40;
const OP_MAX = 40;

/**
 * 구성도 대화의 어느 줄기에 쌓을지: 없으면 기본 대화(session_id null), `{ id }` 면 그 구성도 대화 세션,
 * `"new"` 면 이 첫 메시지로 새 구성도 대화 세션을 만든다(만들면 session 이벤트로 id 를 알린다).
 */
export type ChatSessionTarget = { id: string } | "new";

interface TurnArgs {
  userId: string;
  diagramId: string;
  text: string;
  session?: ChatSessionTarget;
  signal: AbortSignal;
  emit(e: ChatEvent): void;
}

/**
 * 구성도 대화 한 차례. 구성도는 하나라 세션이 달라도 같은 상태를 바꾸고, 잠금도 구성도 하나에 하나다.
 * 남의 구성도·세션은 NotFoundError, 노드 질문 세션 id 면 ValidationError 를 던진다.
 */
export async function runChatTurn(args: TurnArgs, deps: ChatDeps): Promise<ChatTurnResult> {
  await getOwnedDiagram(args.userId, args.diagramId); // NotFoundError 는 그대로 던진다
  const target = args.session;
  if (target !== undefined && target !== "new") {
    const row = await getSession(args.diagramId, target.id);
    if (!row) throw new NotFoundError();
    // 노드 질문 세션은 /ask 로만 이어 간다(구성을 바꾸지 않는다).
    if (row.kind !== "diagram") throw new ValidationError("구성도 대화 세션이 아니에요");
  }
  const emit = guardEmit(args.emit);
  const turnArgs = { ...args, emit };
  const locked = await withDiagramLock(args.diagramId, () => sessionTurn(turnArgs, deps));
  if (!locked.ok) {
    emit({ t: "error", message: BUSY_MESSAGE });
    return { status: "busy" };
  }
  if (locked.value === "session_gone") {
    emit({ t: "error", message: SESSION_GONE_MESSAGE });
    return { status: "session_gone" };
  }
  return { status: "ok" };
}

/** 전송이 끊겨 emit 이 던져도 차례는 끝까지 돌아 버전·메시지를 저장하게 감싼다. */
export function guardEmit(emit: (e: ChatEvent) => void, label = "chat"): (e: ChatEvent) => void {
  let emitFailed = false;
  return (e) => {
    try {
      emit(e);
    } catch (err) {
      if (!emitFailed) console.error(`${label} emit failed`, err);
      emitFailed = true;
    }
  };
}

/** 차례 신호: 호출자 신호(연결 끊김) + 차례 전체 상한. */
export function turnSignals(outer: AbortSignal, deps: ChatDeps): { signal: AbortSignal; timeout: AbortSignal } {
  const timeout = AbortSignal.timeout(deps.turnTimeoutMs ?? TURN_TIMEOUT_MS);
  return { signal: AbortSignal.any([outer, timeout]), timeout };
}

/** 스트리밍 실패를 중단·오류로 나누고 알맞은 error 이벤트를 보낸다(원래 오류 글은 숨긴다). */
export function streamFailure(
  err: unknown,
  s: { outer: AbortSignal; signal: AbortSignal; timeout: AbortSignal },
  emit: (e: ChatEvent) => void,
  label = "chat",
): "aborted" | "error" {
  if (s.signal.aborted) {
    if (s.timeout.aborted && !s.outer.aborted) emit({ t: "error", message: TIMEOUT_MESSAGE });
    return "aborted";
  }
  console.error(`${label} turn failed`, err);
  emit({ t: "error", message: GENERIC_ERROR_MESSAGE });
  return "error";
}

const abortError = () => new DOMException("The operation was aborted.", "AbortError");

function opName(raw: unknown): string {
  const op = raw && typeof raw === "object" ? (raw as { op?: unknown }).op : undefined;
  return typeof op === "string" ? op.slice(0, OP_MAX) : "?";
}

const KNOWN_OPS: ReadonlySet<string> = new Set(COMMAND_OPS);
const SKIP_PREFIX = "건너뜀: ";
const SKIP_MAX = 120;

/** 정리로 사라진 그룹 id 를 깊은 것부터(자식이 부모보다 먼저) 돌려준다. */
function prunedOrder(before: DiagramState, after: DiagramState): string[] {
  const depth = (id: string) => {
    let d = 0;
    for (let p = before.groups[id]?.parent ?? null; p !== null; p = before.groups[p]?.parent ?? null) d++;
    return d;
  };
  return Object.keys(before.groups)
    .filter((id) => !Object.hasOwn(after.groups, id))
    .sort((a, b) => depth(b) - depth(a));
}

/** 잠금 안: 새 세션이면 만들고 알린 뒤 차례를 돌리고, 세션이면 최근 이어간 순서를 갱신한다. */
async function sessionTurn(args: TurnArgs, deps: ChatDeps): Promise<"ok" | "session_gone"> {
  const target = args.session;
  if (target === undefined) {
    await lockedTurn(args, null, false, deps);
    return "ok";
  }
  let sessionId: string;
  if (target === "new") {
    const row = await createSession(args.diagramId, { kind: "diagram" }, args.text);
    args.emit({ t: "session", session: sessionPayload(row) });
    sessionId = row.id;
  } else {
    // 잠금 전에 확인했지만, 잠금을 기다리는 사이 지워졌을 수 있다(삭제도 같은 잠금을 쓴다). 그러면 아무것도 쓰지 않는다.
    if (!(await getSession(args.diagramId, target.id))) return "session_gone";
    sessionId = target.id;
  }
  // 예상치 못한 예외로 끝나도 세션 순서(최근 이어감)는 갱신한다.
  try {
    await lockedTurn(args, sessionId, target !== "new", deps);
    return "ok";
  } finally {
    await touchSession(sessionId).catch((err) => console.error("chat touch session failed", err));
  }
}

/** sessionId 가 null 이면 기본 대화. followUp 이 false 인 새 세션은 기록이 없어 읽지 않는다. */
async function lockedTurn(args: TurnArgs, sessionId: string | null, followUp: boolean, deps: ChatDeps): Promise<void> {
  const { diagramId, emit } = args;
  const { signal, timeout } = turnSignals(args.signal, deps);

  const latest = await getLatestState(diagramId);
  let state: DiagramState = latest?.state ?? emptyState();
  const turnStartState = state;
  const prevWarnings = latest?.state.warnings; // 차례 시작 상태의 경고
  // 이 대화 줄기만 본다(다른 구성도 대화 세션·질문 세션 글은 섞지 않는다).
  const history =
    sessionId === null || followUp
      ? (await listMessages(diagramId, HISTORY_FETCH, sessionId))
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];
  const lastAssistant = history.findLast((m) => m.role === "assistant")?.content;
  const { clean, mentions } = parseMentions(args.text, state);
  const userMsg = await createMessage(diagramId, "user", args.text, { mentions: mentions.map((m) => m.id) }, sessionId);

  const counts = () => ({ nodes: Object.keys(state.nodes).length, edges: Object.keys(state.edges).length });

  if (!deps.qwen) {
    emit({ t: "start", messageId: userMsg.id, intent: null });
    emit({ t: "error", message: AI_UNAVAILABLE_MESSAGE });
    // 응답 메시지는 남기지 않는다. 클라이언트가 깨끗이 정리하도록 done 을 보낸다.
    emit({ t: "done", version: null, status: "complete", applied: 0, changed: 0, skipped: 0, missing: computeMissing(state).count, ...counts(), assistantMessageId: "" });
    return;
  }

  // 차례 시작 상태의 열린(모름 아닌) 빠진 정보. 값만 알려 주는 답을 분류·반영하는 데 쓴다.
  const openMissing = computeMissing(state).items.filter((m) => !m.unknown);
  const nameOf = (id: string) => state.nodes[id]?.label ?? state.groups[id]?.label ?? id;
  const openItems = openMissing.map((m) => {
    if (m.targetKind === "node") return `${nameOf(m.targetId)} ${m.label}`;
    const e = state.edges[m.targetId];
    return e ? `${nameOf(e.from)} → ${nameOf(e.to)} ${m.label}` : `${m.targetId} ${m.label}`;
  });
  const intent: Intent | null = await resolveIntent(args.text, () =>
    deps.clef.classifyIntent(clean, { lastAssistant, openItems }, signal),
  );
  emit({ t: "start", messageId: userMsg.id, intent });

  const says: string[] = [];
  let answer = "";
  let applied = 0;
  let changed = 0; // 구성을 바꾼 명령만(가정·흐름 제외)
  let assumed = 0; // 적용한 가정 명령
  // 흐름 명령은 구성도 상태에 적용하지 않고 모았다가 차례 끝 상태로 흐름 저장소에 적용한다(이어 쓰기 사이에도 모은다).
  const pendingFlowOps: FlowOp[] = [];
  let flowsSaved = 0;
  const tally = createSkipTally();
  let status: "complete" | "aborted" | "error" = "complete";
  const skip = (reason: string, key: string) => {
    tally.add(key);
    emit({ t: "skip", reason: (SKIP_PREFIX + reason).slice(0, SKIP_MAX) });
  };

  if (intent === "history") {
    says.push(HISTORY_REPLY);
    emit({ t: "say", text: HISTORY_REPLY });
    emit({ t: "open_history" });
  } else if (intent === "layout") {
    // 배치는 클라이언트가 한다. 구성은 그대로라 AI 를 부르지 않고 버전도 만들지 않는다.
    says.push(LAYOUT_REPLY);
    emit({ t: "say", text: LAYOUT_REPLY });
    emit({ t: "relayout" });
  } else {
    const answerMode = intent === "question" || intent === "other";
    // 흐름 목록을 못 읽어도 차례는 이어 간다(흐름 없이 프롬프트를 만든다).
    const flows = await listFlows(args.userId, diagramId).catch((err) => {
      console.error("chat list flows failed", err);
      return [];
    });
    const messages = buildMessages({ intent, text: clean, state, mentions, history, missing: openMissing, flows });
    emit({ t: "status", phase: "thinking" });

    const onLine = (raw: unknown) => {
      if (signal.aborted) return;
      if (raw && typeof raw === "object" && (raw as { op?: unknown }).op === "say") {
        const text = (raw as { text?: unknown }).text;
        if (typeof text === "string" && text.trim() !== "") {
          says.push(text);
          emit({ t: "say", text });
        } else skip("내용이 없는 안내 줄", skipKey("empty_say"));
        return;
      }
      const op = opName(raw);
      if (!KNOWN_OPS.has(op)) return skip(`지원하지 않는 명령(${op})`, skipKey("unknown_op", op));
      const parsed = parseCommand(normalizeAiCommand(raw));
      if (!parsed.ok) return skip(`형식이 맞지 않는 명령(${op})`, skipKey("invalid", op, parsed.error));
      if (isFlowCommand(parsed.cmd)) {
        pendingFlowOps.push(toFlowOp(parsed.cmd));
        if (applied === 0) emit({ t: "status", phase: "drawing" });
        applied++;
        emit({ t: "cmd", cmd: parsed.cmd });
        return;
      }
      const r = applyCommand(state, parsed.cmd);
      if (!r.ok) return skip(`적용할 수 없는 명령(${op}) ${r.error}`, skipKey("apply", op, r.error));
      state = r.state;
      if (applied === 0) emit({ t: "status", phase: "drawing" });
      applied++;
      if (isStructural(parsed.cmd)) changed++;
      else assumed++;
      emit({ t: "cmd", cmd: parsed.cmd });
    };
    const onBad = () => {
      if (!signal.aborted) skip("읽을 수 없는 줄", skipKey("bad_json"));
    };

    // 답변 경로: <think> 를 지운 글만 보내고, 보낸 글 그대로 모아 저장한다(중단·오류여도).
    let answering = false;
    let shown = "";
    const stripper = createThinkStripper((text) => {
      if (signal.aborted) return;
      if (!answering) {
        answering = true;
        emit({ t: "status", phase: "answering" });
      }
      shown += text;
      emit({ t: "answer", delta: text });
    });
    try {
      if (answerMode) {
        await deps.qwen.streamCompletion(messages, {
          signal,
          onDelta(delta) {
            if (!signal.aborted) stripper.push(delta);
          },
        });
        if (signal.aborted) throw abortError();
        stripper.end();
      } else {
        // 명령 경로: 출력 한도로 끊기면(finish_reason "length") 지금까지 반영한 상태를 다시 보내 이어 쓰게 한다.
        // 같은 차례라 cmd 는 계속 같은 스트림으로 가고, 버전은 차례 끝에 한 번만 만든다.
        let msgs = messages;
        for (let part = 1; ; part++) {
          const appliedBefore = applied;
          const parser = createJsonlParser(onLine, onBad);
          const r = await deps.qwen.streamCompletion(msgs, {
            signal,
            onDelta(delta) {
              if (!signal.aborted) parser.push(delta);
            },
          });
          if (signal.aborted) throw abortError();
          // 이번 호출이 아무것도 반영하지 못했으면(같은 걸 되풀이하는 등) 더 이어 쓰지 않는다.
          const more = r.finishReason === "length" && part <= MAX_CONTINUATIONS && applied > appliedBefore;
          // 이어 쓸 때만 끊긴 마지막 줄을 조용히 버린다(마지막 시도까지 끊기면 지금처럼 건너뜀으로 센다).
          parser.end({ dropPartial: more });
          if (!more) break;
          const n = part + 1;
          console.info("[chat] output cut by length, continuing", { diagramId, part: n });
          emit({ t: "status", phase: "drawing", part: { n, of: MAX_CONTINUATIONS + 1 } });
          msgs = buildMessages({ intent, text: clean, state, mentions, history, missing: openMissing, continuation: true, flows });
        }
      }
    } catch (err) {
      status = streamFailure(err, { outer: args.signal, signal, timeout }, emit);
    }
    answer = shown.trim();
  }

  let version: number | null = null;
  let fresh: Warning[] = [];
  // 구성도를 바꾼 명령(구성·가정)이 있을 때만 정리·점검·버전을 한다. 흐름만 바꾼 차례는 버전을 만들지 않는다.
  if (changed + assumed > 0) {
    // 이번 차례에 비게 된 영역을 지운다. 클라이언트도 같은 명령으로 맞추도록 안쪽부터 보낸다.
    const pruned = pruneEmptyGroups(turnStartState, state);
    for (const id of prunedOrder(state, pruned)) emit({ t: "cmd", cmd: { op: "remove_group", id } });
    state = pruned;
    // 변경이 있었던 차례만 점검한다. 중단·오류면 이미 중단된 신호로 불러 코드 규칙만 받는다.
    if (status === "complete") emit({ t: "status", phase: "checking" });
    const checkSignal = status === "complete" ? signal : AbortSignal.abort();
    const checked = await checkWarnings(state, prevWarnings, { clef: deps.clef, qwen: deps.qwen }, checkSignal);
    // 점검 중 중단·시간 초과면 버전·메타·done 모두 중단됨으로 따른다.
    if (status === "complete" && signal.aborted) {
      status = "aborted";
      if (timeout.aborted && !args.signal.aborted) emit({ t: "error", message: TIMEOUT_MESSAGE });
    }
    state = { ...state, warnings: checked.warnings };
    fresh = checked.fresh;
    const v = await createVersion(diagramId, state, {
      source: "ai",
      status: status === "complete" ? "complete" : "aborted",
      messageId: userMsg.id,
    });
    version = v.number;
  }
  // 흐름은 차례가 끝난 상태로 검사해 저장한다(같은 차례에 만든 연결도 가리킬 수 있다). 거절은 건너뜀으로 알린다.
  if (pendingFlowOps.length > 0) {
    // 저장이 실패해도 차례는 끝까지 마친다(버전·응답 메시지·done). 흐름 저장 실패는 건너뜀 하나로 알린다.
    try {
      const r = await applyFlowOps(diagramId, state, pendingFlowOps, "ai");
      flowsSaved = r.saved;
      for (const rej of r.rejected) skip(`적용할 수 없는 흐름(${rej.id}) ${rej.reason}`, skipKey("flow", "", rej.reason));
    } catch (err) {
      console.error("chat apply flows failed", err);
      skip("흐름을 저장하지 못했어요", skipKey("flow", "", "db"));
    }
  }

  const skipped = tally.total();
  // 왜 건너뛰었는지 서버 로그에 한 줄로 남긴다(사용자 글·키는 넣지 않는다).
  if (skipped > 0) console.info("[chat] skipped", { diagramId, counts: tally.counts() });
  const missing = computeMissing(state).count;
  const content = [...says, ...(answer ? [answer] : [])].join("\n");
  const meta: MessageMeta = {
    ...(intent ? { intent } : {}),
    applied,
    changed,
    skipped,
    version,
    status,
    says,
    ...(flowsSaved > 0 ? { flows: flowsSaved } : {}),
    ...(changed + assumed > 0 && missing > 0 ? { missing } : {}),
    ...(fresh.length > 0 ? { warnings: fresh } : {}),
    ...counts(),
  };
  const assistant = await createMessage(diagramId, "assistant", content, meta, sessionId);
  if (fresh.length > 0) emit({ t: "warnings", items: fresh });
  emit({
    t: "done",
    version,
    status: status === "complete" ? "complete" : "aborted",
    applied,
    changed,
    ...(flowsSaved > 0 ? { flows: flowsSaved } : {}),
    skipped,
    missing,
    ...counts(),
    assistantMessageId: assistant.id,
  });
}
