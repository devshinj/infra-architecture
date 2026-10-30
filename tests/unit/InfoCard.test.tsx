import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { type DiagramState, emptyState } from "@/domain/types";
import { type ChecklistDrafts, type ChecklistExpanded } from "@/ui/chat/MissingChecklist";
import { InfoCard, type InfoCardProps } from "@/ui/canvas/InfoCard";

afterEach(cleanup);
const origScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  if (origScroll) Object.defineProperty(Element.prototype, "scrollIntoView", origScroll);
  else delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});

const full = { hostname: "h", cpu: "4", ram: "8", disk: "100", os: "linux", ip: "10.0.0.1", sw: "nginx" };
// web(빈 hostname) 1대: 빠진 정보 1 · 단일 장애점 경고 1. 가정 2개 중 1개 미확정.
const mkState = (): DiagramState => ({
  ...emptyState(),
  nodes: { web: { id: "web", kind: "web_server", label: "웹1", parent: null, attrs: { ...full, hostname: "" } } },
  assumptions: {
    scale: { key: "scale", value: "소규모(일 1천 명 이하)", confirmed: false },
    environment: { key: "environment", value: "사내 IDC", confirmed: true },
  },
});

type Outer = Partial<Omit<InfoCardProps, "checklist">> & { onSave?: InfoCardProps["checklist"]["onSave"] };
function Card(p: Outer) {
  const [open, setOpen] = useState(p.open ?? false);
  const [drafts, setDrafts] = useState<ChecklistDrafts>({});
  const [expanded, setExpanded] = useState<ChecklistExpanded>({});
  return (
    <InfoCard
      state={p.state ?? mkState()}
      readOnly={p.readOnly ?? false}
      busy={p.busy ?? false}
      open={open}
      onOpenChange={setOpen}
      onChooseAssumption={p.onChooseAssumption ?? vi.fn()}
      onConfirmAssumption={p.onConfirmAssumption ?? vi.fn()}
      onSelectWarning={p.onSelectWarning ?? vi.fn()}
      {...(p.scrollToWarnings !== undefined ? { scrollToWarnings: p.scrollToWarnings } : {})}
      {...(p.onMeasure ? { onMeasure: p.onMeasure } : {})}
      checklist={{ focusId: null, onSave: p.onSave ?? (async () => ({ ok: true })), drafts, onDraftsChange: setDrafts, expanded, onExpandedChange: setExpanded, onLocate: vi.fn() }}
    />
  );
}

const toggle = () => screen.getByRole("button", { name: /^구성 정보 (펼치기|접기)$/ });

test("card collapsed line shows counts", () => {
  render(<Card />);
  const t = toggle();
  expect(t).toHaveAccessibleName("구성 정보 펼치기");
  expect(t).toHaveAttribute("aria-expanded", "false");
  expect(t).toHaveTextContent("구성 정보 · 채워야 할 정보 1 · 주의 1 · 미확정 가정 1");
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  cleanup();
  // 0 인 항목은 숫자가 흐리다.
  const st = mkState();
  st.nodes.web!.attrs.hostname = "h";
  st.assumptions = { redundancy: { key: "redundancy", value: "핵심 구간 이중화", confirmed: true } };
  render(<Card state={st} />);
  expect(toggle()).toHaveTextContent("구성 정보 · 채워야 할 정보 0 · 주의 0 · 미확정 가정 0");
  for (const n of within(toggle()).getAllByText("0")) expect(n).toHaveAttribute("data-zero");
});

test("hidden on an empty diagram", () => {
  const { container } = render(<Card state={emptyState()} />);
  expect(container).toBeEmptyDOMElement();
});

test("expands upward with three sections", async () => {
  render(<Card />);
  await userEvent.click(toggle());
  expect(toggle()).toHaveAccessibleName("구성 정보 접기");
  expect(toggle()).toHaveAttribute("aria-expanded", "true");
  const sections = screen.getAllByRole("region");
  expect(sections.map((s) => s.getAttribute("aria-label"))).toEqual(["가정", "채워야 할 정보", "주의"]);
  // 위로 열린다: 펼친 내용은 접기 줄 위에 그려진다(카드는 column-reverse, 단추가 DOM 첫째).
  const card = screen.getByRole("complementary", { name: "구성 정보" });
  expect(card.firstElementChild).toBe(toggle());
  expect(within(sections[0]!).getByRole("button", { name: /^규모: 소규모/ })).toBeInTheDocument();
  expect(within(sections[1]!).getByRole("group", { name: "웹1" })).toBeInTheDocument();
  expect(within(sections[2]!).getByRole("button", { name: /웹1이\(가\) 1대뿐/ })).toBeInTheDocument();
});

