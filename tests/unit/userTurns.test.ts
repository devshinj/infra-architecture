import { expect, test } from "vitest";

import { MAX_BACKGROUND_JOBS, MAX_USER_TURNS, withBackgroundSlot, withUserTurnSlot } from "@/server/chat/userTurns";

/** 밖에서 끝낼 수 있는 일 하나. */
function pending() {
  let finish!: () => void;
  const done = new Promise<void>((r) => (finish = r));
  return { run: () => done, finish };
}

test("a user runs at most MAX_USER_TURNS turns at once; the next is refused without running", async () => {
  const held = Array.from({ length: MAX_USER_TURNS }, pending);
  const running = held.map((h) => withUserTurnSlot("u1", h.run));
  let ran = false;
  expect(
    await withUserTurnSlot("u1", async () => {
      ran = true;
    }),
  ).toEqual({ ok: false });
  expect(ran).toBe(false);
  // 다른 사용자는 영향을 받지 않는다.
  expect(await withUserTurnSlot("u2", async () => "ok")).toEqual({ ok: true, value: "ok" });

  // 하나가 끝나면 자리가 난다.
  held[0]!.finish();
  await running[0];
  expect(await withUserTurnSlot("u1", async () => "again")).toEqual({ ok: true, value: "again" });
  held.slice(1).forEach((h) => h.finish());
  await Promise.all(running);
});

test("a turn that throws gives its slot back", async () => {
  for (let i = 0; i < MAX_USER_TURNS + 1; i++) {
    await expect(
      withUserTurnSlot("u3", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  }
  expect(await withUserTurnSlot("u3", async () => 1)).toEqual({ ok: true, value: 1 });
});

test("background work has its own per-user limit and does not use the turn slots", async () => {
  const held = Array.from({ length: MAX_BACKGROUND_JOBS }, pending);
  const running = held.map((h) => withBackgroundSlot("b1", h.run));
  // 배경 자리가 다 찼어도 대화 차례는 돈다.
  expect(await withUserTurnSlot("b1", async () => "turn")).toEqual({ ok: true, value: "turn" });
  let ran = false;
  expect(
    await withBackgroundSlot("b1", async () => {
      ran = true;
    }),
  ).toEqual({ ok: false });
  expect(ran).toBe(false);
  expect(await withBackgroundSlot("b2", async () => "other user")).toEqual({ ok: true, value: "other user" });
  held.forEach((h) => h.finish());
  await Promise.all(running);
});

test("background work waits for a slot up to waitMs, then gives up", async () => {
  const held = Array.from({ length: MAX_BACKGROUND_JOBS }, pending);
  const running = held.map((h) => withBackgroundSlot("b3", h.run));
  // 기다리는 동안 자리가 나면 돈다.
  const waiting = withBackgroundSlot("b3", async () => "after wait", { waitMs: 2000 });
  held[0]!.finish();
  expect(await waiting).toEqual({ ok: true, value: "after wait" });
  // 자리가 안 나면 기다린 뒤 포기한다.
  const filler = pending();
  const fill = withBackgroundSlot("b3", filler.run);
  const started = Date.now();
  expect(await withBackgroundSlot("b3", async () => "never", { waitMs: 120 })).toEqual({ ok: false });
  expect(Date.now() - started).toBeGreaterThanOrEqual(100);
  // 기다리는 중에 요청이 끊기면 바로 포기한다.
  const ctrl = new AbortController();
  const aborted = withBackgroundSlot("b3", async () => "never", { waitMs: 60_000, signal: ctrl.signal });
  ctrl.abort();
  expect(await aborted).toEqual({ ok: false });
  [filler, ...held.slice(1)].forEach((h) => h.finish());
  await Promise.all([fill, ...running]);
});
