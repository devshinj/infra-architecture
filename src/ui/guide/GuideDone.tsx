"use client";

import { useState } from "react";

import { ENV_LABEL, type GuideEnv } from "@/domain/guides/types";
import { euro, iGa } from "@/domain/josa";

import { Button } from "../Button";
import { GENERIC_ERROR } from "../dialogs";
import styles from "./guide.module.css";

export const GUIDE_FREE_LINE = "이제 자유롭게 고쳐 보세요.";

/** "클라우드라면", "다른 환경이라면": 받침에 맞춘다. */
const ramyeon = (w: string) => (iGa(w).endsWith("이") ? `${w}이라면` : `${w}라면`);

export const rebuildLabel = (env: GuideEnv) => `${euro(ENV_LABEL[env])} 다시 만들기`;

export interface GuideDoneProps {
  /** 이 구성도의 환경(표의 왼쪽 열 이름). 모르면 null. */
  env: GuideEnv | null;
  outro?: string;
  otherEnv?: readonly { from: string; to: string }[];
  /** 다시 만들 수 있는 다른 환경. */
  rebuild?: readonly GuideEnv[];
  /** 그 환경으로 새 구성도를 만들고 연다. 실패하면 오류 글. 없으면 버튼을 그리지 않는다. */
  onRebuild?(env: GuideEnv): Promise<string | void>;
}

/** 학습 완료 판: 만든 것 요약, 다른 환경이라면 무엇이 무엇으로 바뀌는지 표, 다른 환경으로 다시 만들기. */
export function GuideDone({ env, outro, otherEnv = [], rebuild = [], onRebuild }: GuideDoneProps) {
  const [pending, setPending] = useState<GuideEnv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fromLabel = env ? ENV_LABEL[env] : "지금";
  const toLabel = rebuild.length === 1 ? ENV_LABEL[rebuild[0]!] : "다른 환경";
  const go = async (e: GuideEnv) => {
    if (pending || !onRebuild) return;
    setPending(e);
    setError(null);
    try {
      const err = await onRebuild(e);
      // 성공하면 새 구성도로 옮겨 가는 동안 버튼을 막아 둔다(두 번 만들지 않게).
      if (err) {
        setError(err);
        setPending(null);
      }
    } catch {
      setError(GENERIC_ERROR);
      setPending(null);
    }
  };
  return (
    <div className={styles.done}>
      {outro && <p className={styles.outro}>{outro}</p>}
      {otherEnv.length > 0 && (
        <table className={styles.table}>
          <caption>{`${ramyeon(toLabel)} 이렇게 바뀌어요`}</caption>
          <thead>
            <tr>
              <th scope="col">{fromLabel}</th>
              <th scope="col">{toLabel}</th>
            </tr>
          </thead>
          <tbody>
            {otherEnv.map((r, i) => (
              <tr key={i}>
                <td>{r.from}</td>
                <td>{r.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className={styles.free}>{GUIDE_FREE_LINE}</p>
      {onRebuild && rebuild.length > 0 && (
        <div className={styles.rebuild}>
          {rebuild.map((e) => (
            <Button key={e} size="sm" disabled={pending !== null} aria-busy={pending === e || undefined} onClick={() => void go(e)}>
              {pending === e ? "만드는 중…" : rebuildLabel(e)}
            </Button>
          ))}
        </div>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
