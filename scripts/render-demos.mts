import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  ensureBrowser,
  getCompositions,
  renderMedia,
} from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

/**
 * Render every docs example to an mp4 under `out/demos/`.
 *
 * Bundles `src/remotion/demos-entry.ts` once (which auto-declares one
 * composition per `examples` entry), then renders each sequentially — Remotion
 * already parallelises frames across Chromium tabs within a single render, so
 * running renders concurrently would only contend for CPU.
 *
 * Run:
 *   bun run render:demos                 # all examples, one cycle each
 *   bun run render:demos --only button-example
 *   bun run render:demos --loops 3       # repeat each cycle 3×
 *
 * Concurrency (tabs per render) is env-tunable: REMOTION_CONCURRENCY (default 4).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function getFlag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : undefined;
}

function remotionConcurrency(): number {
  const parsed = Number(process.env.REMOTION_CONCURRENCY);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 4;
}

async function main() {
  const only = getFlag("only");
  const loops = Math.max(1, Math.floor(Number(getFlag("loops") ?? "1")) || 1);

  const entryPoint = path.join(root, "src", "remotion", "demos-entry.ts");
  const outDir = path.join(root, "out", "demos");
  mkdirSync(outDir, { recursive: true });

  await ensureBrowser();

  // Webpack doesn't read tsconfig `paths`. The examples reach into the registry
  // via specific mappings (e.g. `@/lib/remocn-ui`, `@/components/remocn/use-*`),
  // not just the `@/*` catch-all, so translate the whole `paths` map to aliases.
  const tsAliases = tsconfigWebpackAlias(root);

  console.log("Bundling demos entry…");
  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => {
      // Remotion's default alias is an object; fold it into the ordered array
      // form (first match wins) so our specific entries keep their precedence.
      const existing = Object.entries(config.resolve?.alias ?? {}).map(
        ([name, alias]) => ({
          name: name.replace(/\$$/, ""),
          alias: alias as string,
          onlyModule: name.endsWith("$"),
        }),
      );
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: [...existing, ...tsAliases],
        },
      };
    },
  });
  console.log("Bundle ready.");

  const inputProps = { loops };
  let comps = await getCompositions(serveUrl, { inputProps });
  if (only) comps = comps.filter((c) => c.id === only);

  if (comps.length === 0) {
    console.error(
      only
        ? `No composition matched --only ${only}`
        : "No compositions found in the demos bundle",
    );
    process.exit(1);
  }

  const concurrency = remotionConcurrency();
  console.log(
    `Rendering ${comps.length} demo(s) → ${path.relative(root, outDir)} ` +
      `(loops=${loops}, concurrency=${concurrency})`,
  );

  let i = 0;
  for (const composition of comps) {
    i += 1;
    const name = composition.id.replace(/-example$/, "");
    const tag = `[${i}/${comps.length}] ${name}`;
    const outputLocation = path.join(outDir, `${name}.mp4`);

    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      inputProps,
      outputLocation,
      concurrency,
      onProgress: ({ progress }) => {
        process.stdout.write(`\r${tag} ${Math.round(progress * 100)}%   `);
      },
    });
    process.stdout.write(`\r${tag} ✓            \n`);
  }

  console.log(
    `Done. ${comps.length} file(s) in ${path.relative(root, outDir)}`,
  );
}

main().catch((err) => {
  console.error("\nrender-demos failed:", err);
  process.exit(1);
});
