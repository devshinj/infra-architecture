/** 대화 이벤트·메시지 메타. 클라이언트도 쓰므로 서버 모듈을 import 하지 않는다. */
import type { Command } from "@/domain/commands";

export interface MessageMeta {
  intent?: string;
  applied?: number;
  skipped?: number;
  version?: number | null;
  status?: "complete" | "aborted" | "error";
  mentions?: string[];
  says?: string[];
}

export type ChatEvent =
  | { t: "start"; messageId: string; intent: string | null }
  | { t: "status"; phase: "thinking" | "drawing" | "answering" }
  | { t: "say"; text: string }
  | { t: "cmd"; cmd: Command } // 서버에서 적용 성공한 명령만
  | { t: "skip"; reason: string } // 깨진 줄·거부된 명령
  | { t: "answer"; delta: string } // 질문 답변 글(ANSWER_PROMPT)
  | { t: "open_history" }
  | {
      t: "done";
      version: number | null;
      status: "complete" | "aborted";
      applied: number;
      skipped: number;
      nodes: number;
      edges: number;
      assistantMessageId: string;
    }
  | { t: "error"; message: string };
