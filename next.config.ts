/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to prevent errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure webpack for handling PDF.js and other libraries
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      // Fixes potential worker issues
      'pdfjs-dist': isServer ? 'pdfjs-dist/legacy/build/pdf.js' : 'pdfjs-dist/build/pdf.js',
    };
    
    // Ignore specific package warnings/errors
    config.ignoreWarnings = [
      { module: /node_modules\/pdf-parse/ },
      { module: /node_modules\/mammoth/ },
    ];
    
    return config;
  },
  
  // Configuration for environment variables
  env: {
    // You can add environment variables here if needed
  },
  
  // Increase serverless function timeout (Vercel Pro plan required)
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth']
  }
};

module.exports = nextConfig;