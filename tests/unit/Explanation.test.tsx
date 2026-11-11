import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import type { EdgeExplanation, NodeExplanation } from "@/domain/explain";
import { Explanation, SLOW_MS } from "@/ui/explain/Explanation";

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

test("node sections in spec order with the AI 설명 badge", () => {
  render(<Explanation status="ready" data={node} terms={terms} />);
  const heads = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(heads).toEqual(["정의", "필요한 이유", "비교", "이 구성에서의 역할", "왜 이렇게 짰나요"]);
  expect(screen.getByText("AI 설명")).not.toHaveAttribute("title");
  // 배지 뜻은 화면 읽기용 숨긴 글로 들린다(title 과 겹쳐 두 번 읽히지 않게 title 은 두지 않는다).
  expect(screen.getByText("(사람이 아직 확인하지 않았어요)")).toBeInTheDocument();
  for (const l of ["결정", "이유", "대안", "대가"]) expect(screen.getByText(l)).toBeInTheDocument();
  expect(document.querySelector("abbr.term")).toHaveTextContent("WAS");
});

test("AI 설명 badge only for AI-made unreviewed definitions, never for built-in seed terms", () => {
  const glossaryNode = { ...node, definitionSource: "glossary" as const };
  const { rerender } = render(<Explanation status="ready" data={{ ...glossaryNode, termSource: "seed" }} terms={[]} />);
  expect(screen.queryByText("AI 설명")).not.toBeInTheDocument();
  expect(screen.queryByText("(사람이 아직 확인하지 않았어요)")).not.toBeInTheDocument();
  // 앞서 AI 가 사전에 넣은 항목을 다시 쓰는 경우에도 붙는다.
  rerender(<Explanation status="ready" data={{ ...glossaryNode, termSource: "ai" }} terms={[]} />);
  expect(screen.getByText("AI 설명")).toBeInTheDocument();
  rerender(<Explanation status="ready" data={{ ...glossaryNode, termSource: "ai", reviewed: true }} terms={[]} />);
  expect(screen.queryByText("AI 설명")).not.toBeInTheDocument();
});

test("term node shows 필요한 이유 and 비교", () => {
  render(<Explanation status="ready" data={{ ...node, reviewed: true }} terms={[]} />);
  expect(screen.getByText("정적 파일을 빠르게 내보내려고 둡니다.")).toBeInTheDocument();
  expect(screen.getByText("Apache 보다 가볍습니다.")).toBeInTheDocument();
  expect(screen.queryByText("AI 설명")).not.toBeInTheDocument();
});

test("no why/compare headings without glossary entry", () => {
  render(<Explanation status="ready" data={{ ...node, why: undefined, compare: undefined }} terms={[]} />);
  expect(screen.queryByText("필요한 이유")).not.toBeInTheDocument();
  expect(screen.queryByText("비교")).not.toBeInTheDocument();
});

test("loading draws skeleton lines under each heading and announces once", () => {
  const { container } = render(<Explanation status="loading" terms={[]} />);
  const heads = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(heads).toEqual(["정의", "이 구성에서의 역할", "왜 이렇게 짰나요"]);
  // 글자 대신 칸마다 줄 자리(스켈레톤). "만드는 중"은 알림 한 자리에만.
  expect(container.querySelectorAll("section").length).toBe(3);
  container.querySelectorAll("section").forEach((sec) => expect(sec.querySelector("h3 + span")).not.toBeNull());
  expect(screen.getByRole("status")).toHaveTextContent("설명을 만드는 중…");
  expect(screen.getAllByText("설명을 만드는 중…")).toHaveLength(1);
});

test("a slow explanation says so after SLOW_MS, and the timer restarts on the next load", () => {
  vi.useFakeTimers();
  try {
    const { rerender } = render(<Explanation status="loading" terms={[]} />);
    act(() => vi.advanceTimersByTime(SLOW_MS - 1));
    expect(screen.getByRole("status")).toHaveTextContent("설명을 만드는 중…");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toHaveTextContent("조금 오래 걸리고 있어요");
    rerender(<Explanation status="ready" data={node} terms={[]} />);
    expect(screen.queryByText(/조금 오래 걸리고 있어요/)).not.toBeInTheDocument();
    rerender(<Explanation status="loading" terms={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("설명을 만드는 중…");
  } finally {
    vi.useRealTimers();
  }
});

test("loading shows the glossary definition at once; role and ADR wait", () => {
  render(
    <Explanation
      status="loading"
      partial={{ term: "Redis", definition: "메모리 저장소입니다.", definitionSource: "glossary", reviewed: false, termSource: "ai", why: "빠르게 읽으려고", compare: "디스크 DB 보다 빠릅니다." }}
      terms={[]}
    />,
  );
  const heads = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(heads).toEqual(["정의", "필요한 이유", "비교", "이 구성에서의 역할", "왜 이렇게 짰나요"]);
  expect(screen.getByText("메모리 저장소입니다.")).toBeInTheDocument();
  expect(screen.getByText("AI 설명")).toBeInTheDocument();
  expect(screen.getByText("빠르게 읽으려고")).toBeInTheDocument();
  expect(screen.getAllByText("설명을 만드는 중…")).toHaveLength(1);
});

test("error shows the AI 설명 badge with an unreviewed AI-made partial definition", () => {
  const { rerender } = render(<Explanation status="error" partial={{ definition: "사전 정의입니다.", reviewed: false, termSource: "ai" }} message="x" terms={[]} />);
  expect(screen.getByText("AI 설명")).toBeInTheDocument();
  rerender(<Explanation status="error" partial={{ definition: "사전 정의입니다.", reviewed: false, termSource: "seed" }} message="x" terms={[]} />);
  expect(screen.queryByText("AI 설명")).not.toBeInTheDocument();
  rerender(<Explanation status="error" partial={{ definition: "사전 정의입니다.", reviewed: true, termSource: "ai" }} message="x" terms={[]} />);
  expect(screen.queryByText("AI 설명")).not.toBeInTheDocument();
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
