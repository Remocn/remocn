import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

const root = process.cwd();
const output = path.join(root, "out/independent-templates");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/independent-templates-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});

const samples = [
  {
    id: "OrderFlow",
    slug: "order-flow",
    times: [1.5, 4.8, 6.5, 9.7, 11.7, 13.5, 15.5, 18],
  },
  {
    id: "WorkflowConsole",
    slug: "workflow-console",
    times: [
      1, 4.5, 9.3, 13.3, 15.4, 18.3, 20.7, 23.3, 24.7, 29.5, 33.5, 39.7, 41.7,
      44.9, 46.3,
    ],
  },
  {
    id: "ProductShowcase",
    slug: "product-showcase",
    times: [
      0.6, 1.8, 3.3, 5.2, 6.6, 8.1, 8.9, 9.9, 10.8, 11.9, 13.5, 14.7, 16.3,
      18.1, 19.6, 20.45, 20.8, 21.35, 22.8, 25.5,
    ],
  },
];
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
for (const sample of samples.filter(
  (sample) => !only || only === sample.slug,
)) {
  const chromiumOptions = {
    gl: process.argv.includes("--software")
      ? ("swangle" as const)
      : ("angle" as const),
  };
  const browser = await openBrowser("chrome", { chromiumOptions });
  try {
    const composition = await selectComposition({
      serveUrl,
      id: sample.id,
      puppeteerInstance: browser,
    });
    for (const t of sample.times) {
      await renderStill({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        frame: Math.round(t * 60),
        scale: 0.5,
        output: path.join(
          output,
          `${sample.slug}-${String(Math.round(t * 100)).padStart(4, "0")}.png`,
        ),
      });
      console.log(`${sample.id}: checked ${t}s`);
    }
    if (process.argv.includes("--render")) {
      let last = -1;
      const stagedOutput = path.join(
        output,
        `.${sample.slug}-${process.pid}.mp4`,
      );
      await renderMedia({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        codec: "h264",
        crf: 18,
        concurrency: 4,
        outputLocation: stagedOutput,
        chromiumOptions,
        onProgress: ({ progress }) => {
          const step = Math.floor(progress * 10);
          if (step > last) {
            last = step;
            console.log(`${sample.id}: rendered ${step * 10}%`);
          }
        },
      });
      renameSync(stagedOutput, path.join(root, "out", `${sample.slug}.mp4`));
    }
  } finally {
    await browser.close({ silent: true });
  }
}
