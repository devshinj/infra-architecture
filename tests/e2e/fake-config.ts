// 다른 worktree 의 E2E 와 같이 돌릴 때는 E2E_FAKE_PORT 로 바꾼다.
export const FAKE_PORT = Number(process.env.E2E_FAKE_PORT) || 3199;
export const FAKE_QWEN_KEY = "fake-qwen-key";
export const FAKE_CLEF_KEY = "fake-clef-key";
