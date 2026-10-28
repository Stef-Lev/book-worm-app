import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.77", "localhost:3000", "192.168.1.238"],
  cacheComponents: true,
  partialPrefetching: true,
};

export default withNextIntl(nextConfig);
