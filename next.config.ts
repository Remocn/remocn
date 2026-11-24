import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import {
  agentBeforeFilesRewrites,
  agentFallbackRewrites,
  agentHeaders,
} from "./lib/agent-routing";

const withMDX = createMDX();

/**
 * The version of the production preview bundle, which `bun run build` writes
 * (scripts/previews/build.mts) before it runs `next build`. Constant in dev:
 * there the page reads the manifest itself, and a value that changed on each
 * start would only invalidate Turbopack's cache.
 */
function previewsVersion(): string {
  if (process.env.NODE_ENV === "development") return "";
  try {
    const manifest = readFileSync(
      join(__dirname, "public/_previews/prod/manifest.json"),
      "utf8",
    );
    return JSON.parse(manifest).version;
  } catch {
    // lib/previews/index.ts reports the missing bundle where it is needed.
    return "";
  }
}

/**
 * Every script and font of the preview bundle is named by the hash of its
 * content, so none of them changes under its URL. The manifest, the preload
 * map and the source maps are not, and keep the default headers.
 */
function previewsHeaders() {
  const headers = [
    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  ];
  return [
    "/_previews/:mode(dev|prod)/chunks/:file([^/]+\\.js)",
    "/_previews/:mode(dev|prod)/assets/:file*",
    "/_previews/:mode(dev|prod)/:entry(entries-[0-9a-f]+\\.js)",
  ].map((source) => ({ source, headers }));
}

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
  // takumi's OG renderer is a native binding: keep it out of the server bundle.
  serverExternalPackages: ["@takumi-rs/core"],
  // The /mcp route reads the remocn skill's archetype recipes from disk at
  // runtime (lib/mcp/archetype-files.ts). Docker copies the whole tree, but
  // trace them explicitly so standalone/traced output keeps them too.
  outputFileTracingIncludes: {
    "/mcp": ["./plugins/remocn/skills/remocn/references/**/*.md"],
  },
  // The preview bundle in public/_previews that lib/previews/index.ts loads
  // by URL: the version names its entry file, and the server refuses a bundle
  // other than the one the site was built against.
  env: {
    REMOCN_PREVIEWS_VERSION: previewsVersion(),
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    // Agents get Markdown at the same URLs; see lib/agent-routing.ts.
    return {
      beforeFiles: agentBeforeFilesRewrites(),
      afterFiles: [],
      fallback: agentFallbackRewrites(),
    };
  },
  async headers() {
    return [...agentHeaders(), ...previewsHeaders()];
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
      // `/docs` has no page: proxy.ts sends people to the introduction and
      // gives agents the llms.txt index, after reading their Accept header.
      // Conventional trust-page URLs land on the matching part of /legal.
      { source: "/privacy", destination: "/legal#privacy", permanent: true },
      { source: "/terms", destination: "/legal#terms", permanent: true },
      // Short, question-shaped URL for the text animations answer page.
      {
        source: "/remotion-text-animations",
        destination: "/docs/guides/remotion-text-animations",
        permanent: true,
      },
      // Short, question-shaped URL for the Remotion MCP servers answer page.
      {
        source: "/remotion-mcp-server",
        destination: "/docs/guides/remotion-mcp-servers",
        permanent: true,
      },
      // Short URL for the Claude Code plugin page, as it is shared.
      {
        source: "/plugin",
        destination: "/docs/getting-started/plugin",
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
