import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "High School Students Jobs",
  description: "Job matching platform for New Brunswick high school students. Full-time during breaks, part-time during school, volunteer opportunities and more.",
  keywords: ["New Brunswick", "high school jobs", "part-time", "full-time", "volunteer", "resume", "Canada", "student jobs", "career", "employment"],
  authors: [{ name: "High School Students Jobs Team" }],
  creator: "High School Students Jobs",
  publisher: "Professional Services Team",
  robots: "index, follow",
  
  // Updated favicon settings from favicon generator
  icons: {
    icon: [
      { url: '/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/android-icon-192x192.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/favicon-96x96.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    ]
  },
  manifest: '/site.webmanifest',
  
  openGraph: {
    type: "website",
    locale: "en_CA",
    title: "High School Students Jobs - Professional Career Support",
    description: "Job matching platform for New Brunswick high school students",
    siteName: "High School Students Jobs",
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
      <head>
        {/* Additional favicon meta tags for better browser compatibility */}
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-gray-50 dynamic-font-body">
        {children}
      </body>
    </html>
  );
}
