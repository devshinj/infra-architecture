"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  createDiagramAction,
  createProjectAction,
  deleteDiagramAction,
  deleteProjectAction,
  duplicateDiagramAction,
  logoutAction,
  renameDiagramAction,
  renameProjectAction,
} from "@/app/(app)/actions";
import { LogoMark } from "@/ui/brand/Logo";

import styles from "./app.module.css";
import { Button } from "./Button";
import { type Dialog, DialogView, GENERIC_ERROR, type NameDialog, RowMenu, type RowMenuItem } from "./dialogs";
import { useShell } from "./Shell";

const ACCOUNT_POP_ID = "sidebar-account";
const DRAWER_ID = "sidebar-drawer";

export { GENERIC_ERROR };

export interface SidebarProject {
  id: string;
  name: string;
  diagrams: { id: string; name: string }[];
}

type MenuTarget = { type: "project" | "diagram"; id: string; name: string; project: SidebarProject };
type MenuAction = "newDiagram" | "rename" | "duplicate" | "delete";
type MenuItem = RowMenuItem<MenuAction>;


const diagramPath = (projectId: string, diagramId: string) => `/p/${projectId}/d/${diagramId}`;

/** 서버 액션의 redirect() 는 클라이언트에서 NEXT_REDIRECT 오류로 끝난다(이동은 라우터가 이미 했다). */
export const isRedirect = (e: unknown): boolean => {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
};

export function deleteMessage(t: Pick<MenuTarget, "type" | "name" | "project">): string {
  if (t.type === "diagram") {
    return `‘${t.name}’ 구성도를 삭제할까요? 그림과 버전 이력·대화가 모두 함께 지워져요. 되돌릴 수 없어요.`;
  }
  const n = t.project.diagrams.length;
  const inside = n > 0 ? `안에 있는 구성도 ${n}개와 각 구성도의 버전 이력·대화가 모두 함께 지워져요.` : "안에 구성도는 없어요.";
  return `‘${t.name}’ 프로젝트를 삭제할까요? ${inside} 되돌릴 수 없어요.`;
}

