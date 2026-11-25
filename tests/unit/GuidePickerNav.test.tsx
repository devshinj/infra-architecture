import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";

// router.push 는 이 테스트의 «앱» 이 주제 화면을 구성도 화면으로 바꾸게 한다(전환 안에서, Next 처럼).
const holder = vi.hoisted(() => ({ go: (() => {}) as (path: string) => void }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: (p: string) => holder.go(p), refresh: () => {} }), usePathname: () => "/learn" }));
vi.mock("@/app/(app)/actions", () => ({ startGuideAction: vi.fn(async () => ({ ok: true, projectId: "p", diagramId: "d" })) }));

import { SHOP } from "@/domain/guides/shop";
import { guideSummary } from "@/domain/guides/view";
import { GuidePicker } from "@/ui/guide/GuidePicker";
import { ShellProvider } from "@/ui/Shell";
import { ShellMain } from "@/ui/ShellMain";

afterEach(cleanup);

function App() {
  const [page, setPage] = useState("learn");
  holder.go = setPage;
  return (
    <ShellProvider>
      <ShellMain>{page === "learn" ? <GuidePicker guides={[guideSummary(SHOP)]} runs={[]} /> : <p>workspace</p>}</ShellMain>
    </ShellProvider>
  );
}

test("starting from /learn clears the navigation skeleton once the diagram opens", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "시작" }));
  await waitFor(() => expect(screen.getByText("workspace")).toBeInTheDocument());
  // 주제 화면이 사라질 때 navigating 을 풀지 않으면 작업 화면이 뼈대 뒤에 숨는다(.main[data-navigating]).
  await waitFor(() => expect(document.querySelector("main")!.getAttribute("data-navigating")).toBeNull());
});
