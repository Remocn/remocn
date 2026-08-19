import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDefaults } from "@/lib/customizer-config";
import registry, { loadComponentConfig } from "@/registry/__index__";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outFile = path.join(root, "registry", "__manifest__.ts");

const HEADER = `// GENERATED FILE — do not edit by hand.
// Run \`bun run manifest:build\` after changing any registry config.
//
// The playback slice of every registry config: everything a preview needs to
// mount a Player, and nothing it needs only to render the customizer panel.
// Consumers that just play a component (cards, changelog, icon gallery) read
// this instead of importing 263 config modules into the client bundle.

import type { BackdropFill } from "@/registry/remocn/backdrop";

export interface PreviewManifestEntry {
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  previewBackdrop?: BackdropFill;
  defaults: Record<string, unknown>;
}

export const previewManifest: Record<string, PreviewManifestEntry> = `;

async function main() {
  const slugs = Object.keys(registry).sort();
  const manifest: Record<string, unknown> = {};

  for (const slug of slugs) {
    const config = await loadComponentConfig(slug);
    const entry: Record<string, unknown> = {
      durationInFrames: config.durationInFrames,
      fps: config.fps,
      compositionWidth: config.compositionWidth,
      compositionHeight: config.compositionHeight,
    };
    if (config.previewBackdrop) entry.previewBackdrop = config.previewBackdrop;
    entry.defaults = getDefaults(config.controls);
    manifest[slug] = entry;
  }

  const body = JSON.stringify(manifest, null, 2);
  writeFileSync(
    outFile,
    `${HEADER}${body};\n\nexport default previewManifest;\n`,
  );
  console.log(`wrote ${slugs.length} entries to registry/__manifest__.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
