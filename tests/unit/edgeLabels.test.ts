import { expect, test } from "vitest";

import { LABEL_LINE, LABEL_OFFSET, MIN_TRUNK, NODE_RING, ROW_GAP, ROW_PITCH, labelBox, mergedLabels, type PlacedLabel } from "@/canvas/edgeLabels";
import type { Rect } from "@/canvas/layout";

type Pt = { x: number; y: number };
const edge = (id: string, from: string, to: string, points: Pt[], label?: string, labelAt?: Pt) => ({
  id, from, to, points, ...(label ? { label } : {}), ...(labelAt ? { labelAt } : {}),
});

test("constants keep their exact values", () => {
  expect(MIN_TRUNK).toBe(12);
  expect(LABEL_OFFSET).toBe(14);
  expect(NODE_RING).toBe(6);
  expect(LABEL_LINE).toBe(14);
  expect(ROW_GAP).toBe(4);
  expect(ROW_PITCH).toBe(18);
});

test("four same labels on a shared trunk merge onto the trunk", () => {
  const rect: Rect = { x: 100, y: 0, width: 100, height: 40 };
  // 노드 아래 변 (150,40) 에서 함께 내려가다(40px) 네 갈래로 갈라진다.
  const xs = [60, 120, 180, 240];
  const incident = xs.map((x, i) =>
    edge(`e${i}`, "n", `t${i}`, [{ x: 150, y: 40 }, { x: 150, y: 80 }, { x, y: 80 }, { x, y: 140 }], "HTTP 8080", { x, y: 110 }),
  );
  const out = mergedLabels("n", rect, incident);
  expect(out).toHaveLength(1);
  expect(out[0]).toMatchObject({ text: "HTTP 8080 ×4", edgeIds: ["e0", "e1", "e2", "e3"] });
  expect(out[0].x).toBe(150);
  expect(out[0].y).toBeGreaterThanOrEqual(40);
  expect(out[0].y).toBeLessThanOrEqual(80);
});

test("same labels without a trunk go next to the node on the leaving side", () => {
  const rect: Rect = { x: 0, y: 0, width: 100, height: 40 };
  const ys = [5, 15, 25, 35];
  const incident = ys.map((y, i) => edge(`e${i}`, "n", `t${i}`, [{ x: 100, y }, { x: 200, y: y * 3 }], "HTTP", { x: 150, y: y * 2 }));
  const out = mergedLabels("n", rect, incident);
  expect(out).toHaveLength(1);
  expect(out[0].text).toBe("HTTP ×4");
  expect(out[0].x).toBe(rect.x + rect.width + 14);
  expect(out[0].y).toBe(20);
});

test("different labels stay on their own edges", () => {
  const rect: Rect = { x: 0, y: 0, width: 100, height: 40 };
  const incident = [
    edge("a", "n", "x", [{ x: 100, y: 10 }, { x: 200, y: 10 }], "HTTPS", { x: 150, y: 10 }),
    edge("b", "n", "y", [{ x: 100, y: 30 }, { x: 200, y: 30 }], "SQL", { x: 150, y: 30 }),
  ];
  const out = mergedLabels("n", rect, incident);
  expect(out).toEqual([
    { text: "HTTPS", x: 150, y: 10, anchor: "middle", edgeIds: ["a"] },
    { text: "SQL", x: 150, y: 30, anchor: "middle", edgeIds: ["b"] },
  ]);
});

test("incoming and outgoing edges with the same label merge", () => {
  const rect: Rect = { x: 0, y: 0, width: 100, height: 40 };
  const incident = [
    // 나가는 선: 오른쪽 변 (100,10) 에서 시작.
    edge("out", "n", "x", [{ x: 100, y: 10 }, { x: 200, y: 10 }], "gRPC", { x: 150, y: 10 }),
    // 들어오는 선: 오른쪽 변 (100,30) 에서 끝난다. 고른 노드 쪽 끝부터 보면 (100,30) 이 시작.
    edge("in", "y", "n", [{ x: 200, y: 30 }, { x: 100, y: 30 }], "gRPC", { x: 150, y: 30 }),
  ];
  const out = mergedLabels("n", rect, incident);
  expect(out).toHaveLength(1);
  expect(out[0].text).toBe("gRPC ×2");
  expect(out[0].edgeIds).toEqual(["out", "in"]);
  expect(out[0].x).toBe(114);
  expect(out[0].y).toBe(20);
});

