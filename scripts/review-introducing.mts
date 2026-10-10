import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

/** Render representative frames (and an alternate brand) with one bundle. */
const root = process.cwd();
const output = path.join(root, "out/introducing-review");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/introducing-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const browser = await openBrowser("chrome");
try {
  const composition = await selectComposition({
    serveUrl,
    id: "IntroducingRemocn",
    puppeteerInstance: browser,
    inputProps: { sound: false },
  });
  const requestedFrames = process.argv
    .find((arg) => arg.startsWith("--frames="))
    ?.slice(9)
    .split(",")
    .map(Number);
  const frames = requestedFrames ?? [
    45, 110, 225, 370, 480, 660, 890, 1040, 1180, 1319, 1350, 1450, 1590, 1860,
  ];
  for (const frame of frames) {
    await renderStill({
      serveUrl,
      composition,
      frame,
      output: path.join(output, `${frame}.png`),
      scale: 0.5,
      puppeteerInstance: browser,
      inputProps: { sound: false },
    });
    console.log(`Frame ${frame} (${(frame / 60).toFixed(2)}s)`);
  }
  const alternateProps = {
    sound: false,
    productName: "Forma Studio",
    website: "forma.example",
    accentColor: "#B7D7FA",
    content: { closingLine: "Make something worth sharing." },
  };
  const alternateComposition = await selectComposition({
    serveUrl,
    id: "IntroducingRemocn",
    puppeteerInstance: browser,
    inputProps: alternateProps,
  });
  await renderStill({
    serveUrl,
    composition: alternateComposition,
    frame: 1860,
    output: path.join(output, "alternate-brand.png"),
    scale: 0.5,
    puppeteerInstance: browser,
    inputProps: {
      sound: false,
      productName: "Forma Studio",
      website: "forma.example",
      accentColor: "#B7D7FA",
      content: { closingLine: "Make something worth sharing." },
    },
  });
} finally {
  await browser.close({ silent: true });
}
