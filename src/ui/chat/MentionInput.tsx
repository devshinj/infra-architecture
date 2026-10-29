"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

import styles from "./chat.module.css";

export interface Mention {
  id: string;
  label: string;
}

export interface MentionInputHandle {
  insertMention(m: Mention): void;
  focus(): void;
  /** Send what is typed now (same path as Enter). */
  submit(): void;
}

export interface MentionInputProps {
  placeholder: string;
  /** Typing stays possible; sending (Enter / submit) is blocked while false. */
  canSend: boolean;
  disabled?: boolean;
  onSend(text: string): void;
  /** True when there is something to send (text or a chip). */
  onContentChange?(hasContent: boolean): void;
}

/** `@[라벨](node:<id>)`: brackets in a label would break the token, so they are dropped. */
export const mentionToken = (m: Mention) => `@[${m.label.replace(/[[\]\r\n]+/g, " ").trim() || m.id}](node:${m.id})`;

/**
 * Textarea plus a chip strip above it. Chips are atomic: Backspace with the caret at the very start
 * removes the last chip, and each chip has its own remove button. Serialized as chips first, then the text.
 */
export const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(function MentionInput(
  { placeholder, canSend, disabled = false, onSend, onContentChange },
  ref,
) {
  const [text, setText] = useState("");
  const [chips, setChips] = useState<Mention[]>([]);
  const area = useRef<HTMLTextAreaElement>(null);
  const live = useRef({ text: "", chips: [] as Mention[] });

  const update = useCallback(
    (nextText: string, nextChips: Mention[]) => {
      live.current = { text: nextText, chips: nextChips };
      setText(nextText);
      setChips(nextChips);
      onContentChange?.(nextText.trim().length > 0 || nextChips.length > 0);
    },
    [onContentChange],
  );

  const submit = useCallback(() => {
    if (!canSend || disabled) return;
    const { text: t, chips: c } = live.current;
    const out = [...c.map(mentionToken), t.trim()].filter(Boolean).join(" ");
    if (!out) return;
    onSend(out);
    update("", []);
  }, [canSend, disabled, onSend, update]);

  useImperativeHandle(
    ref,
    () => ({
      insertMention: (m) => {
        const { text: t, chips: c } = live.current;
        if (!c.some((x) => x.id === m.id)) update(t, [...c, m]);
        area.current?.focus();
      },
      focus: () => area.current?.focus(),
      submit,
    }),
    [submit, update],
  );

  const removeChip = (id: string) => {
    update(live.current.text, live.current.chips.filter((c) => c.id !== id));
    area.current?.focus();
  };

  return (
    <div className={styles.mention}>
      {chips.length > 0 && (
        <ul className={styles.chipStrip} aria-label="참조한 노드">
          {chips.map((c) => (
            <li key={c.id} className={styles.chip}>
              <span>{c.label}</span>
              <button type="button" className={styles.chipX} aria-label={`${c.label} 참조 제거`} onClick={() => removeChip(c.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={area}
        className={styles.textarea}
        rows={3}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="메시지 입력"
        onChange={(e) => update(e.target.value, live.current.chips)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return; // Korean IME (229: Safari): Enter confirms the syllable
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Backspace" && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0 && live.current.chips.length > 0) {
            e.preventDefault();
            update(live.current.text, live.current.chips.slice(0, -1));
          }
        }}
      />
    </div>
  );
});
