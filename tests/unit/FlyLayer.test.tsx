import "@testing-library/jest-dom/vitest";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { FLY_MS, FlyLayer, MAX_DOTS, type Locate, type Point, useFly } from "@/ui/FlyLayer";

type Fly = ReturnType<typeof useFly>;
let fly: Fly | null = null;

function Harness({ motion = true, chatVisible = true, origin = true }: { motion?: boolean; chatVisible?: boolean; origin?: boolean }) {
  const f = useFly({ motion, chatVisible });
  fly = f;
  return (
    <>
      {origin && <span data-fly-origin="" data-testid="origin" />}
      <FlyLayer ref={f.layerRef} />
    </>
  );
}

const FROM = { left: 900, top: 200, width: 12, height: 12 };
const TO: Point = { x: 300, y: 500 };
const dots = () => document.querySelectorAll("[data-fly-dot]");
const at = (el: Element) => {
  const m = (el as HTMLElement).style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
  return m ? { x: Number(m[1]) + 3, y: Number(m[2]) + 3 } : null;
};

const origRect = Element.prototype.getBoundingClientRect;
let reduced = false;
beforeEach(() => {
  fly = null;
  reduced = false;
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const r = this.hasAttribute("data-fly-origin") ? FROM : { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
  };
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduced && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  Element.prototype.getBoundingClientRect = origRect;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const locateAll: Locate = () => TO;
const fire = (ids: string[], locate: Locate = locateAll) =>
  act(() => {
    for (const id of ids) fly!.queue(id);
    fly!.placed(locate);
  });

test("add_node during a turn launches one dot from card to node", () => {
  render(<Harness />);
  fire(["n1"]);
  expect(dots()).toHaveLength(1);
  // 첫 프레임: 진행 카드 점의 중심에서 출발한다
  act(() => void vi.advanceTimersByTime(16));
  const start = at(dots()[0]!)!;
  expect(Math.abs(start.x - 906)).toBeLessThan(15);
  expect(Math.abs(start.y - 206)).toBeLessThan(15);
  // 중간: 곧은 선보다 위로 휜다
  act(() => void vi.advanceTimersByTime(FLY_MS / 2 - 16));
  const mid = at(dots()[0]!)!;
  expect(mid.y).toBeLessThan((206 + TO.y) / 2);
  // 끝 무렵: 노드 중심에 닿고 흐려진다
  act(() => void vi.advanceTimersByTime(FLY_MS / 2 - 40));
  const end = at(dots()[0]!)!;
  expect(Math.abs(end.x - TO.x)).toBeLessThan(15);
  expect(Math.abs(end.y - TO.y)).toBeLessThan(15);
  expect(Number((dots()[0] as HTMLElement).style.opacity)).toBeLessThan(1);
  act(() => void vi.advanceTimersByTime(100));
  expect(dots()).toHaveLength(0);
  // 한 번 날린 노드는 다시 날리지 않는다
  act(() => fly!.placed(locateAll));
  expect(dots()).toHaveLength(0);
});

test("max 3 concurrent dots, extras skipped", () => {
  render(<Harness />);
  fire(["a", "b", "c", "d", "e"]);
  expect(dots()).toHaveLength(MAX_DOTS);
  act(() => void vi.advanceTimersByTime(FLY_MS + 50));
  expect(dots()).toHaveLength(0);
  // 건너뛴 것은 나중에도 날리지 않는다. 자리가 나면 새 노드는 날린다
  act(() => fly!.placed(locateAll));
  expect(dots()).toHaveLength(0);
  fire(["f"]);
  expect(dots()).toHaveLength(1);
});

test("no dot when reduced motion or motion off", () => {
  reduced = true;
  const { unmount } = render(<Harness />);
  fire(["n1"]);
  expect(dots()).toHaveLength(0);
  unmount();
  reduced = false;
  render(<Harness motion={false} />);
  fire(["n2"]);
  expect(dots()).toHaveLength(0);
});

test("no dot when target unknown or chat tab hidden", () => {
  const { unmount } = render(<Harness />);
  fire(["n1"], () => null); // 접힌 영역 안·화면 밖
  expect(dots()).toHaveLength(0);
  unmount();
  const second = render(<Harness chatVisible={false} />);
  fire(["n2"]);
  expect(dots()).toHaveLength(0);
  second.unmount();
  render(<Harness origin={false} />); // 진행 카드가 없다
  fire(["n3"]);
  expect(dots()).toHaveLength(0);
});

test("layer never captures pointer events", () => {
  render(<Harness />);
  fire(["n1"]);
  const layer = document.querySelector("[data-fly-layer]") as HTMLElement;
  expect(layer.style.position).toBe("fixed");
  expect(layer.style.pointerEvents).toBe("none");
  expect(layer).toHaveAttribute("aria-hidden", "true");
  const dot = dots()[0] as HTMLElement;
  expect(dot.style.pointerEvents).toBe("none");
  expect(dot.style.background).toBe("var(--fly-dot)");
  expect(dot.style.boxShadow).toBe("");
  expect(dot.style.width).toBe("6px");
});

test("unmount cancels running dots", () => {
  const { unmount } = render(<Harness />);
  fire(["n1"]);
  unmount();
  expect(() => vi.advanceTimersByTime(FLY_MS)).not.toThrow();
  expect(dots()).toHaveLength(0);
});

test("clear drops queued origins so a later settle launches nothing", () => {
  render(<Harness />);
  act(() => {
    fly!.queue("a");
    fly!.queue("b");
    fly!.clear();
    fly!.placed(locateAll);
  });
  expect(dots()).toHaveLength(0);
  fire(["c"]);
  expect(dots()).toHaveLength(1);
});
