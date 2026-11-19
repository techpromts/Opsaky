import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@workspace/api-client-react"],
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.replit.dev", "*.pike.replit.dev", "*.replit.app", ...(process.env.REPLIT_DEV_DOMAIN ? [process.env.REPLIT_DEV_DOMAIN] : [])],
  serverExternalPackages: ["@prisma/client"],
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};
export default config;
