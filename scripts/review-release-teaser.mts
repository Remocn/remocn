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
const output = path.join(root, "out/release-teaser");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/release-teaser-root.tsx"),
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
    id: "ReleaseTeaser",
    puppeteerInstance: browser,
  });
  const frames = process.argv.includes("--quick")
    ? [60, 260, 520, 690, 790, 959]
    : [
        0, 12, 30, 60, 94, 103, 104, 118, 148, 202, 208, 224, 260, 320, 326,
        342, 386, 440, 446, 462, 520, 580, 609, 610, 626, 650, 690, 740, 790,
        858, 908, 959,
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
    console.log(`ReleaseTeaser: reviewed frame ${frame}`);
  }
  if (!process.argv.includes("--quick")) {
    const variants = [
      {
        name: "custom",
        frames: [60, 148, 260, 520, 790],
        props: {
          brandName: "North Atelier / Studio",
          release: "03",
          tagline: "More room for your next great idea.",
          accentColor: "#D7B37B",
          statements: [
            "Every good idea deserves room to become something.",
            "Створюй сміливо.\nРухайся разом.",
            "👩🏽‍🎨 Ideas, people & possibilities.",
          ],
          reducedMotion: true,
        },
      },
      {
        name: "logo",
        frames: [60, 690, 959],
        props: {
          brandName: "Fieldwork",
          release: "",
          tagline: "Make what comes next.",
          accentColor: "#AADFC2",
          logoSrc: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M15 15h70v20H35v15h38v20H35v15H15z" fill="#AADFC2"/></svg>')}`,
        },
      },
    ];
    for (const variant of variants) {
      const custom = await selectComposition({
        serveUrl,
        id: "ReleaseTeaser",
        inputProps: variant.props,
        puppeteerInstance: browser,
      });
      for (const frame of variant.frames) {
        await renderStill({
          serveUrl,
          composition: custom,
          inputProps: variant.props,
          puppeteerInstance: browser,
          frame,
          scale: 0.5,
          output: path.join(output, `${variant.name}-${frame}.png`),
        });
      }
    }
    // A repeated out-of-order seek must paint the exact same canvas pixels.
    for (const frame of [790, 60]) {
      await renderStill({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        frame,
        scale: 0.5,
        output: path.join(output, `seek-${frame}.png`),
      });
    }
  }
  if (process.argv.includes("--render")) {
    let last = -1;
    const staging = path.join(output, `.release-teaser-${process.pid}.mp4`);
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      crf: 18,
      concurrency: 4,
      outputLocation: staging,
      chromiumOptions,
      onProgress: ({ progress }) => {
        const step = Math.floor(progress * 10);
        if (step > last) {
          last = step;
          console.log(`ReleaseTeaser: rendered ${step * 10}%`);
        }
      },
    });
    renameSync(staging, path.join(root, "out/release-teaser.mp4"));
  }
} finally {
  await browser.close({ silent: true });
}
