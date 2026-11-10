import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "../styles/globals.css";

const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  weight: "100 900",
  display: "swap",
  // 글꼴은 토큰(--font-body)으로 쓴다: <html> 에 이 변수를 두고(:root 의 --font-body 가 읽는다) globals.css 가 font-family 를 준다.
  variable: "--font-suit",
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
    <html lang="ko" className={suit.variable}>
      <body>{children}</body>
    </html>
  );
}
