import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

// 프로젝트·구성도 관리 UX: 만들기·이름 바꾸기·삭제·복제 대화상자와 행 메뉴의 키보드 동작.
const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), params: {} as Record<string, string> }));
const actions = vi.hoisted(() => ({
  createDiagramAction: vi.fn(),
  createProjectAction: vi.fn(),
  deleteDiagramAction: vi.fn(),
  deleteProjectAction: vi.fn(),
  duplicateDiagramAction: vi.fn(),
  logoutAction: vi.fn(),
  renameDiagramAction: vi.fn(),
  renameProjectAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
  useParams: () => nav.params,
  usePathname: () => "/",
}));
vi.mock("@/app/(app)/actions", () => actions);

import { CreateButton, ShellProvider } from "@/ui/Shell";
import { GENERIC_ERROR, Sidebar, type SidebarProject } from "@/ui/Sidebar";

const P: SidebarProject[] = [
  { id: "p1", name: "쇼핑몰", diagrams: [{ id: "d1", name: "운영" }, { id: "d2", name: "개발" }] },
  { id: "p2", name: "빈 프로젝트", diagrams: [] },
];
const view = (projects = P) =>
  render(
    <ShellProvider>
      <Sidebar projects={projects} userName="재석" />
    </ShellProvider>,
  );
const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

beforeEach(() => {
  window.localStorage.clear();
  nav.params = {};
  for (const f of [nav.push, nav.refresh, ...Object.values(actions)]) f.mockReset();
});
afterEach(cleanup);

test("새 프로젝트: 안내를 보이고 Enter 로 만든 뒤 첫 구성도로 간다, 진행 중엔 버튼이 바뀐다", async () => {
  const d = deferred<{ ok: true; id: string; diagramId: string }>();
  actions.createProjectAction.mockReturnValue(d.promise);
  view();
  fireEvent.click(screen.getByRole("button", { name: "새 프로젝트" }));
  const dialog = screen.getByRole("dialog", { name: "새 프로젝트" });
  const input = within(dialog).getByLabelText("이름");
  expect(document.activeElement).toBe(input);
  expect(input).toHaveAccessibleDescription(/빈 구성도/);
  expect(input).toHaveAttribute("placeholder", "예: 쇼핑몰");
  // 이름이 비면 무채색 비활성, 이름이 생기면 금색 주 동작(보내기와 같다).
  const make = within(dialog).getByRole("button", { name: "만들기" });
  expect(make).toBeDisabled();
  expect(make.className).toMatch(/_btn_/);
  expect(make.className).not.toMatch(/primaryBtn/);
  fireEvent.change(input, { target: { value: "  예약 서비스 " } });
  expect(make).toBeEnabled();
  expect(make.className).toMatch(/primaryBtn/);
  fireEvent.submit(dialog);
  const busy = await within(dialog).findByRole("button", { name: "만드는 중…" });
  expect(busy).toBeDisabled();
  expect(busy.className).not.toMatch(/primaryBtn/);
  // 진행 중에는 두 번 보내지 않고, Esc·취소로도 닫히지 않는다.
  fireEvent.submit(dialog);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(within(dialog).getByRole("button", { name: "취소" })).toBeDisabled();
  expect(actions.createProjectAction).toHaveBeenCalledTimes(1);
  expect(actions.createProjectAction).toHaveBeenCalledWith("  예약 서비스 ");
  await act(async () => d.resolve({ ok: true, id: "p9", diagramId: "d9" }));
  expect(nav.push).toHaveBeenCalledWith("/p/p9/d/d9");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(actions.createDiagramAction).not.toHaveBeenCalled();
});

test("서버가 돌려준 오류는 입력칸과 이어 보이고, 고치기 시작하면 사라진다", async () => {
  actions.createProjectAction.mockResolvedValue({ ok: false, error: "같은 이름의 프로젝트가 이미 있어요. 다른 이름을 써 주세요" });
  view();
  fireEvent.click(screen.getByRole("button", { name: "새 프로젝트" }));
  const dialog = screen.getByRole("dialog", { name: "새 프로젝트" });
  const input = within(dialog).getByLabelText("이름");
  fireEvent.change(input, { target: { value: "쇼핑몰" } });
  fireEvent.submit(dialog);
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("같은 이름의 프로젝트가 이미 있어요");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription(/같은 이름/);
  fireEvent.change(input, { target: { value: "쇼핑몰2" } });
  expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  expect(input).not.toHaveAttribute("aria-invalid");
});

test("던진 오류는 서버 문구 대신 한국어 안내로 보인다", async () => {
  actions.createProjectAction.mockRejectedValue(new Error("An error occurred in the Server Components render"));
  view();
  fireEvent.click(screen.getByRole("button", { name: "새 프로젝트" }));
  const dialog = screen.getByRole("dialog", { name: "새 프로젝트" });
  fireEvent.change(within(dialog).getByLabelText("이름"), { target: { value: "x" } });
  fireEvent.submit(dialog);
  expect(await within(dialog).findByRole("alert")).toHaveTextContent(GENERIC_ERROR);
});

