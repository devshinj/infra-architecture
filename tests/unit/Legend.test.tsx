import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { EDGE_KINDS } from "@/domain/catalog";
import { LEGEND_LINE_HEIGHT, Legend, legendPlacement, legendStacksAboveCard } from "@/ui/canvas/Legend";

const KEY = "infrasketch.legendOpen";
beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("legend is collapsed by default and toggles with aria-expanded", async () => {
  const user = userEvent.setup();
  render(<Legend hideAux={false} />);
  const btn = screen.getByRole("button", { name: /범례/ });
  expect(btn).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("연결 범례")).toBeNull();
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("연결 범례")).toBeInTheDocument();
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "false");
});

test("legend lists four edge kinds from catalog plus dot, junction and arrow rows", async () => {
  render(<Legend hideAux={false} />);
  await userEvent.click(screen.getByRole("button", { name: /범례/ }));
  const list = screen.getByRole("list");
  for (const k of EDGE_KINDS) expect(within(list).getByText(k.label)).toBeInTheDocument();
  expect(within(list).getByText("움직이는 금색 점: 요청이 흘러가는 방향")).toBeInTheDocument();
  expect(within(list).getByText("작은 점: 여러 연결이 한 줄로 합쳐지는 곳")).toBeInTheDocument();
  expect(within(list).getByText("화살표: 연결이 향하는 쪽")).toBeInTheDocument();
  expect(within(list).getAllByRole("listitem")).toHaveLength(7);
  expect(screen.queryByText("숨김")).toBeNull();
});

test("aux row shows 숨김 when hideAux", async () => {
  render(<Legend hideAux />);
  await userEvent.click(screen.getByRole("button", { name: /범례/ }));
  const aux = screen.getByText("보조(관리·모니터링)").closest("li") as HTMLElement;
  expect(within(aux).getByText("숨김")).toBeInTheDocument();
});

test("Esc closes and returns focus to the button", async () => {
  const user = userEvent.setup();
  render(<Legend hideAux={false} />);
  const btn = screen.getByRole("button", { name: /범례/ });
  await user.click(btn);
  await user.keyboard("{Escape}");
  expect(btn).toHaveAttribute("aria-expanded", "false");
  expect(btn).toHaveFocus();
});

test("open state persists in localStorage and survives storage errors", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Legend hideAux={false} />);
  await user.click(screen.getByRole("button", { name: /범례/ }));
  expect(window.localStorage.getItem(KEY)).toBe("1");
  unmount();
  render(<Legend hideAux={false} />);
  expect(await screen.findByText("연결 범례")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /범례/ }));
  expect(window.localStorage.getItem(KEY)).toBe("0");
  cleanup();

  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  render(<Legend hideAux={false} />);
  const btn = screen.getByRole("button", { name: /범례/ });
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
});

test("hidden on an empty diagram", () => {
  render(<Legend hideAux={false} empty />);
  expect(screen.queryByRole("button", { name: /범례/ })).toBeNull();
});

// ---- 좁은 캔버스: 범례가 구성 정보 카드와 가로로 겹치면 카드 접힌 줄 위로 올라간다 ----
const narrow = { insetLeft: 252, insetRight: 444, cardWidth: 300, gap: 12 };

test("wide canvas: legend stays in the card band beside the card", () => {
  // 카드 오른쪽 끝(252+300) + 틈 12 = 564 ≤ 범례 왼쪽 끝(1400 − 444 − 90 = 866).
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 1400, legendWidth: 90 })).toBe(false);
});

test("narrow canvas: legend that would overlap the card stacks above it", () => {
  // 1000 − 444 − 90 = 466 < 564: 겹친다.
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 1000, legendWidth: 90 })).toBe(true);
  // 경계: 범례 왼쪽 끝이 카드 끝 + 틈과 딱 맞으면 겹치지 않는다.
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 564 + 444 + 90, legendWidth: 90 })).toBe(false);
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 564 + 444 + 90 - 1, legendWidth: 90 })).toBe(true);
  // 펼친 범례는 넓어서 더 일찍 올라간다.
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 1100, legendWidth: 90 })).toBe(false);
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 1100, legendWidth: 300 })).toBe(true);
});

test("unknown sizes never stack", () => {
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 0, legendWidth: 90 })).toBe(false);
  expect(legendStacksAboveCard({ ...narrow, canvasWidth: 1000, legendWidth: 0 })).toBe(false);
});

test("legend sits on the panel gap by default and above the card line when lifted", () => {
  const { unmount } = render(<Legend hideAux={false} />);
  expect((screen.getByRole("complementary", { name: "연결 범례" }) as HTMLElement).style.bottom).toBe("");
  unmount();
  render(<Legend hideAux={false} bottom={66} />);
  expect((screen.getByRole("complementary", { name: "연결 범례" }) as HTMLElement).style.bottom).toBe("66px");
});

test("legend reports its rendered width", () => {
  const seen: number[] = [];
  render(<Legend hideAux={false} onMeasure={(w) => seen.push(w)} />);
  expect(seen.length).toBeGreaterThan(0);
});

// ---- 비켜난 범례 자리: 카메라 바닥 인셋과 열린 카드 ----
const band = { cardLine: 42, cardOpen: false, cardHeight: 42 };

test("legend line height matches the collapsed toggle (min-height 40 + 2px border)", () => {
  const css = readFileSync("src/ui/canvas/legend.module.css", "utf8");
  const minH = Number(css.match(/\.toggle \{[^}]*min-height:\s*(\d+)px/)![1]);
  const border = Number(css.match(/\.legend \{[^}]*border:\s*(\d+)px solid/)![1]);
  expect(LEGEND_LINE_HEIGHT).toBe(minH + 2 * border);
});

test("beside the card: legend stays on the gap and the camera keeps only the card band", () => {
  const p = legendPlacement({ ...narrow, ...band, canvasWidth: 1400, legendWidth: 90 });
  expect(p.bottom).toBeUndefined();
  expect(p.insetBottom).toBe(12 + 42 + 12);
});

test("lifted above the collapsed card: the camera bottom inset also clears the legend", () => {
  const p = legendPlacement({ ...narrow, ...band, canvasWidth: 1000, legendWidth: 90 });
  expect(p.bottom).toBe(12 + 42 + 12);
  // 카드 줄 + 틈 + 접힌 범례 + 틈: 맞춤이 범례 밑에 노드를 두지 않는다.
  expect(p.insetBottom).toBe(12 + 42 + 12 + LEGEND_LINE_HEIGHT + 12);
});

test("open card on a narrow canvas: the legend sits above the open card's top, never over its body", () => {
  const p = legendPlacement({ ...narrow, ...band, cardOpen: true, cardHeight: 320, canvasWidth: 1000, legendWidth: 90 });
  expect(p.bottom).toBe(12 + 320 + 12);
  // 카메라 바닥 띠는 접힌 카드 기준 그대로(열린 카드는 위치 보기에서 따로 피한다).
  expect(p.insetBottom).toBe(12 + 42 + 12 + LEGEND_LINE_HEIGHT + 12);
  // 넓으면 열린 카드여도 옮기지 않는다.
  expect(legendPlacement({ ...narrow, ...band, cardOpen: true, cardHeight: 320, canvasWidth: 1400, legendWidth: 90 }).bottom).toBeUndefined();
});

test("a lifted legend caps its height to the room above it", () => {
  render(<Legend hideAux={false} bottom={344} />);
  const el = screen.getByRole("complementary", { name: "연결 범례" }) as HTMLElement;
  expect(el.style.maxHeight).toBe("calc(100% - 344px - var(--panel-gap))");
});
