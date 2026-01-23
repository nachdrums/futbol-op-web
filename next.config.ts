import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static generation for pages that require auth
  experimental: {
    // This will help with dynamic pages
  },
};

export default nextConfig;
