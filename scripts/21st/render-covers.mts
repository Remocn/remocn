import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { tsconfigWebpackAlias } from "../tsconfig-webpack-alias.mts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const outRoot = path.join(root, "out", "21st");

async function main() {
  const { generated } = JSON.parse(readFileSync(path.join(outRoot, "generated.json"), "utf8")) as {
    generated: string[];
  };
  const only = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]?.split(",")
    : null;
  const slugs = (only ?? generated).filter((slug) => {
    const output = path.join(outRoot, "publish", slug, "cover.png");
    return only ? true : !existsSync(output);
  });
  if (slugs.length === 0) {
    console.log("all covers already rendered");
    return;
  }

  await ensureBrowser();
  const tsAliases = tsconfigWebpackAlias(root);
  console.log(`Bundling covers root for ${slugs.length} covers…`);
  const serveUrl = await bundle({
    entryPoint: path.join(outRoot, "covers-root.tsx"),
    webpackOverride: (config) => {
      const existing = Object.entries(config.resolve?.alias ?? {}).map(([name, alias]) => ({
        name: name.replace(/\$$/, ""),
        alias: alias as string,
        onlyModule: name.endsWith("$"),
      }));
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: [...existing, ...tsAliases],
        },
      };
    },
  });
  console.log("Bundle ready.");

  const failed: { slug: string; error: string }[] = [];
  let done = 0;
  for (const slug of slugs) {
    const output = path.join(outRoot, "publish", slug, "cover.png");
    try {
      const composition = await selectComposition({ serveUrl, id: slug });
      const frame = Math.min(
        Math.floor(composition.durationInFrames * 0.66),
        composition.durationInFrames - 1,
      );
      await renderStill({
        composition,
        serveUrl,
        output,
        frame,
        chromiumOptions: { gl: "swangle" },
        timeoutInMilliseconds: 60000,
      });
    } catch (err) {
      failed.push({ slug, error: String(err).slice(0, 200) });
    }
    done += 1;
    if (done % 10 === 0 || done === slugs.length) console.log(`covers: ${done}/${slugs.length}`);
  }
  if (failed.length) {
    console.log(`FAILED (${failed.length}):`);
    for (const f of failed) console.log(`  ${f.slug}: ${f.error}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
