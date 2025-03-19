import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add fallbacks for Node.js modules if needed
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