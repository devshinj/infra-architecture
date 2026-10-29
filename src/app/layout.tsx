import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";

import "../styles/globals.css";

const plexSansKR = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "InfraSketch",
  description: "인프라 구성도 시각화 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={plexSansKR.className}>{children}</body>
    </html>
  );
}
