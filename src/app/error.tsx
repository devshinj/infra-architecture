"use client";

import { ErrorScreen } from "@/ui/StatusScreen";

// 셸 밖에서 난 오류(로그인 화면, 셸 레이아웃 자체 — 예: DB 가 끊겨 프로젝트 목록을 못 읽음).
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} page />;
}
