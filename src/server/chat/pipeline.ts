import { computeMissing } from "@/domain/missing";
import { applyCommand, pruneEmptyGroups } from "@/domain/apply";
import { COMMAND_OPS, parseCommand } from "@/domain/commands";
import { emptyState, type DiagramState, type Warning } from "@/domain/types";
import { INTENT_MIN_CONFIDENCE, type ClefClient, type Intent } from "@/server/llm/clef";
import { createJsonlParser } from "@/server/llm/jsonl";
import { createThinkStripper } from "@/server/llm/think";
import type { QwenClient } from "@/server/llm/qwen";
import { getOwnedDiagram } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

import type { ChatEvent, MessageMeta } from "./events";
import { BUSY_MESSAGE } from "./busy";
import { withDiagramLock } from "./lock";
import { createMessage, listMessages } from "./messages";
import { normalizeAiCommand } from "./normalize";
import { checkWarnings } from "./warnings";
import { createSkipTally, skipKey } from "./skips";
import { buildMessages, parseMentions } from "./prompt";

export interface ChatDeps {
  qwen: QwenClient | null;
  clef: ClefClient;
  /** 차례 전체 상한(기본 120초). 테스트에서만 바꾼다. */
  turnTimeoutMs?: number;
}

/** `busy` 면 잠금을 얻지 못한 것(이미 `error` 이벤트를 보냈다). 호출자는 409 로 바꾼다. */
export type ChatTurnResult = { status: "ok" } | { status: "busy" };

export { BUSY_MESSAGE };
export const AI_UNAVAILABLE_MESSAGE = "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.";
export const HISTORY_REPLY = "변경 이력은 오른쪽 '이력' 탭에서 보고 되돌릴 수 있어요.";
export const LAYOUT_REPLY = "구성도를 다시 정렬했어요.";
export const TIMEOUT_MESSAGE = "응답 시간이 너무 길어 중단했어요.";
export const GENERIC_ERROR_MESSAGE = "응답을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.";

const TURN_TIMEOUT_MS = 120_000;
const HISTORY_FETCH = 40;
const OP_MAX = 40;

interface TurnArgs {
  userId: string;
  diagramId: string;
  text: string;
  signal: AbortSignal;
  emit(e: ChatEvent): void;
}

export async function runChatTurn(args: TurnArgs, deps: ChatDeps): Promise<ChatTurnResult> {
  await getOwnedDiagram(args.userId, args.diagramId); // NotFoundError 는 그대로 던진다
  // 전송이 끊겨 emit 이 던져도 차례는 끝까지 돌아 버전·메시지를 저장한다.
  let emitFailed = false;
  const emit = (e: ChatEvent) => {
    try {
      args.emit(e);
    } catch (err) {
      if (!emitFailed) console.error("chat emit failed", err);
      emitFailed = true;
    }
  };
  const turnArgs = { ...args, emit };
  const locked = await withDiagramLock(args.diagramId, () => lockedTurn(turnArgs, deps));
  if (!locked.ok) {
    emit({ t: "error", message: BUSY_MESSAGE });
    return { status: "busy" };
  }
  return { status: "ok" };
}

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

