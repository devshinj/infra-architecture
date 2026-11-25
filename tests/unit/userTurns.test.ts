import { expect, test } from "vitest";

import { MAX_USER_TURNS, withUserTurnSlot } from "@/server/chat/userTurns";

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
