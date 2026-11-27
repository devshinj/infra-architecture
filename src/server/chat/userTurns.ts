/** 한 사용자가 동시에 돌릴 수 있는 차례(구성도 대화·학습·노드 질문) 수. */
export const MAX_USER_TURNS = 2;

/**
 * 한 사용자가 동시에 돌릴 수 있는 배경 작업(노드 설명 만들기·흐름 제안) 수.
 * 화면은 탭마다 설명을 한 번에 하나씩 청한다. 탭 서너 개까지는 그대로 돌고, 스크립트로 몰아 보내는 것만 걸린다.
 */
export const MAX_BACKGROUND_JOBS = 3;

/** 배경 작업이 자리를 기다려 주는 시간. 설명 하나가 보통 몇 초~십몇 초라, 이 안에 앞 작업이 끝난다. */
export const BACKGROUND_WAIT_MS = 15_000;

const RETRY_MS = 50;

// 차례 하나는 LLM 을 몇 초~몇 분 부르고 잠금용 DB 연결도 하나 쥔다. 구성도 잠금은 구성도마다 따로라서,
// 구성도를 여러 개 열어 동시에 보내면 한 계정이 LLM 과 DB 연결을 끝없이 쓸 수 있다. 그래서 계정마다 센다.
// 서버 프로세스 안에서만 센다(DB 연결을 더 쓰지 않는다). 서버가 여러 대면 대수만큼 한도가 늘어난다.
// 라우트마다 모듈이 따로 올라와도 같은 표를 보게 globalThis 에 둔다.
// 대화 차례와 배경 작업은 따로 센다 — 설명을 만드는 동안 대화가 막히지 않게.
const store = globalThis as typeof globalThis & {
  __infraSketchUserTurns?: Map<string, number>;
  __infraSketchBackgroundJobs?: Map<string, number>;
};
const turns = (store.__infraSketchUserTurns ??= new Map<string, number>());
const background = (store.__infraSketchBackgroundJobs ??= new Map<string, number>());

type Slot<T> = { ok: true; value: T } | { ok: false };

async function runInSlot<T>(running: Map<string, number>, userId: string, fn: () => Promise<T>): Promise<T> {
  running.set(userId, (running.get(userId) ?? 0) + 1);
  try {
    return await fn();
  } finally {
    const left = (running.get(userId) ?? 1) - 1;
    if (left > 0) running.set(userId, left);
    else running.delete(userId);
  }
}

/**
 * 사용자의 차례 자리를 하나 잡고 fn 을 돌린다. 이미 MAX_USER_TURNS 개가 돌고 있으면 돌리지 않고 `{ ok: false }`.
 * fn 이 던져도 자리는 돌려준다.
 */
export async function withUserTurnSlot<T>(userId: string, fn: () => Promise<T>): Promise<Slot<T>> {
  if ((turns.get(userId) ?? 0) >= MAX_USER_TURNS) return { ok: false };
  return { ok: true, value: await runInSlot(turns, userId, fn) };
}

/**
 * 사용자의 배경 작업 자리를 하나 잡고 fn 을 돌린다(모델을 부르는 구간만 감싼다 — 캐시로 답하는 요청은 자리를 쓰지 않는다).
 * 자리가 없으면 waitMs 동안 기다려 보고, 그래도 없거나 그사이 요청이 끊기면(signal) 돌리지 않고 `{ ok: false }`.
 */
export async function withBackgroundSlot<T>(
  userId: string,
  fn: () => Promise<T>,
  opts: { waitMs?: number; signal?: AbortSignal } = {},
): Promise<Slot<T>> {
  const deadline = Date.now() + (opts.waitMs ?? 0);
  while ((background.get(userId) ?? 0) >= MAX_BACKGROUND_JOBS) {
    if (opts.signal?.aborted || Date.now() >= deadline) return { ok: false };
    await new Promise((r) => setTimeout(r, RETRY_MS));
  }
  return { ok: true, value: await runInSlot(background, userId, fn) };
}
