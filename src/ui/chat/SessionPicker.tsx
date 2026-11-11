"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { usePopover } from "@/canvas/usePopover";
import { Button } from "@/ui/Button";

import { type Dialog, DialogView, RowMenu, type RowMenuItem } from "../dialogs";

import styles from "./chat.module.css";
import { type MoreState, NEW_SESSION, type SessionKey, type SessionKind, type SessionSummary } from "./useSessions";

export interface SessionPickerProps {
  /** 세션들(구성도 대화·노드 질문, 순서는 상관없다. 무리마다 최신순으로 보인다). */
  sessions: SessionSummary[];
  active: SessionKey;
  /** 지금 구성도의 노드 이름. 노드가 지워졌으면 null. */
  labelOf(nodeId: string): string | null;
  onSelect(key: SessionKey): void;
  /** 서버가 아직 id 를 주지 않은 새 세션(고른 상태일 때 버튼 글과 목록에 쓴다). */
  pending?: SessionSummary | null;
  /** `새 대화`: 새 구성도 대화를 연다. 없으면 버튼을 그리지 않는다. */
  onNew?(): void;
  newDisabled?: boolean;
  /** 이름 바꾸기·삭제. 실패하면 대화상자에 보일 오류 글을 돌려준다. 없으면 행 메뉴를 그리지 않는다. */
  onRename?(id: string, title: string): Promise<string | void>;
  onDelete?(id: string): Promise<string | void>;
  /** 차례가 도는 중: 삭제를 막는다(구성도 잠금이 걸려 있어 서버도 거절한다). */
  deleteDisabled?: boolean;
  /** 대화상자를 닫은 뒤 고르기·`새 대화` 버튼이 모두 막혀 있을 때 포커스를 둘 곳(대화 입력칸 등). */
  fallbackFocus?(): void;
  /** 무리마다 `더 보기` 상태. 없으면 더 불러올 것이 없다. */
  more?: Record<SessionKind, MoreState>;
  /** 무리의 다음 쪽을 불러온다. 새로 들어온 세션 id 를 돌려준다. */
  onMore?(kind: SessionKind): Promise<string[]>;
}

/** 세션 없는 구성도 대화. 늘 맨 위에 있고 이름을 바꾸거나 지울 수 없다. */
export const MAIN_LABEL = "기본 대화";
const DIAGRAM_GROUP = "구성도 대화";
const NODE_GROUP = "노드 질문";
const NEW_LABEL = "새 대화";

type Action = "rename" | "delete";

const pad = (n: number) => String(n).padStart(2, "0");
/** 오늘이면 HH:mm, 아니면 M/D. */
function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const today = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return today ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 구성도 대화 세션은 제목, 노드 질문 세션은 노드 이름(지금 이름, 지워졌으면 만들 때 이름 + ` (지워짐)`) · 제목.
 * 노드 이름 뒤에 조사를 붙이지 않는다.
 */
export function sessionName(s: SessionSummary, labelOf: (nodeId: string) => string | null): string {
  if (s.kind === "diagram") return s.title;
  const name = labelOf(s.nodeId) ?? `${s.nodeLabel} (지워짐)`;
  return `${name} · ${s.title}`;
}

const Chevron = () => (
  <svg className={styles.sessionChevron} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 3 4 5.5 6.5 3" />
  </svg>
);
const Plus = () => (
  <svg className={styles.newChatIcon} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 2v8M2 6h8" />
  </svg>
);

const byRecent = (a: SessionSummary, b: SessionSummary) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
const ITEM = "[data-session-item]";
/** ↑↓ 로 오가는 줄: 세션 행과 무리 끝의 `더 보기`. */
const NAV = "[data-session-item], [data-session-more]";
const MORE_LABEL: Record<Exclude<MoreState, "none">, string> = { idle: "더 보기", loading: "불러오는 중…", error: "다시 불러오기" };
const menuRootId = (id: string) => `session-${id}`;

/**
 * 대화 탭 맨 위: 지금 대화 이름 ▾ 와 `새 대화`. 펼치면 두 무리로 보인다.
 *  - 구성도 대화: 기본 대화(맨 위, 고정) → 구성도 대화 세션(최근 이어간 순)
 *  - 노드 질문: 노드 질문 세션(최근 이어간 순)
 * 세션 행의 ⋯ 메뉴로 이름을 바꾸거나 지운다(지우기 전에 확인한다). 고를 세션이 하나도 없으면 이름만 보이고 누를 수 없다.
 */
