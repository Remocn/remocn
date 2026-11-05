import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

// Next anchors `value` as `^value$`. Browsers never put text/markdown in
// Accept; Claude Code's WebFetch sends `text/markdown, text/html, */*`.
const AGENT_SIGNALS = [
  { type: "header", key: "accept", value: ".*text/markdown.*" },
  {
    type: "header",
    key: "user-agent",
    value: ".*(Claude-User|ChatGPT-User|Perplexity-User|MistralAI-User).*",
  },
] as const;

const DOCS_FOLDER_REDIRECTS: Record<string, string> = {
  "/docs/getting-started": "/docs/getting-started/introduction",
  "/docs/icons": "/docs/icons/gallery",
  "/docs/ui/components": "/docs/ui",
  ...Object.fromEntries(
    ["shaders", "filters", "captions"].flatMap((tier) => {
      const intro = `/docs/${tier}/getting-started/introduction`;
      return [
        [`/docs/${tier}`, intro],
        [`/docs/${tier}/getting-started`, intro],
        [`/docs/${tier}/components`, intro],
      ];
    }),
  ),
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // `motion` ships a barrel (motion/react re-exports the whole runtime). Next's
  // default optimizePackageImports list covers lucide-react/date-fns but not
  // motion, so name it explicitly to rewrite the 15 `from "motion/react"` sites
  // into direct imports and keep unused motion features out of the bundle.
  experimental: {
    optimizePackageImports: ["motion"],
  },
  // Remotion's server packages are Node-only and ship native binaries (esbuild +
  // the platform-specific @remotion/compositor-*). They must NOT be bundled by
  // Turbopack/webpack — keep them external so they're require()'d at runtime in
  // the /api/render route. Without this the build fails resolving the compositor
  // binaries + reading the esbuild binary as source.
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "esbuild",
    "@takumi-rs/core",
  ],
  // The /mcp route reads the remocn skill's archetype recipes from disk at
  // runtime (lib/mcp/archetype-files.ts). Docker copies the whole tree, but
  // trace them explicitly so standalone/traced output keeps them too.
  outputFileTracingIncludes: {
    "/mcp": ["./plugins/remocn/skills/remocn/references/**/*.md"],
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Explicit Markdown URL: `/docs/<slug>.md` -> app/llms.md route.
        // `/docs` itself has no page; its Markdown is the llms.txt index.
        { source: "/docs.md", destination: "/llms.txt" },
        { source: "/docs/:path*.md", destination: "/llms.md/:path*" },
        // Same URL, Markdown for agents: a docs page or the home page answers
        // with Markdown when the client asks for it or is a fetcher reading a
        // page for a user. Crawlers that build a search index (Googlebot,
        // OAI-SearchBot, Claude-SearchBot) and agentic browsers (Atlas,
        // Claude-Agent, Google-Agent) still get HTML: the first would see
        // cloaking, the second needs the real UI to click through.
        ...AGENT_SIGNALS.flatMap((signal) => [
          // Before `/docs/:path*`, which matches the bare `/docs` too.
          { source: "/docs", has: [signal], destination: "/llms.txt" },
          {
            source: "/docs/:path*",
            has: [signal],
            destination: "/llms.md/:path*",
          },
          { source: "/", has: [signal], destination: "/llms.txt" },
        ]),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    // The response at these URLs depends on Accept and User-Agent, so a cache
    // must not hand the Markdown variant to a browser or the other way round.
    return ["/", "/docs/:path*"].map((source) => ({
      source,
      headers: [{ key: "Vary", value: "Accept, User-Agent" }],
    }));
  },
  async redirects() {
    // Collapse the www host into the canonical apex so Google indexes a single
    // origin. Traefik routes both hosts to this app; 308 preserves the path.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.remocn.dev" }],
        destination: "https://remocn.dev/:path*",
        permanent: true,
      },
      // `/docs` has no page; people land on the introduction. Agents get the
      // llms.txt index there instead (see rewrites), so they skip this one.
      {
        source: "/docs",
        missing: [...AGENT_SIGNALS],
        destination: "/docs/getting-started/introduction",
        permanent: true,
      },
      // Docs folders without an index.mdx would 404; send them to their
      // first page.
      ...Object.entries(DOCS_FOLDER_REDIRECTS).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
};

export default withMDX(nextConfig);
