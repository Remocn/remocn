import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

const root = process.cwd();
const output = path.join(root, "out/workflow-console-review");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/workflow-console-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const browser = await openBrowser("chrome");
try {
  const composition = await selectComposition({
    serveUrl,
    id: "WorkflowConsole",
    puppeteerInstance: browser,
  });
  const times = process.argv
    .find((a) => a.startsWith("--times="))
    ?.slice(8)
    .split(",")
    .map(Number) ?? [
    0.5, 1, 1.8, 2.5, 4.5, 5.8, 7.3, 9.3, 11.3, 13.2, 14.5, 16, 18.3, 20.7,
    23.3, 24.7, 26.8, 29.5, 30.7, 32, 33.5, 35, 36.5, 38, 39.7, 41.7, 43.8,
    44.9, 46.3,
  ];
  for (const t of times) {
    if (!Number.isFinite(t) || t < 0 || t * 60 >= composition.durationInFrames)
      throw new Error(`Invalid sample time ${t}`);
    await renderStill({
      serveUrl,
      composition,
      frame: Math.round(t * 60),
      scale: 0.5,
      output: path.join(
        output,
        `${String(Math.round(t * 100)).padStart(4, "0")}.png`,
      ),
      puppeteerInstance: browser,
    });
    console.log(`Reviewed ${t}s`);
  }
  const alternateProps = {
    productName: "Studio",
    accentColor: "#5e9cff",
    countries: ["Japan"],
    bars: [
      { label: "Before", value: 0, detail: "0" },
      { label: "After", value: 100, detail: "+100" },
    ],
    content: { prefix: "Meet", closing: "Build your next idea" },
  };
  const alternateComposition = await selectComposition({
    serveUrl,
    id: "WorkflowConsole",
    inputProps: alternateProps,
    puppeteerInstance: browser,
  });
  for (const [name, frame] of [
    ["alternate-title", 60],
    ["alternate-country", 870],
    ["alternate-chart", 2382],
  ] as const) {
    await renderStill({
      serveUrl,
      composition: alternateComposition,
      frame,
      scale: 0.5,
      inputProps: alternateProps,
      output: path.join(output, `${name}.png`),
      puppeteerInstance: browser,
    });
  }
} finally {
  await browser.close({ silent: true });
}
