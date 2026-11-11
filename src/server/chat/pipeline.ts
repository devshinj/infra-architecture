import { computeMissing } from "@/domain/missing";
import { applyCommand } from "@/domain/apply";
import { COMMAND_OPS, createFlowRetarget, isFlowCommand, isStructural, parseCommand, SERVER_ONLY_OPS, toFlowOp, type Command, type FlowCommand } from "@/domain/commands";
import { createEdgeCoalescer } from "@/domain/edgeCoalesce";
import { asksStepText, FLOW_LIMITS, keepStepText, type FlowOp } from "@/domain/flows";
import { splitFlowSteps, type StepSplit } from "@/domain/linkGuess";
import type { NetworkKnowledge } from "@/domain/network";
import { emptyState, type DiagramState, type Warning } from "@/domain/types";
import { warningDelta, type WarningCounts } from "@/domain/warnings";
import type { ClefClient, Intent } from "@/server/llm/clef";
import { createJsonlParser } from "@/server/llm/jsonl";
import { createThinkStripper } from "@/server/llm/think";
import type { QwenClient } from "@/server/llm/qwen";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";
import { applyFlowOps, listFlows, rewriteFlows } from "@/server/flows";
import { getNetworkKnowledge } from "@/server/network";

import { SESSION_GONE_MESSAGE, sessionPayload, type ChatEvent, type MessageMeta } from "./events";
import { BUSY_MESSAGE } from "./busy";
import { withDiagramLock } from "./lock";
import { clefOpenItems, resolveIntent } from "./intent";
import { createMessage, listMessages } from "./messages";
import { normalizeAiCommand } from "./normalize";
import { checkWarnings } from "./warnings";
import { settleTurn } from "./settle";
import { createSkipTally, skipKey } from "./skips";
import { buildMessages, parseMentions, REPLAY_COMMANDS_MAX, type HistoryItem } from "./prompt";
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
      ? (await listMessages(diagramId, HISTORY_FETCH, sessionId, { withCommands: true }))
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map(
            (m): HistoryItem => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              intent: m.meta?.intent ?? null,
              ...(Array.isArray(m.meta?.commands) ? { commands: m.meta.commands } : {}),
            }),
          )
      : [];
  const lastAssistant = history.findLast((m) => m.role === "assistant")?.content;
  const { clean, mentions } = parseMentions(args.text, state);
  const userMsg = await createMessage(diagramId, "user", args.text, { mentions: mentions.map((m) => m.id) }, sessionId);

  const counts = () => ({ nodes: Object.keys(state.nodes).length, edges: Object.keys(state.edges).length });

  // 망 지식(계정 공통). 못 읽으면 망 블록·종류 붙이기·연결 방식 판정 없이 지금처럼 돈다.
  // 빠진 정보 수는 화면 체크리스트와 같게 지식으로 센다(망 종류 줄 포함).
  const knowledge: NetworkKnowledge | null = await getNetworkKnowledge(args.userId).catch((err) => {
    console.error("chat network knowledge failed", err);
    return null;
  });

  if (!deps.qwen) {
    emit({ t: "start", messageId: userMsg.id, intent: null });
    emit({ t: "error", message: AI_UNAVAILABLE_MESSAGE });
    // 응답 메시지는 남기지 않는다. 클라이언트가 깨끗이 정리하도록 done 을 보낸다.
    emit({ t: "done", version: null, status: "complete", applied: 0, changed: 0, skipped: 0, missing: computeMissing(state, knowledge ?? undefined).count, ...counts(), assistantMessageId: "" });
    return;
  }

  // 차례 시작 상태의 열린(모름 아닌) 빠진 정보. 값만 알려 주는 답을 분류·반영하는 데 쓴다.
  // 망 종류(영역 항목)는 AI 가 프롬프트의 망 지식으로 추정하므로 넘기지 않는다.
  const openMissing = computeMissing(state).items.filter((m) => !m.unknown && m.targetKind !== "group");
  const openItems = clefOpenItems(state, openMissing, { text: clean, lastAssistant, mentionIds: mentions.map((m) => m.id) });
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
  let plainLines = 0; // 명령 모드에서 일반 글이라 say 로 보여 준 줄 수(서버 로그용)
  // 명령 경로 차례에 실제로 적용한 명령. 다음 차례 기록에 JSON 줄로 다시 보낸다(명령 경로가 아니면 undefined).
  let turnCommands: Command[] | undefined;
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
    const network = knowledge ? { network: knowledge } : {};
    const messages = buildMessages({ intent, text: clean, state, mentions, history, missing: openMissing, flows, ...network });
    const keepText = !asksStepText(clean);
    emit({ t: "status", phase: "thinking" });

    const edges = createEdgeCoalescer();
    // 흐름 명령은 받은 그대로 모으고, 저장 직전에 연결 id 를 다시 바꾼다(흐름 명령 뒤에 짝을 알게 될 수 있다).
    // 연결 id 를 바꾼 뒤 단계 글 지키기를 한다(keepStepText 는 연결·시작 노드로 맞춘다).
    const flowCmds: FlowCommand[] = [];
    // 단계 글을 고쳐 달라는 요청이 아니면, 남는 단계의 글은 원래 흐름 것을 쓴다.
    const prepareFlow = (c: FlowCommand) => {
      const mapped = edges.mapFlow(c);
      return keepText ? keepStepText(mapped, flows) : mapped;
    };
    // 이미 있는 흐름 id 의 add_flow 는 그 흐름을 고치는 update_flow 로 받는다(모델이 고치기를 add_flow 로 쓰는 일이 있다).
    const retargetFlow = createFlowRetarget(flows.map((f) => f.id));
    const appliedCmds: Command[] = [];
    if (!answerMode) turnCommands = appliedCmds;
    const applyOne = (raw: Command) => {
      if (isFlowCommand(raw)) {
        const cmd = retargetFlow(raw);
        flowCmds.push(cmd);
        if (applied === 0) emit({ t: "status", phase: "drawing" });
        applied++;
        emit({ t: "cmd", cmd: prepareFlow(cmd) });
        return;
      }
      const cmd = raw;
      // 지식에 없는 종류(지운·숨긴 것)가 붙은 망은 종류 없음으로 보고 AI 가 다시 붙이게 한다.
      const r = applyCommand(state, cmd, knowledge ? { netTypes: knowledge.types } : {});
      if (!r.ok) return skip(`적용할 수 없는 명령(${cmd.op}) ${r.error}`, skipKey("apply", cmd.op, r.error));
      state = r.state;
      if (applied === 0) emit({ t: "status", phase: "drawing" });
      applied++;
      if (isStructural(cmd)) changed++;
      else assumed++;
      appliedCmds.push(cmd);
      emit({ t: "cmd", cmd });
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
      // 서버만 만드는 명령(set_link_guess)은 AI 가 써도 모르는 명령처럼 건너뛴다.
      if (!KNOWN_OPS.has(op) || SERVER_ONLY_OPS.has(op as Command["op"])) return skip(`지원하지 않는 명령(${op})`, skipKey("unknown_op", op));
      const parsed = parseCommand(normalizeAiCommand(raw));
      if (!parsed.ok) return skip(`형식이 맞지 않는 명령(${op})`, skipKey("invalid", op, parsed.error));
      // 망 종류는 망 지식에 있는 key 만 붙인다(null 은 지우기). 지식을 못 읽었으면 모두 건너뛴다.
      if (parsed.cmd.op === "set_zone_type" && (!knowledge || (parsed.cmd.type !== null && !Object.hasOwn(knowledge.types, parsed.cmd.type)))) {
        return skip(`알 수 없는 망 종류(${parsed.cmd.type})`, skipKey("invalid", op, "unknown net type"));
      }
      // 같은 두 노드 사이 연결을 지웠다 다시 만들면 짝을 지운다(연결 id 유지). 바꾼 명령만 적용·전송한다.
      for (const cmd of edges.push(parsed.cmd, state)) applyOne(cmd);
    };
    // 미뤄 둔 연결 지우기를 지금 적용한다(이어 쓰기 직전·차례 끝). 그사이 사라진 연결은 조용히 버린다.
    const flushEdges = () => {
      for (const cmd of edges.flush(state)) applyOne(cmd);
    };
    const onBad = () => {
      if (!signal.aborted) skip("읽을 수 없는 줄", skipKey("bad_json"));
    };
    // 명령 모드인데 모델이 JSON 대신 일반 글로 답하면(질문으로 읽은 경우가 많다) 버리지 않고 say 처럼 보여 준다.
    const onText = (text: string) => {
      if (signal.aborted) return;
      plainLines++;
      says.push(text);
      emit({ t: "say", text });
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
        const qwen = deps.qwen;
        const draw = async (first: typeof messages) => {
          let msgs = first;
          for (let part = 1; ; part++) {
            const appliedBefore = applied;
            const parser = createJsonlParser(onLine, onBad, onText);
            const r = await qwen.streamCompletion(msgs, {
              signal,
              onDelta(delta) {
                if (!signal.aborted) parser.push(delta);
              },
            });
            if (signal.aborted) throw abortError();
            // 이번 호출이 아무것도 반영하지 못했으면(같은 걸 되풀이하는 등) 더 이어 쓰지 않는다. 미뤄 둔 연결 지우기도 반영으로 센다.
            const more = r.finishReason === "length" && part <= MAX_CONTINUATIONS && (applied > appliedBefore || edges.pending() > 0);
            // 이어 쓸 때만 끊긴 마지막 줄을 조용히 버린다(마지막 시도까지 끊기면 지금처럼 건너뜀으로 센다).
            parser.end({ dropPartial: more });
            if (!more) break;
            // 이어 쓰기는 지금 상태를 보고 쓰므로, 미뤄 둔 지우기를 먼저 적용한다.
            flushEdges();
            const n = part + 1;
            console.info("[chat] output cut by length, continuing", { diagramId, part: n });
            emit({ t: "status", phase: "drawing", part: { n, of: MAX_CONTINUATIONS + 1 } });
            msgs = buildMessages({ intent, text: clean, state, mentions, history, missing: openMissing, continuation: true, flows, ...network });
          }
        };
        await draw(messages);
        // 구성 변경 요청인데 아무것도 반영하지 못했으면(say 만 쓰고 멈추는 흔들림) 다그치는 한 줄을 붙여 한 번만 다시 부른다.
        if (intent === "structure_change" && applied === 0 && edges.pending() === 0) {
          console.info("[chat] no change on a structure request, retrying once", { diagramId });
          emit({ t: "status", phase: "drawing", retry: true });
          await draw(buildMessages({ intent, text: clean, state, mentions, history, missing: openMissing, retry: true, flows, ...network }));
        }
      }
    } catch (err) {
      status = streamFailure(err, { outer: args.signal, signal, timeout }, emit);
    }
    // 중단·오류여도 미뤄 둔 지우기는 적용한다(바로 적용했을 때와 같은 결과). 그다음 흐름 명령을 마지막 짝 정보로 바꾼다.
    flushEdges();
    const preparedFlows = flowCmds.map((c) => prepareFlow(c));
    appliedCmds.push(...preparedFlows);
    pendingFlowOps.push(...preparedFlows.map((c) => toFlowOp(c)));
    answer = shown.trim();
  }

  let version: number | null = null;
  let fresh: Warning[] = [];
  let warningCounts: WarningCounts | undefined;
  // 이번 차례에 망연계(guess)가 끼어든 연결. 흐름 단계를 나누는 데 쓴다.
  let splits: StepSplit[] = [];
  // 구성도를 바꾼 명령(구성·가정)이 있을 때만 정리·점검·버전을 한다. 흐름만 바꾼 차례는 버전을 만들지 않는다.
  if (changed + assumed > 0) {
    // 비게 된 영역 지우기와 망연계 기록. 클라이언트도 같은 명령으로 맞추도록 적용한 순서대로 보낸다.
    const settled = settleTurn(turnStartState, state);
    for (const cmd of settled.emitted) emit({ t: "cmd", cmd });
    state = settled.state;
    splits = settled.splits;
    // 변경이 있었던 차례만 점검한다. 중단·오류면 이미 중단된 신호로 불러 코드 규칙만 받는다.
    if (status === "complete") emit({ t: "status", phase: "checking" });
    const checkSignal = status === "complete" ? signal : AbortSignal.abort();
    const checked = await checkWarnings(state, prevWarnings, { clef: deps.clef, qwen: deps.qwen }, checkSignal, knowledge ? { knowledge } : {});
    // 점검 중 중단·시간 초과면 버전·메타·done 모두 중단됨으로 따른다.
    if (status === "complete" && signal.aborted) {
      status = "aborted";
      if (timeout.aborted && !args.signal.aborted) emit({ t: "error", message: TIMEOUT_MESSAGE });
    }
    state = { ...state, warnings: checked.warnings };
    fresh = checked.fresh;
    // 주의 칩: 새 경고만 세면 그대로 남은 경고·해결한 경고가 안 보인다. 화면 경고(무시 제외) 전후로 센다.
    const delta = warningDelta(turnStartState, state, knowledge ?? undefined);
    if (delta.fresh > 0 || delta.resolved > 0) warningCounts = delta;
    const v = await createVersion(diagramId, state, {
      source: "ai",
      status: status === "complete" ? "complete" : "aborted",
      messageId: userMsg.id,
    });
    version = v.number;
  }
  // 망연계가 끼어든 연결을 지나던 흐름 단계를 둘로 나눈다. AI 흐름 명령보다 먼저 한다. 실패해도 차례는 마친다.
  if (splits.length > 0) {
    try {
      await rewriteFlows(diagramId, (f) => {
        const next = splitFlowSteps(f, splits);
        return next && next.steps.length <= FLOW_LIMITS.steps ? next : null;
      });
    } catch (err) {
      console.error("chat split flow steps failed", err);
    }
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
  if (plainLines > 0) console.info("[chat] plain text shown as say", { diagramId, lines: plainLines });
  const missing = computeMissing(state, knowledge ?? undefined).count;
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
    ...(warningCounts ? { warningCounts } : {}),
    ...(turnCommands ? { commands: turnCommands.slice(0, REPLAY_COMMANDS_MAX) } : {}),
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
    ...(warningCounts ? { warningCounts } : {}),
    assistantMessageId: assistant.id,
  });
}
