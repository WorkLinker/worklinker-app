import type { Metadata } from "next";
import "./globals.css";
import DynamicStyleLoader from "@/components/DynamicStyleLoader";

export const metadata: Metadata = {
  title: "NB Student Hub",
  description: "Job matching platform for New Brunswick high school students. Full-time during breaks, part-time during school, volunteer opportunities and more.",
  keywords: ["New Brunswick", "high school jobs", "part-time", "full-time", "volunteer", "resume", "Canada", "student jobs", "career", "employment"],
  authors: [{ name: "NB Student Hub Team" }],
  creator: "NB Student Hub",
  publisher: "Professional Services Team",
  robots: "index, follow",
  
  // Clear favicon settings for browser tabs
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
  
  openGraph: {
    type: "website",
    locale: "en_CA",
    title: "NB Student Hub - Professional Career Support",
    description: "Job matching platform for New Brunswick high school students",
    siteName: "NB Student Hub",
  },
  
  twitter: {
    card: "summary_large_image",
    creator: "@nbstudentjobs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dynamic-font-body">
        <DynamicStyleLoader />
        {children}
      </body>
    </html>
  );
}