test("assumption choose and confirm work inside the card", async () => {
  const onChooseAssumption = vi.fn();
  const onConfirmAssumption = vi.fn();
  render(<Card open onChooseAssumption={onChooseAssumption} onConfirmAssumption={onConfirmAssumption} />);
  await userEvent.click(screen.getByRole("button", { name: /^규모: 소규모/ }));
  await userEvent.click(within(screen.getByRole("group", { name: "규모 대안" })).getByRole("button", { name: /대규모/ }));
  expect(onChooseAssumption).toHaveBeenCalledWith("scale", expect.stringContaining("대규모"));
  await userEvent.click(screen.getByRole("button", { name: /^규모: 소규모/ }));
  await userEvent.click(screen.getByRole("button", { name: "이대로 확정" }));
  expect(onConfirmAssumption).toHaveBeenCalledWith("scale");
});

test("warning item selects node", async () => {
  const onSelectWarning = vi.fn();
  render(<Card open onSelectWarning={onSelectWarning} />);
  const warn = within(screen.getByRole("region", { name: "주의" }));
  await userEvent.click(warn.getByRole("button", { name: /1대뿐/ }));
  expect(onSelectWarning).toHaveBeenCalledWith("web");
});

test("scroll request opens at the warnings section", () => {
  const { rerender } = render(<Card open scrollToWarnings={0} />);
  vi.mocked(Element.prototype.scrollIntoView).mockClear();
  rerender(<Card open scrollToWarnings={1} />);
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts[0]).toBe(screen.getByRole("region", { name: "주의" }));
});

test("read-only in history view", async () => {
  render(<Card open readOnly />);
  // 가정은 글로만 보이고, 고르기·확정이 없다.
  const a = within(screen.getByRole("region", { name: "가정" }));
  expect(a.getByText(/규모: 소규모/)).toBeInTheDocument();
  expect(a.queryByRole("button")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "웹1 항목 펼치기" }));
  expect(screen.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "호스트명" })).toBeDisabled();
  // 위치 보기·주의 항목은 그대로 쓸 수 있다.
  expect(screen.getByRole("button", { name: "웹1 위치 보기" })).toBeEnabled();
  expect(within(screen.getByRole("region", { name: "주의" })).getByRole("button", { name: /1대뿐/ })).toBeEnabled();
});

test("toggle is described by the visible counts line", () => {
  render(<Card />);
  expect(toggle()).toHaveAccessibleDescription("구성 정보 · 채워야 할 정보 1 · 주의 1 · 미확정 가정 1");
});

test("scroll request moves focus to the first warning item", () => {
  const { rerender } = render(<Card open scrollToWarnings={0} />);
  rerender(<Card open scrollToWarnings={1} />);
  expect(within(screen.getByRole("region", { name: "주의" })).getByRole("button", { name: /1대뿐/ })).toHaveFocus();
});

test("Escape inside the open card collapses it and returns focus to the toggle", async () => {
  render(<Card open />);
  await userEvent.click(screen.getByRole("button", { name: "웹1 항목 펼치기" }));
  screen.getByRole("textbox", { name: "호스트명" }).focus();
  await userEvent.keyboard("{Escape}");
  expect(toggle()).toHaveAttribute("aria-expanded", "false");
  expect(toggle()).toHaveFocus();
});

test("Escape on an open assumption menu closes only the menu", async () => {
  render(<Card open />);
  await userEvent.click(screen.getByRole("button", { name: /^규모: 소규모/ }));
  expect(screen.getByRole("group", { name: "규모 대안" })).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("group", { name: "규모 대안" })).not.toBeInTheDocument();
  expect(toggle()).toHaveAttribute("aria-expanded", "true");
});

test("reports its size for the camera", () => {
  const onMeasure = vi.fn();
  render(<Card onMeasure={onMeasure} />);
  expect(onMeasure).toHaveBeenCalledWith({ width: expect.any(Number), height: expect.any(Number), lineHeight: expect.any(Number) });
});
