"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

import styles from "./app.module.css";
import { useShell } from "./Shell";

export interface SidebarProject {
  id: string;
  name: string;
  diagrams: { id: string; name: string }[];
}

type Dialog =
  | { kind: "name"; title: string; submit: string; initial: string; run(name: string): Promise<string | void> }
  | { kind: "delete"; name: string; run(): Promise<string | void> };

type MenuTarget = { type: "project" | "diagram"; id: string; name: string };
type MenuAction = "newDiagram" | "rename" | "duplicate" | "delete";

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

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const goDiagram = (projectId: string, diagramId: string) => router.push(`/p/${projectId}/d/${diagramId}`);

  const newProject = () =>
    setDialog({
      kind: "name",
      title: "새 프로젝트",
      submit: "만들기",
      initial: "",
      run: async (name) => {
        const p = await createProjectAction(name);
        if (!p.ok) return p.error;
        const d = await createDiagramAction(p.id, "새 구성도");
        if (!d.ok) return d.error;
        goDiagram(p.id, d.id);
      },
    });

  const act = (action: MenuAction, t: MenuTarget) => {
    setMenu(null);
    if (action === "newDiagram") {
      setDialog({
        kind: "name",
        title: "새 구성도",
        submit: "만들기",
        initial: "",
        run: async (name) => {
          const d = await createDiagramAction(t.id, name);
          if (!d.ok) return d.error;
          goDiagram(t.id, d.id);
        },
      });
    } else if (action === "rename") {
      setDialog({
        kind: "name",
        title: "이름 바꾸기",
        submit: "바꾸기",
        initial: t.name,
        run: async (name) => {
          const r = t.type === "project" ? await renameProjectAction(t.id, name) : await renameDiagramAction(t.id, name);
          if (!r.ok) return r.error;
          router.refresh();
        },
      });
    } else if (action === "duplicate") {
      setNotice(null);
      startDup(async () => {
        try {
          const d = await duplicateDiagramAction(t.id);
          goDiagram(d.projectId, d.id);
        } catch {
          setNotice("복제하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
      });
    } else {
      setDialog({
        kind: "delete",
        name: t.name,
        run: async () => {
          const wasCurrent = t.type === "project" ? params.projectId === t.id : params.diagramId === t.id;
          if (t.type === "project") await deleteProjectAction(t.id);
          else await deleteDiagramAction(t.id);
          if (wasCurrent) router.push("/");
          else router.refresh();
        },
      });
    }
  };

  const menuFor = (t: MenuTarget) => (
    <>
      <button
        type="button"
        className={styles.menuBtn}
        aria-label={`${t.name} 메뉴`}
        aria-haspopup="menu"
        aria-expanded={menu === t.id}
        onClick={() => setMenu(menu === t.id ? null : t.id)}
      >
        ⋯
      </button>
      {menu === t.id && (
        <div className={styles.menu} role="menu">
          {t.type === "project" && (
            <button type="button" role="menuitem" onClick={() => act("newDiagram", t)}>새 구성도</button>
          )}
          <button type="button" role="menuitem" onClick={() => act("rename", t)}>이름 바꾸기</button>
          {t.type === "diagram" && (
            <button type="button" role="menuitem" onClick={() => act("duplicate", t)}>복제</button>
          )}
          <button type="button" role="menuitem" onClick={() => act("delete", t)}>삭제</button>
        </div>
      )}
    </>
  );

  const dialogView = dialog && <DialogView dialog={dialog} onClose={() => setDialog(null)} />;

  if (shell.collapsed) {
    return (
      <>
        <nav className={`${styles.sidebar} ${styles.rail}`} aria-label="프로젝트">
          <RailButton label="프로젝트 영역 펼치기" onClick={() => shell.setCollapsed(false)}><IconExpand /></RailButton>
          <RailButton label="새 프로젝트" onClick={newProject}><IconPlus /></RailButton>
          <Link
            href="/glossary"
            className={`${styles.railBtn} ${glossaryCurrent ? styles.railBtnActive : ""}`}
            aria-label="용어 사전"
            title="용어 사전"
            aria-current={glossaryCurrent ? "page" : undefined}
          >
            <IconBook />
          </Link>
          <div className={styles.railFoot}>
            <RailButton label="계정" expanded={account} onClick={() => setAccount((v) => !v)}><IconUser /></RailButton>
            {account && (
              <div className={styles.accountPop} onKeyDown={(e) => e.key === "Escape" && setAccount(false)}>
                <span>{userName}</span>
                <form action={logoutAction}>
                  <button type="submit" className={styles.linkBtn}>로그아웃</button>
                </form>
              </div>
            )}
          </div>
        </nav>
        {dialogView}
      </>
    );
  }

  return (
    <>
      <nav className={styles.sidebar} aria-label="프로젝트">
        <div className={styles.sideHead}>
          <h1 className={styles.brand}>InfraSketch</h1>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="프로젝트 영역 접기"
            title="프로젝트 영역 접기"
            onClick={() => {
              setMenu(null);
              shell.setCollapsed(true);
            }}
          >
            <IconCollapse />
          </button>
        </div>
        <ul className={styles.tree}>
          {projects.map((p) => {
            const isCollapsed = collapsed.has(p.id);
            return (
              <li key={p.id}>
                <div className={styles.row}>
                  <button type="button" className={styles.rowMain} aria-expanded={!isCollapsed} onClick={() => toggle(p.id)}>
                    {isCollapsed ? "▸" : "▾"} {p.name}
                  </button>
                  {menuFor({ type: "project", id: p.id, name: p.name })}
                </div>
                {!isCollapsed && (
                  <ul className={styles.subtree}>
                    {p.diagrams.map((d) => {
                      const current = params.diagramId === d.id;
                      return (
                        <li key={d.id}>
                          <div className={`${styles.row} ${styles.diagramRow} ${current ? styles.current : ""}`}>
                            <button
                              type="button"
                              className={styles.rowMain}
                              aria-current={current ? "page" : undefined}
                              onClick={() => goDiagram(p.id, d.id)}
                            >
                              {d.name}
                            </button>
                            {menuFor({ type: "diagram", id: d.id, name: d.name })}
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
        {(notice || duplicating) && (
          <p className={notice ? styles.error : styles.user} role={notice ? "alert" : "status"} style={{ padding: "0 12px" }}>
            {notice ?? "복제하는 중…"}
          </p>
        )}
        <div className={styles.sideFoot}>
          <Link
            href="/glossary"
            className={`${styles.sideLink} ${glossaryCurrent ? styles.sideLinkActive : ""}`}
            aria-current={glossaryCurrent ? "page" : undefined}
          >용어 사전</Link>
          <button type="button" className={styles.btn} onClick={newProject}>새 프로젝트</button>
          <div className={styles.user}>
            <span>{userName}</span>
            <form action={logoutAction}>
              <button type="submit" className={styles.linkBtn}>로그아웃</button>
            </form>
          </div>
        </div>
      </nav>
      {dialogView}
    </>
  );
}



function RailButton({ label, onClick, expanded, children }: { label: string; onClick(): void; expanded?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={styles.railBtn}
      aria-label={label}
      title={label}
      {...(expanded === undefined ? {} : { "aria-expanded": expanded })}
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
const IconUser = () => <Svg><circle cx="9" cy="6.5" r="2.75" /><path d="M3.75 15a5.25 5.25 0 0 1 10.5 0" /></Svg>;

function DialogView({ dialog, onClose }: { dialog: Dialog; onClose(): void }) {
  const [value, setValue] = useState(dialog.kind === "name" ? dialog.initial : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      try {
        const err = dialog.kind === "name" ? await dialog.run(value) : await dialog.run();
        if (err) setError(err);
        else onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "처리하지 못했어요");
      }
    });

  return (
    <div className={styles.backdrop}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={dialog.kind === "name" ? dialog.title : "삭제 확인"}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        {dialog.kind === "name" ? (
          <>
            <h2>{dialog.title}</h2>
            <label>
              이름
              <input autoFocus value={value} maxLength={60} onChange={(e) => setValue(e.target.value)} />
            </label>
          </>
        ) : (
          <p>{`‘${dialog.name}’을 삭제할까요? 되돌릴 수 없습니다.`}</p>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.btn} onClick={onClose}>취소</button>
          <button type="submit" className={styles.btn} disabled={pending || (dialog.kind === "name" && value.trim() === "")}>
            {dialog.kind === "name" ? dialog.submit : "삭제"}
          </button>
        </div>
      </form>
    </div>
  );
}
