"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import styles from "./app.module.css";
import { Button } from "./Button";

/**
 * 행의 ⋯ 메뉴와 이름·삭제 확인 대화상자. 사이드바(프로젝트·구성도)와 대화 세션 고르기가 함께 쓴다.
 */

export type NameDialog = {
  kind: "name";
  title: string;
  /** 대화상자 안 짧은 안내(무엇이 생기는지 등). */
  hint?: string;
  placeholder: string;
  submit: string;
  pendingLabel: string;
  initial: string;
  run(name: string): Promise<string | void>;
};
export type DeleteDialog = { kind: "delete"; title: string; message: string; run(): Promise<string | void> };
export type Dialog = NameDialog | DeleteDialog;

export type RowMenuItem<A extends string> = { action: A; label: string; disabled?: boolean; danger?: boolean };

/** 서버 액션이 던진 오류는 운영 환경에서 영어 안내로 바뀌므로, 화면에는 늘 같은 한국어 문장을 보인다. */
export const GENERIC_ERROR = "처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

/** 행의 ⋯ 메뉴. 열면 첫 항목에 포커스, ↑↓·Home·End 로 옮기고, Esc 는 닫고 ⋯ 버튼으로 돌아간다. Tab 은 닫는다. */
export function RowMenu<A extends string>({ id, label, open, onOpenChange, buttonRef, buttonClassName, items, onSelect }: {
  id: string;
  label: string;
  open: boolean;
  onOpenChange(v: boolean): void;
  buttonRef(el: HTMLButtonElement | null): void;
  /** ⋯ 버튼에 더할 클래스(놓인 자리의 크기 규칙). */
  buttonClassName?: string;
  items: RowMenuItem<A>[];
  onSelect(a: A): void;
}) {
  const btn = useRef<HTMLButtonElement | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = `row-menu-${id}`;
  const enabled = () => Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? []);

  useEffect(() => {
    if (open) enabled()[0]?.focus();
  }, [open]);

  // 스크롤되는 목록 아래쪽에 자리가 모자라면(잘려 보이면) 위로 연다. 그리기 전에 재서 깜빡이지 않게.
  const [up, setUp] = useState(false);
  useLayoutEffect(() => {
    if (!open) return setUp(false);
    const menuEl = list.current, root = menuEl?.closest("[data-scroll-root]");
    if (!menuEl || !root || !btn.current) return;
    const m = menuEl.getBoundingClientRect(), r = root.getBoundingClientRect(), b = btn.current.getBoundingClientRect();
    setUp(m.bottom > r.bottom && b.top - r.top > r.bottom - b.bottom);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const all = enabled();
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    const move = (n: number) => {
      e.preventDefault();
      all[(n + all.length) % all.length]?.focus();
    };
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(all.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
      btn.current?.focus();
    } else if (e.key === "Tab") onOpenChange(false);
  };

  return (
    <div className={styles.menuRoot} data-menu-root={id}>
      <button
        ref={(el) => {
          btn.current = el;
          buttonRef(el);
        }}
        type="button"
        className={buttonClassName ? `${styles.menuBtn} ${buttonClassName}` : styles.menuBtn}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => onOpenChange(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            onOpenChange(true);
          }
        }}
      >
        ⋯
      </button>
      {open && (
        <div ref={list} id={menuId} className={`${styles.menu} ${up ? styles.menuUp : ""}`} role="menu" aria-label={label} onKeyDown={onKeyDown}>
          {items.map((it) => (
            <button
              key={it.action}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={it.danger ? styles.menuDanger : undefined}
              disabled={it.disabled}
              onClick={() => onSelect(it.action)}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const focusables = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("input, button:not(:disabled)"));

// 대화상자는 한 번에 하나만 뜬다(사이드바·대화 세션 고르기가 함께 쓴다).
const DIALOG_HINT_ID = "app-dialog-hint";
const DIALOG_ERROR_ID = "app-dialog-error";

export function DialogView({ dialog, onClose }: { dialog: Dialog; onClose(): void }) {
  const [value, setValue] = useState(dialog.kind === "name" ? dialog.initial : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const isName = dialog.kind === "name";

  // 이름 대화상자는 입력칸에(바꾸기면 기존 이름을 골라 둔 채로), 삭제 확인은 실수로 지우지 않게 ‘취소’에 포커스.
  useEffect(() => {
    if (isName) {
      input.current?.focus();
      input.current?.select();
    } else cancel.current?.focus();
  }, [isName]);

  // 진행 중에는 닫지 않는다(닫아도 요청은 계속 돌아 결과·오류가 안 보이게 된다).
  const close = () => {
    if (!busy.current) onClose();
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  // Esc 는 캡처 단계에서 먼저 받아 preventDefault 한다: 다른 팝오버의 Esc 처리기가 함께 돌지 않게.
  // 포커스가 대화상자 밖으로 나가면(바탕 클릭 등) 다시 안으로 데려온다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      closeRef.current();
    };
    const onFocusIn = (e: FocusEvent) => {
      const f = form.current;
      if (f && e.target instanceof Node && !f.contains(e.target)) focusables(f)[0]?.focus();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  const submit = () => {
    if (busy.current) return;
    busy.current = true;
    start(async () => {
      try {
        const err = dialog.kind === "name" ? await dialog.run(value) : await dialog.run();
        busy.current = false;
        if (err) setError(err);
        else onClose();
      } catch {
        busy.current = false;
        setError(GENERIC_ERROR);
      }
    });
  };

  // 포커스를 대화상자 안에 가둔다(Tab·Shift+Tab 이 끝에서 처음으로 돈다).
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !form.current) return;
    const f = focusables(form.current);
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

  const blank = isName && value.trim() === "";
  const unchanged = isName && dialog.initial !== "" && value.trim() === dialog.initial.trim();
  const submitDisabled = pending || blank || unchanged;
  const describedBy = [isName && dialog.hint ? DIALOG_HINT_ID : "", error ? DIALOG_ERROR_ID : ""].filter(Boolean).join(" ") || undefined;
  const submitLabel = dialog.kind === "name" ? (pending ? dialog.pendingLabel : dialog.submit) : pending ? "삭제하는 중…" : "삭제";

  return (
    <div
      className={styles.backdrop}
      // 바탕을 눌러도 포커스가 body 로 빠져 Tab 이 대화상자 밖으로 새지 않게 한다.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <form
        ref={form}
        className={styles.dialog}
        role={isName ? "dialog" : "alertdialog"}
        aria-modal="true"
        aria-label={dialog.title}
        aria-describedby={isName ? undefined : DIALOG_HINT_ID}
        aria-busy={pending || undefined}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={trap}
      >
        <h2>{dialog.title}</h2>
        {dialog.kind === "name" ? (
          <>
            {dialog.hint && <p id={DIALOG_HINT_ID} className={styles.dialogHint}>{dialog.hint}</p>}
            <label>
              이름
              <input
                ref={input}
                value={value}
                maxLength={60}
                placeholder={dialog.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
              />
            </label>
          </>
        ) : (
          <p id={DIALOG_HINT_ID}>{dialog.message}</p>
        )}
        {error && <p id={DIALOG_ERROR_ID} className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}>
          <Button ref={cancel} disabled={pending} onClick={close}>취소</Button>
          {/* 이름 확인은 주 동작(비었거나 그대로이거나 진행 중이면 무채색 비활성). 삭제는 늘 빠진 정보 색. */}
          <Button type="submit" variant={isName ? "primary" : "danger"} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
