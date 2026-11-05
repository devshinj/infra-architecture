import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { emptyState, type DiagramState } from "@/domain/types";
import type { StoredFlow } from "@/server/flows";
import { FlowPanel, type FlowPanelProps } from "@/ui/flows/FlowPanel";

afterEach(cleanup);

// 망 밖 브라우저 → (업무망) 방화벽 → 웹
const state = (): DiagramState =>
  ({
    ...emptyState(),
    groups: { biz: { id: "biz", groupKind: "network_zone", label: "업무망", parent: null } },
    nodes: {
      browser: { id: "browser", kind: "client", label: "브라우저", parent: null, attrs: {} },
      fw: { id: "fw", kind: "firewall", label: "방화벽", parent: "biz", attrs: {} },
      web: { id: "web", kind: "web_server", label: "웹", parent: "biz", attrs: {} },
    },
    edges: {
      e1: { id: "e1", from: "browser", to: "fw", edgeKind: "request" },
      e2: { id: "e2", from: "fw", to: "web", edgeKind: "request" },
    },
  }) as unknown as DiagramState;

const flow = (o: Partial<StoredFlow> & { id: string }): StoredFlow => ({
  name: o.id,
  origin: "user",
  steps: [
    { edge: "e1", from: "browser", short: "접속", text: "브라우저가 방화벽으로 접속해요" },
    { edge: "e2", from: "fw", short: "전달", text: "방화벽이 웹으로 넘겨요" },
  ],
  source: "user",
  reviewed: true,
  problems: [],
  ...o,
});

const props = (o: Partial<FlowPanelProps> = {}): FlowPanelProps => ({
  flows: [],
  state: state(),
  activeKey: null,
  onActivate: vi.fn(),
  onFocusStep: vi.fn(),
  onSuggest: vi.fn(),
  suggesting: false,
  onRename: vi.fn(async () => undefined),
  onDelete: vi.fn(async () => undefined),
  onConfirm: vi.fn(),
  onRepair: vi.fn(),
  disabled: false,
  ...o,
});

test("groups by origin", () => {
  render(<FlowPanel {...props({ flows: [flow({ id: "login", name: "로그인" }), flow({ id: "backup", name: "백업", origin: "system" })] })} />);
  const user = screen.getByRole("region", { name: "사용자 행동" });
  const system = screen.getByRole("region", { name: "시스템·네트워크" });
  expect(within(user).getByRole("button", { name: /^로그인(?! 메뉴)/ })).toBeInTheDocument();
  expect(within(user).queryByRole("button", { name: /^백업(?! 메뉴)/ })).not.toBeInTheDocument();
  expect(within(system).getByRole("button", { name: /^백업(?! 메뉴)/ })).toBeInTheDocument();
});

