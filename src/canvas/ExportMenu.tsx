import { useEffect, useId, useRef, useState } from "react";

import { LIGHT_BACKGROUND, type ExportBackground, type ExportFormat } from "./exportImage";
import { moveMenuFocus, usePopover } from "./usePopover";

export const EXPORT_BUSY_MESSAGE = "이미지를 만드는 중…";
export const EXPORT_DONE_MESSAGE = "이미지를 저장했어요.";
export const EXPORT_FAILED_MESSAGE = "이미지를 만들지 못했어요. 잠시 뒤 다시 해 보세요.";
export const EXPORT_EMPTY_REASON = "구성도가 비어 있어 저장할 그림이 없어요.";
/** 버튼·메뉴 이름. 대화의 `보내기` 버튼과 이름이 겹치지 않게 '보내기'를 쓰지 않는다. */
export const EXPORT_LABEL = "이미지 저장";
/** 끝났다는 알림·실패 알림을 보여 두는 시간. */
const NOTE_MS = { done: 2500, failed: 8000 } as const;

const FORMATS: { format: ExportFormat; title: string; hint: string }[] = [
  { format: "png", title: "PNG", hint: "문서·메신저에 붙이기 좋은 그림" },
  { format: "svg", title: "SVG", hint: "확대해도 선명한 그림" },
];
const BACKGROUNDS: { background: ExportBackground; label: string }[] = [
  { background: "dark", label: "어두운 바탕(화면과 같음)" },
  { background: "light", label: "흰 바탕(문서용)" },
];

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const IconExport = () => (
  <svg className="canvas__tool-icon" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false" {...stroke}>
    <path d="M8 2v8M4.8 6.8 8 10l3.2-3.2M2.5 11v2.5h11V11" />
  </svg>
);
const IconChevron = () => (
  <svg className="canvas__tool-chevron" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" focusable="false" {...stroke}>
    <path d="M1.5 3 4 5.5 6.5 3" />
  </svg>
);

export interface ExportMenuProps {
  /** 그릴 구성도가 없으면 참. 버튼을 막고 까닭을 알려 준다. */
  disabled: boolean;
  disabledReason?: string;
  onExport(format: ExportFormat, background: ExportBackground): Promise<void>;
}

type Note = { kind: "busy" | "done" | "failed" } | null;

/**
 * `이미지 저장 ▾`: 형식(PNG·SVG)마다 바탕(어두운·흰) 두 항목을 묶은 메뉴. 고르면 닫히고, 만드는 동안 버튼은 막히며
 * 진행·완료·실패를 도구 모음 아래에 알린다.
 */
export function ExportMenu({ disabled, disabledReason = EXPORT_EMPTY_REASON, onExport }: ExportMenuProps) {
  const { open, setOpen, root, trigger } = usePopover('[role="menuitem"]');
  const [note, setNote] = useState<Note>(null);
  const reasonId = useId();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (note?.kind !== "done" && note?.kind !== "failed") return;
    const t = setTimeout(() => setNote(null), NOTE_MS[note.kind]);
    return () => clearTimeout(t);
  }, [note]);
  const busy = note?.kind === "busy";
  const blocked = disabled || busy;
  const status = note?.kind === "busy" ? EXPORT_BUSY_MESSAGE : note?.kind === "done" ? EXPORT_DONE_MESSAGE : "";
  // 메뉴가 열린 채 버튼이 막히면(구성도가 비거나 다시 배치 중) 메뉴를 닫는다.
  useEffect(() => {
    if (open && blocked) setOpen(false);
  }, [open, blocked, setOpen]);

  const choose = (format: ExportFormat, background: ExportBackground) => {
    setOpen(false);
    trigger.current?.focus();
    setNote({ kind: "busy" });
    onExport(format, background).then(
      () => mounted.current && setNote({ kind: "done" }),
      () => mounted.current && setNote({ kind: "failed" }),
    );
  };

  return (
    <div ref={root} className="canvas__view canvas__export">
      <button
        ref={trigger}
        type="button"
        className="canvas__tool"
        aria-haspopup="menu"
        aria-expanded={open}
        // 만드는 동안은 막되 disabled 로 바꾸지 않는다(포커스가 버튼에서 떨어지지 않게).
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        aria-describedby={disabled ? reasonId : undefined}
        onClick={() => {
          if (busy) return;
          // 메뉴를 열면 지난 완료·실패 알림을 걷는다(같은 자리에 겹치지 않게).
          if (!open) setNote(null);
          setOpen((v) => !v);
        }}
      >
        <IconExport />
        <span>{busy ? EXPORT_BUSY_MESSAGE : EXPORT_LABEL}</span>
        {!busy && <IconChevron />}
      </button>
      {disabled && (
        <span id={reasonId} className="node-menu__reason">
          {disabledReason}
        </span>
      )}
      {open && !blocked && (
        <div className="canvas__pop canvas__pop--end canvas__export-menu" role="menu" aria-label={EXPORT_LABEL} onKeyDown={moveMenuFocus}>
          {FORMATS.map((f) => (
            <div key={f.format} role="group" aria-label={`${f.title} · ${f.hint}`} className="canvas__export-group">
              <div className="canvas__export-head" aria-hidden="true">
                <span className="canvas__opt-name">{f.title}</span>
                <span className="canvas__opt-desc">{f.hint}</span>
              </div>
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.background}
                  type="button"
                  role="menuitem"
                  className="canvas__export-item"
                  aria-label={`${f.title} ${b.label}`}
                  data-export={`${f.format}-${b.background}`}
                  onClick={() => choose(f.format, b.background)}
                >
                  <span
                    className={`canvas__export-swatch canvas__export-swatch--${b.background}`}
                    // 흰 바탕 견본은 내보내기 바탕과 같은 흰색(토큰에는 흰색이 없다).
                    style={b.background === "light" ? { background: LIGHT_BACKGROUND } : undefined}
                    aria-hidden="true"
                  />
                  {b.label}
                </button>
              ))}
            </div>
          ))}
          <p className="canvas__export-foot">화면에 보이는 범위와 상관없이 구성도 전체를 담아요. 접힌 영역은 접힌 채로 나와요.</p>
        </div>
      )}
      {/* 진행·완료 알림 자리는 늘 두어 화면 읽기 프로그램이 바뀐 글을 읽게 한다. */}
      <p className={`canvas__export-note${status ? "" : " canvas__export-note--empty"}`} role="status">
        {status}
      </p>
      {note?.kind === "failed" && (
        <p className="canvas__export-note canvas__export-note--error" role="alert">
          {EXPORT_FAILED_MESSAGE}
        </p>
      )}
    </div>
  );
}
