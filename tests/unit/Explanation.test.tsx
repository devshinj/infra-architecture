import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import type { EdgeExplanation, NodeExplanation } from "@/domain/explain";
import { Explanation } from "@/ui/explain/Explanation";

afterEach(cleanup);

const node: NodeExplanation = {
  kind: "node",
  term: "Nginx",
  definition: "웹 서버입니다.",
  definitionSource: "ai",
  reviewed: false,
  why: "정적 파일을 빠르게 내보내려고 둡니다.",
  compare: "Apache 보다 가볍습니다.",
  role: "외부 요청을 WAS 로 넘깁니다.",
  adr: { decision: "Nginx 사용", reason: "가벼워서", alternative: "Apache", cost: "설정 학습" },
};
const terms = [{ key: "was", term: "WAS", definition: "애플리케이션 서버" }];

test("node sections in spec order with 미검수 badge", () => {
  render(<Explanation status="ready" data={node} terms={terms} />);
  const heads = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(heads).toEqual(["정의", "필요한 이유", "비교", "이 구성에서의 역할", "결정 기록(ADR)"]);
  expect(screen.getByText("미검수")).toBeInTheDocument();
  for (const l of ["결정", "이유", "대안", "대가"]) expect(screen.getByText(l)).toBeInTheDocument();
  expect(document.querySelector("abbr.term")).toHaveTextContent("WAS");
});

test("term node shows 필요한 이유 and 비교", () => {
  render(<Explanation status="ready" data={{ ...node, reviewed: true }} terms={[]} />);
  expect(screen.getByText("정적 파일을 빠르게 내보내려고 둡니다.")).toBeInTheDocument();
  expect(screen.getByText("Apache 보다 가볍습니다.")).toBeInTheDocument();
  expect(screen.queryByText("미검수")).not.toBeInTheDocument();
});

test("no why/compare headings without glossary entry", () => {
  render(<Explanation status="ready" data={{ ...node, why: undefined, compare: undefined }} terms={[]} />);
  expect(screen.queryByText("필요한 이유")).not.toBeInTheDocument();
  expect(screen.queryByText("비교")).not.toBeInTheDocument();
});

test("loading text", () => {
  render(<Explanation status="loading" terms={[]} />);
  expect(screen.getAllByText("설명을 만드는 중…").length).toBeGreaterThanOrEqual(3);
});

test("error shows partial definition, message and retry", async () => {
  const onRetry = vi.fn();
  render(<Explanation status="error" partial={{ definition: "사전 정의입니다." }} message="설명을 만들지 못했어요." terms={[]} onRetry={onRetry} />);
  expect(screen.getByText("사전 정의입니다.")).toBeInTheDocument();
  expect(screen.getByText("설명을 만들지 못했어요.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(onRetry).toHaveBeenCalled();
});

test("rewrite sends instruction, empty uses default", async () => {
  const onRewrite = vi.fn();
  render(<Explanation status="ready" data={node} terms={[]} onRewrite={onRewrite} />);
  await userEvent.click(screen.getByRole("button", { name: "다시 쓰기" }));
  await userEvent.type(screen.getByPlaceholderText("어떻게 고칠까요? (예: 더 쉽게)"), "더 쉽게");
  await userEvent.click(screen.getByRole("button", { name: "다시 만들기" }));
  expect(onRewrite).toHaveBeenLastCalledWith("더 쉽게");
  await userEvent.click(screen.getByRole("button", { name: "다시 쓰기" }));
  await userEvent.click(screen.getByRole("button", { name: "다시 만들기" }));
  expect(onRewrite).toHaveBeenLastCalledWith("더 쉽고 짧게");
});

test("busy disables rewrite", () => {
  render(<Explanation status="ready" data={node} terms={[]} onRewrite={vi.fn()} busy />);
  expect(screen.getByRole("button", { name: "다시 쓰기" })).toBeDisabled();
});

test("edge four fields", () => {
  const edge: EdgeExplanation = { kind: "edge", flow: "HTTP 요청", method: "동기 호출", why: "화면을 보여주려고", firewall: "443 허용" };
  render(<Explanation status="ready" data={edge} terms={[]} />);
  for (const l of ["무엇이 오가나", "방식", "왜 연결됐나", "방화벽 규칙"]) expect(screen.getByText(l)).toBeInTheDocument();
  expect(screen.getByText("443 허용")).toBeInTheDocument();
});

test("busy disables retry", () => {
  render(<Explanation status="error" message="x" terms={[]} onRetry={vi.fn()} busy />);
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeDisabled();
});
