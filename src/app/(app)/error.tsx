"use client";

import { ErrorScreen } from "@/ui/StatusScreen";

// 셸 안 화면(구성도·용어 사전 등)이 그리다 실패했을 때. 사이드바는 그대로 남는다.
export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} />;
}
