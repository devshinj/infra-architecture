import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, expect, test, vi } from "vitest";

import type { GuideView } from "@/domain/guides/view";
import { ChatPanel, type ChatPanelProps } from "@/ui/chat/ChatPanel";
import type { MentionInputHandle } from "@/ui/chat/MentionInput";
import { GuideCard } from "@/ui/guide/GuideCard";
import { GuideDone } from "@/ui/guide/GuideDone";
import { GuideNotes } from "@/ui/guide/GuideNotes";

afterEach(cleanup);

const VIEW: GuideView = {
  guideId: "shop",
  title: "대형 쇼핑몰",
  env: "onprem",
  envChoices: ["onprem", "cloud"],
  step: 2,
  total: 12,
  status: "active",
  current: { goal: "WAS 를 두 대로 이중화하기", example: "WAS 두 대를 이중화해서 넣어 줘" },
};
const ENV_VIEW: GuideView = { ...VIEW, env: null, step: 0, total: 0, current: null };

const card = (o: Partial<Parameters<typeof GuideCard>[0]> = {}) => ({
  view: VIEW,
  onInsert: vi.fn(),
  onSendEnv: vi.fn(),
  onQuit: vi.fn(async () => undefined),
  ...o,
});

const panel = (o: Partial<ChatPanelProps> = {}): ChatPanelProps => ({
  lines: [],
  busy: false,
  onSend: vi.fn(),
  onStop: vi.fn(),
  health: { qwen: "ok", clef: "ok" },
  mentionRef: createRef<MentionInputHandle>(),
  guide: { view: VIEW, onQuit: vi.fn(async () => undefined), onRebuild: vi.fn(async () => undefined) },
  ...o,
});

const dots = (region: HTMLElement) => region.querySelector<HTMLElement>("[data-progress]");

test("the band shows the topic title", () => {
  render(<GuideCard {...card()} />);
  const region = screen.getByRole("region", { name: "학습 단계" });
  const title = within(region).getByText("학습 · 대형 쇼핑몰 (온프레미스)");
  expect(title.closest("[data-band]")).not.toBeNull();
});

test("dots mark done, now and todo steps", () => {
  render(<GuideCard {...card()} />);
  const row = dots(screen.getByRole("region", { name: "학습 단계" }))!;
  const states = [...row.querySelectorAll("[data-state]")].map((d) => d.getAttribute("data-state"));
  expect(states).toHaveLength(12);
  expect(states.filter((s) => s === "done")).toHaveLength(2);
  expect(states[2]).toBe("now");
  expect(states.filter((s) => s === "now")).toHaveLength(1);
  expect(states.filter((s) => s === "todo")).toHaveLength(9);
});

test("progress dots are hidden from assistive tech", () => {
  render(<GuideCard {...card()} />);
  const region = screen.getByRole("region", { name: "학습 단계" });
  expect(dots(region)).toHaveAttribute("aria-hidden", "true");
  expect(region).toHaveTextContent("이번 단계 · 3 / 12");
});

test("env-less card shows the band without progress dots", () => {
  render(<GuideCard {...card({ view: ENV_VIEW })} />);
  const region = screen.getByRole("region", { name: "학습 단계" });
  expect(within(region).getByText("학습 · 대형 쇼핑몰")).toBeInTheDocument();
  expect(dots(region)).toBeNull();
});

test("GuideCard shows step n/N, goal and example", () => {
  render(<GuideCard {...card()} />);
  const region = screen.getByRole("region", { name: "학습 단계" });
  expect(region).toHaveTextContent("3 / 12");
  expect(within(region).getByText("WAS 를 두 대로 이중화하기")).toBeInTheDocument();
  expect(within(region).getByText("WAS 두 대를 이중화해서 넣어 줘")).toBeInTheDocument();
  expect(within(region).getByRole("button", { name: "입력창에 넣기" })).toBeInTheDocument();
  expect(within(region).getByRole("button", { name: "학습 그만두기" })).toBeInTheDocument();
  // 환경을 고른 뒤에는 환경 칩이 없다.
  expect(within(region).queryByRole("button", { name: "온프레미스" })).not.toBeInTheDocument();
});