export function Sidebar({ projects, userName }: { projects: SidebarProject[]; userName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ projectId?: string; diagramId?: string }>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [duplicating, startDup] = useTransition();
  const shell = useShell();
  const [account, setAccount] = useState(false);
  const glossaryCurrent = pathname === "/glossary";
  const networkCurrent = pathname === "/network";
  const claudeCodeCurrent = pathname === "/claude-code";
  const { narrow } = shell;

  // 좁은 화면: 사이드바는 위 막대의 ☰ 로 여는 서랍이다. 다른 화면으로 가거나 넓은 화면이 되면 닫는다.
  const [drawer, setDrawer] = useState(false);
  const drawerBtn = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerWasOpen = useRef(false);
  useEffect(() => {
    setDrawer(false);
  }, [pathname, narrow]);
  // 열면 서랍 첫 버튼(닫기)으로, 닫으면 ☰ 로 포커스를 옮긴다.
  useEffect(() => {
    if (drawer) {
      drawerWasOpen.current = true;
      drawerRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    } else if (drawerWasOpen.current) {
      drawerWasOpen.current = false;
      drawerBtn.current?.focus();
    }
  }, [drawer]);
  // Esc 는 서랍을 닫는다. 대화상자·행 메뉴가 먼저 받은 Esc(preventDefault)는 건드리지 않는다.
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      setMenu(null);
      setDrawer(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);
  // 서랍이 열린 동안 뒤(위 막대·작업 화면)는 inert: 포인터·포커스·보조기기가 닿지 않는다. 연 뒤에 생기는 대화상자는 건드리지 않는다.
  useEffect(() => {
    const el = drawerRef.current;
    const parent = el?.parentElement;
    if (!drawer || !el || !parent) return;
    const made = Array.from(parent.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && c !== el && !c.hasAttribute("data-drawer-backdrop") && !c.hasAttribute("inert"),
    );
    made.forEach((c) => c.setAttribute("inert", ""));
    return () => made.forEach((c) => c.removeAttribute("inert"));
  }, [drawer]);
  // 포커스를 서랍 안에 가둔다(Tab·Shift+Tab 이 끝에서 처음으로 돈다).
  const trapDrawer = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !drawerRef.current) return;
    // 행 메뉴 항목(tabindex=-1)처럼 Tab 으로 닿지 않는 것은 뺀다.
    const f = Array.from(
      drawerRef.current.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), a[href]:not([tabindex="-1"]), input:not([tabindex="-1"])'),
    );
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // 접기·펼치기 버튼은 바뀌는 순간 사라진다: 사용자가 누른 경우에만 짝 버튼으로 포커스를 옮긴다(마운트 뒤 복원은 제외).
  const toggleRef = useRef<HTMLButtonElement>(null);
  const focusToggle = useRef(false);
  const setShellCollapsed = (v: boolean) => {
    focusToggle.current = true;
    setAccount(false);
    setMenu(null);
    shell.setCollapsed(v);
  };
  useEffect(() => {
    if (!focusToggle.current) return;
    focusToggle.current = false;
    toggleRef.current?.focus();
  }, [shell.collapsed]);

  // 레일의 계정 팝오버: Esc 는 닫고 계정 버튼으로 포커스를 돌려준다. 바깥을 누르면 닫는다.
  const accountWrap = useRef<HTMLDivElement>(null);
  const accountBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!account) return;
    const onKey = (e: KeyboardEvent) => {
      // 대화상자가 먼저(캡처 단계에서) 받은 Esc 는 건드리지 않는다.
      if (e.key !== "Escape" || e.defaultPrevented) return;
      setAccount(false);
      accountBtn.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!accountWrap.current?.contains(e.target as Node)) setAccount(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [account]);

  // 행 메뉴는 바깥을 누르면 닫는다(Esc·방향키는 RowMenu 가 맡는다).
  useEffect(() => {
    if (menu === null) return;
    const onDown = (e: PointerEvent) => {
      const root = (e.target as Element | null)?.closest?.("[data-menu-root]");
      if (root?.getAttribute("data-menu-root") !== menu) setMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);

  // 대화상자를 닫으면 연 버튼으로 포커스를 돌려준다. 그 버튼이 사라졌으면(삭제 등) ‘새 프로젝트’ 버튼으로.
  const returnFocus = useRef<HTMLElement | null>(null);
  const newProjectBtn = useRef<HTMLButtonElement>(null);
  const menuBtns = useRef(new Map<string, HTMLButtonElement>());
  const openDialog = (d: Dialog, from: Element | null) => {
    returnFocus.current = from instanceof HTMLElement ? from : null;
    // 떠 있는 팝오버·메뉴는 닫는다(Esc 한 번이 둘 다 닫으며 포커스가 튀지 않게).
    setAccount(false);
    setMenu(null);
    setDialog(d);
  };
  const closeDialog = () => {
    setDialog(null);
    const back = returnFocus.current;
    returnFocus.current = null;
    // 대화상자가 사라지고 목록이 다시 그려진 뒤에 옮긴다.
    setTimeout(() => {
      const target = back?.isConnected ? back : (newProjectBtn.current ?? toggleRef.current ?? drawerBtn.current);
      target?.focus();
    }, 0);
  };

  // 지금 연 구성도가 목록 밖에 있으면 보이게 굴린다(새로 만든 프로젝트는 목록 맨 아래에 붙는다).
  const currentRow = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    currentRow.current?.scrollIntoView?.({ block: "nearest" });
  }, [params.diagramId, shell.collapsed]);

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const goDiagram = (projectId: string, diagramId: string) => {
    // 지금 연 구성도를 다시 눌러도 주소가 그대로라 닫히지 않으므로 직접 닫는다.
    if (diagramId === params.diagramId) setDrawer(false);
    router.push(diagramPath(projectId, diagramId));
  };

  const newProjectDialog = (): NameDialog => ({
    kind: "name",
    title: "새 프로젝트",
    hint: "서비스 하나를 담는 폴더예요. 빈 구성도 ‘새 구성도’가 함께 만들어져요.",
    placeholder: "예: 쇼핑몰",
    submit: "만들기",
    pendingLabel: "만드는 중…",
    initial: "",
    run: async (name) => {
      const p = await createProjectAction(name);
      if (!p.ok) return p.error;
      goDiagram(p.id, p.diagramId);
    },
  });
  const newDiagramDialog = (projectId: string, projectName: string): NameDialog => ({
    kind: "name",
    title: "새 구성도",
    hint: `‘${projectName}’ 프로젝트 안에 빈 구성도를 만들어요.`,
    placeholder: "예: 운영 환경",
    submit: "만들기",
    pendingLabel: "만드는 중…",
    initial: "",
    run: async (name) => {
      const d = await createDiagramAction(projectId, name);
      if (!d.ok) return d.error;
      goDiagram(projectId, d.id);
    },
  });

  const newProject = () => openDialog(newProjectDialog(), document.activeElement);

  // 빈 홈 화면의 시작 버튼이 같은 대화상자를 열 수 있게 등록한다. 대화상자 내용은 열 때마다 새로 만든다.
  const opener = useRef<(projectId?: string) => void>(() => {});
  opener.current = (projectId) => {
    const p = projectId ? projects.find((x) => x.id === projectId) : undefined;
    openDialog(p ? newDiagramDialog(p.id, p.name) : newProjectDialog(), document.activeElement);
  };
  const { setCreateHandler } = shell;
  useEffect(() => {
    setCreateHandler((projectId) => opener.current(projectId));
    return () => setCreateHandler(null);
  }, [setCreateHandler]);

  const act = (action: MenuAction, t: MenuTarget) => {
    setMenu(null);
    setNotice(null);
    const from = menuBtns.current.get(t.id) ?? null;
    if (action === "newDiagram") {
      openDialog(newDiagramDialog(t.id, t.name), from);
    } else if (action === "rename") {
      openDialog(
        {
          kind: "name",
          title: t.type === "project" ? "프로젝트 이름 바꾸기" : "구성도 이름 바꾸기",
          placeholder: t.name,
          submit: "바꾸기",
          pendingLabel: "바꾸는 중…",
          initial: t.name,
          run: async (name) => {
            const r = t.type === "project" ? await renameProjectAction(t.id, name) : await renameDiagramAction(t.id, name);
            if (!r.ok) return r.error;
            router.refresh();
          },
        },
        from,
      );
    } else if (action === "duplicate") {
      from?.focus();
      if (duplicating) return;
      startDup(async () => {
        try {
          const d = await duplicateDiagramAction(t.id);
          if (!d.ok) {
            setNotice(d.error);
            return;
          }
          goDiagram(d.projectId, d.id);
        } catch {
          setNotice("복제하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
      });
    } else {
      openDialog(
        {
          kind: "delete",
          title: t.type === "project" ? "프로젝트 삭제" : "구성도 삭제",
          message: deleteMessage(t),
          run: async () => {
            // 보던 것을 지우면 서버가 지운 뒤 곧바로 다음 화면(같은 프로젝트의 다른 구성도, 없으면 홈)으로 보낸다.
            // 지우고 나서 클라이언트에서 옮기면, 액션 응답이 지금 주소(지운 구성도)를 다시 그려 404 가 잠깐 보인다.
            const leave = t.type === "project" ? params.projectId === t.id : params.diagramId === t.id;
            try {
              if (t.type === "project") await deleteProjectAction(t.id, leave);
              else await deleteDiagramAction(t.id, leave);
            } catch (e) {
              if (isRedirect(e)) return;
              throw e;
            }
            router.refresh();
          },
        },
        // 지운 행의 ⋯ 는 곧 사라지므로, 구성도면 그 프로젝트의 ⋯ 로, 프로젝트면 ‘새 프로젝트’로 포커스를 돌린다.
        t.type === "diagram" ? (menuBtns.current.get(t.project.id) ?? null) : newProjectBtn.current,
      );
    }
  };

  const menuFor = (t: MenuTarget) => {
    const items: MenuItem[] = [
      ...(t.type === "project" ? [{ action: "newDiagram" as const, label: "새 구성도" }] : []),
      { action: "rename", label: "이름 바꾸기" },
      ...(t.type === "diagram" ? [{ action: "duplicate" as const, label: "복제", disabled: duplicating }] : []),
      { action: "delete", label: "삭제", danger: true },
    ];
    return (
      <RowMenu
        id={t.id}
        label={`${t.name} 메뉴`}
        open={menu === t.id}
        onOpenChange={(v) => setMenu(v ? t.id : null)}
        buttonRef={(el) => {
          if (el) menuBtns.current.set(t.id, el);
          else menuBtns.current.delete(t.id);
        }}
        items={items}
        onSelect={(a) => act(a, t)}
      />
    );
  };

  const dialogView = dialog && <DialogView dialog={dialog} onClose={closeDialog} />;

  const glossaryLink = (rail: boolean) => (
    <Link
      href="/glossary"
      className={rail ? `${styles.railBtn} ${glossaryCurrent ? styles.railBtnActive : ""}` : `${styles.sideLink} ${glossaryCurrent ? styles.sideLinkActive : ""}`}
      aria-current={glossaryCurrent ? "page" : undefined}
      onClick={() => setDrawer(false)}
      {...(rail ? { "aria-label": "용어 사전", title: "용어 사전" } : {})}
    >
      {rail ? <IconBook /> : "용어 사전"}
    </Link>
  );
  const networkLink = (rail: boolean) => (
    <Link
      href="/network"
      className={rail ? `${styles.railBtn} ${networkCurrent ? styles.railBtnActive : ""}` : `${styles.sideLink} ${networkCurrent ? styles.sideLinkActive : ""}`}
      aria-current={networkCurrent ? "page" : undefined}
      onClick={() => setDrawer(false)}
      {...(rail ? { "aria-label": "망 지식", title: "망 지식" } : {})}
    >
      {rail ? <IconNetwork /> : "망 지식"}
    </Link>
  );
  // inAccount: 접힌 레일의 계정 팝오버 안(한 줄 전체를 차지한다). 펼친 사이드바에서는 용어 사전·망 지식과 한 묶음이다.
  const claudeCodeLink = (inAccount: boolean) => (
    <Link
      href="/claude-code"
      className={`${styles.sideLink} ${inAccount ? styles.accountLink : ""} ${claudeCodeCurrent ? styles.sideLinkActive : ""}`}
      aria-current={claudeCodeCurrent ? "page" : undefined}
      onClick={() => {
        setAccount(false);
        setDrawer(false);
      }}
    >
      Claude Code 연결
    </Link>
  );
  const userRow = (
    <>
      <span title={userName}>{userName}</span>
      <form action={logoutAction}>
        <Button type="submit" variant="quiet" size="sm">로그아웃</Button>
      </form>
    </>
  );
  const accountRow = (
    <>
      {claudeCodeLink(true)}
      {userRow}
    </>
  );

  if (narrow) {
    const project = projects.find((p) => p.id === params.projectId);
    const diagram = project?.diagrams.find((d) => d.id === params.diagramId);
    return (
      <>
        <header className={styles.topbar}>
          <button
            ref={drawerBtn}
            type="button"
            className={styles.topbarBtn}
            aria-label="프로젝트 목록 열기"
            aria-haspopup="dialog"
            aria-expanded={drawer}
            aria-controls={drawer ? DRAWER_ID : undefined}
            onClick={() => setDrawer(true)}
          >
            <IconMenu />
          </button>
          <p className={styles.topbarTitle}>
            {project && diagram ? (
              <>
                <span className={styles.topbarProject} title={project.name}>{project.name}</span>
                <span className={styles.topbarSep} aria-hidden="true">/</span>
                <span className={styles.topbarDiagram} title={diagram.name}>{diagram.name}</span>
              </>
            ) : glossaryCurrent ? (
              <span className={styles.topbarDiagram}>용어 사전</span>
            ) : networkCurrent ? (
              <span className={styles.topbarDiagram}>망 지식</span>
            ) : claudeCodeCurrent ? (
              <span className={styles.topbarDiagram}>Claude Code 연결</span>
            ) : (
              <span className={styles.topbarBrand}>
                <LogoMark size={18} />
                InfraSketch
              </span>
            )}
          </p>
        </header>
        {drawer && (
          <>
            <div className={styles.drawerBackdrop} data-drawer-backdrop="" aria-hidden="true" onClick={() => setDrawer(false)} />
            <div ref={drawerRef} id={DRAWER_ID} className={styles.drawer} role="dialog" aria-modal="true" aria-label="프로젝트 목록" onKeyDown={trapDrawer}>
              {expandedNav(true)}
            </div>
          </>
        )}
        {dialogView}
      </>
    );
  }

  if (shell.collapsed) {
    return (
      <>
        <nav className={`${styles.sidebar} ${styles.rail}`} aria-label="프로젝트">
          <RailButton label="프로젝트 영역 펼치기" expanded={false} buttonRef={toggleRef} onClick={() => setShellCollapsed(false)}><IconExpand /></RailButton>
          <RailButton label="새 프로젝트" buttonRef={newProjectBtn} onClick={newProject}><IconPlus /></RailButton>
          {glossaryLink(true)}
          {networkLink(true)}
          <div className={styles.railFoot} ref={accountWrap}>
            <RailButton
              label="계정"
              expanded={account}
              controls={account ? ACCOUNT_POP_ID : undefined}
              buttonRef={accountBtn}
              onClick={() => setAccount((v) => !v)}
            >
              <IconUser />
            </RailButton>
            {account && <div id={ACCOUNT_POP_ID} className={styles.accountPop}>{accountRow}</div>}
          </div>
        </nav>
        {dialogView}
      </>
    );
  }

  return (
    <>
      {expandedNav(false)}
      {dialogView}
    </>
  );

  /** 펼친 사이드바. inDrawer 면 좁은 화면 서랍 안에 그리고, 접기 대신 닫기 버튼을 둔다. */
  function expandedNav(inDrawer: boolean) {
    return (
      <nav className={inDrawer ? `${styles.sidebar} ${styles.drawerNav}` : styles.sidebar} aria-label="프로젝트">
        <div className={styles.sideHead}>
          {/* 로고는 제목이 아니다(페이지 제목 h1 은 작업 화면·용어 사전이 각자 둔다). */}
          <p className={styles.brand}>
            <LogoMark size={18} />
            InfraSketch
          </p>
          {inDrawer ? (
            <button ref={toggleRef} type="button" className={styles.iconBtn} aria-label="프로젝트 목록 닫기" onClick={() => setDrawer(false)}>
              <IconClose />
            </button>
          ) : (
            <button
              ref={toggleRef}
              type="button"
              className={styles.iconBtn}
              aria-label="프로젝트 영역 접기"
              title="프로젝트 영역 접기"
              aria-expanded={true}
              onClick={() => setShellCollapsed(true)}
            >
              <IconCollapse />
            </button>
          )}
        </div>
        {projects.length === 0 && <p className={styles.treeEmpty}>아직 프로젝트가 없어요</p>}
        <ul className={styles.tree} data-scroll-root="">
          {projects.map((p) => {
            const isCollapsed = collapsed.has(p.id);
            const holdsCurrent = p.diagrams.some((d) => d.id === params.diagramId);
            return (
              <li key={p.id}>
                <div className={`${styles.row} ${holdsCurrent ? styles.currentProject : ""}`}>
                  <button
                    type="button"
                    className={`${styles.rowMain} ${styles.projectMain}`}
                    aria-expanded={!isCollapsed}
                    onClick={() => toggle(p.id)}
                  >
                    <span className={styles.caret} aria-hidden="true">{isCollapsed ? "▸" : "▾"}</span>
                    <span className={styles.rowName} title={p.name}>{p.name}</span>
                    <span className={styles.count} aria-hidden="true">{p.diagrams.length}</span>
                    <span className={styles.srOnly}>{`, 구성도 ${p.diagrams.length}개`}</span>
                  </button>
                  {menuFor({ type: "project", id: p.id, name: p.name, project: p })}
                </div>
                {!isCollapsed && (
                  <ul className={styles.subtree}>
                    {p.diagrams.length === 0 && (
                      <li>
                        <button type="button" className={styles.addRow} onClick={(e) => openDialog(newDiagramDialog(p.id, p.name), e.currentTarget)}>
                          + 구성도 추가
                        </button>
                      </li>
                    )}
                    {p.diagrams.map((d) => {
                      const current = params.diagramId === d.id;
                      return (
                        <li key={d.id}>
                          <div className={`${styles.row} ${styles.diagramRow} ${current ? styles.current : ""}`}>
                            <button
                              ref={current ? currentRow : undefined}
                              type="button"
                              className={styles.rowMain}
                              aria-current={current ? "page" : undefined}
                              onClick={() => goDiagram(p.id, d.id)}
                            >
                              {/* 잘린 긴 이름은 마우스를 올리면 보인다. 포커스되지 않는 안쪽에 두어 이름을 두 번 읽지 않게. */}
                              <span className={styles.rowName} title={d.name}>{d.name}</span>
                            </button>
                            {menuFor({ type: "diagram", id: d.id, name: d.name, project: p })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <p className={styles.sideStatus} role="status">{duplicating ? "복제하는 중…" : ""}</p>
        {notice && <p className={`${styles.error} ${styles.sideNotice}`} role="alert">{notice}</p>}
        <div className={styles.sideFoot}>
          <Button ref={newProjectBtn} onClick={newProject}>새 프로젝트</Button>
          <div className={styles.pageLinks}>
            {glossaryLink(false)}
            {networkLink(false)}
            {claudeCodeLink(false)}
          </div>
        </div>
        <div className={`${styles.user} ${styles.userSeam}`}>{userRow}</div>
      </nav>
    );
  }
}

function RailButton({ label, onClick, expanded, controls, buttonRef, children }: {
  label: string;
  onClick(): void;
  expanded?: boolean;
  controls?: string | undefined;
  buttonRef?: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.railBtn}
      aria-label={label}
      title={label}
      {...(expanded === undefined ? {} : { "aria-expanded": expanded })}
      {...(controls ? { "aria-controls": controls } : {})}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// 레일 아이콘: 18px, 1.5px 선, currentColor.
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconCollapse = () => <Svg><rect x="2.5" y="3" width="13" height="12" rx="2" /><path d="M6.5 3v12M11.5 7l-2 2 2 2" /></Svg>;
const IconExpand = () => <Svg><rect x="2.5" y="3" width="13" height="12" rx="2" /><path d="M6.5 3v12M9.5 7l2 2-2 2" /></Svg>;
const IconPlus = () => <Svg><path d="M9 4v10M4 9h10" /></Svg>;
const IconBook = () => <Svg><path d="M3.5 3.5h4a1.5 1.5 0 0 1 1.5 1.5v9a1.2 1.2 0 0 0-1.2-1.2H3.5zM14.5 3.5h-4A1.5 1.5 0 0 0 9 5v9a1.2 1.2 0 0 1 1.2-1.2h4.3z" /></Svg>;
const IconNetwork = () => <Svg><circle cx="9" cy="4.5" r="1.75" /><circle cx="4.5" cy="13.5" r="1.75" /><circle cx="13.5" cy="13.5" r="1.75" /><path d="M8.2 6.1L5.3 11.9M9.8 6.1l2.9 5.8M6.25 13.5h5.5" /></Svg>;
const IconMenu = () => <Svg><path d="M3 5h12M3 9h12M3 13h12" /></Svg>;
const IconClose = () => <Svg><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" /></Svg>;
const IconUser = () => <Svg><circle cx="9" cy="6.5" r="2.75" /><path d="M3.75 15a5.25 5.25 0 0 1 10.5 0" /></Svg>;
