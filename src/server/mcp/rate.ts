/** 한 계정이 MCP 주소를 부를 수 있는 횟수. Claude Code 가 그림 하나를 그릴 때 쓰는 호출은 많아야 수십 번이다. */
export const MCP_RATE = { max: 120, windowMs: 60_000 } as const;

type Window = { start: number; count: number };

// 서버 프로세스 안에서만 센다(요청마다 DB 를 쓰지 않는다). 서버가 여러 대면 대수만큼 한도가 늘어난다.
// 라우트 묶음이 따로 올라와도 같은 표를 보게 globalThis 에 둔다.
const store = globalThis as typeof globalThis & { __infraSketchMcpRate?: Map<string, Window> };
const windows = (store.__infraSketchMcpRate ??= new Map<string, Window>());

/** 표가 이만큼 커지면 지난 창을 치운다. */
const SWEEP_AT = 1000;

/**
 * 계정의 호출 하나를 센다. 창(1분) 안에서 한도를 넘으면 `{ ok: false }` 와 창이 끝나기까지 남은 초.
 * 키가 여러 개여도 계정으로 묶어 센다(키를 더 만들어 한도를 늘리지 못하게).
 */
export function takeMcpRequest(userId: string, now: number = Date.now()): { ok: true } | { ok: false; retryAfterS: number } {
  const w = windows.get(userId);
  if (!w || now - w.start >= MCP_RATE.windowMs) {
    if (windows.size >= SWEEP_AT) {
      for (const [id, old] of windows) if (now - old.start >= MCP_RATE.windowMs) windows.delete(id);
    }
    windows.set(userId, { start: now, count: 1 });
    return { ok: true };
  }
  if (w.count >= MCP_RATE.max) return { ok: false, retryAfterS: Math.max(1, Math.ceil((w.start + MCP_RATE.windowMs - now) / 1000)) };
  w.count++;
  return { ok: true };
}
