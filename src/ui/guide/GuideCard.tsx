"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { stepCount } from "@/domain/guides/progress";
import { ENV_LABEL } from "@/domain/guides/types";
import type { GuideView } from "@/domain/guides/view";

import { Button } from "../Button";
import { type Dialog, DialogView } from "../dialogs";
import styles from "./guide.module.css";

export const QUIT_LABEL = "학습 그만두기";
export const QUIT_MESSAGE =
  "학습을 그만둘까요? 지금 구성도는 일반 구성도로 남아 자유롭게 고칠 수 있고, 이 학습은 이어서 할 수 없어요.";
export const INSERT_LABEL = "입력창에 넣기";

export interface GuideCardProps {
  /** 학습 중(status active)인 진행 상태. */
  view: GuideView;
  /** 대화를 보낼 수 없을 때(차례가 도는 중 등): 입력창에 넣기·환경 칩을 막는다. */
  disabled?: boolean;
  /** 차례가 도는 중: 그만두기를 막는다(서버 잠금이 거절한다). */
  quitDisabled?: boolean;
  /** 예시 문장을 입력창에 넣는다(보내지 않는다). */
  onInsert(text: string): void;
  /** 환경 칩: 그 환경 이름을 바로 보낸다. */
  onSendEnv(text: string): void;
  /** 학습을 그만둔다. 실패하면 대화상자에 보일 오류 글. */
  onQuit(): Promise<string | void>;
  /** 그만둔 뒤 카드가 사라져 그만두기 버튼으로 돌아갈 수 없을 때 포커스를 둘 곳(대화 입력칸). */
  fallbackFocus?(): void;
}

/**
 * 대화 탭 맨 위의 학습 단계 카드: 제목·환경, `n / N`, 이번 단계, 예시 문장과 [입력창에 넣기], [학습 그만두기].
 * 환경을 고르기 전이면 이번 단계 대신 환경 칩을 보인다.
 */
export function GuideCard({
  view,
  disabled = false,
  quitDisabled = false,
  onInsert,
  onSendEnv,
  onQuit,
  fallbackFocus,
}: GuideCardProps) {
  const count = stepCount(view);
  const title = `학습 · ${view.title}${view.env ? ` (${ENV_LABEL[view.env]})` : ""}`;
  const quitBtn = useRef<HTMLButtonElement>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);

  // 다음 단계로 넘어가면(되돌리기 포함) 보조기기에 새 단계를 알린다. 처음 열 때는 알리지 않는다.
  const [announce, setAnnounce] = useState("");
  const shown = useRef(`${view.env}:${view.step}`);
  const goal = view.current?.goal;
  useEffect(() => {
    const key = `${view.env}:${view.step}`;
    if (key === shown.current) return;
    shown.current = key;
    setAnnounce(
      goal && count
        ? `${count.n}단계: ${goal}`
        : view.env === null
          ? "환경을 골라 주세요"
          : "",
    );
    // count 는 env·step 에서 나온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.env, view.step, goal]);

  const closeDialog = () => {
    setDialog(null);
    // 대화상자가 사라진 뒤에 옮긴다. 그만둬서 카드가 사라졌으면 입력칸으로.
    setTimeout(() => {
      if (quitBtn.current?.isConnected) quitBtn.current.focus();
      else fallbackFocus?.();
    }, 0);
  };
  const askQuit = () =>
    setDialog({
      kind: "delete",
      title: QUIT_LABEL,
      message: QUIT_MESSAGE,
      submit: "그만두기",
      pendingLabel: "그만두는 중…",
      run: onQuit,
    });

  return (
    <section className={styles.card} aria-label="학습 단계">
      {/* 머리띠: "지금 할 일" 판이라 연두를 옅게 칠한다(DESIGN.md · One Signal Rule 보충). 진행 점은 꾸밈이고, 진행은 아래 「이번 단계 · n / N」로 읽힌다. */}
      <div className={styles.band} data-band>
        <p className={styles.bandTitle}>{title}</p>
        {count && (
          <span className={styles.dots} data-progress aria-hidden="true">
            {Array.from({ length: view.total }, (_, i) => (
              <span
                key={i}
                className={styles.dot}
                data-state={
                  i < view.step ? "done" : i === view.step ? "now" : "todo"
                }
              />
            ))}
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        {view.env === null ? (
          <div>
            <p className={styles.label}>어느 환경으로 만들지 골라 주세요</p>
            <ul className={styles.envs} aria-label="환경">
              {view.envChoices.map((e) => (
                <li key={e}>
                  <button
                    type="button"
                    className={styles.chip}
                    disabled={disabled}
                    onClick={() => onSendEnv(ENV_LABEL[e])}
                  >
                    {ENV_LABEL[e]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          view.current && (
            <dl className={styles.rows}>
              <div>
                <dt>
                  이번 단계
                  {count && (
                    <span className={styles.count}>
                      {" "}
                      · {count.n} / {count.total}
                    </span>
                  )}
                </dt>
                <dd className={styles.goal}>{view.current.goal}</dd>
              </div>
              <div>
                <dt>이렇게 말해 보세요</dt>
                <dd className={styles.example}>
                  <q className={styles.exampleText}>{view.current.example}</q>
                  <Button
                    size="sm"
                    disabled={disabled}
                    onClick={() => onInsert(view.current!.example)}
                  >
                    {INSERT_LABEL}
                  </Button>
                </dd>
              </div>
            </dl>
          )
        )}
        <div className={styles.cardFoot}>
          <Button
            ref={quitBtn}
            size="sm"
            variant="quiet"
            disabled={quitDisabled}
            onClick={askQuit}
          >
            {QUIT_LABEL}
          </Button>
        </div>
      </div>
      <p className={styles.srOnly} role="status">
        {announce}
      </p>
      {dialog &&
        typeof document !== "undefined" &&
        createPortal(
          <DialogView dialog={dialog} onClose={closeDialog} />,
          document.body,
        )}
    </section>
  );
}