test("AI 제안 badge until 맞아요", () => {
  const onConfirm = vi.fn();
  const ai = flow({ id: "login", name: "로그인", source: "ai", reviewed: false });
  const { rerender } = render(<FlowPanel {...props({ flows: [ai], onConfirm })} />);
  const row = screen.getByRole("button", { name: /^로그인(?! 메뉴)/ });
  expect(row).toHaveTextContent("AI 제안");
  expect(row).toHaveTextContent("사람이 아직 확인하지 않았어요");
  fireEvent.click(screen.getByRole("button", { name: "로그인 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "맞아요" }));
  expect(onConfirm).toHaveBeenCalledWith("login");
  rerender(<FlowPanel {...props({ flows: [{ ...ai, reviewed: true }], onConfirm })} />);
  expect(screen.getByRole("button", { name: /^로그인(?! 메뉴)/ })).not.toHaveTextContent("AI 제안");
  fireEvent.click(screen.getByRole("button", { name: "로그인 메뉴" }));
  expect(screen.queryByRole("menuitem", { name: "맞아요" })).not.toBeInTheDocument();
});

test("끊김 row shows 다시 맞추기 which calls onRepair with name", () => {
  const onRepair = vi.fn();
  render(
    <FlowPanel
      {...props({
        flows: [flow({ id: "login", name: "로그인", problems: [{ kind: "missing_edge", step: 1 }] }), flow({ id: "ok", name: "정상" })],
        onRepair,
      })}
    />,
  );
  expect(screen.getByRole("button", { name: /^로그인(?! 메뉴)/ })).toHaveTextContent("끊김");
  expect(screen.getByRole("button", { name: /^정상(?! 메뉴)/ })).not.toHaveTextContent("끊김");
  const repairs = screen.getAllByRole("button", { name: "흐름 다시 맞추기" });
  expect(repairs).toHaveLength(1);
  fireEvent.click(repairs[0]!);
  expect(onRepair).toHaveBeenCalledWith("로그인");
});

test("selecting shows numbered steps with crossing note and result", () => {
  const onActivate = vi.fn();
  const onFocusStep = vi.fn();
  const f = flow({ id: "login", name: "로그인", result: "웹 화면이 떠요" });
  const { rerender } = render(<FlowPanel {...props({ flows: [f], onActivate })} />);
  expect(screen.queryByText(/브라우저가 방화벽으로 접속해요/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^로그인(?! 메뉴)/ }));
  expect(onActivate).toHaveBeenCalledWith("login");
  rerender(<FlowPanel {...props({ flows: [f], activeKey: "login", onActivate, onFocusStep })} />);
  expect(screen.getByRole("button", { name: /^로그인(?! 메뉴)/ })).toHaveAttribute("aria-expanded", "true");
  const steps = screen.getByRole("list", { name: "로그인 단계" });
  const items = within(steps).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("①");
  expect(items[0]).toHaveTextContent("브라우저가 방화벽으로 접속해요");
  expect(items[0]).toHaveTextContent("망 밖에서 업무망으로 넘어가요(방화벽 거침)");
  expect(items[1]).toHaveTextContent("②");
  expect(items[1]).not.toHaveTextContent("넘어가요");
  expect(screen.getByText("웹 화면이 떠요")).toBeInTheDocument();
  fireEvent.click(within(items[1]!).getByRole("button"));
  expect(onFocusStep).toHaveBeenCalledWith("e2");
  // 다시 누르면 흐름 보기를 푼다.
  fireEvent.click(screen.getByRole("button", { name: /^로그인(?! 메뉴)/ }));
  expect(onActivate).toHaveBeenLastCalledWith(null);
});

test("empty state text", () => {
  render(<FlowPanel {...props()} />);
  expect(screen.getByText('아직 흐름이 없어요. "흐름 제안받기"를 누르면 AI가 주요 흐름을 만들어 드려요.')).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "사용자 행동" })).not.toBeInTheDocument();
});

test("suggest button and its pending label", () => {
  const onSuggest = vi.fn();
  const { rerender } = render(<FlowPanel {...props({ onSuggest })} />);
  fireEvent.click(screen.getByRole("button", { name: "흐름 제안받기" }));
  expect(onSuggest).toHaveBeenCalled();
  rerender(<FlowPanel {...props({ onSuggest, suggesting: true })} />);
  expect(screen.getByRole("button", { name: "만드는 중…" })).toBeDisabled();
});

test("actions disabled when busy", () => {
  const onActivate = vi.fn();
  render(
    <FlowPanel
      {...props({
        disabled: true,
        onActivate,
        flows: [flow({ id: "login", name: "로그인", source: "ai", reviewed: false, problems: [{ kind: "missing_edge", step: 0 }] })],
      })}
    />,
  );
  expect(screen.getByRole("button", { name: "흐름 제안받기" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "흐름 다시 맞추기" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "로그인 메뉴" }));
  for (const name of ["이름 바꾸기", "삭제", "맞아요"]) expect(screen.getByRole("menuitem", { name })).toBeDisabled();
  // 보기는 늘 된다.
  fireEvent.click(screen.getByRole("button", { name: /^로그인(?! 메뉴)/ }));
  expect(onActivate).toHaveBeenCalledWith("login");
});

test("rename and delete go through the dialogs", async () => {
  const onRename = vi.fn(async () => undefined);
  const onDelete = vi.fn(async () => undefined);
  render(<FlowPanel {...props({ flows: [flow({ id: "login", name: "로그인" })], onRename, onDelete })} />);
  fireEvent.click(screen.getByRole("button", { name: "로그인 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "이름 바꾸기" }));
  const dialog = screen.getByRole("dialog", { name: "흐름 이름 바꾸기" });
  fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "가입" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "바꾸기" }));
  await vi.waitFor(() => expect(onRename).toHaveBeenCalledWith("login", "가입"));
  await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "로그인 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  const del = screen.getByRole("alertdialog", { name: "흐름 삭제" });
  fireEvent.click(within(del).getByRole("button", { name: "삭제" }));
  await vi.waitFor(() => expect(onDelete).toHaveBeenCalledWith("login"));
});
