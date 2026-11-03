/** 대화 이벤트·메시지 메타. 클라이언트도 쓰므로 서버 모듈을 import 하지 않는다. */
import type { Command } from "@/domain/commands";
import type { Warning } from "@/domain/types";

/** 세션 행을 session 이벤트 모양으로. */
export function sessionPayload(s: {
  id: string;
  kind: "node" | "diagram";
  nodeId: string | null;
  nodeLabel: string | null;
  title: string;
  updatedAt: Date;
}): SessionEventPayload {
  const base = { id: s.id, title: s.title, updatedAt: s.updatedAt.toISOString() };
  return s.kind === "node" && s.nodeId !== null && s.nodeLabel !== null
    ? { ...base, kind: "node", nodeId: s.nodeId, nodeLabel: s.nodeLabel }
    : { ...base, kind: "diagram", nodeId: null, nodeLabel: null };
}

/** 잠금을 기다리는 사이 세션이 지워졌을 때(다른 탭에서 삭제 등). */
export const SESSION_GONE_MESSAGE = "대화를 찾을 수 없어요.";

/** 노드 질문: 노드가 지금 구성도에 없을 때. 질문 세션 화면도 같은 문구를 안내로 보인다. */
export const NODE_GONE_MESSAGE = "이 노드는 지금 구성도에 없어서 이어서 물을 수 없어요.";

export interface MessageMeta {
  intent?: string;
  applied?: number;
  skipped?: number;
  version?: number | null;
  status?: "complete" | "aborted" | "error";
  mentions?: string[];
  says?: string[];
  /** 차례 끝에 아직 비어 있는 필수 정보 수(적용된 변경이 있고 0보다 클 때만). */
  missing?: number;
  /** 이번 차례에 새로 생긴(무시하지 않은) 경고. 있을 때만. */
  warnings?: Warning[];
  /** 차례 끝 구성도의 노드·연결 수(다시 불러올 때 요약 칩·완료 카드에 쓴다). */
  nodes?: number;
  edges?: number;
  /** 노드 질문에서 구성 변경 요청이라 구성도 대화로 넘긴 답. */
  handoff?: true;
  /** handoff 일 때 구성도 대화로 넘긴 사용자 글(다시 불러와도 버튼에 쓴다). */
  handoffText?: string;
}

/** 새로 만든 세션(session 이벤트). 노드 질문 세션은 노드가 있고, 구성도 대화 세션은 nodeId·nodeLabel 이 null. */
export type SessionEventPayload =
  | { id: string; kind: "node"; nodeId: string; nodeLabel: string; title: string; updatedAt: string }
  | { id: string; kind: "diagram"; nodeId: null; nodeLabel: null; title: string; updatedAt: string };

export type ChatEvent =
  // 새 세션(노드 질문의 첫 질문, 새 구성도 대화의 첫 메시지)을 만들었을 때만, start 바로 앞
  | { t: "session"; session: SessionEventPayload }
  | { t: "start"; messageId: string; intent: string | null }
  | { t: "status"; phase: "thinking" | "drawing" | "answering" | "checking" }
  | { t: "say"; text: string }
  | { t: "cmd"; cmd: Command } // 서버에서 적용 성공한 명령만
  | { t: "skip"; reason: string } // 깨진 줄·거부된 명령
  | { t: "answer"; delta: string } // 질문 답변 글(ANSWER_PROMPT)
  | { t: "warnings"; items: Warning[] } // 새 경고만, done 앞
  | { t: "open_history" }
  | { t: "relayout" } // 고정 위치를 풀고 다시 배치(구성도 재정렬 요청)
  | { t: "handoff"; text: string } // 노드 질문의 구성 변경 요청(사용자 글 그대로)
  | {
      t: "done";
      version: number | null;
      status: "complete" | "aborted";
      applied: number;
      skipped: number;
      missing: number;
      nodes: number;
      edges: number;
      assistantMessageId: string;
    }
  | { t: "error"; message: string };
