import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { setZoneTypeAction } from "@/app/(app)/actions";
import { type DiagramState, emptyState } from "@/domain/types";
import { NetworkKnowledgeProvider } from "@/ui/network/NetworkKnowledgeContext";
import { type ChecklistDrafts, type ChecklistExpanded, MissingChecklist as Controlled, type MissingChecklistProps } from "@/ui/chat/MissingChecklist";

import { KNOWLEDGE } from "../fixtures/network";

vi.mock("@/app/(app)/actions", () => ({ setZoneTypeAction: vi.fn(async () => ({ ok: true, number: 4 })) }));

type OuterProps = Omit<MissingChecklistProps, "drafts" | "onDraftsChange" | "expanded" | "onExpandedChange">;
// 부모가 초안·블록 펼침을 들고 있는 모양을 흉내 낸다.
function MissingChecklist(p: OuterProps) {
  const [drafts, setDrafts] = useState<ChecklistDrafts>({});
  const [expanded, setExpanded] = useState<ChecklistExpanded>({});
  return <Controlled {...p} drafts={drafts} onDraftsChange={setDrafts} expanded={expanded} onExpandedChange={setExpanded} />;
}

afterEach(cleanup);
// jsdom 에는 scrollIntoView 가 없다: 테스트마다 끼우고 원래대로 돌려 둔다.
const origScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  if (origScroll) Object.defineProperty(Element.prototype, "scrollIntoView", origScroll);
  else delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
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
const setup = (o: { state?: DiagramState; busy?: boolean; readOnly?: boolean; focusId?: string | null; onSave?: OnSave } = {}) => {
  const onSave = vi.fn<OnSave>(o.onSave ?? (async () => ({ ok: true as const })));
  const onLocate = vi.fn();
  const props = { state: o.state ?? mkState(), busy: o.busy ?? false, focusId: o.focusId ?? null, onSave, onLocate, ...(o.readOnly ? { readOnly: true } : {}) };
  const r = render(<MissingChecklist {...props} />);
  return { ...r, onSave, onLocate, props };
};
const block = (name: string) => screen.getByRole("group", { name });
const expand = async (...names: string[]) => {
  for (const n of names) await userEvent.click(screen.getByRole("button", { name: `${n} 항목 펼치기` }));
};
const ALL = ["웹1", "디비", "웹1 → 디비"];

test("hidden when nothing is missing", () => {
  const state: DiagramState = { ...emptyState(), nodes: { web: { id: "web", kind: "web_server", label: "웹1", parent: null, attrs: full } } };
  const { container } = setup({ state });
  expect(container).toBeEmptyDOMElement();
});

