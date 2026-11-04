import { expect, test } from "vitest";

import { LABEL_OFFSET, MIN_TRUNK, mergedLabels } from "@/canvas/edgeLabels";
import type { Rect } from "@/canvas/layout";

type Pt = { x: number; y: number };
const edge = (id: string, from: string, to: string, points: Pt[], label?: string, labelAt?: Pt) => ({
  id, from, to, points, ...(label ? { label } : {}), ...(labelAt ? { labelAt } : {}),
});

test("constants keep their exact values", () => {
  expect(MIN_TRUNK).toBe(12);
  expect(LABEL_OFFSET).toBe(14);
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
  expect(http.y).toBe(rect.y + rect.height + 14);
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
  expect(mergedLabels("n", rect, top)[0]).toMatchObject({ anchor: "middle", x: 150, y: 86 });
  const bottom = [120, 180].map((x, i) => edge(`b${i}`, "n", `a${i}`, [{ x, y: 140 }, { x, y: 240 }], "B"));
  expect(mergedLabels("n", rect, bottom)[0]).toMatchObject({ anchor: "middle", x: 150, y: 154 });
  const trunk = [0, 300].map((x, i) => edge(`k${i}`, "n", `a${i}`, [{ x: 150, y: 140 }, { x: 150, y: 180 }, { x, y: 180 }], "C"));
  expect(mergedLabels("n", rect, trunk)[0]).toMatchObject({ anchor: "middle", x: 150, y: 160 });
  const single = [edge("s", "n", "a", [{ x: 200, y: 120 }, { x: 300, y: 120 }], "D", { x: 250, y: 120 })];
  expect(mergedLabels("n", rect, single)[0]).toMatchObject({ anchor: "middle", x: 250, y: 120 });
});
