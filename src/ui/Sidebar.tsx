"use client";

import { useParams, useRouter } from "next/navigation";
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

export interface SidebarProject {
  id: string;
  name: string;
  diagrams: { id: string; name: string }[];
}

type Dialog =
  | { kind: "name"; title: string; submit: string; initial: string; run(name: string): Promise<void> }
  | { kind: "delete"; name: string; run(): Promise<void> };

type MenuTarget = { type: "project" | "diagram"; id: string; name: string };
type MenuAction = "newDiagram" | "rename" | "duplicate" | "delete";

export function Sidebar({ projects, userName }: { projects: SidebarProject[]; userName: string }) {
  const router = useRouter();
  const params = useParams<{ projectId?: string; diagramId?: string }>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);

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
        const d = await createDiagramAction(p.id, "새 구성도");
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
          if (t.type === "project") await renameProjectAction(t.id, name);
          else await renameDiagramAction(t.id, name);
          router.refresh();
        },
      });
    } else if (action === "duplicate") {
      void duplicateDiagramAction(t.id).then((d) => goDiagram(d.projectId, d.id));
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

  return (
    <nav className={styles.sidebar} aria-label="프로젝트">
      <h1 className={styles.brand}>InfraSketch</h1>
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
      <div className={styles.sideFoot}>
        <button type="button" className={styles.btn} onClick={newProject}>새 프로젝트</button>
        <div className={styles.user}>
          <span>{userName}</span>
          <form action={logoutAction}>
            <button type="submit" className={styles.linkBtn}>로그아웃</button>
          </form>
        </div>
      </div>
      {dialog && <DialogView dialog={dialog} onClose={() => setDialog(null)} />}
    </nav>
  );
}

function DialogView({ dialog, onClose }: { dialog: Dialog; onClose(): void }) {
  const [value, setValue] = useState(dialog.kind === "name" ? dialog.initial : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      try {
        if (dialog.kind === "name") await dialog.run(value);
        else await dialog.run();
        onClose();
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
