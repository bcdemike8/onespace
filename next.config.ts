import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // The Snowflake driver is CommonJS with native-ish internals; bundling it
  // breaks its dynamic requires. Next leaves externals to the Node runtime.
  serverExternalPackages: ["snowflake-sdk"],
  experimental: {
    // Server actions are used for every mutation in this app.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
