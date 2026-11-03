import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "../styles/globals.css";

const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InfraSketch",
  description: "인프라 구성도 시각화 도구",
};

/** viewport-fit=cover: 휴대폰 홈 표시줄·노치 안쪽 여백을 env(safe-area-inset-*) 로 받는다(좁은 화면 위·아래 막대). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={suit.className}>{children}</body>
    </html>
  );
}
