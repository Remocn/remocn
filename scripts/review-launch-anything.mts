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
const output = path.join(root, "out/launch-anything-review");
mkdirSync(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/remotion/launch-anything-root.tsx"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: tsconfigWebpackAlias(root) },
  }),
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "swangle" },
});
try {
  const composition = await selectComposition({
    serveUrl,
    id: "LaunchAnything",
    puppeteerInstance: browser,
  });
  const times = process.argv
    .find((a) => a.startsWith("--times="))
    ?.slice(8)
    .split(",")
    .map(Number) ?? [
    0.4, 1.4, 2.2, 3.2, 4.3, 5.3, 6.4, 7.6, 8.7, 9.7, 10.8, 11.8, 12.8, 13.7,
    14.5, 16, 17.7, 19.4, 20.4, 20.8, 21.3, 22.6, 24.5, 26.5,
  ];
  for (const t of times) {
    await renderStill({
      serveUrl,
      composition,
      frame: Math.round(t * composition.fps),
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
    brandUrl: "Acme.studio",
    opening: "Your next",
    subject: "big idea",
    accentColor: "#df622b",
    content: {
      industry: "Every ambition",
      promise: "Make your next move.",
      proof: "Built for ambitious\nteams",
      integrations: ["Notion"],
    },
  };
  await renderStill({
    serveUrl,
    composition,
    inputProps: alternateProps,
    frame: 1164,
    scale: 0.5,
    output: path.join(output, "alternate.png"),
    puppeteerInstance: browser,
  });
} finally {
  await browser.close({ silent: true });
}
