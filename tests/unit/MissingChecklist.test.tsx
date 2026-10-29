import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { type DiagramState, emptyState } from "@/domain/types";
import { MissingChecklist, type MissingChecklistProps } from "@/ui/chat/MissingChecklist";

afterEach(cleanup);
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// web 은 hostname 만 비었고, db 는 cpu 가 모름이고 나머지는 비었다. 요청 연결은 라벨이 없다.
const full = { hostname: "h", cpu: "4", ram: "8", disk: "100", os: "linux", ip: "10.0.0.1", sw: "nginx" };
const mkState = (o: { db?: boolean } = {}): DiagramState => ({
  ...emptyState(),
  nodes: {
    web: { id: "web", kind: "web_server", label: "웹1", parent: null, attrs: { ...full, hostname: "" } },
    ...(o.db === false
      ? {}
      : { db: { id: "db", kind: "db_rdb", label: "디비", parent: null, attrs: { ip: "10.0.0.2", replication: "x", version: "8" }, unknown: ["cpu"] } }),
  },
  edges: o.db === false ? {} : { e1: { id: "e1", from: "web", to: "db", edgeKind: "request" } },
});

type OnSave = MissingChecklistProps["onSave"];
const setup = (o: { state?: DiagramState; busy?: boolean; focusId?: string | null; onSave?: OnSave } = {}) => {
  const onSave = vi.fn<OnSave>(o.onSave ?? (async () => ({ ok: true as const })));
  const props = { state: o.state ?? mkState(), busy: o.busy ?? false, focusId: o.focusId ?? null, onSave };
  const r = render(<MissingChecklist {...props} />);
  return { ...r, onSave, props };
};
const header = () => screen.getByRole("button", { name: /채워야 할 정보/ });
const block = (name: string) => screen.getByRole("group", { name });

test("hidden when nothing is missing", () => {
  const state: DiagramState = { ...emptyState(), nodes: { web: { id: "web", kind: "web_server", label: "웹1", parent: null, attrs: full } } };
  const { container } = setup({ state });
  expect(container).toBeEmptyDOMElement();
});

test("header shows count excluding unknown", async () => {
  setup();
  // web hostname 1 + db ram 1 (cpu 는 모름) + 연결 라벨 1 = 3
  expect(header()).toHaveTextContent("채워야 할 정보 (3)");
  expect(header()).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("group")).not.toBeInTheDocument();
  await userEvent.click(header());
  expect(header()).toHaveAttribute("aria-expanded", "true");
  expect(block("웹1")).toBeInTheDocument();
  expect(block("디비")).toBeInTheDocument();
  expect(block("웹1 → 디비")).toBeInTheDocument();
  expect(within(block("웹1 → 디비")).getByRole("textbox", { name: "프로토콜/포트" })).toBeInTheDocument();
});

test("unknown checkbox disables the input and is sent on save", async () => {
  const { onSave } = setup();
  await userEvent.click(header());
  const db = block("디비");
  // 이미 모름인 cpu 는 체크돼 있고 입력이 비활성이다.
  expect(within(db).getByRole("textbox", { name: "CPU" })).toBeDisabled();
  const ramRow = within(db).getByRole("textbox", { name: "RAM" });
  expect(ramRow).toBeEnabled();
  await userEvent.click(within(db).getByRole("checkbox", { name: "RAM 모름" }));
  expect(ramRow).toBeDisabled();
  await userEvent.click(within(db).getByRole("button", { name: "저장" }));
  expect(onSave).toHaveBeenCalledWith({ targetKind: "node", targetId: "db", values: {}, unknown: ["cpu", "ram"] });
});

test("save sends trimmed values for that target only", async () => {
  const { onSave } = setup();
  await userEvent.click(header());
  await userEvent.type(within(block("웹1")).getByRole("textbox", { name: "호스트명" }), "  web-01  ");
  await userEvent.type(within(block("웹1 → 디비")).getByRole("textbox", { name: "프로토콜/포트" }), "HTTP 8080");
  await userEvent.click(within(block("웹1")).getByRole("button", { name: "저장" }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith({ targetKind: "node", targetId: "web", values: { hostname: "web-01" }, unknown: [] });
  // 저장한 대상의 초안만 지워지고 다른 대상 초안은 남는다.
  await waitFor(() => expect(within(block("웹1")).getByRole("textbox", { name: "호스트명" })).toHaveValue(""));
  expect(within(block("웹1 → 디비")).getByRole("textbox", { name: "프로토콜/포트" })).toHaveValue("HTTP 8080");
  await userEvent.click(within(block("웹1 → 디비")).getByRole("button", { name: "저장" }));
  expect(onSave).toHaveBeenLastCalledWith({ targetKind: "edge", targetId: "e1", values: { label: "HTTP 8080" }, unknown: [] });
});

test("failed save shows the message and keeps the draft", async () => {
  const onSave: OnSave = async () => ({ ok: false, message: "값은 80자 이하로 입력해 주세요" });
  setup({ onSave });
  await userEvent.click(header());
  const input = within(block("웹1")).getByRole("textbox", { name: "호스트명" });
  await userEvent.type(input, "web-01");
  await userEvent.click(within(block("웹1")).getByRole("button", { name: "저장" }));
  expect(await within(block("웹1")).findByRole("alert")).toHaveTextContent("값은 80자 이하로 입력해 주세요");
  expect(input).toHaveValue("web-01");
  expect(within(block("디비")).queryByRole("alert")).not.toBeInTheDocument();
});

test("vanished target keeps other drafts", async () => {
  const { rerender, props } = setup();
  await userEvent.click(header());
  await userEvent.type(within(block("웹1")).getByRole("textbox", { name: "호스트명" }), "web-01");
  await userEvent.type(within(block("디비")).getByRole("textbox", { name: "RAM" }), "16");
  // db 와 그 연결이 사라진 새 상태가 온다.
  rerender(<MissingChecklist {...props} state={mkState({ db: false })} />);
  expect(screen.queryByRole("group", { name: "디비" })).not.toBeInTheDocument();
  expect(within(block("웹1")).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
  // db 가 다시 나타나도 버린 초안은 돌아오지 않는다.
  rerender(<MissingChecklist {...props} state={mkState()} />);
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveValue("");
  expect(within(block("웹1")).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
});

test("save disabled while busy", async () => {
  setup({ busy: true });
  await userEvent.click(header());
  for (const b of screen.getAllByRole("button", { name: "저장" })) expect(b).toBeDisabled();
});

test("focusId expands and focuses the first input of that target", () => {
  const { rerender, props } = setup();
  expect(header()).toHaveAttribute("aria-expanded", "false");
  rerender(<MissingChecklist {...props} focusId="db" />);
  expect(header()).toHaveAttribute("aria-expanded", "true");
  // cpu 는 모름이라 비활성: 첫 입력 가능한 칸(RAM)에 포커스가 간다.
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveFocus();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  // 같은 대상을 다시 가리키면(새 토큰) 접혀 있어도 다시 펼친다.
  fireEvent.click(header());
  expect(header()).toHaveAttribute("aria-expanded", "false");
  rerender(<MissingChecklist {...props} focusId="db" focusToken={2} />);
  expect(header()).toHaveAttribute("aria-expanded", "true");
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveFocus();
});
