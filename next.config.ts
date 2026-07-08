import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remotion's server packages are Node-only and ship native binaries (esbuild +
  // the platform-specific @remotion/compositor-*). They must NOT be bundled by
  // Turbopack/webpack — keep them external so they're require()'d at runtime in
  // the /api/render route. Without this the build fails resolving the compositor
  // binaries + reading the esbuild binary as source.
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "esbuild",
  ],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    // Serve raw Markdown for AI agents: `/docs/<slug>.md` -> app/llms.md route.
    return [{ source: "/docs/:path*.md", destination: "/llms.md/:path*" }];
  },
};

export default withMDX(nextConfig);
