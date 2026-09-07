import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Server actions are used for every mutation in this app.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
