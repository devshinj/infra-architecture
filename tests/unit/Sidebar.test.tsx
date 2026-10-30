import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
