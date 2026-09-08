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
const output = path.join(root, "out/fomo-review");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/fomo-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const browser = await openBrowser("chrome");
try {
  const composition = await selectComposition({
    serveUrl,
    id: "FomoLimitOrders",
    puppeteerInstance: browser,
  });
  const times = process.argv
    .find((a) => a.startsWith("--times="))
    ?.slice(8)
    .split(",")
    .map(Number) ?? [
    0.5, 1.3, 2.3, 3.4, 4.6, 5.8, 6.9, 7.7, 8.3, 9.8, 10.8, 11.4, 12.2, 13.2,
    14.2, 15.25, 15.65, 17.15,
  ];
  for (const t of times) {
    await renderStill({
      serveUrl,
      composition,
      frame: Math.round(t * 60),
      scale: 0.5,
      output: path.join(output, `${t}.png`),
      puppeteerInstance: browser,
    });
    console.log(`Frame ${Math.round(t * 60)} (${t}s)`);
  }
  const alternate = await selectComposition({
    serveUrl,
    id: "FomoLimitOrders",
    puppeteerInstance: browser,
    inputProps: {
      brandName: "Forma",
      accentColor: "#f56d61",
      content: { ticker: "TEST", limitPrice: "$210.00" },
    },
  });
  await renderStill({
    serveUrl,
    composition: alternate,
    frame: 804,
    scale: 0.5,
    output: path.join(output, "alternate.png"),
    puppeteerInstance: browser,
  });
} finally {
  await browser.close({ silent: true });
}
