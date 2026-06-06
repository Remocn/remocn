import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";

/**
 * Pre-bundle the Remotion entry into `.remotion-bundle/` so the server has a
 * ready serveUrl at boot (no slow bundle-on-first-render). Baked into the Docker
 * image during build (see Dockerfile) — `lib/server/bundle.ts` returns this dir
 * when present, otherwise it lazily bundles at runtime.
 *
 * Run: `bun run bundle:remotion`
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

async function main() {
  const entryPoint = path.join(root, "src", "remotion", "index.ts");
  const outDir = path.join(root, ".remotion-bundle");

  console.log(`Bundling Remotion entry: ${entryPoint}`);
  const serveUrl = await bundle({
    entryPoint,
    outDir,
    // Keep Remotion's defaults; the registry component is plain React + CSS.
    webpackOverride: (config) => config,
  });
  console.log(`Remotion bundle ready at: ${serveUrl}`);
}

main().catch((err) => {
  console.error("Remotion bundle failed:", err);
  process.exit(1);
});
