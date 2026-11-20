import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
vi.mock("@/app/(app)/actions", () => ({ startGuideAction: vi.fn() }));

import { startGuideAction } from "@/app/(app)/actions";
import { SHOP } from "@/domain/guides/shop";
import { guideSummary } from "@/domain/guides/view";
import { GuidePicker, LEARN_DISCLAIMER, LEARN_EXAMPLE_NOTE } from "@/ui/guide/GuidePicker";

afterEach(cleanup);
beforeEach(() => {
  nav.push.mockReset();
  vi.mocked(startGuideAction).mockReset();
});

const topics = [guideSummary(SHOP)];

test("GuidePicker lists guides with the disclaimer", () => {
  render(
    <GuidePicker
      guides={topics}
      runs={[
        { diagramId: "d1", href: "/p/p1/d/d1", name: "대형 쇼핑몰 (온프레미스)", status: "active", progress: "3 / 12" },
        { diagramId: "d2", href: "/p/p1/d/d2", name: "대형 쇼핑몰 사본", status: "done", progress: "완료" },
      ]}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: "학습 모드" })).toBeInTheDocument();
  expect(LEARN_DISCLAIMER).toBe("실제 회사의 구성이 아니라, 이런 서비스를 만들 때 흔히 쓰는 구성입니다.");
  expect(LEARN_EXAMPLE_NOTE).toBe("값은 예시입니다.");
  expect(screen.getByText(LEARN_DISCLAIMER)).toBeInTheDocument();
  expect(screen.getByText(LEARN_EXAMPLE_NOTE)).toBeInTheDocument();

  const topic = screen.getByRole("article", { name: "대형 쇼핑몰" });
  expect(within(topic).getByText(SHOP.intro)).toBeInTheDocument();
  for (const l of SHOP.learns) expect(within(topic).getByText(l)).toBeInTheDocument();
  const envs = within(topic).getByRole("list", { name: "준비된 환경" });
  const onprem = SHOP.variants.onprem!.steps.length;
  const cloud = SHOP.variants.cloud!.steps.length;
  expect(within(envs).getAllByRole("listitem").map((li) => li.textContent)).toEqual([`온프레미스 · ${onprem}단계`, `클라우드 · ${cloud}단계`]);
  expect(within(topic).getByRole("button", { name: "시작" })).toBeInTheDocument();

  const going = screen.getByRole("region", { name: "진행 중" });
  const link = within(going).getByRole("link", { name: /대형 쇼핑몰 \(온프레미스\)/ });
  expect(link).toHaveAttribute("href", "/p/p1/d/d1");
  expect(going).toHaveTextContent("3 / 12");
  const done = screen.getByRole("region", { name: "끝낸 학습" });
  expect(within(done).getByRole("link", { name: /대형 쇼핑몰 사본/ })).toHaveAttribute("href", "/p/p1/d/d2");
  expect(done).toHaveTextContent("완료");
});

test("GuidePicker hides empty run lists", () => {
  render(<GuidePicker guides={topics} runs={[]} />);
  expect(screen.queryByRole("region", { name: "진행 중" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "끝낸 학습" })).not.toBeInTheDocument();
});

test("GuidePicker start calls the action and navigates", async () => {
  let resolve!: (v: { ok: true; projectId: string; diagramId: string }) => void;
  vi.mocked(startGuideAction).mockImplementation(() => new Promise((r) => (resolve = r)));
  render(<GuidePicker guides={topics} runs={[]} />);
  const user = userEvent.setup();
  const start = screen.getByRole("button", { name: "시작" });
  while (document.activeElement !== start) await user.tab();
  await user.keyboard("{Enter}");
  expect(startGuideAction).toHaveBeenCalledWith("shop", null);
  // 만드는 동안은 두 번 누르지 못한다.
  expect(screen.getByRole("button", { name: "만드는 중…" })).toBeDisabled();
  resolve({ ok: true, projectId: "p9", diagramId: "d9" });
  await vi.waitFor(() => expect(nav.push).toHaveBeenCalledWith("/p/p9/d/d9"));
  expect(startGuideAction).toHaveBeenCalledTimes(1);
});

test("GuidePicker shows the start error in the topic card", async () => {
  vi.mocked(startGuideAction).mockResolvedValue({ ok: false, error: "없는 학습 주제예요." });
  render(<GuidePicker guides={topics} runs={[]} />);
  await userEvent.click(screen.getByRole("button", { name: "시작" }));
  const topic = screen.getByRole("article", { name: "대형 쇼핑몰" });
  expect(await within(topic).findByRole("alert")).toHaveTextContent("없는 학습 주제예요.");
  expect(nav.push).not.toHaveBeenCalled();
  expect(within(topic).getByRole("button", { name: "시작" })).toBeEnabled();
});
