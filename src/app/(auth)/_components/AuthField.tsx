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
 * 로그인·가입·비밀번호 화면 옆에 두는 실제 구성도 한 장(사내 IDC WEB-WAS-DB 이중화 샘플의 한 띠를 앱에서 그대로 찍은 것).
 * 모서리 눈금 테두리 안에 두고, 그림 속 두 곳을 지시선으로 짚는다. 좁은 화면에서는 숨긴다(양식 아래로 밀지 않는다).
 */
export function AuthShowcase() {
  return (
    <figure className={styles.showcase}>
      <div className={styles.shot} style={{ "--ratio": SAMPLE.width / SAMPLE.height } as CSSProperties}>
        <Image
          src="/brand/sample-diagram.png"
          width={SAMPLE.width}
          height={SAMPLE.height}
          alt="사내 IDC 구성도 예시의 DMZ 와 WEB·WAS 이중화 부분"
          className={styles.shotImg}
          priority
        />
        {SAMPLE.callouts.map((c) => (
          <span key={c.label} className={styles.callout} style={{ "--x": c.x, "--y": c.y, "--len": c.len } as CSSProperties} aria-hidden="true">
            <span className={styles.calloutLabel}>{c.label}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}

/**
 * public/brand/sample-diagram.png: 샘플의 DMZ → WEB VIP → WAS VIP 띠를 2배 밀도로 찍은 것(1332×1420 픽셀, 화면 크기 666×710).
 * 지시선은 그림에 적혀 있지 않은 것을 짚는다. x·y 는 점(영역 왼쪽 테두리 가운데), len 은 이름+선 길이(그림 너비 %).
 * 그림을 다시 찍으면 .hallmark/sample.json 값으로 같이 고친다.
 */
const SAMPLE = {
  width: 666,
  height: 710,
  callouts: [
    { label: "망 경계: DMZ", x: 28.02, y: 27.48, len: 26.22 },
    { label: "이중화 2대", x: 30.39, y: 84.6, len: 28.59 },
  ],
} as const;