test("insert example fills the input", async () => {
  const p = panel();
  render(<ChatPanel {...p} />);
  const user = userEvent.setup();
  // 키보드만으로: 입력창에 넣기 버튼까지 Tab 으로 가서 Enter.
  const insert = screen.getByRole("button", { name: "입력창에 넣기" });
  while (document.activeElement !== insert) await user.tab();
  await user.keyboard("{Enter}");
  const box = screen.getByRole("textbox");
  expect(box).toHaveValue("WAS 두 대를 이중화해서 넣어 줘");
  expect(box).toHaveFocus();
  expect(p.onSend).not.toHaveBeenCalled();
  // 넣은 글은 Enter 로 보낸다.
  await user.keyboard("{Enter}");
  expect(p.onSend).toHaveBeenCalledWith("WAS 두 대를 이중화해서 넣어 줘");
});

test("env chips send the env label", async () => {
  const p = panel({ guide: { view: ENV_VIEW, onQuit: vi.fn(async () => undefined) } });
  render(<ChatPanel {...p} />);
  const region = screen.getByRole("region", { name: "학습 단계" });
  expect(within(region).getByText("학습 · 대형 쇼핑몰")).toBeInTheDocument();
  expect(region).not.toHaveTextContent("/ 0");
  expect(within(region).queryByRole("button", { name: "입력창에 넣기" })).not.toBeInTheDocument();
  const user = userEvent.setup();
  const cloud = within(region).getByRole("button", { name: "클라우드" });
  while (document.activeElement !== cloud) await user.tab();
  await user.keyboard(" ");
  expect(p.onSend).toHaveBeenCalledWith("클라우드");
  await user.click(within(region).getByRole("button", { name: "온프레미스" }));
  expect(p.onSend).toHaveBeenLastCalledWith("온프레미스");
});

test("env chips and insert are disabled while a turn runs", () => {
  const { rerender } = render(<ChatPanel {...panel({ busy: true, guide: { view: ENV_VIEW, onQuit: vi.fn(async () => undefined) } })} />);
  expect(screen.getByRole("button", { name: "온프레미스" })).toBeDisabled();
  rerender(<ChatPanel {...panel({ busy: true })} />);
  expect(screen.getByRole("button", { name: "입력창에 넣기" })).toBeDisabled();
});

test("quit asks to confirm", async () => {
  const onQuit = vi.fn(async () => undefined);
  render(<GuideCard {...card({ onQuit })} />);
  const user = userEvent.setup();
  const quit = screen.getByRole("button", { name: "학습 그만두기" });
  while (document.activeElement !== quit) await user.tab();
  await user.keyboard("{Enter}");
  const dialog = screen.getByRole("alertdialog", { name: "학습 그만두기" });
  expect(dialog).toHaveTextContent("학습을 그만둘까요?");
  // 실수로 그만두지 않게 취소에 포커스. Esc 는 닫고 그만두기 버튼으로 돌아간다.
  expect(within(dialog).getByRole("button", { name: "취소" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(onQuit).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(quit).toHaveFocus());
  await user.keyboard("{Enter}");
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "그만두기" }));
  expect(onQuit).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});

