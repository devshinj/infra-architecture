import { computeMissing } from "@/domain/missing";
import type { DiagramState } from "@/domain/types";
import type { Intent } from "@/server/llm/clef";
import { cachedNodeExplanation } from "@/server/explain";
import { createThinkStripper } from "@/server/llm/think";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";
import { getLatestState } from "@/server/versions";

import { NODE_GONE_MESSAGE, type ChatEvent, type MessageMeta } from "./events";
import { resolveIntent } from "./intent";
import { withDiagramLock } from "./lock";
import { createMessage, listMessages } from "./messages";
import {
  AI_UNAVAILABLE_MESSAGE,
  BUSY_MESSAGE,
  guardEmit,
  HISTORY_FETCH,
  streamFailure,
  turnSignals,
  type ChatDeps,
  type ChatTurnResult,
} from "./pipeline";
import { buildAskMessages } from "./prompt";
import { createSession, getSession, touchSession, type SessionRow } from "./sessions";

export const HANDOFF_REPLY = "구성을 바꾸려면 구성도 대화에서 말해 주세요.";
export { NODE_GONE_MESSAGE };

export type AskTurnResult = ChatTurnResult | { status: "gone" };

interface AskArgs {
  userId: string;
  diagramId: string;
  nodeId: string;
  /** null 이면 첫 질문(세션을 새로 만든다). */
  sessionId: string | null;
  text: string;
  signal: AbortSignal;
  emit(e: ChatEvent): void;
}

const hasNode = (state: DiagramState | undefined, nodeId: string) => !!state && Object.hasOwn(state.nodes, nodeId);

/**
 * 노드 하나에 대해 묻는 차례(§6.8). 구성도는 바꾸지 않고 버전도 만들지 않는다.
 * 구성도 대화와 같은 잠금을 써서 한 구성도에 한 차례만 돈다.
 * 노드가 지금 구성도에 없으면 `gone`(세션을 만들지 않는다), 잠금을 얻지 못하면 `busy`.
 * 남의 구성도·세션은 NotFoundError, 세션의 노드와 nodeId 가 다르면 ValidationError 를 던진다.
 */
export async function runAskTurn(args: AskArgs, deps: ChatDeps): Promise<AskTurnResult> {
  await getOwnedDiagram(args.userId, args.diagramId);
  let session: SessionRow | null = null;
  if (args.sessionId !== null) {
    session = await getSession(args.diagramId, args.sessionId);
    if (!session) throw new NotFoundError();
    if (session.nodeId !== args.nodeId) throw new ValidationError("세션의 노드와 맞지 않아요");
  }
  const emit = guardEmit(args.emit, "ask");
  const gone = (): AskTurnResult => {
    emit({ t: "error", message: NODE_GONE_MESSAGE });
    return { status: "gone" };
  };
  // 잠금 전에 노드를 확인해 없으면 세션을 만들지 않는다.
  if (!hasNode((await getLatestState(args.diagramId))?.state, args.nodeId)) return gone();

  const locked = await withDiagramLock(args.diagramId, () => lockedAsk({ ...args, emit }, session, deps));
  if (!locked.ok) {
    emit({ t: "error", message: BUSY_MESSAGE });
    return { status: "busy" };
  }
  return locked.value === "gone" ? gone() : { status: "ok" };
}

async function lockedAsk(args: AskArgs, existing: SessionRow | null, deps: ChatDeps): Promise<"ok" | "gone"> {
  const { diagramId, nodeId, emit } = args;

  // 잠금을 기다리는 사이 구성도 대화가 노드를 지웠을 수 있어 다시 읽는다.
  const state = (await getLatestState(diagramId))?.state;
  if (!state || !hasNode(state, nodeId)) return "gone";

  let session = existing;
  if (!session) {
    session = await createSession(diagramId, nodeId, state.nodes[nodeId]!.label, args.text);
    const { id, title, nodeLabel, updatedAt } = session;
    emit({ t: "session", session: { id, nodeId, nodeLabel, title, updatedAt: updatedAt.toISOString() } });
  }
  const sessionId = session.id;
  // 예상치 못한 예외로 끝나도 세션 순서(최근 이어감)는 갱신한다.
  try {
    return await askInSession(args, state, sessionId, existing !== null, deps);
  } finally {
    await touchSession(sessionId).catch((err) => console.error("ask touch session failed", err));
  }
}

