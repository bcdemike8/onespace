import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // The Snowflake driver is CommonJS with native-ish internals; bundling it
  // breaks its dynamic requires. Next leaves externals to the Node runtime.
  serverExternalPackages: ["snowflake-sdk"],
  experimental: {
    // Server actions are used for every mutation in this app.
    //
    // 12mb because the Salesforce import sends a CSV as the action's body,
    // and Contact.csv is 7,485 rows - about 4mb of text. At the 2mb default
    // the upload is rejected by the framework before any code runs, which
    // reads as the import silently doing nothing.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
