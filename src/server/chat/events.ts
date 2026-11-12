/** 대화 이벤트·메시지 메타. 클라이언트도 쓰므로 서버 모듈을 import 하지 않는다. */
import type { ClarifyQuestion } from "@/domain/clarify";
import type { Command } from "@/domain/commands";
import type { Warning } from "@/domain/types";
import type { WarningCounts } from "@/domain/warnings";

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
  /** 그리기 전에 되물은 차례: 물은 것과, 답을 받으면 그릴 원래 요청 글. */
  clarify?: { questions: ClarifyQuestion[]; text: string };
  /** 적용한 명령 수(가정·흐름 명령 포함). */
  applied?: number;
  /** 그중 구성을 바꾼 명령 수(isStructural). 없으면(옛 메시지) applied 로 본다. */
  changed?: number;
  /** 흐름 저장소에 저장된 흐름 명령 수. 있을 때만. */
  flows?: number;
  skipped?: number;
  version?: number | null;
  status?: "complete" | "aborted" | "error";
  mentions?: string[];
  says?: string[];
  /** 차례 끝에 아직 비어 있는 필수 정보 수(적용된 변경이 있고 0보다 클 때만). */
  missing?: number;
  /** 이번 차례에 새로 생긴(무시하지 않은) 경고. 있을 때만. */
  warnings?: Warning[];
  /** 차례 전후 경고 변화(새로·해결·지금 모두). 새로 생기거나 해결된 경고가 있을 때만. 주의 칩이 쓴다. */
  warningCounts?: WarningCounts;
  /**
   * 명령 경로 차례에 실제로 적용한 명령(앞부분만). 다음 차례의 대화 기록에 JSON 줄로 다시 보낸다.
   * 서버 전용: listMessages 가 기본으로 빼서 화면에는 가지 않는다.
   */
  commands?: unknown[];
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
  // part: 출력 한도로 끊겨 이어 그리는 중일 때만(n 번째 요청 / 최대 of 번). 진행 카드에 `이어서 그리는 중 (n/of)`.
  // retry: 구성 변경 요청에 아무것도 반영하지 못해 한 번 다시 그리는 중일 때만. 진행 카드에 `다시 그리는 중`.
  | { t: "status"; phase: "thinking" | "drawing" | "answering" | "checking"; part?: { n: number; of: number }; retry?: true }
  | { t: "say"; text: string }
  | { t: "cmd"; cmd: Command } // 서버에서 적용 성공한 명령만
  | { t: "skip"; reason: string } // 깨진 줄·거부된 명령
  | { t: "answer"; delta: string } // 질문 답변 글(ANSWER_PROMPT)
  | { t: "warnings"; items: Warning[] } // 새 경고만, done 앞
  | { t: "open_history" }
  | { t: "relayout" } // 고정 위치를 풀고 다시 배치(구성도 재정렬 요청)
  // 그리기 전에 되묻기: 구성은 바꾸지 않고 선택지를 보낸다. 답은 다음 차례의 choices 로 온다.
  | { t: "clarify"; questions: ClarifyQuestion[] }
  | { t: "handoff"; text: string } // 노드 질문의 구성 변경 요청(사용자 글 그대로)
  | {
      t: "done";
      version: number | null;
      status: "complete" | "aborted";
      applied: number;
      /** 구성을 바꾼 명령 수(가정 제외). 요약의 "바꾼 곳". */
      changed: number;
      /** 흐름 저장소에 저장된 흐름 명령 수(있을 때만). 요약의 "흐름 N개 바꿨어요". */
      flows?: number;
      skipped: number;
      missing: number;
      nodes: number;
      edges: number;
      /** MessageMeta.warningCounts 와 같다(있을 때만). */
      warningCounts?: WarningCounts;
      assistantMessageId: string;
    }
  | { t: "error"; message: string };
