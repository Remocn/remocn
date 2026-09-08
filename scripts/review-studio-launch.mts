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
const output = path.join(root, "out/studio-launch-review");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/studio-launch-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const browser = await openBrowser("chrome");
try {
  const composition = await selectComposition({
    serveUrl,
    id: "StudioLaunch",
    puppeteerInstance: browser,
  });
  const times = process.argv
    .find((a) => a.startsWith("--times="))
    ?.slice(8)
    .split(",")
    .map(Number) ?? [
    0.5, 1.2, 2.8, 4, 5.5, 6.6, 7.6, 8.5, 9.2, 10.2, 11.8, 13.2, 14.2, 15.5,
    17.5, 19.3, 20.7, 22.3, 23.5, 24.4, 25.2, 26.1, 27.5, 28.6, 29.6, 31.7, 34,
  ];
  for (const t of times) {
    await renderStill({
      serveUrl,
      composition,
      frame: Math.round(t * 30),
      scale: 0.5,
      output: path.join(output, `${t}.png`),
      puppeteerInstance: browser,
    });
    console.log(`Frame ${Math.round(t * 30)} (${t}s)`);
  }
  const alternate = await selectComposition({
    serveUrl,
    id: "StudioLaunch",
    puppeteerInstance: browser,
    inputProps: {
      brandName: "Forma",
      accentColor: "#f56d61",
      content: { feedTitle: "Community feed" },
    },
  });
  await renderStill({
    serveUrl,
    composition: alternate,
    frame: 960,
    scale: 0.5,
    output: path.join(output, "alternate.png"),
    puppeteerInstance: browser,
  });
} finally {
  await browser.close({ silent: true });
}
