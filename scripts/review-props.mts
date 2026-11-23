// `bun scripts/review-props.mts --names a,b|--file names.txt --out dir [--props '{"scale":0.8}'] [--at 0.6,0.25|all] [--scale 0.25]`
//
// Renders stills of registry components through `src/remotion/props-review-root.tsx`:
// one PNG per component per moment (`--at` is a share of each component's
// duration, or `all` for every frame). Used to check that new props keep the
// default render unchanged and visibly do something when set, and with
// `--at all --scale 1` that a refactor keeps every frame to the pixel.
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

const flag = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const root = process.cwd();
const names = (
  flag("file")
    ? readFileSync(flag("file") as string, "utf8")
    : (flag("names") ?? "")
)
  .split(/[\s,]+/)
  .filter(Boolean);
const out = path.resolve(flag("out") ?? "out/review-props");
const props = JSON.parse(flag("props") ?? "{}") as Record<string, unknown>;
const every = flag("at") === "all";
const at = every ? [] : (flag("at") ?? "0.6").split(",").map(Number);
const scale = Number(flag("scale") ?? "0.25");
mkdirSync(out, { recursive: true });

const serveUrl =
  flag("serve") ??
  (await bundle({
    entryPoint: path.join(root, "src/remotion/props-review-root.tsx"),
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: [
          ...Object.entries(config.resolve?.alias ?? {}).map(
            ([name, alias]) => ({
              name: name.replace(/\$$/, ""),
              alias: alias as string,
              onlyModule: name.endsWith("$"),
            }),
          ),
          ...tsconfigWebpackAlias(root),
        ],
      },
    }),
  }));
const inputProps = { names, props };
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
const failed: string[] = [];
try {
  const compositions = await getCompositions(serveUrl, {
    inputProps,
    puppeteerInstance: browser,
  });
  let i = 0;
  for (const composition of compositions) {
    i += 1;
    const moments = every
      ? Array.from({ length: composition.durationInFrames }, (_, f) => ({
          frame: f,
          tag: String(f).padStart(4, "0"),
        }))
      : at.map((share) => ({
          frame: Math.min(
            composition.durationInFrames - 1,
            Math.round(composition.durationInFrames * share),
          ),
          tag: String(share),
        }));
    for (const { frame, tag } of moments) {
      const file = path.join(out, `${composition.id}@${tag}.png`);
      try {
        await renderStill({
          serveUrl,
          composition,
          frame,
          output: file,
          inputProps,
          scale,
          puppeteerInstance: browser,
          chromiumOptions: { gl: "angle" },
        });
      } catch (error) {
        failed.push(`${composition.id}: ${String(error).split("\n")[0]}`);
      }
    }
    process.stdout.write(`\r${i}/${compositions.length}   `);
  }
} finally {
  await browser.close({ silent: true });
}
console.log(`\n${failed.length} failed`);
for (const line of failed) console.log(line);