test("blocks start collapsed, toggle expands", async () => {
  setup();
  // 블록 머리: 이름과 남은 개수(모름 제외). web hostname 1 · db ram 1(cpu 는 모름) · 연결 라벨 1
  for (const n of ALL) expect(within(block(n)).getByRole("button", { name: `${n} 항목 펼치기` })).toHaveAttribute("aria-expanded", "false");
  expect(within(block("디비")).getByText("1")).toBeInTheDocument();
  expect(within(block("디비")).getByRole("button", { name: "디비 위치 보기" })).toHaveTextContent("디비");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  await expand("웹1 → 디비");
  expect(within(block("웹1 → 디비")).getByRole("textbox", { name: "프로토콜/포트" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "웹1 → 디비 항목 접기" })).toHaveAttribute("aria-expanded", "true");
  expect(within(block("웹1")).queryByRole("textbox")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "웹1 → 디비 항목 접기" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

test("title click asks to locate the target", async () => {
  const { onLocate } = setup();
  await userEvent.click(screen.getByRole("button", { name: "웹1 위치 보기" }));
  expect(onLocate).toHaveBeenCalledWith("web");
  await userEvent.click(screen.getByRole("button", { name: "웹1 → 디비 위치 보기" }));
  expect(onLocate).toHaveBeenLastCalledWith("e1");
  // 위치 보기는 블록을 펼치지 않는다.
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

test("renamed node updates block title", async () => {
  const { rerender, props } = setup();
  await expand("웹1");
  const renamed = mkState();
  renamed.nodes.web = { ...renamed.nodes.web!, label: "프론트" };
  rerender(<MissingChecklist {...props} state={renamed} />);
  expect(screen.queryByRole("group", { name: "웹1" })).not.toBeInTheDocument();
  expect(within(block("프론트")).getByRole("button", { name: "프론트 위치 보기" })).toHaveTextContent("프론트");
  expect(block("프론트 → 디비")).toBeInTheDocument();
  // 펼침은 대상 id 를 따라가 그대로다.
  expect(within(block("프론트")).getByRole("textbox", { name: "호스트명" })).toBeInTheDocument();
});

test("read-only hides save and disables inputs", async () => {
  setup({ readOnly: true });
  await expand(...ALL);
  expect(screen.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  for (const t of screen.getAllByRole("textbox")) expect(t).toBeDisabled();
  for (const c of screen.getAllByRole("checkbox")) expect(c).toBeDisabled();
});

test("unknown checkbox disables the input and is sent on save", async () => {
  const { onSave } = setup();
  await expand("디비");
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
  await expand(...ALL);
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
  await expand(...ALL);
  const input = within(block("웹1")).getByRole("textbox", { name: "호스트명" });
  await userEvent.type(input, "web-01");
  await userEvent.click(within(block("웹1")).getByRole("button", { name: "저장" }));
  expect(await within(block("웹1")).findByRole("alert")).toHaveTextContent("값은 80자 이하로 입력해 주세요");
  expect(input).toHaveValue("web-01");
  expect(within(block("디비")).queryByRole("alert")).not.toBeInTheDocument();
});

test("vanished target keeps other drafts", async () => {
  const { rerender, props } = setup();
  await expand(...ALL);
  await userEvent.type(within(block("웹1")).getByRole("textbox", { name: "호스트명" }), "web-01");
  await userEvent.type(within(block("디비")).getByRole("textbox", { name: "RAM" }), "16");
  // db 와 그 연결이 사라진 새 상태가 온다.
  rerender(<MissingChecklist {...props} state={mkState({ db: false })} />);
  expect(screen.queryByRole("group", { name: "디비" })).not.toBeInTheDocument();
  expect(within(block("웹1")).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
  // db 가 다시 나타나도 버린 초안·펼침은 돌아오지 않는다.
  rerender(<MissingChecklist {...props} state={mkState()} />);
  expect(screen.getByRole("button", { name: "디비 항목 펼치기" })).toBeInTheDocument();
  await expand("디비");
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveValue("");
  expect(within(block("웹1")).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
});

test("save disabled while busy", async () => {
  setup({ busy: true });
  await expand(...ALL);
  for (const b of screen.getAllByRole("button", { name: "저장" })) expect(b).toBeDisabled();
});

test("focusId expands that block and focuses its first input", () => {
  const { rerender, props } = setup();
  rerender(<MissingChecklist {...props} focusId="db" />);
  expect(screen.getByRole("button", { name: "디비 항목 접기" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "웹1 항목 펼치기" })).toHaveAttribute("aria-expanded", "false");
  // cpu 는 모름이라 비활성: 첫 입력 가능한 칸(RAM)에 포커스가 간다.
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveFocus();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  // 같은 대상을 다시 가리키면(새 토큰) 접혀 있어도 다시 펼친다.
  fireEvent.click(screen.getByRole("button", { name: "디비 항목 접기" }));
  expect(within(block("디비")).queryByRole("textbox")).not.toBeInTheDocument();
  rerender(<MissingChecklist {...props} focusId="db" focusToken={2} />);
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveFocus();
});

test("focus request is reported as handled once consumed", () => {
  const onFocusHandled = vi.fn();
  const { rerender, props } = setup();
  rerender(<MissingChecklist {...props} focusId="db" onFocusHandled={onFocusHandled} />);
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveFocus();
  expect(onFocusHandled).toHaveBeenCalledTimes(1);
});

test("edge title falls back to a group's label when an endpoint is a group", async () => {
  const state: DiagramState = {
    ...emptyState(),
    groups: { g1: { id: "g1", groupKind: "dmz", label: "DMZ", parent: null } },
    nodes: { web: { id: "web", kind: "web_server", label: "웹1", parent: null, attrs: full } },
    edges: { e1: { id: "e1", from: "g1", to: "web", edgeKind: "request" } },
  };
  setup({ state });
  expect(block("DMZ → 웹1")).toBeInTheDocument();
});

test("read-only view keeps current drafts untouched and does not show them", async () => {
  const { rerender, props } = setup();
  await expand("디비");
  await userEvent.type(within(block("디비")).getByRole("textbox", { name: "RAM" }), "16");
  // 이력 보기: db 가 없는 옛 상태를 읽기 전용으로 본다.
  rerender(<MissingChecklist {...props} readOnly state={mkState({ db: false })} />);
  expect(screen.queryByRole("group", { name: "디비" })).not.toBeInTheDocument();
  // 현재로 돌아오면 초안과 펼침이 그대로다.
  rerender(<MissingChecklist {...props} state={mkState()} />);
  expect(within(block("디비")).getByRole("textbox", { name: "RAM" })).toHaveValue("16");
});

test("payload and direction render as selects with 쉬운 말 options (API/파일, 단방향/양방향)", async () => {
  const state: DiagramState = {
    ...emptyState(),
    groups: {
      biz: { id: "biz", groupKind: "network_zone", label: "업무망", parent: null },
      net: { id: "net", groupKind: "network_zone", label: "인터넷망", parent: null },
    },
    nodes: {
      a: { id: "a", kind: "firewall", label: "방화벽", parent: "biz", attrs: { ...full, rules: "r" } },
      b: { id: "b", kind: "firewall", label: "방화벽2", parent: "net", attrs: { ...full, rules: "r" } },
    },
    edges: { e: { id: "e", from: "a", to: "b", edgeKind: "request", label: "HTTPS" } },
  };
  const { onSave } = setup({ state });
  await expand("방화벽 → 방화벽2");
  const b = block("방화벽 → 방화벽2");
  const payload = within(b).getByRole("combobox", { name: "전달물" });
  const direction = within(b).getByRole("combobox", { name: "방향" });
  expect(within(payload).getAllByRole("option").map((o) => o.textContent)).toEqual(["선택", "API", "파일"]);
  expect(within(direction).getAllByRole("option").map((o) => o.textContent)).toEqual(["선택", "단방향", "양방향"]);
  expect(within(b).queryByRole("textbox", { name: "전달물" })).not.toBeInTheDocument();
  await userEvent.selectOptions(payload, "파일");
  await userEvent.selectOptions(direction, "양방향");
  await userEvent.click(within(b).getByRole("button", { name: "저장" }));
  expect(onSave).toHaveBeenCalledWith({ targetKind: "edge", targetId: "e", values: { payload: "file", direction: "two_way" }, unknown: [] });
});

// 망 둘, 종류 없음. 노드는 빠진 정보가 없다.
const zonesState = (): DiagramState => ({
  ...emptyState(),
  groups: {
    z1: { id: "z1", groupKind: "network_zone", label: "행정망", parent: null },
    z2: { id: "z2", groupKind: "network_zone", label: "인터넷", parent: null, netType: { key: "internet", source: "user", confirmed: true } },
    z3: { id: "z3", groupKind: "network_zone", label: "옛 망", parent: null, netType: { key: "gone-type", source: "user", confirmed: true } },
  },
});

test("망 종류 줄은 종류 고르기로 보인다", async () => {
  vi.mocked(setZoneTypeAction).mockClear();
  const onSaved = vi.fn();
  render(
    <NetworkKnowledgeProvider value={KNOWLEDGE}>
      <MissingChecklist state={zonesState()} busy={false} focusId={null} onSave={vi.fn()} zoneType={{ diagramId: "d1", onSaved }} />
    </NetworkKnowledgeProvider>,
  );
  // 종류 없는 망과 지식에 없는 종류의 망이 줄로 나온다. 종류가 맞는 망은 없다.
  expect(screen.queryByRole("group", { name: "인터넷" })).not.toBeInTheDocument();
  expect(within(block("옛 망")).getByText("1")).toBeInTheDocument();
  await expand("행정망");
  const b = block("행정망");
  // 저장 폼(글 칸·모름·저장) 대신 종류 고르기.
  expect(within(b).queryByRole("textbox")).not.toBeInTheDocument();
  expect(within(b).queryByRole("checkbox")).not.toBeInTheDocument();
  expect(within(b).queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  const select = within(b).getByRole("combobox", { name: "행정망 망 종류 고르기" });
  expect(select).toHaveValue("");
  // 등급별 묶음
  expect(within(select).getByRole("group", { name: "내부" })).toBeInTheDocument();
  expect(within(select).getByRole("group", { name: "폐쇄" })).toBeInTheDocument();
  expect(within(b).queryByText("AI 추정")).not.toBeInTheDocument();
  await userEvent.selectOptions(select, "admin-net");
  await userEvent.click(within(b).getByRole("button", { name: "정하기" }));
  expect(setZoneTypeAction).toHaveBeenCalledWith("d1", "z1", "admin-net");
  expect(onSaved).toHaveBeenCalledWith(4);
});

test("망 종류 줄: 저장 실패 문구를 보인다", async () => {
  vi.mocked(setZoneTypeAction).mockResolvedValueOnce({ ok: false, error: "다른 대화가 돌고 있어요." });
  render(
    <NetworkKnowledgeProvider value={KNOWLEDGE}>
      <MissingChecklist state={zonesState()} busy={false} focusId={null} onSave={vi.fn()} zoneType={{ diagramId: "d1", onSaved: vi.fn() }} />
    </NetworkKnowledgeProvider>,
  );
  await expand("행정망");
  const b = block("행정망");
  await userEvent.selectOptions(within(b).getByRole("combobox"), "admin-net");
  await userEvent.click(within(b).getByRole("button", { name: "정하기" }));
  expect(await within(b).findByRole("alert")).toHaveTextContent("다른 대화가 돌고 있어요.");
});

test("망 종류 줄: 지식이 없으면 나오지 않는다", () => {
  const { container } = setup({ state: zonesState() });
  expect(container).toBeEmptyDOMElement();
});