test("incoming edges sharing a trunk into the node merge onto that trunk", () => {
  const rect: Rect = { x: 0, y: 100, width: 100, height: 40 };
  const incident = [
    edge("a", "s1", "n", [{ x: 0, y: 0 }, { x: 0, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 100 }], "TCP"),
    edge("b", "s2", "n", [{ x: 100, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 100 }], "TCP"),
  ];
  const out = mergedLabels("n", rect, incident);
  expect(out).toEqual([{ text: "TCP ×2", x: 50, y: 75, anchor: "middle", edgeIds: ["a", "b"] }]);
});

test("pinned-node elbow routes are handled", () => {
  // 고정 노드의 꺾은선: 같은 점에서 나가지만 곧바로(12px 미만) 갈라진다 → 변 바깥에 둔다.
  const rect: Rect = { x: 100, y: 100, width: 80, height: 40 };
  const incident = [
    edge("a", "n", "x", [{ x: 140, y: 140 }, { x: 140, y: 146 }, { x: 60, y: 146 }, { x: 60, y: 220 }], "HTTP"),
    edge("b", "n", "y", [{ x: 140, y: 140 }, { x: 140, y: 146 }, { x: 260, y: 146 }, { x: 260, y: 220 }], "HTTP"),
    edge("c", "n", "z", [{ x: 140, y: 140 }, { x: 140, y: 180 }, { x: 300, y: 180 }], "SSH", { x: 220, y: 180 }),
  ];
  const out = mergedLabels("n", rect, incident);
  expect(out).toHaveLength(2);
  const http = out.find((l) => l.text === "HTTP ×2")!;
  expect(http).toBeDefined();
  expect(http.x).toBe(140);
  // 위·아래 변 옆은 선택 고리(6px)에서 4px 를 더 띄운다: 글자 높이 14 의 절반 7 + 4 + 6 = 17.
  expect(http.y).toBe(rect.y + rect.height + 17);
  expect(out.find((l) => l.text === "SSH")).toMatchObject({ x: 220, y: 180, edgeIds: ["c"] });
});

test("a single label without labelAt is left out, edges without a label are ignored", () => {
  const rect: Rect = { x: 0, y: 0, width: 100, height: 40 };
  const incident = [
    edge("a", "n", "x", [{ x: 100, y: 10 }, { x: 200, y: 10 }], "HTTPS"),
    edge("b", "n", "y", [{ x: 100, y: 30 }, { x: 200, y: 30 }], undefined, { x: 150, y: 30 }),
  ];
  expect(mergedLabels("n", rect, incident)).toEqual([]);
});

test("right-side merged label starts 14px right of the node, left-side ends 14px left of it", () => {
  const rect: Rect = { x: 100, y: 0, width: 100, height: 40 };
  const right = [10, 30].map((y, i) => edge(`r${i}`, "n", `t${i}`, [{ x: 200, y }, { x: 300, y: y * 2 }], "HTTP"));
  const [r] = mergedLabels("n", rect, right);
  expect(r).toMatchObject({ text: "HTTP ×2", anchor: "start", x: rect.x + rect.width + 14, y: 20 });
  const left = [10, 30].map((y, i) => edge(`l${i}`, `s${i}`, "n", [{ x: 0, y: y * 2 }, { x: 100, y }], "HTTP"));
  const [l] = mergedLabels("n", rect, left);
  expect(l).toMatchObject({ text: "HTTP ×2", anchor: "end", x: rect.x - 14, y: 20 });
});