export function SessionPicker({
  sessions,
  active,
  labelOf,
  onSelect,
  pending = null,
  onNew,
  newDisabled = false,
  onRename,
  onDelete,
  deleteDisabled = false,
  fallbackFocus,
  more,
  onMore,
}: SessionPickerProps) {
  const { open, setOpen, root, trigger } = usePopover(ITEM);
  const current = active === NEW_SESSION ? pending : (sessions.find((s) => s.id === active) ?? null);
  const label = active === "main" || !current ? MAIN_LABEL : sessionName(current, labelOf);
  const canOpen = sessions.length > 0 || active !== "main";
  const diagramRows = sessions.filter((s) => s.kind === "diagram").sort(byRecent);
  const nodeRows = sessions.filter((s) => s.kind === "node").sort(byRecent);
  const draft = active === NEW_SESSION && pending ? pending : null;
  const manage = !!onRename && !!onDelete;

  // 행 메뉴: 하나만 열린다. 바깥을 누르면 닫는다(Esc·방향키는 RowMenu 가 맡는다). 목록을 닫으면 함께 닫는다.
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => {
    if (!open) setMenu(null);
  }, [open]);
  useEffect(() => {
    if (menu === null) return;
    const onDown = (e: PointerEvent) => {
      const at = (e.target as Element | null)?.closest?.("[data-menu-root]");
      if (at?.getAttribute("data-menu-root") !== menuRootId(menu)) setMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);

  // 이름 바꾸기·삭제 대화상자. 닫으면 고르기 버튼으로 포커스를 돌린다(행은 목록과 함께 닫혔다).
  // 마지막 세션을 지워 고르기 버튼이 막혔으면 `새 대화`, 그것도 막혔으면 fallbackFocus(입력칸)로.
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const newBtn = useRef<HTMLButtonElement>(null);
  /** 대화상자를 닫고 돌려준 포커스(목록이 늦게 바뀌어 고르기 버튼이 막히면 다시 옮긴다). */
  const returned = useRef(false);
  const refocus = () => {
    const usable = (el: HTMLButtonElement | null) => !!el && el.isConnected && !el.disabled;
    if (usable(trigger.current)) trigger.current!.focus();
    else if (usable(newBtn.current)) newBtn.current!.focus();
    else fallbackFocus?.();
  };
  const closeDialog = () => {
    setDialog(null);
    returned.current = true;
    setTimeout(refocus, 0);
  };
  // 삭제 결과가 대화상자를 닫은 뒤에 그려져 고르기 버튼이 막히면, 그 버튼(또는 body)에 남은 포커스를 옮긴다.
  useEffect(() => {
    if (!returned.current || canOpen) return;
    const a = document.activeElement;
    if (a === trigger.current || a === document.body || a === null) refocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 막힐 때만 다시 본다
  }, [canOpen]);
  useEffect(() => {
    if (open) returned.current = false;
  }, [open]);
  const act = (action: Action, s: SessionSummary) => {
    setMenu(null);
    setOpen(false);
    const name = sessionName(s, labelOf);
    if (action === "rename") {
      setDialog({
        kind: "name",
        title: "대화 이름 바꾸기",
        placeholder: s.title,
        submit: "바꾸기",
        pendingLabel: "바꾸는 중…",
        initial: s.title,
        run: (title) => onRename!(s.id, title),
      });
    } else {
      setDialog({
        kind: "delete",
        title: "대화 삭제",
        message: `‘${name}’ 대화를 삭제할까요? 이 대화의 메시지가 모두 지워져요. 구성도와 버전 이력은 그대로예요. 되돌릴 수 없어요.`,
        run: () => onDelete!(s.id),
      });
    }
  };

  const move = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    // 행 메뉴 안의 방향키는 RowMenu 가 맡는다.
    if ((e.target as Element).closest('[role="menu"]')) return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>(NAV)];
    const at = items.indexOf(document.activeElement as HTMLElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  const choose = (key: SessionKey) => {
    setOpen(false);
    trigger.current?.focus();
    if (key !== active) onSelect(key);
  };

  // `더 보기`: 불러온 뒤 새로 들어온 첫 세션으로 포커스를 옮기고, 몇 개를 더 불러왔는지 알린다.
  const [announce, setAnnounce] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusId === null) return;
    setFocusId(null);
    list.current?.querySelector<HTMLElement>(`[data-session-id="${CSS.escape(focusId)}"]`)?.focus();
  }, [focusId]);
  const loadMore = async (kind: SessionKind, group: string) => {
    if (!onMore || more?.[kind] === "loading") return;
    setAnnounce("");
    const added = await onMore(kind);
    if (added.length > 0) {
      setAnnounce(`${group} ${added.length}개를 더 불러왔어요.`);
      setFocusId(added[0]!);
      return;
    }
    // 새로 온 것이 없고 `더 보기` 가 사라졌으면 포커스가 갈 곳을 잃지 않게 목록 마지막 줄로.
    setTimeout(() => {
      const a = document.activeElement;
      if (a && a !== document.body && list.current?.contains(a)) return;
      [...(list.current?.querySelectorAll<HTMLElement>(NAV) ?? [])].at(-1)?.focus();
    }, 0);
  };
  const moreRow = (kind: SessionKind, group: string) => {
    const state = more?.[kind] ?? "none";
    if (state === "none" || !onMore) return null;
    return (
      <li className={styles.sessionRow}>
        <button
          type="button"
          data-session-more=""
          className={`${styles.sessionItem} ${styles.sessionMore}`}
          aria-label={`${group} ${MORE_LABEL[state]}`}
          aria-disabled={state === "loading" || undefined}
          onClick={() => void loadMore(kind, group)}
        >
          <span className={styles.sessionLabel}>{MORE_LABEL[state]}</span>
        </button>
      </li>
    );
  };

  const item = (key: SessionKey, name: string, at?: string) => (
    <button
      type="button"
      data-session-item=""
      data-session-id={key}
      className={styles.sessionItem}
      {...(active === key ? { "aria-current": "true" as const } : {})}
      onClick={() => choose(key)}
    >
      <span className={styles.sessionLabel}>{name}</span>
      {at !== undefined && (
        <time className={styles.sessionTime} dateTime={at}>
          {when(at)}
        </time>
      )}
    </button>
  );
  const row = (s: SessionSummary) => {
    const name = sessionName(s, labelOf);
    const items: RowMenuItem<Action>[] = [
      { action: "rename", label: "이름 바꾸기" },
      { action: "delete", label: "삭제", danger: true, disabled: deleteDisabled },
    ];
    return (
      <li key={s.id} className={styles.sessionRow}>
        {item(s.id, name, s.updatedAt)}
        {manage && (
          <RowMenu
            id={menuRootId(s.id)}
            label={`${name} 메뉴`}
            open={menu === s.id}
            onOpenChange={(v) => setMenu(v ? s.id : null)}
            buttonRef={() => {}}
            buttonClassName={styles.sessionMenuBtn}
            items={items}
            onSelect={(a) => act(a, s)}
          />
        )}
      </li>
    );
  };
  const draftRow = (s: SessionSummary) => (
    <li className={styles.sessionRow}>{item(NEW_SESSION, sessionName(s, labelOf), s.updatedAt)}</li>
  );

  return (
    <div ref={root} className={styles.sessionBar}>
      <button
        ref={trigger}
        type="button"
        className={styles.sessionBtn}
        data-session-picker=""
        disabled={!canOpen}
        {...(canOpen ? { "aria-haspopup": "dialog" as const, "aria-expanded": open } : {})}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.sessionLabel}>{label}</span>
        {canOpen && <Chevron />}
      </button>
      {onNew && (
        <Button ref={newBtn} size="sm" disabled={newDisabled} onClick={onNew}>
          <Plus />
          {NEW_LABEL}
        </Button>
      )}
      {open && (
        <div ref={list} className={styles.sessionList} role="dialog" aria-label="대화 고르기" data-scroll-root="" onKeyDown={move}>
          <section aria-labelledby="session-group-diagram">
            <h3 id="session-group-diagram" className={styles.sessionGroup}>
              {DIAGRAM_GROUP}
            </h3>
            <ul className={styles.sessionRows}>
              <li className={styles.sessionRow}>{item("main", MAIN_LABEL)}</li>
              {draft?.kind === "diagram" && draftRow(draft)}
              {diagramRows.map(row)}
              {moreRow("diagram", DIAGRAM_GROUP)}
            </ul>
          </section>
          {(nodeRows.length > 0 || draft?.kind === "node" || (more?.node ?? "none") !== "none") && (
            <section aria-labelledby="session-group-node">
              <h3 id="session-group-node" className={styles.sessionGroup}>
                {NODE_GROUP}
              </h3>
              <ul className={styles.sessionRows}>
                {draft?.kind === "node" && draftRow(draft)}
                {nodeRows.map(row)}
                {moreRow("node", NODE_GROUP)}
              </ul>
            </section>
          )}
        </div>
      )}
      <div role="status" className={styles.srOnly}>
        {announce}
      </div>
      {/* 대화 패널은 유리 칠(backdrop-filter)이라 고정 위치 자식을 가둔다: 대화상자는 body 에 그린다. */}
      {dialog && typeof document !== "undefined" && createPortal(<DialogView dialog={dialog} onClose={closeDialog} />, document.body)}
    </div>
  );
}
