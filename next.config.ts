import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/zenlogo.jpg",
        permanent: true,
      },
    ];
  },
  transpilePackages: [
    "@wallet-standard/app",
    "@wallet-standard/base",
    "@wallet-standard/features",
    "@solana/wallet-standard-features",
  ],
};

export default nextConfig;