import { expect, test } from "vitest";

import { offscreenHints, PEEK_PX, type OffscreenTarget } from "@/canvas/offscreen";

const SIZE = { width: 1000, height: 600 };
const INSETS = { left: 100, right: 300, top: 60, bottom: 50 }; // 보이는 띠: x 100–700, y 60–550
const ext = (x: number, count = 2, label = "외부 서비스", id = "ext"): OffscreenTarget => ({ id, label, count, rect: { x, y: 200, width: 200, height: 100 } });
const at = (x: number, y = 0, zoom = 1) => ({ x, y, zoom });

test("a lane past the right edge of the strip shows one hint on the right, at the lane's height", () => {
  const hints = offscreenHints([ext(800)], at(0), SIZE, INSETS);
  expect(hints).toEqual([{ side: "right", text: "외부 서비스 2", y: 250, rect: { x: 800, y: 200, width: 200, height: 100 }, ids: ["ext"] }]);
});

test("a lane that peeks into the strip by more than PEEK_PX counts as visible", () => {
  expect(offscreenHints([ext(700 - PEEK_PX - 1)], at(0), SIZE, INSETS)).toEqual([]);
  expect(offscreenHints([ext(700 - PEEK_PX + 1)], at(0), SIZE, INSETS)).toHaveLength(1);
});

test("panned the other way, the lane hint moves to the left; zoom scales the test", () => {
  const left = offscreenHints([ext(800)], at(-1000), SIZE, INSETS);
  expect(left.map((h) => h.side)).toEqual(["left"]);
  // 줌 0.5 면 같은 묶음이 400–500 에 놓여 띠 안이다.
  expect(offscreenHints([ext(800)], at(0, 0, 0.5), SIZE, INSETS)).toEqual([]);
});

test("several lanes on one side merge into one hint with the summed node count; the height stays inside the strip", () => {
  const hints = offscreenHints([ext(800, 2, "결제", "a"), { ...ext(800, 3, "인증", "b"), rect: { x: 800, y: 2000, width: 200, height: 100 } }], at(0), SIZE, INSETS);
  expect(hints).toHaveLength(1);
  expect(hints[0]).toMatchObject({ text: "외부 서비스 5", ids: ["a", "b"] });
  expect(hints[0]!.y).toBeLessThanOrEqual(550);
  expect(offscreenHints([ext(800, 1, "결제")], at(0), SIZE, INSETS)[0]!.text).toBe("결제 1");
});

test("no hint before the canvas has a size or when the strip is too narrow", () => {
  expect(offscreenHints([ext(800)], at(0), { width: 0, height: 0 }, INSETS)).toEqual([]);
  expect(offscreenHints([ext(800)], at(0), SIZE, { left: 480, right: 480 })).toEqual([]);
});

test("the hint slides along the strip edge to the nearest height that covers no node", () => {
  // 띠 오른쪽 가장자리 칸(x 552–692)에 노드가 y 220–280 에 있다. 묶음 가운데(250)는 막혀 위나 아래로 비킨다.
  const node = { x: 560, y: 220, width: 120, height: 60 };
  const [h] = offscreenHints([ext(800)], at(0), SIZE, INSETS, [node]);
  expect(h!.y + 16 <= 220 - 6 || h!.y - 16 >= 280 + 6).toBe(true);
  expect(Math.abs(h!.y - 250)).toBeLessThanOrEqual(60);
  // 칸 밖 노드는 상관없다.
  expect(offscreenHints([ext(800)], at(0), SIZE, INSETS, [{ x: 200, y: 220, width: 120, height: 60 }])[0]!.y).toBe(250);
});
