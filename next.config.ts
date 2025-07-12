import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Netlify 배포를 위한 static export 활성화
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
