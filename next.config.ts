import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // The Snowflake driver is CommonJS with native-ish internals; bundling it
  // breaks its dynamic requires. Next leaves externals to the Node runtime.
  serverExternalPackages: ["snowflake-sdk"],
  experimental: {
    // Server actions are used for every mutation in this app.
    //
    // Two things come through an action body, and the limit has to clear the
    // larger of them:
    //
    //   the Salesforce import, which sends a CSV - Contact.csv is 7,485 rows,
    //   about 4mb of text;
    //   a file attached to a deal, capped at 15mb in lib/crm/files.
    //
    // It was 12mb, which was under the file cap: a 14mb scanned SOW would
    // have been refused by the framework before any code ran, with no message
    // that named a size. Exactly the failure the 2mb default used to cause
    // for the import. 20mb leaves room for the multipart wrapper.
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
