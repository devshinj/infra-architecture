"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import { LogoMark } from "./brand/Logo";
import { Button, buttonClassName } from "./Button";
import styles from "./app.module.css";

/**
 * 없는 화면·오류 화면. 빈 홈과 같은 빈 도면(점 격자 위 눈금 판)에 제목·설명·돌아갈 길을 둔다(DESIGN.md · Elevation & Depth).
 * page: 셸 밖(루트 레이아웃·전체 오류)이라 화면 높이를 스스로 채우고 로고 마크를 위에 둔다.
 */
export function StatusScreen({ title, children, actions, page = false }: { title: string; children: ReactNode; actions: ReactNode; page?: boolean }) {
  return (
    <div className={`${styles.emptyState} ${page ? styles.statusPage : ""} dot-grid`}>
      <section className={`${styles.emptySheet} ticks`}>
        {page && <LogoMark size={36} />}
        <h1>{title}</h1>
        {children}
        <div className={`${styles.emptyActions} ${styles.statusActions}`}>{actions}</div>
      </section>
    </div>
  );
}

export function HomeLink({ primary = false }: { primary?: boolean }) {
  return (
    <Link href="/" {...buttonClassName({ variant: primary ? "primary" : "secondary" })}>
      내 구성도로
    </Link>
  );
}

/** 찾는 것이 없을 때(없는 주소, 남의·지운 구성도). */
export function NotFoundScreen({ title, children, page = false }: { title: string; children: ReactNode; page?: boolean }) {
  return (
    <StatusScreen title={title} page={page} actions={<HomeLink primary />}>
      {children}
    </StatusScreen>
  );
}

type ErrorProps = { error: Error & { digest?: string }; reset: () => void; page?: boolean };

/**
 * 화면을 그리다 서버·브라우저에서 오류가 났을 때. 오류 내용은 보이지 않고, 서버 로그와 맞춰 볼 오류 번호(digest)만 보인다.
 * digest 는 운영 서버에서 난 오류에만 붙는다.
 */
export function ErrorScreen({ error, reset, page = false }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusScreen
      title="화면을 불러오지 못했어요"
      page={page}
      actions={
        <>
          <Button variant="primary" onClick={reset}>
            다시 시도
          </Button>
          <HomeLink />
        </>
      }
    >
      <p>잠시 뒤 다시 시도해 주세요. 계속되면 관리자에게 알려 주세요.</p>
      {error.digest && (
        <p className={styles.statusCode}>
          오류 번호 <code>{error.digest}</code>
        </p>
      )}
    </StatusScreen>
  );
}
