import type { Metadata } from "next";
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
