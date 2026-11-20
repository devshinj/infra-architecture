"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

import { startGuideAction } from "@/app/(app)/actions";
import { ENV_LABEL } from "@/domain/guides/types";
import type { GuideSummary } from "@/domain/guides/view";

import { Button } from "../Button";
import { GENERIC_ERROR } from "../dialogs";
import { useShell } from "../Shell";
import styles from "./guide.module.css";

export const LEARN_TITLE = "학습 모드";
export const LEARN_DISCLAIMER = "실제 회사의 구성이 아니라, 이런 서비스를 만들 때 흔히 쓰는 구성입니다.";
export const LEARN_EXAMPLE_NOTE = "값은 예시입니다.";

/** 진행 중·끝낸 학습 한 줄. progress 는 "3 / 12", "환경 고르기 전", "완료" 같은 짧은 글. */
export interface GuideRunRow {
  diagramId: string;
  href: string;
  name: string;
  status: "active" | "done";
  progress: string;
}

/** 주제 고르기(/learn): 위 문구 두 줄, 주제 카드, 진행 중·끝낸 학습 목록. */
export function GuidePicker({ guides, runs }: { guides: GuideSummary[]; runs: GuideRunRow[] }) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; text: string } | null>(null);
  // 새 구성도로 옮겨 가는 동안 본문을 작업 화면 뼈대로 덮는다(사이드바에서 구성도를 고를 때와 같다).
  const [navPending, startNav] = useTransition();
  const { setNavigating } = useShell();
  useEffect(() => setNavigating(navPending), [navPending, setNavigating]);

  const start = async (id: string) => {
    if (starting) return;
    setStarting(id);
    setError(null);
    try {
      const r = await startGuideAction(id, null);
      if (!r.ok) {
        setError({ id, text: r.error });
        setStarting(null);
        return;
      }
      startNav(() => router.push(`/p/${r.projectId}/d/${r.diagramId}`));
    } catch {
      setError({ id, text: GENERIC_ERROR });
      setStarting(null);
    }
  };

  const going = runs.filter((r) => r.status === "active");
  const done = runs.filter((r) => r.status === "done");

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{LEARN_TITLE}</h1>
      <div className={styles.lead}>
        <p>{LEARN_DISCLAIMER}</p>
        <p>{LEARN_EXAMPLE_NOTE}</p>
      </div>
      <ul className={styles.topics}>
        {guides.map((g) => (
          <li key={g.id}>
            <Topic guide={g} starting={starting} error={error?.id === g.id ? error.text : null} onStart={() => void start(g.id)} />
          </li>
        ))}
      </ul>
      {going.length > 0 && <RunList title="진행 중" runs={going} />}
      {done.length > 0 && <RunList title="끝낸 학습" runs={done} />}
    </div>
  );
}

function Topic({ guide: g, starting, error, onStart }: { guide: GuideSummary; starting: string | null; error: string | null; onStart(): void }) {
  const id = useId();
  const titleId = `${id}-title`;
  return (
    <article className={styles.topic} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.topicTitle}>
        {g.title}
      </h2>
      <p className={styles.intro}>{g.intro}</p>
      <div>
        <p className={styles.label} id={`${id}-learns`}>
          배우는 것
        </p>
        <ul className={styles.learns} aria-labelledby={`${id}-learns`}>
          {g.learns.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
      <ul className={styles.envList} aria-label="준비된 환경">
        {g.envs.map((e) => (
          <li key={e.env} className={styles.envBadge}>
            {`${ENV_LABEL[e.env]} · ${e.steps}단계`}
          </li>
        ))}
      </ul>
      <div className={styles.topicFoot}>
        {/* 칠한 연두 버튼은 화면에 하나뿐이라 주제가 여럿이어도 같은 모양의 보조 버튼을 쓴다. */}
        <Button disabled={starting !== null} aria-describedby={titleId} onClick={onStart}>
          {starting === g.id ? "만드는 중…" : "시작"}
        </Button>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

function RunList({ title, runs }: { title: string; runs: GuideRunRow[] }) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      <ul className={styles.runs}>
        {runs.map((r) => (
          <li key={r.diagramId}>
            <Link href={r.href} className={styles.run}>
              <span className={styles.runName} title={r.name}>
                {r.name}
              </span>
              <span className={styles.runProgress}>{r.progress}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
