import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output for Railway: smaller image, faster cold starts
  output: "standalone",
};

export default withNextIntl(nextConfig);