test("quit shows the server error inside the dialog", async () => {
  const onQuit = vi.fn(async () => "다른 작업이 진행 중이에요.");
  render(<GuideCard {...card({ onQuit })} />);
  await userEvent.click(screen.getByRole("button", { name: "학습 그만두기" }));
  await userEvent.click(screen.getByRole("button", { name: "그만두기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("다른 작업이 진행 중이에요.");
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
});

test("note chips expand with aria-expanded", async () => {
  render(
    <GuideNotes
      notes={[
        { kind: "net", text: "DMZ 는 인터넷에서 오는 요청을 처음 받는 구역이에요." },
        { kind: "caution", text: "실제로는 방화벽도 두 대를 HA 로 묶어요." },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "해설" });
  const net = within(list).getByRole("button", { name: "망 특성" });
  const caution = within(list).getByRole("button", { name: "주의" });
  expect(net).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("DMZ 는 인터넷에서 오는 요청을 처음 받는 구역이에요.")).not.toBeVisible();
  const user = userEvent.setup();
  while (document.activeElement !== net) await user.tab();
  await user.keyboard("{Enter}");
  expect(net).toHaveAttribute("aria-expanded", "true");
  const text = screen.getByText("DMZ 는 인터넷에서 오는 요청을 처음 받는 구역이에요.");
  expect(text).toBeVisible();
  expect(net.getAttribute("aria-controls")).toBe(text.id);
  // 다른 칩은 따로 접고 편다.
  expect(caution).toHaveAttribute("aria-expanded", "false");
  await user.tab();
  expect(caution).toHaveFocus();
  await user.keyboard(" ");
  expect(caution).toHaveAttribute("aria-expanded", "true");
  await user.click(net);
  expect(net).toHaveAttribute("aria-expanded", "false");
});

test("done shows the other-env table and rebuild buttons", async () => {
  const onRebuild = vi.fn(async () => undefined);
  render(
    <GuideDone
      env="onprem"
      outro="IDC 안에 DMZ 와 내부 구역을 나눈 쇼핑몰을 만들었어요."
      otherEnv={[
        { from: "L4 두 대(VIP)", to: "ALB(AWS 가 이중화하는 관리형)" },
        { from: "NAS", to: "S3" },
      ]}
      rebuild={["cloud"]}
      onRebuild={onRebuild}
    />,
  );
  expect(screen.getByText("IDC 안에 DMZ 와 내부 구역을 나눈 쇼핑몰을 만들었어요.")).toBeInTheDocument();
  const table = screen.getByRole("table", { name: "클라우드라면 이렇게 바뀌어요" });
  const rows = within(table).getAllByRole("row");
  expect(within(rows[0]!).getAllByRole("columnheader").map((c) => c.textContent)).toEqual(["온프레미스", "클라우드"]);
  expect(within(rows[1]!).getAllByRole("cell").map((c) => c.textContent)).toEqual(["L4 두 대(VIP)", "ALB(AWS 가 이중화하는 관리형)"]);
  expect(rows).toHaveLength(3);
  expect(screen.getByText("이제 자유롭게 고쳐 보세요.")).toBeInTheDocument();
  const user = userEvent.setup();
  const rebuild = screen.getByRole("button", { name: "클라우드로 다시 만들기" });
  while (document.activeElement !== rebuild) await user.tab();
  await user.keyboard("{Enter}");
  expect(onRebuild).toHaveBeenCalledWith("cloud");
});

test("done without a rebuild handler shows no buttons; a failed rebuild shows the error", async () => {
  const { rerender } = render(<GuideDone env="onprem" outro="끝" rebuild={["cloud"]} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  rerender(<GuideDone env="onprem" outro="끝" rebuild={["cloud"]} onRebuild={async () => "처리하지 못했어요."} />);
  await userEvent.click(screen.getByRole("button", { name: "클라우드로 다시 만들기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("처리하지 못했어요.");
  expect(screen.getByRole("button", { name: "클라우드로 다시 만들기" })).toBeEnabled();
});

test("chat shows note chips and the done panel from guide lines", async () => {
  const onRebuild = vi.fn(async () => undefined);
  const T = { turn: "a1", at: 0 };
  render(
    <ChatPanel
      {...panel({
        guide: { view: { ...VIEW, status: "done", current: null, step: 12 }, onQuit: vi.fn(async () => undefined), onRebuild },
        lines: [
          { id: "a1-say-0", kind: "progress", text: "WAS 두 대를 넣었어요.", ...T },
          { id: "a1-guide", kind: "guide", text: "", guide: { kind: "step", step: 3, notes: [{ kind: "flow", text: "요청은 L4 에서 나눠요." }] }, ...T },
          { id: "a2-guide", kind: "guide", text: "", guide: { kind: "done", outro: "다 만들었어요.", otherEnv: [{ from: "NAS", to: "S3" }], rebuild: ["cloud"] }, turn: "a2", at: 0 },
        ],
      })}
    />,
  );
  expect(screen.queryByRole("region", { name: "학습 단계" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "흐름" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText("다 만들었어요.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "클라우드로 다시 만들기" }));
  expect(onRebuild).toHaveBeenCalledWith("cloud");
});