test("Esc 로 닫으면 연 버튼으로 포커스가 돌아온다, Tab 은 대화상자 안을 돈다", async () => {
  view();
  const open = screen.getByRole("button", { name: "새 프로젝트" });
  open.focus();
  fireEvent.click(open);
  const dialog = screen.getByRole("dialog", { name: "새 프로젝트" });
  const input = within(dialog).getByLabelText("이름");
  fireEvent.change(input, { target: { value: "x" } });
  const make = within(dialog).getByRole("button", { name: "만들기" });
  make.focus();
  fireEvent.keyDown(make, { key: "Tab" });
  expect(document.activeElement).toBe(input);
  fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(make);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await flush();
  expect(document.activeElement).toBe(open);
});

test("행 메뉴: 열면 첫 항목, 방향키로 옮기고 Esc 는 ⋯ 로 돌아간다, 바깥을 누르면 닫힌다", () => {
  view();
  const btn = screen.getByRole("button", { name: "쇼핑몰 메뉴" });
  fireEvent.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  const menu = screen.getByRole("menu", { name: "쇼핑몰 메뉴" });
  expect(btn).toHaveAttribute("aria-controls", menu.id);
  const items = within(menu).getAllByRole("menuitem");
  expect(items.map((i) => i.textContent)).toEqual(["새 구성도", "이름 바꾸기", "삭제"]);
  expect(document.activeElement).toBe(items[0]);
  fireEvent.keyDown(items[0], { key: "ArrowDown" });
  expect(document.activeElement).toBe(items[1]);
  fireEvent.keyDown(items[1], { key: "ArrowUp" });
  fireEvent.keyDown(items[0], { key: "ArrowUp" });
  expect(document.activeElement).toBe(items[2]);
  fireEvent.keyDown(items[2], { key: "Escape" });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(btn);
  fireEvent.click(btn);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  // 다른 행의 메뉴를 누르면 먼저 연 메뉴는 닫힌다(한 번에 하나).
  fireEvent.click(btn);
  fireEvent.pointerDown(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  expect(screen.getAllByRole("menu")).toHaveLength(1);
  expect(screen.getByRole("menu", { name: "운영 메뉴" })).toBeInTheDocument();
});

// 서버 액션의 redirect() 가 클라이언트에 닿는 모양.
const redirectError = (to: string) => Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;push;${to};307;` });

test("보던 구성도를 지우면 무엇이 지워지는지 알리고, 서버가 다음 화면으로 보낸다(클라이언트는 옮기지 않는다)", async () => {
  nav.params = { projectId: "p1", diagramId: "d1" };
  actions.deleteDiagramAction.mockRejectedValue(redirectError("/p/p1/d/d2"));
  view();
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  const dialog = screen.getByRole("alertdialog", { name: "구성도 삭제" });
  expect(dialog).toHaveAccessibleDescription(/‘운영’ 구성도를 삭제할까요\? .*버전 이력·대화.*되돌릴 수 없어요/);
  // 실수로 Enter 를 눌러도 지워지지 않게 취소에 포커스.
  expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "취소" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(actions.deleteDiagramAction).toHaveBeenCalledWith("d1", true);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(nav.push).not.toHaveBeenCalled();
  // 곧 사라질 지운 행의 ⋯ 대신 그 프로젝트의 ⋯ 로 포커스가 돌아온다.
  await flush();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "쇼핑몰 메뉴" }));
});

test("프로젝트 삭제는 구성도 개수를 알리고, 보던 프로젝트면 서버가 홈으로 보내고, 아니면 목록만 새로 고친다", async () => {
  actions.deleteProjectAction.mockRejectedValueOnce(redirectError("/")).mockResolvedValue(undefined);
  nav.params = { projectId: "p1", diagramId: "d1" };
  view();
  fireEvent.click(screen.getByRole("button", { name: "쇼핑몰 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  const dialog = screen.getByRole("alertdialog", { name: "프로젝트 삭제" });
  expect(dialog).toHaveAccessibleDescription(/‘쇼핑몰’ 프로젝트를 삭제할까요\? 안에 있는 구성도 2개와/);
  fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(actions.deleteProjectAction).toHaveBeenLastCalledWith("p1", true);
  expect(nav.refresh).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "빈 프로젝트 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription(/안에 구성도는 없어요/);
  fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  expect(actions.deleteProjectAction).toHaveBeenLastCalledWith("p2", false);
  expect(nav.push).not.toHaveBeenCalled();
  await flush();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "새 프로젝트" }));
});

test("삭제가 실패하면 대화상자에 남아 한국어 안내를 보인다", async () => {
  actions.deleteDiagramAction.mockRejectedValue(new Error("boom"));
  view();
  fireEvent.click(screen.getByRole("button", { name: "개발 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  const dialog = screen.getByRole("alertdialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent(GENERIC_ERROR);
});

test("이름 바꾸기: 기존 이름을 골라 두고, 그대로면 바꾸기를 막는다", async () => {
  actions.renameDiagramAction.mockResolvedValue({ ok: true });
  view();
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "이름 바꾸기" }));
  const dialog = screen.getByRole("dialog", { name: "구성도 이름 바꾸기" });
  const input = within(dialog).getByLabelText<HTMLInputElement>("이름");
  expect(input.value).toBe("운영");
  expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2]);
  const ok = within(dialog).getByRole("button", { name: "바꾸기" });
  expect(ok).toBeDisabled();
  fireEvent.change(input, { target: { value: "운영 환경" } });
  fireEvent.click(ok);
  await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  expect(actions.renameDiagramAction).toHaveBeenCalledWith("d1", "운영 환경");
  await flush();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "운영 메뉴" }));
});

test("목록: 구성도 개수·긴 이름 툴팁·지금 연 구성도 표시, 빈 프로젝트는 바로 구성도를 추가할 수 있다", () => {
  nav.params = { projectId: "p1", diagramId: "d2" };
  view();
  const project = screen.getByRole("button", { name: "쇼핑몰, 구성도 2개" });
  expect(project).toHaveAttribute("aria-expanded", "true");
  // 툴팁은 포커스되지 않는 안쪽 글자에만: 버튼 이름을 설명으로 한 번 더 읽지 않는다.
  expect(project).not.toHaveAttribute("title");
  expect(project).not.toHaveAccessibleDescription();
  expect(within(project).getByText("쇼핑몰")).toHaveAttribute("title", "쇼핑몰");
  const current = screen.getByRole("button", { name: "개발" });
  expect(current).toHaveAttribute("aria-current", "page");
  expect(current).not.toHaveAccessibleDescription();
  expect(within(current).getByText("개발")).toHaveAttribute("title", "개발");
  const more = screen.getByRole("button", { name: "개발 메뉴" });
  expect(more).not.toHaveAttribute("title"); // aria-label 이 이름이므로 같은 툴팁을 또 읽지 않게 둔다
  expect(more).not.toHaveAccessibleDescription();
  expect(screen.getByRole("button", { name: "운영" })).not.toHaveAttribute("aria-current");
  fireEvent.click(screen.getByRole("button", { name: "+ 구성도 추가" }));
  const dialog = screen.getByRole("dialog", { name: "새 구성도" });
  expect(within(dialog).getByLabelText("이름")).toHaveAccessibleDescription(/‘빈 프로젝트’ 프로젝트 안에/);
});

test("프로젝트가 하나도 없으면 목록 자리엔 짧게만 알린다(자세한 안내는 홈 화면이 한다)", () => {
  view([]);
  expect(screen.getByText("아직 프로젝트가 없어요")).toBeInTheDocument();
  expect(screen.queryByText(/새 프로젝트’로/)).not.toBeInTheDocument();
});

test("복제 상태 알림 영역은 처음부터 있어 내용이 바뀌면 읽힌다", () => {
  view();
  const status = screen.getByRole("status");
  expect(status).toBeEmptyDOMElement();
  expect(status).toBeVisible();
});

test("대화상자를 열면 계정 팝오버는 닫히고, Esc 한 번은 대화상자만 닫는다", async () => {
  window.localStorage.setItem("infrasketch.sidebarCollapsed", "1");
  render(
    <ShellProvider>
      <Sidebar projects={P} userName="재석" />
      <CreateButton>첫 프로젝트 만들기</CreateButton>
    </ShellProvider>,
  );
  const account = screen.getByRole("button", { name: "계정" });
  fireEvent.click(account);
  expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  const start = screen.getByRole("button", { name: "첫 프로젝트 만들기" });
  start.focus();
  fireEvent.click(start);
  expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  const input = within(screen.getByRole("dialog")).getByLabelText("이름");
  expect(fireEvent.keyDown(input, { key: "Escape" })).toBe(false); // preventDefault 됨
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await flush();
  expect(document.activeElement).toBe(start);
  expect(account).toHaveAttribute("aria-expanded", "false");
});

test("바탕을 눌러도 포커스가 대화상자 밖으로 새지 않는다", () => {
  view();
  fireEvent.click(screen.getByRole("button", { name: "새 프로젝트" }));
  const dialog = screen.getByRole("dialog");
  expect(fireEvent.mouseDown(dialog.parentElement!)).toBe(false);
  // 그래도 밖으로 나가면(스크립트 등) 안으로 데려온다.
  act(() => screen.getByRole("button", { name: "쇼핑몰 메뉴" }).focus());
  expect(dialog.contains(document.activeElement)).toBe(true);
});

test("⋯ 메뉴는 목록 아래쪽에 자리가 모자라면 위로 열린다", () => {
  const rects: Record<string, { top: number; bottom: number }> = {
    tree: { top: 0, bottom: 300 },
    btn: { top: 270, bottom: 290 },
    menu: { top: 290, bottom: 400 },
  };
  const orig = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const key = this.hasAttribute("data-scroll-root") ? "tree" : this.getAttribute("role") === "menu" ? "menu" : this.hasAttribute("aria-haspopup") ? "btn" : null;
    return (key ? rects[key] : { top: 0, bottom: 0 }) as DOMRect;
  };
  try {
    view();
    fireEvent.click(screen.getByRole("button", { name: "개발 메뉴" }));
    const menu = screen.getByRole("menu");
    expect(menu.className).toMatch(/menuUp/);
    expect(document.activeElement).toBe(within(menu).getAllByRole("menuitem")[0]);
    fireEvent.keyDown(menu, { key: "Escape" });
    rects.btn = { top: 20, bottom: 40 };
    rects.menu = { top: 40, bottom: 150 };
    fireEvent.click(screen.getByRole("button", { name: "개발 메뉴" }));
    expect(screen.getByRole("menu").className).not.toMatch(/menuUp/);
  } finally {
    HTMLElement.prototype.getBoundingClientRect = orig;
  }
});

test("복제: 진행 중에는 다시 누를 수 없고 상태를 알린다, 끝나면 사본으로 간다", async () => {
  const d = deferred<{ ok: true; id: string; name: string; projectId: string }>();
  actions.duplicateDiagramAction.mockReturnValue(d.promise);
  view();
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "복제" }));
  expect(await screen.findByRole("status")).toHaveTextContent("복제하는 중…");
  fireEvent.click(screen.getByRole("button", { name: "개발 메뉴" }));
  expect(screen.getByRole("menuitem", { name: "복제" })).toBeDisabled();
  await act(async () => d.resolve({ ok: true, id: "d3", name: "운영 사본", projectId: "p1" }));
  expect(nav.push).toHaveBeenCalledWith("/p/p1/d/d3");
  expect(actions.duplicateDiagramAction).toHaveBeenCalledTimes(1);
});

test("복제가 실패하면 안내를 보이고, 다음 메뉴 동작에서 지운다", async () => {
  actions.duplicateDiagramAction.mockRejectedValue(new Error("x"));
  view();
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "복제" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("복제하지 못했어요");
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "이름 바꾸기" }));
  expect(screen.queryByText(/복제하지 못했어요/)).not.toBeInTheDocument();
});

test("복제가 이름 충돌로 실패하면 서버가 돌려준 안내를 그대로 보인다", async () => {
  const error = "이 프로젝트에 같은 이름의 구성도가 이미 있어요. 다른 이름을 써 주세요";
  actions.duplicateDiagramAction.mockResolvedValue({ ok: false, error });
  view();
  fireEvent.click(screen.getByRole("button", { name: "운영 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "복제" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(error);
  expect(nav.push).not.toHaveBeenCalled();
});

test("빈 홈 화면의 시작 버튼은 사이드바와 같은 대화상자를 연다(접힌 레일에서도)", () => {
  window.localStorage.setItem("infrasketch.sidebarCollapsed", "1");
  render(
    <ShellProvider>
      <Sidebar projects={P} userName="재석" />
      <CreateButton>첫 프로젝트 만들기</CreateButton>
      <CreateButton projectId="p2">구성도 만들기</CreateButton>
    </ShellProvider>,
  );
  expect(screen.getByRole("button", { name: "프로젝트 영역 펼치기" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "첫 프로젝트 만들기" }));
  expect(screen.getByRole("dialog", { name: "새 프로젝트" })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "취소" }));
  fireEvent.click(screen.getByRole("button", { name: "구성도 만들기" }));
  const dialog = screen.getByRole("dialog", { name: "새 구성도" });
  expect(within(dialog).getByLabelText("이름")).toHaveAccessibleDescription(/‘빈 프로젝트’/);
});

test("좁은 화면은 저장값이 없을 때 레일로 시작하고, 저장값이 있으면 그것을 따른다", () => {
  const mm = vi.fn().mockReturnValue({ matches: true });
  vi.stubGlobal("matchMedia", mm);
  try {
    view();
    expect(screen.getByRole("button", { name: "프로젝트 영역 펼치기" })).toBeInTheDocument();
    cleanup();
    window.localStorage.setItem("infrasketch.sidebarCollapsed", "0");
    view();
    expect(screen.getByRole("button", { name: "프로젝트 영역 접기" })).toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});
