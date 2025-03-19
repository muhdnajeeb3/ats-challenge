import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Increase body parser size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  reactStrictMode: true,
  fs:false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude pdf-parse from client-side bundles
      config.resolve.fallback = {
        fs: false,
        http: false,
        https: false,
        url: false,
      };
    }
    return config;
  },
};

export default nextConfig;


