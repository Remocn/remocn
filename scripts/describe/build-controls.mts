/**
 * Writes the customizer controls of every component to
 * .describe/controls.json for the describe endpoint. Route handlers run
 * under React's server build, where the preview configs (which import
 * Remotion) can't load, so the server reads their controls from here.
 *
 * Runs after every preview build: `bun run previews:build` and each rebuild
 * in `bun dev`. About half a second.
 */
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ControlConfig } from "@/lib/customizer-config";
import { CONTROLS_FILE } from "@/lib/describe/controls";
import registry, { loadComponentConfig } from "@/registry/__index__";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const out = path.join(root, CONTROLS_FILE);

const controls: Record<string, ControlConfig> = {};
for (const name of Object.keys(registry)) {
  const config = await loadComponentConfig(name);
  if (Object.keys(config.controls).length > 0) controls[name] = config.controls;
}

await mkdir(path.dirname(out), { recursive: true });
await writeFile(`${out}.tmp`, JSON.stringify(controls));
await rename(`${out}.tmp`, out);
console.log(
  `describe: wrote controls of ${Object.keys(controls).length} components`,
);
