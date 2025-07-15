import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포를 위해 trailingSlash 설정 변경
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  // Vercel은 Next.js를 완벽하게 지원하므로 SSR 활용
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // 정적 파일 최적화
  compress: true,
  // 빌드 최적화
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;
