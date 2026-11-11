"use client";

import { useLinkStatus } from "next/link";

import styles from "./app.module.css";

/**
 * <Link> 안에 두면, 누른 뒤 새 화면이 올 때까지 링크 밑에 점선 한 줄이 그려진다(스켈레톤과 같은 말씨).
 * 빠른 이동에서는 깜박이지 않게 CSS 가 조금 늦게 보인다. 알림은 목적지의 불러오는 화면(role=status)이 맡는다.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={styles.linkPending} data-pending={pending || undefined} />;
}