test("top and bottom side labels, trunk labels and single labels are centred", () => {
  const rect: Rect = { x: 100, y: 100, width: 100, height: 40 };
  const top = [120, 180].map((x, i) => edge(`t${i}`, "n", `a${i}`, [{ x, y: 100 }, { x, y: 0 }], "A"));
  expect(mergedLabels("n", rect, top)[0]).toMatchObject({ anchor: "middle", x: 150, y: 83 });
  const bottom = [120, 180].map((x, i) => edge(`b${i}`, "n", `a${i}`, [{ x, y: 140 }, { x, y: 240 }], "B"));
  expect(mergedLabels("n", rect, bottom)[0]).toMatchObject({ anchor: "middle", x: 150, y: 157 });
  const trunk = [0, 300].map((x, i) => edge(`k${i}`, "n", `a${i}`, [{ x: 150, y: 140 }, { x: 150, y: 180 }, { x, y: 180 }], "C"));
  expect(mergedLabels("n", rect, trunk)[0]).toMatchObject({ anchor: "middle", x: 150, y: 160 });
  const single = [edge("s", "n", "a", [{ x: 200, y: 120 }, { x: 300, y: 120 }], "D", { x: 250, y: 120 })];
  expect(mergedLabels("n", rect, single)[0]).toMatchObject({ anchor: "middle", x: 250, y: 120 });
});

type Box = { x1: number; y1: number; x2: number; y2: number };
/** 두 상자 사이 틈(겹치면 음수). 가로·세로 가운데 더 벌어진 쪽. */
const gap = (a: Box, b: Box) => Math.max(b.x1 - a.x2, a.x1 - b.x2, b.y1 - a.y2, a.y1 - b.y2);
const ring = (r: Rect): Box => ({ x1: r.x - 6, y1: r.y - 6, x2: r.x + r.width + 6, y2: r.y + r.height + 6 });
/** 이름 상자끼리, 그리고 선택 고리까지 넓힌 노드 상자와 ROW_GAP 이상 떨어진다(출력 좌표 0.01 반올림 몫만 봐준다). */
function expectClear(out: PlacedLabel[], rect: Rect) {
  const boxes = out.map(labelBox);
  const min = ROW_GAP - 0.01;
  for (let i = 0; i < boxes.length; i++) {
    expect(gap(boxes[i], ring(rect)), `${out[i].text} vs node`).toBeGreaterThanOrEqual(min);
    for (let j = i + 1; j < boxes.length; j++) expect(gap(boxes[i], boxes[j]), `${out[i].text} vs ${out[j].text}`).toBeGreaterThanOrEqual(min);
  }
}

test("labelBox follows the anchor and the 11px text width", () => {
  const b = labelBox({ text: "HTTP", x: 100, y: 50, anchor: "start" });
  expect(b.x1).toBeLessThanOrEqual(100);
  expect(b.x2).toBeGreaterThan(100 + 4 * 11 * 0.7);
  expect(b.y2 - b.y1).toBe(14);
  const m = labelBox({ text: "HTTP", x: 100, y: 50, anchor: "middle" });
  expect((m.x1 + m.x2) / 2).toBeCloseTo(100);
  const e = labelBox({ text: "HTTP", x: 100, y: 50, anchor: "end" });
  expect(e.x2).toBeGreaterThanOrEqual(100);
  expect(e.x1).toBeLessThan(100 - 4 * 11 * 0.7);
});

test("two groups on the same bottom side stack in rows clear of each other and of the node", () => {
  const rect: Rect = { x: 100, y: 100, width: 100, height: 40 };
  const incident = [
    edge("a1", "n", "x1", [{ x: 130, y: 140 }, { x: 30, y: 240 }], "AAAA"),
    edge("a2", "n", "x2", [{ x: 170, y: 140 }, { x: 270, y: 240 }], "AAAA"),
    edge("b1", "n", "y1", [{ x: 140, y: 140 }, { x: 90, y: 240 }], "BBBB"),
    edge("b2", "n", "y2", [{ x: 160, y: 140 }, { x: 210, y: 240 }], "BBBB"),
  ];
  const out = mergedLabels("n", rect, incident);
  expect(out.map((l) => l.text)).toEqual(["AAAA ×2", "BBBB ×2"]);
  expectClear(out, rect);
  // 글자 순서대로 첫 줄, 다음 줄(18px 아래).
  expect(out[0]).toMatchObject({ x: 150, y: 157, anchor: "middle" });
  expect(out[1]).toMatchObject({ x: 150, y: 157 + 18, anchor: "middle" });
});

