"use client";

import "../styles/globals.css";

import { ErrorScreen } from "@/ui/StatusScreen";

// 루트 레이아웃까지 실패했을 때. 레이아웃 대신 그려지므로 <html>·<body> 를 직접 둔다(글꼴은 기본 대체 글꼴).
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <ErrorScreen {...props} page />
      </body>
    </html>
  );
}
