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
const output = path.join(root, "out/brand-guidelines");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/brand-guidelines-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const chromiumOptions = { gl: "angle" as const };
const browser = await openBrowser("chrome", { chromiumOptions });
try {
  const composition = await selectComposition({
    serveUrl,
    id: "BrandGuidelines",
    puppeteerInstance: browser,
  });
  const frames = [
    0, 60, 117, 118, 180, 224, 280, 306, 325, 365, 388, 417, 434, 478, 511, 525,
    544, 556, 570, 586, 605, 623, 650, 710, 770, 805, 806, 842, 868, 890, 920,
    952, 977, 1002, 1035, 1071,
  ];
  for (const frame of frames) {
    await renderStill({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      frame,
      scale: 0.5,
      output: path.join(output, `frame-${String(frame).padStart(4, "0")}.png`),
    });
    console.log(`BrandGuidelines: reviewed frame ${frame}`);
  }
  // Exercise a nondefault identity, Unicode, partial lists, and reduced motion.
  const inputProps = {
    brandName: "Atelier North / Objects",
    accentColor: "#285A50",
    content: {
      openingTagline: "Thoughtful objects, made for your everyday.",
      collageTitle: "A new point of view.",
      footer: "Your identity. Your story.",
    },
    phrases: [
      "Objects, ideas & everyday possibilities.",
      "Форма має значення.",
    ],
    closingWords: ["Imagine", "Make", "Share."],
    reducedMotion: true,
  };
  const custom = await selectComposition({
    serveUrl,
    id: "BrandGuidelines",
    inputProps,
    puppeteerInstance: browser,
  });
  for (const frame of [60, 388, 478, 710, 890, 977]) {
    await renderStill({
      serveUrl,
      composition: custom,
      inputProps,
      puppeteerInstance: browser,
      frame,
      scale: 0.5,
      output: path.join(output, `custom-${frame}.png`),
    });
  }
  if (process.argv.includes("--render")) {
    let last = -1;
    const stagedOutput = path.join(
      output,
      `.brand-guidelines-${process.pid}.mp4`,
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
          console.log(`BrandGuidelines: rendered ${step * 10}%`);
        }
      },
    });
    renameSync(stagedOutput, path.join(root, "out/brand-guidelines.mp4"));
  }
} finally {
  await browser.close({ silent: true });
}
