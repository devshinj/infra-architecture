import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import RootNotFound from "@/app/not-found";
import DiagramNotFound from "@/app/(app)/p/[projectId]/d/[diagramId]/not-found";
import AppError from "@/app/(app)/error";
import RootError from "@/app/error";
import GlobalError from "@/app/global-error";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("없는 화면: 제목 하나와 내 구성도로 가는 길", () => {
  render(<RootNotFound />);
  expect(screen.getByRole("heading", { level: 1, name: "찾는 화면이 없어요" })).toBeInTheDocument();
  const home = screen.getByRole("link", { name: "내 구성도로" });
  expect(home).toHaveAttribute("href", "/");
  expect(home).toHaveAttribute("data-variant", "primary");
});

test("남의·지운 구성도: 계정마다 따로라는 것을 알려 준다", () => {
  render(<DiagramNotFound />);
  expect(screen.getByRole("heading", { level: 1, name: "없거나 볼 수 없는 구성도예요" })).toBeInTheDocument();
  expect(screen.getByText(/만든 계정만 열 수 있어요/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "내 구성도로" })).toHaveAttribute("href", "/");
});

test.each([
  ["셸 안 오류", AppError],
  ["루트 오류", RootError],
])("%s: 다시 시도는 reset 을 부르고, 오류 번호를 보인다", async (_, Screen) => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const reset = vi.fn();
  const error = Object.assign(new Error("db down"), { digest: "3141592653" });
  render(<Screen error={error} reset={reset} />);
  expect(screen.getByRole("heading", { level: 1, name: "화면을 불러오지 못했어요" })).toBeInTheDocument();
  expect(screen.getByText("3141592653")).toBeInTheDocument();
  // 오류 내용(내부 메시지)은 화면에 내지 않는다.
  expect(screen.queryByText(/db down/)).not.toBeInTheDocument();
  const retry = screen.getByRole("button", { name: "다시 시도" });
  expect(retry).toHaveAttribute("data-variant", "primary");
  await userEvent.click(retry);
  expect(reset).toHaveBeenCalledTimes(1);
  // 칠한 연두 단추는 하나: 내 구성도로는 선 단추.
  expect(screen.getByRole("link", { name: "내 구성도로" })).toHaveAttribute("data-variant", "secondary");
});

test("오류 번호가 없으면(개발 서버·브라우저 오류) 번호 줄을 내지 않는다", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<AppError error={new Error("x")} reset={() => {}} />);
  expect(screen.queryByText(/오류 번호/)).not.toBeInTheDocument();
});

test("전체 오류(루트 레이아웃까지 실패): html 을 직접 그리고 같은 안내를 보인다", () => {
  // 루트 레이아웃 대신 그려지므로 <html lang="ko"> 와 <body> 를 제가 갖는다.
  const html = renderToStaticMarkup(<GlobalError error={new Error("x")} reset={() => {}} />);
  expect(html).toMatch(/^<html lang="ko"[^>]*>(<head><\/head>)?<body>/);
  expect(html).toContain("화면을 불러오지 못했어요");
  expect(html).toContain("다시 시도");
});
