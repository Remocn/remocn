import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

// Renders a contact sheet per base shader for its preset registry items
// (`meta.presetOf` in registry/remocn/registry.json). Usage:
//   bun scripts/review-shader-presets.mts [shader-warp ...] [--frames=30,150]

const root = process.cwd();
const output = path.join(root, "out/shader-presets");
mkdirSync(output, { recursive: true });

const args = process.argv.slice(2);
const framesArg = args.find((a) => a.startsWith("--frames="));
const frames = framesArg
  ? framesArg.slice("--frames=".length).split(",").map(Number)
  : [60];
const only = args.filter((a) => !a.startsWith("--"));

const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/shader-presets-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const chromiumOptions = { gl: "angle" as const };
const browser = await openBrowser("chrome", { chromiumOptions });
try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
  });
  for (const composition of compositions) {
    const sheet = composition.id.replace(/^presets-/, "");
    if (only.length > 0 && !only.includes(sheet)) continue;
    for (const frame of frames) {
      const file = path.join(output, `${sheet}-f${frame}.png`);
      await renderStill({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        frame,
        output: file,
      });
      console.log(`rendered ${path.relative(root, file)}`);
    }
  }
} finally {
  await browser.close({ silent: true });
}
