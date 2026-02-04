import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static generation for pages that require auth
  experimental: {
    // This will help with dynamic pages
  },
  turbopack: {},
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
