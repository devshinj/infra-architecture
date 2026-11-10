"use client";

import Image from "next/image";
import { useId, useState, type CSSProperties } from "react";

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
  defaultValue?: string;
};

/**
 * 라벨·입력칸·안내·오류를 묶는다. 안내와 오류는 라벨 밖에 두고 aria-describedby 로 잇는다
 * (라벨 안에 두면 오류 문구가 입력칸 이름에 섞인다).
 * 비밀번호 칸은 "보기" 버튼으로 입력한 글자를 확인할 수 있다. 버튼 이름에 라벨 글자를 넣지 않는다
 * — getByLabel("비밀번호") 가 입력칸 하나만 찾도록.
 */
export function AuthField({ label, name, type = "text", autoComplete, hint, error, autoFocus, defaultValue }: Props) {
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
          defaultValue={defaultValue}
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
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={`${styles.button} ${styles.primary}`}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * 로그인·가입·비밀번호 화면 옆에 두는 실제 구성도 한 장(사내 IDC WEB-WAS-DB 이중화 샘플을 앱에서 그대로 찍은 것).
 * 모서리 눈금 테두리 안에 두고, 그림 속 두 곳을 지시선으로 짚는다. 좁은 화면에서는 숨긴다(양식 아래로 밀지 않는다).
 */
export function AuthShowcase() {
  return (
    <figure className={styles.showcase}>
      <div className={styles.shot}>
        <Image
          src="/brand/sample-diagram.png"
          width={SAMPLE.width}
          height={SAMPLE.height}
          alt="사내 IDC 에 WEB·WAS·DB 를 이중화한 구성도 예시"
          className={styles.shotImg}
          priority
        />
        {SAMPLE.callouts.map((c) => (
          <span key={c.label} className={styles.callout} data-dir={c.dir} style={{ "--x": c.x, "--y": c.y } as CSSProperties} aria-hidden="true">
            <span className={styles.calloutLabel}>{c.label}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}

/** public/brand/sample-diagram.png 의 크기와 지시선이 짚는 자리(그림 안 백분율). 그림을 다시 찍으면 같이 고친다. */
const SAMPLE = {
  width: 581,
  height: 1309,
  callouts: [
    // 외부 방화벽 노드의 왼쪽 가장자리에서 왼쪽(DMZ 안 빈자리)으로.
    { label: "외부 방화벽", x: 55.1, y: 22.8, dir: "left" },
    // DB Primary → Standby 복제선(겹선) 가운데에서 위로.
    { label: "DB 이중화", x: 50.6, y: 91.5, dir: "up" },
  ],
} as const;
