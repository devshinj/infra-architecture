import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vitest";

import { groupToggleWidth } from "@/canvas/layout";
import { ZoneNameLayer, zoneNameMaxWidth, zoneNameTransform, type ZoneName } from "@/canvas/ZoneNameLayer";

afterEach(cleanup);

const ZONES: ZoneName[] = [
  { id: "vpc", x: 40, y: 20, width: 400, label: "운영 VPC", groupKind: "vpc", collapsed: false, hiddenCount: 0 },
  { id: "db", x: 500, y: 60, width: 300, label: "데이터베이스 영역", groupKind: "subnet_private", collapsed: true, hiddenCount: 3, dimmed: true },
];

const pill = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`.group__name[data-zone-id="${id}"]`)!;

test("renders one .group__name per drawn zone with its label and title", () => {
  const { container } = render(<ZoneNameLayer zones={ZONES} />);
  const pills = container.querySelectorAll(".zone-names .group__name");
  expect(pills).toHaveLength(2);
  expect(pill(container, "vpc")).toHaveTextContent("운영 VPC");
  expect(pill(container, "vpc")).toHaveAttribute("title", "운영 VPC");
  expect(pill(container, "db")).toHaveAttribute("title", "데이터베이스 영역");
  // 영역 색: GroupBox 와 같은 토큰을 알약 자신에 준다(영역 상자 밖이라 물려받지 못한다).
  expect(pill(container, "vpc").style.getPropertyValue("--tint")).toBe("var(--zone-tint-vpc)");
});

test("sits inside the 1px border + 10px head padding, centred in the 30px head, placed by transform", () => {
  // 예전 GroupBox 머리 안 알약 자리: x + 1(테두리) + 10, 세로 가운데 y + 1 + 15.
  expect(zoneNameTransform(40, 20)).toBe("translate(51px, 36px) translateY(-50%)");
  const { container } = render(<ZoneNameLayer zones={ZONES} />);
  const s = pill(container, "vpc").style;
  expect(s.transform).toBe("translate(51px, 36px) translateY(-50%)");
  // left·top 으로 놓지 않는다(바뀔 때 영역 래퍼처럼 transform 으로 미끄러져야 한다).
  expect(s.left).toBe("");
  expect(s.top).toBe("");
});

test("the pill glides with the same transform transition as the zone wrapper, and not under reduced motion", () => {
  const css = readFileSync(join(process.cwd(), "src/canvas/canvas.css"), "utf8");
  const node = /^\.canvas__flow \.react-flow__node \{ transition: transform ([^;]+); \}/m.exec(css);
  expect(node).not.toBeNull();
  const pillRule = /^\.group__name \{([^}]*)\}/m.exec(css)![1];
  const transition = /transition: ([^;]+);/.exec(pillRule)![1].split(",").map((t) => t.trim());
  expect(transition).toContain(`transform ${node![1]}`);
  expect(transition).toContain("opacity 0.35s ease");
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  expect(reduced).toMatch(/\.group__name \{ transition: none; \}/);
});

test("max-width leaves room for the toggle: width − 2 (border) − 20 − 8 − toggle width", () => {
  // 펼친 영역: "접기" 11px 두 글자(22) + 안쪽 여백 12 + 테두리 2 = 36.
  expect(groupToggleWidth(false, 0)).toBeCloseTo(36, 6);
  expect(zoneNameMaxWidth(400, false, 0)).toBeCloseTo(334, 6);
  // 접힌 영역: "펼치기 · 노드 3개" 넓은 글자 6개(66) + 좁은 글자 5개(5 × 0.58 × 11 = 31.9) + 14 = 111.9.
  expect(groupToggleWidth(true, 3)).toBeCloseTo(111.9, 6);
  expect(zoneNameMaxWidth(300, true, 3)).toBeCloseTo(158.1, 6);
  const { container } = render(<ZoneNameLayer zones={ZONES} />);
  expect(parseFloat(pill(container, "vpc").style.maxWidth)).toBeCloseTo(334, 3);
  expect(parseFloat(pill(container, "db").style.maxWidth)).toBeCloseTo(158.1, 3);
});

test("adds the dimmed class when the zone is dimmed", () => {
  const { container } = render(<ZoneNameLayer zones={ZONES} />);
  expect(pill(container, "db")).toHaveClass("group--dimmed");
  expect(pill(container, "vpc")).not.toHaveClass("group--dimmed");
});

test("a click on a pill acts like a click on the zone head (passes the zone id), a right click opens the zone menu", () => {
  const onClick = vi.fn();
  const onContextMenu = vi.fn();
  const { container } = render(<ZoneNameLayer zones={ZONES} onPillClick={onClick} onPillContextMenu={onContextMenu} />);
  fireEvent.click(pill(container, "vpc"));
  expect(onClick).toHaveBeenCalledWith("vpc");
  fireEvent.contextMenu(pill(container, "db"));
  expect(onContextMenu).toHaveBeenCalledWith("db", expect.anything());
});
