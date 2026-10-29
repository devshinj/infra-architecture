/** 메시지 메타. 클라이언트도 쓰므로 서버 모듈을 import 하지 않는다. */
export interface MessageMeta {
  intent?: string;
  applied?: number;
  skipped?: number;
  version?: number | null;
  status?: "complete" | "aborted" | "error";
  mentions?: string[];
  says?: string[];
}
