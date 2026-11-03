import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import * as emphasis from "@/canvas/emphasis";

import { fx } from "../fixtures/spike";

// 노드 목록(computed)을 만들 때마다 emphasisOf 가 두 번(선택·호버) 불린다. 렌더마다 한 번(호버 확인)은 따로 불린다.
vi.mock("@/canvas/emphasis", async (orig) => {
  const m = await orig<typeof import("@/canvas/emphasis")>();
  return { ...m, emphasisOf: vi.fn(m.emphasisOf) };
});

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  class DM { m22 = 1; }
  vi.stubGlobal("DOMMatrixReadOnly", DM);
  vi.stubGlobal("DOMMatrix", DM);
});
afterEach(cleanup);

test("moving focus with arrows does not rebuild the node list; only the tab stop moves", async () => {
  const state = fx("s2");
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false };
  const props: CanvasProps = {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(), onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelector(".react-flow__node-infra")).not.toBeNull());
  const stops = () => [...container.querySelectorAll<HTMLElement>('.react-flow__node[tabindex="0"]')];
  let cur = stops()[0];
  cur.focus();
  const spy = vi.mocked(emphasis.emphasisOf);
  // 렌더가 가라앉을 때까지 기다린 뒤 센다.
  await new Promise((r) => setTimeout(r, 50));
  spy.mockClear();
  let renders = 0;
  for (const key of ["End", "Home", "ArrowDown"]) {
    fireEvent.keyDown(cur, { key });
    const next = document.activeElement as HTMLElement;
    await waitFor(() => expect(stops()).toEqual([next]));
    renders++;
    cur = next;
  }
  // 렌더마다 호버 확인 1번씩만: 노드 목록을 다시 만들었다면 그때마다 2번씩 더 불린다.
  const calls = spy.mock.calls.length;
  expect(calls).toBeGreaterThan(0);
  expect(calls).toBeLessThan(renders * 3);
  expect(spy.mock.calls.every((c) => c.length === 3)).toBe(true);
});
