"use client";

import { useId, useState } from "react";

import styles from "../auth.module.css";

type Props = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  /** 입력 전에 늘 보여 주는 규칙 안내 */
  hint?: string;
  error?: string;
  autoFocus?: boolean;
};

/**
 * 라벨·입력칸·안내·오류를 묶는다. 안내와 오류는 라벨 밖에 두고 aria-describedby 로 잇는다
 * (라벨 안에 두면 오류 문구가 입력칸 이름에 섞인다).
 * 비밀번호 칸은 "보기" 버튼으로 입력한 글자를 확인할 수 있다. 버튼 이름에 라벨 글자를 넣지 않는다
 * — getByLabel("비밀번호") 가 입력칸 하나만 찾도록.
 */
export function AuthField({ label, name, type = "text", autoComplete, hint, error, autoFocus }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputRow}>
        <input
          id={id}
          name={name}
          type={isPassword && shown ? "text" : type}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          // 단일 목적 화면이라 첫 칸에 바로 입력할 수 있게 한다.
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={isPassword ? `${styles.input} ${styles.inputWithReveal}` : styles.input}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.reveal}
            aria-controls={id}
            onClick={() => setShown((v) => !v)}
          >
            {shown ? "숨기기" : "보기"}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function AuthSubmit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={styles.button}>
      {pending ? pendingLabel : label}
    </button>
  );
}
