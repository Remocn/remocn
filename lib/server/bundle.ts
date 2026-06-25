import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";

/**
 * Resolves the Remotion `serveUrl` that `selectComposition`/`renderMedia` need.
 *
 * Bundling is expensive, so it happens at most once per process: if the deploy
 * baked a pre-bundle into `.remotion-bundle/` (see scripts/bundle-remotion.mts),
 * that path is returned directly; otherwise we lazily `bundle()` the entry once
 * and cache the in-flight promise so concurrent first renders share it.
 */

const PREBUNDLED_DIR = path.join(process.cwd(), ".remotion-bundle");
const ENTRY_POINT = path.join(process.cwd(), "src", "remotion", "index.ts");

let serveUrlPromise: Promise<string> | null = null;

export function getServeUrl(): Promise<string> {
  if (serveUrlPromise) return serveUrlPromise;

  serveUrlPromise = (async () => {
    if (existsSync(PREBUNDLED_DIR)) {
      return PREBUNDLED_DIR;
    }
    try {
      return await bundle({
        entryPoint: ENTRY_POINT,
        // Webpack doesn't read tsconfig `paths`; teach it the `@/* → root` alias
        // (must match scripts/bundle-remotion.mts) so `@/registry/...` resolves.
        webpackOverride: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...(config.resolve?.alias ?? {}),
              "@": process.cwd(),
            },
          },
        }),
      });
    } catch (err) {
      // Don't poison the cache on failure — let the next render retry the bundle.
      serveUrlPromise = null;
      throw err;
    }
  })();

  return serveUrlPromise;
}
