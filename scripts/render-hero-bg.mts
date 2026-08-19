import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  ensureBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const FRAME = 120;

const PROPS = {
  colors: ["#000d14", "#001929", "#00263d", "#00355a"],
  proportion: 0.35,
  softness: 0.05,
  distortion: 0.55,
  swirl: 0.8,
  swirlIterations: 10,
  shape: "checks",
  shapeScale: 0.5,
  scale: 2.2,
  rotation: 0,
};

async function main() {
  const entryPoint = path.join(root, "src", "remotion", "hero-bg-root.tsx");
  const output = path.join(root, "public", "hero-bg.png");

  await ensureBrowser();

  const tsAliases = tsconfigWebpackAlias(root);

  console.log("Bundling hero-bg entry…");
  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => {
      const existing = Object.entries(config.resolve?.alias ?? {}).map(
        ([name, alias]) => ({
          name: name.replace(/\$$/, ""),
          alias: alias as string,
          onlyModule: name.endsWith("$"),
        }),
      );
      return {
        ...config,
        resolve: { ...config.resolve, alias: [...existing, ...tsAliases] },
      };
    },
  });
  console.log("Bundle ready.");

  const composition = await selectComposition({
    serveUrl,
    id: "hero-bg",
    inputProps: PROPS,
  });

  await renderStill({
    serveUrl,
    composition,
    frame: FRAME,
    inputProps: PROPS,
    output,
    imageFormat: "png",
    chromiumOptions: { gl: "swangle" },
  });

  console.log(`${path.relative(root, output)} ✓`);
}

main().catch((err) => {
  console.error("\nrender-hero-bg failed:", err);
  process.exit(1);
});
