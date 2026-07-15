import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Header from "@/components/Header";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Project Relay",
  description:
    "프로젝트형 부트캠프 수강생을 위한 피드백 성장 관리 서비스, Project Relay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Header />
        <main className="max-w-5xl mx-auto px-6 sm:px-10 pb-10 pt-8">{children}</main>
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
