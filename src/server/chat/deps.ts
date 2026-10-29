import { llmConfig } from "@/server/llm/config";
import { createClefClient } from "@/server/llm/clef";
import { createQwenClient } from "@/server/llm/qwen";

import type { ChatDeps } from "./pipeline";

// Clef 클라이언트의 동시 호출 상한이 프로세스 전체에서 지켜지도록 인스턴스를 하나만 쓴다.
let singleton: ChatDeps | null = null;
let override: ChatDeps | null = null;

export function defaultChatDeps(): ChatDeps {
  if (override) return override;
  if (!singleton) {
    const cfg = llmConfig();
    singleton = {
      qwen: cfg.qwen ? createQwenClient(cfg.qwen) : null,
      clef: createClefClient(cfg.clef),
    };
  }
  return singleton;
}

/** 테스트에서만 동작한다. null 이면 원래대로 돌아간다. */
export function setChatDepsForTest(deps: ChatDeps | null): void {
  if (process.env.NODE_ENV !== "test") return;
  override = deps;
}
