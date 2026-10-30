import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

let path = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => path,
}));
vi.mock("@/app/(app)/actions", () => ({
  createDiagramAction: vi.fn(),
  createProjectAction: vi.fn(),
  deleteDiagramAction: vi.fn(),
  deleteProjectAction: vi.fn(),
  duplicateDiagramAction: vi.fn(),
  logoutAction: vi.fn(),
  renameDiagramAction: vi.fn(),
  renameProjectAction: vi.fn(),
}));

import { ShellProvider } from "@/ui/Shell";
import { Sidebar } from "@/ui/Sidebar";

afterEach(cleanup);

test("용어 사전 link is current only on /glossary", () => {
  path = "/glossary";
  render(<Sidebar projects={[]} userName="a" />);
  expect(screen.getByRole("link", { name: "용어 사전" })).toHaveAttribute("aria-current", "page");
  cleanup();
  path = "/";
  render(<Sidebar projects={[]} userName="a" />);
  expect(screen.getByRole("link", { name: "용어 사전" })).not.toHaveAttribute("aria-current");
});

// ---- 접는 사이드바 (P3D Task 6) ----
const COLLAPSE_KEY = "infrasketch.sidebarCollapsed";
const shell = () => (
  <ShellProvider>
    <Sidebar projects={[{ id: "p", name: "프로젝트A", diagrams: [] }]} userName="재석" />
  </ShellProvider>
);

test("sidebar collapses to rail and is remembered", () => {
  window.localStorage.clear();
  path = "/";
  render(shell());
  expect(screen.getByText(/프로젝트A/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "프로젝트 영역 접기" }));
  expect(window.localStorage.getItem(COLLAPSE_KEY)).toBe("1");
  expect(screen.queryByText(/프로젝트A/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "프로젝트 영역 펼치기" }));
  expect(window.localStorage.getItem(COLLAPSE_KEY)).toBe("0");
  expect(screen.getByText(/프로젝트A/)).toBeInTheDocument();
  window.localStorage.clear();
});

test("collapsed state restored after mount", () => {
  window.localStorage.setItem(COLLAPSE_KEY, "1");
  // SSR 첫 렌더는 저장값을 모른다: 펼친 채로 그린다(하이드레이션 일치).
  const html = renderToString(shell());
  expect(html).toContain("프로젝트 영역 접기");
  expect(html).not.toContain("프로젝트 영역 펼치기");
  render(shell());
  expect(screen.getByRole("button", { name: "프로젝트 영역 펼치기" })).toBeInTheDocument();
  expect(screen.queryByText(/프로젝트A/)).not.toBeInTheDocument();
  window.localStorage.clear();
});

test("rail buttons have labels", () => {
  window.localStorage.setItem(COLLAPSE_KEY, "1");
  path = "/glossary";
  render(shell());
  const nav = screen.getByRole("navigation", { name: "프로젝트" });
  for (const name of ["프로젝트 영역 펼치기", "새 프로젝트", "계정"]) {
    const b = within(nav).getByRole("button", { name });
    expect(b).toHaveAttribute("aria-label", name);
    expect(b).toHaveAttribute("title", name);
  }
  const link = within(nav).getByRole("link", { name: "용어 사전" });
  expect(link).toHaveAttribute("title", "용어 사전");
  expect(link).toHaveAttribute("aria-current", "page");
  // 레일의 새 프로젝트는 펼친 때와 같은 대화상자를 연다.
  fireEvent.click(within(nav).getByRole("button", { name: "새 프로젝트" }));
  expect(screen.getByRole("dialog", { name: "새 프로젝트" })).toBeInTheDocument();
  cleanup();
  // 계정 버튼은 이름과 로그아웃을 연다.
  render(shell());
  fireEvent.click(screen.getByRole("button", { name: "계정" }));
  expect(screen.getByText("재석")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  window.localStorage.clear();
  path = "/";
});
