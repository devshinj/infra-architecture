import postgres from "postgres";
import { afterAll, afterEach, expect, test, vi } from "vitest";

// 풀 크기는 처음 쓸 때 정해진다. 이 파일에서는 작게 잡아 천장을 본다.
vi.hoisted(() => {
  process.env.DB_LOCK_POOL_MAX = "3";
});

import { LOCK_APP_NAME, withDiagramLock } from "@/server/chat/lock";

const admin = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
afterAll(() => admin.end());
afterEach(() => vi.restoreAllMocks());

/** 잠금 전용 풀이 지금 열어 둔 DB 연결 수. */
async function lockConnections(): Promise<number> {
  const [row] = await admin<{ n: number }[]>`
    select count(*)::int as n from pg_stat_activity
    where application_name = ${LOCK_APP_NAME} and datname = current_database()`;
  return row.n;
}

/** 잠금 n개를 쥔 채 멈춰 두고, 모두 쥐었을 때 돌아온다. release 를 부르면 푼다. */
async function hold(keys: string[]) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let entered = 0;
  let allIn!: () => void;
  const ready = new Promise<void>((r) => (allIn = r));
  const held = keys.map((key) =>
    withDiagramLock(key, async () => {
      if (++entered === keys.length) allIn();
      await gate;
    }),
  );
  await ready;
  return { release, held };
}

test("잠금을 여러 번 잡아도 연결을 새로 열지 않고 빌려 쓴다", async () => {
  for (let i = 0; i < 12; i++) expect((await withDiagramLock(`seq-${i}`, async () => i)).ok).toBe(true);
  expect(await lockConnections()).toBeLessThanOrEqual(3);
});

test("풀이 다 쓰이면 연결을 더 열지 않고 바쁨으로 돌려준다", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const { release, held } = await hold(["full-0", "full-1", "full-2"]);
  try {
    const extra = await Promise.all(Array.from({ length: 7 }, (_, i) => withDiagramLock(`full-extra-${i}`, async () => i)));
    expect(extra.every((r) => !r.ok)).toBe(true);
    expect(await lockConnections()).toBe(3);
    expect(warn).toHaveBeenCalled();
  } finally {
    release();
  }
  expect((await Promise.all(held)).every((r) => r.ok)).toBe(true);
  // 자리가 나면 다시 잡힌다.
  expect(await withDiagramLock("full-extra-0", async () => "again")).toEqual({ ok: true, value: "again" });
});

test("풀이 차 있어도 waitMs 안에 자리가 나면 잡는다", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const { release, held } = await hold(["wait-0", "wait-1", "wait-2"]);
  const waiting = withDiagramLock("wait-3", async () => "got it", { waitMs: 3000 });
  release();
  expect(await waiting).toEqual({ ok: true, value: "got it" });
  await Promise.all(held);
});

test("같은 구성도는 한 번에 하나만 — 풀린 뒤에는 같은 연결을 다시 빌려도 잡힌다", async () => {
  const { release, held } = await hold(["same"]);
  expect(await withDiagramLock("same", async () => 1)).toEqual({ ok: false });
  release();
  await Promise.all(held);
  for (let i = 0; i < 5; i++) expect((await withDiagramLock("same", async () => i)).ok).toBe(true);
});

test("fn 이 던져도 잠금과 자리를 돌려준다", async () => {
  for (let i = 0; i < 5; i++) {
    await expect(withDiagramLock("throws", async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
  }
  expect((await withDiagramLock("throws", async () => 1)).ok).toBe(true);
});

test("쥐고 있던 연결이 끊겨도 그다음 잠금은 잡힌다", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {}); // 해제 쿼리가 실패하면 남기는 줄(다시 붙어 성공하면 안 남는다).
  const result = await withDiagramLock("dropped", async () => {
    // 잠금 연결을 DB 쪽에서 끊는다(DB 재시작·네트워크 끊김 흉내).
    await admin`select pg_terminate_backend(pid) from pg_stat_activity
      where application_name = ${LOCK_APP_NAME} and datname = current_database()`;
    return "done";
  });
  expect(result).toEqual({ ok: true, value: "done" });
  for (let i = 0; i < 4; i++) expect((await withDiagramLock("dropped", async () => i)).ok).toBe(true);
  expect(await lockConnections()).toBeLessThanOrEqual(3);
});