async function lockedTurn(args: TurnArgs, deps: ChatDeps): Promise<void> {
  const { diagramId, emit } = args;
  const timeout = AbortSignal.timeout(deps.turnTimeoutMs ?? TURN_TIMEOUT_MS);
  const signal = AbortSignal.any([args.signal, timeout]);

  const latest = await getLatestState(diagramId);
  let state: DiagramState = latest?.state ?? emptyState();
  const turnStartState = state;
  const prevWarnings = latest?.state.warnings; // 차례 시작 상태의 경고
  const history = (await listMessages(diagramId, HISTORY_FETCH))
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  const lastAssistant = history.findLast((m) => m.role === "assistant")?.content;
  const { clean, mentions } = parseMentions(args.text, state);
  const userMsg = await createMessage(diagramId, "user", args.text, { mentions: mentions.map((m) => m.id) });

  const counts = () => ({ nodes: Object.keys(state.nodes).length, edges: Object.keys(state.edges).length });

  if (!deps.qwen) {
    emit({ t: "start", messageId: userMsg.id, intent: null });
    emit({ t: "error", message: AI_UNAVAILABLE_MESSAGE });
    // 응답 메시지는 남기지 않는다. 클라이언트가 깨끗이 정리하도록 done 을 보낸다.
    emit({ t: "done", version: null, status: "complete", applied: 0, skipped: 0, missing: computeMissing(state).count, ...counts(), assistantMessageId: "" });
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
  const classified = await deps.clef.classifyIntent(clean, { lastAssistant, openItems }, signal);
  const intent: Intent | null =
    classified && classified.confidence >= INTENT_MIN_CONFIDENCE ? classified.intent : null;
  emit({ t: "start", messageId: userMsg.id, intent });

  const says: string[] = [];
  let answer = "";
  let applied = 0;
  const tally = createSkipTally();
  let status: "complete" | "aborted" | "error" = "complete";

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
    const messages = buildMessages({ intent, text: clean, state, mentions, history, missing: openMissing });
    emit({ t: "status", phase: "thinking" });

    const skip = (reason: string, key: string) => {
      tally.add(key);
      emit({ t: "skip", reason: (SKIP_PREFIX + reason).slice(0, SKIP_MAX) });
    };
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
      const r = applyCommand(state, parsed.cmd);
      if (!r.ok) return skip(`적용할 수 없는 명령(${op}) ${r.error}`, skipKey("apply", op, r.error));
      state = r.state;
      if (applied === 0) emit({ t: "status", phase: "drawing" });
      applied++;
      emit({ t: "cmd", cmd: parsed.cmd });
    };
    const parser = createJsonlParser(onLine, () => {
      if (!signal.aborted) skip("읽을 수 없는 줄", skipKey("bad_json"));
    });

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
      await deps.qwen.streamCompletion(messages, {
        signal,
        onDelta(delta) {
          if (signal.aborted) return;
          if (answerMode) stripper.push(delta);
          else parser.push(delta);
        },
      });
      if (signal.aborted) throw new DOMException("The operation was aborted.", "AbortError");
      if (answerMode) stripper.end();
      else parser.end();
    } catch (err) {
      if (signal.aborted) {
        status = "aborted";
        if (timeout.aborted && !args.signal.aborted) emit({ t: "error", message: TIMEOUT_MESSAGE });
      } else {
        status = "error";
        console.error("chat turn failed", err);
        emit({ t: "error", message: GENERIC_ERROR_MESSAGE });
      }
    }
    answer = shown.trim();
  }

  const skipped = tally.total();
  // 왜 건너뛰었는지 서버 로그에 한 줄로 남긴다(사용자 글·키는 넣지 않는다).
  if (skipped > 0) console.info("[chat] skipped", { diagramId, counts: tally.counts() });

  let version: number | null = null;
  let fresh: Warning[] = [];
  if (applied > 0) {
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
  const missing = computeMissing(state).count;
  const content = [...says, ...(answer ? [answer] : [])].join("\n");
  const meta: MessageMeta = {
    ...(intent ? { intent } : {}),
    applied,
    skipped,
    version,
    status,
    says,
    ...(applied > 0 && missing > 0 ? { missing } : {}),
    ...(fresh.length > 0 ? { warnings: fresh } : {}),
    ...counts(),
  };
  const assistant = await createMessage(diagramId, "assistant", content, meta);
  if (fresh.length > 0) emit({ t: "warnings", items: fresh });
  emit({
    t: "done",
    version,
    status: status === "complete" ? "complete" : "aborted",
    applied,
    skipped,
    missing,
    ...counts(),
    assistantMessageId: assistant.id,
  });
}
