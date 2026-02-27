import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output for Railway: smaller image, faster cold starts
  output: "standalone",
};

export default nextConfig;
