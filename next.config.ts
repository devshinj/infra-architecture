import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // E2E builds into its own folder so a running `next dev` keeps its .next intact.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