async function askInSession(
  args: AskArgs,
  state: DiagramState,
  sessionId: string,
  followUp: boolean,
  deps: ChatDeps,
): Promise<"ok"> {
  const { diagramId, nodeId, emit } = args;
  const { signal, timeout } = turnSignals(args.signal, deps);
  const history = followUp
    ? (await listMessages(diagramId, HISTORY_FETCH, sessionId))
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    : [];
  const lastAssistant = history.findLast((m) => m.role === "assistant")?.content;
  const userMsg = await createMessage(diagramId, "user", args.text, {}, sessionId);

  const counts = { nodes: Object.keys(state.nodes).length, edges: Object.keys(state.edges).length };
  const done = (status: "complete" | "aborted", assistantMessageId: string): ChatEvent => ({
    t: "done",
    version: null,
    status,
    applied: 0,
    skipped: 0,
    missing: computeMissing(state).count,
    ...counts,
    assistantMessageId,
  });

  if (!deps.qwen) {
    emit({ t: "start", messageId: userMsg.id, intent: null });
    emit({ t: "error", message: AI_UNAVAILABLE_MESSAGE });
    emit(done("complete", ""));
    return "ok";
  }

  // Clef 가 실패하거나 확신이 낮으면 질문으로 친다.
  const intent: Intent | null = await resolveIntent(args.text, async () => {
    try {
      return await deps.clef.classifyIntent(args.text, { lastAssistant, openItems: [] }, signal);
    } catch {
      return null;
    }
  });
  emit({ t: "start", messageId: userMsg.id, intent });

  if (intent === "structure_change") {
    // 질문 세션에서는 구성을 바꾸지 않는다. 구성도 대화로 넘기도록 사용자 글을 돌려준다.
    emit({ t: "say", text: HANDOFF_REPLY });
    emit({ t: "handoff", text: args.text });
    const meta: MessageMeta = { intent, handoff: true, handoffText: args.text, says: [HANDOFF_REPLY] };
    const assistant = await createMessage(diagramId, "assistant", HANDOFF_REPLY, meta, sessionId);
    emit(done("complete", assistant.id));
    return "ok";
  }

  // 설명은 답의 근거일 뿐이라 못 읽어도 없이 답한다.
  const explanation = await cachedNodeExplanation(args.userId, diagramId, state, nodeId).catch((err) => {
    console.error("ask explanation lookup failed", { diagramId, nodeId, err: err instanceof Error ? err.message : String(err) });
    return undefined;
  });
  const messages = buildAskMessages({ state, nodeId, explanation, history, text: args.text });
  emit({ t: "status", phase: "thinking" });

  // <think> 를 지운 글만 보내고, 보낸 글 그대로 모아 저장한다(중단·오류여도).
  let status: "complete" | "aborted" | "error" = "complete";
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
        if (!signal.aborted) stripper.push(delta);
      },
    });
    if (signal.aborted) throw new DOMException("The operation was aborted.", "AbortError");
    stripper.end();
  } catch (err) {
    status = streamFailure(err, { outer: args.signal, signal, timeout }, emit, "ask");
  }

  const meta: MessageMeta = {
    ...(intent ? { intent } : {}),
    applied: 0,
    skipped: 0,
    version: null,
    status,
    says: [],
    ...counts,
  };
  const assistant = await createMessage(diagramId, "assistant", shown.trim(), meta, sessionId);
  emit(done(status === "complete" ? "complete" : "aborted", assistant.id));
  return "ok";
}
