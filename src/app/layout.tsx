import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "캐나다 학생 플랫폼",
  description: "뉴브런즈윅 주 고등학생들을 위한 일자리 매칭 플랫폼입니다. 방학 중 풀타임, 학기 중 파트타임, 봉사활동 등 다양한 기회를 제공합니다.",
  keywords: ["뉴브런즈윅", "고등학생", "일자리", "파트타임", "풀타임", "봉사활동", "레쥬메", "New Brunswick", "high school jobs", "캐나다", "Canada", "진로", "취업"],
  authors: [{ name: "캐나다 학생 플랫폼 팀" }],
  creator: "캐나다 학생 플랫폼",
  publisher: "전문 서비스 팀",
  robots: "index, follow",
  
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "캐나다 학생 일자리 플랫폼 - 전문 진로 지원",
    description: "뉴브런즈윅 주 고등학생들을 위한 일자리 매칭 플랫폼",
    siteName: "캐나다 학생 일자리 플랫폼",
  },
  
  twitter: {
    card: "summary_large_image",
    creator: "@canadastudentjobs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