test("ALB: HTTP 80 ×4 and HTTP 8080 ×2 leaving the same bottom side do not overlap", () => {
  const rect: Rect = { x: 300, y: 200, width: 320, height: 110 };
  const bottom = rect.y + rect.height;
  const leave = (id: string, x: number, label: string, tx: number) => edge(id, "alb", `t-${id}`, [{ x, y: bottom }, { x, y: bottom + 20 + (x % 7) }, { x: tx, y: bottom + 20 + (x % 7) }, { x: tx, y: 600 }], label);
  const incident = [
    leave("w1", 400, "HTTP 80", 100),
    leave("w2", 430, "HTTP 80", 300),
    leave("w3", 490, "HTTP 80", 500),
    leave("w4", 520, "HTTP 80", 800),
    leave("a1", 450, "HTTP 8080", 1000),
    leave("a2", 470, "HTTP 8080", 1200),
  ];
  const out = mergedLabels("alb", rect, incident);
  expect(out.map((l) => l.text).sort()).toEqual(["HTTP 80 ×4", "HTTP 8080 ×2"]);
  expectClear(out, rect);
  for (const l of out) expect(l.y).toBeGreaterThan(bottom);
});

test("a trunk label next to a side label moves along its trunk instead of overlapping", () => {
  const rect: Rect = { x: 100, y: 100, width: 100, height: 40 };
  const incident = [
    // 공유 구간: (150,140) 에서 60px 내려간 뒤 갈라진다. 가운데는 (150,170).
    edge("t1", "n", "a", [{ x: 150, y: 140 }, { x: 150, y: 200 }, { x: 50, y: 200 }], "TRUNK"),
    edge("t2", "n", "b", [{ x: 150, y: 140 }, { x: 150, y: 200 }, { x: 250, y: 200 }], "TRUNK"),
    // 같은 아래 변의 다른 무리(공유 구간 없음): y=157 첫 줄, x=150.
    edge("s1", "n", "c", [{ x: 120, y: 140 }, { x: 20, y: 300 }], "SIDE"),
    edge("s2", "n", "d", [{ x: 180, y: 140 }, { x: 280, y: 300 }], "SIDE"),
  ];
  const out = mergedLabels("n", rect, incident);
  expectClear(out, rect);
  const side = out.find((l) => l.text === "SIDE ×2")!;
  const trunk = out.find((l) => l.text === "TRUNK ×2")!;
  expect(side).toMatchObject({ x: 150, y: 157 });
  // 공유 구간 위에 남는다.
  expect(trunk.x).toBe(150);
  // 가운데(150,170)는 변 옆 이름과 가까워서 구간을 따라 비켰다.
  expect(trunk.y).not.toBe(170);
  expect(trunk.y).toBeGreaterThanOrEqual(140);
  expect(trunk.y).toBeLessThanOrEqual(200);
});

test("a single label too close to the node slides along its own line", () => {
  const rect: Rect = { x: 100, y: 100, width: 100, height: 40 };
  const incident = [edge("s", "n", "x", [{ x: 150, y: 140 }, { x: 150, y: 240 }], "SQL", { x: 150, y: 145 })];
  const [l] = mergedLabels("n", rect, incident);
  expect(l.x).toBe(150);
  expect(l.y).toBeGreaterThan(145);
  expectClear([l], rect);
});

test("a fractional node rect keeps the first bottom row (rounding does not push it a row out)", () => {
  for (const height of [40, 40.004, 40.3333]) {
    const rect: Rect = { x: 100, y: 100, width: 100, height };
    const bottom = rect.y + rect.height;
    const incident = [
      edge("a", "n", "x", [{ x: 130, y: bottom }, { x: 30, y: 300 }], "HTTP"),
      edge("b", "n", "y", [{ x: 170, y: bottom }, { x: 270, y: 300 }], "HTTP"),
    ];
    const [l] = mergedLabels("n", rect, incident);
    expect(l.y, String(height)).toBe(Math.round((bottom + 17) * 100) / 100);
    expectClear([l], rect);
  }
});
