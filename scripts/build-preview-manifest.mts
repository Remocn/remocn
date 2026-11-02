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
  /** Index-card overrides on top of \`defaults\` (see ComponentConfig.card). */
  card?: { props?: Record<string, unknown>; fit?: boolean; backdrop?: boolean };
}

export const previewManifest: Record<string, PreviewManifestEntry> = `;

/** Ink the light index cards use instead of a light color. */
const CARD_INK = "#0E1012";
/** Control names that hold a component's main text/shape color. */
const MAIN_INK = new Set(["color", "textColor", "fill"]);

/** Relative lightness 0..1 of a CSS color, or null when it can't tell. */
function lightness(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const color = value.trim().toLowerCase();
  if (color === "white") return 1;
  if (color === "black") return 0;
  const oklch = /^oklch\(\s*([\d.]+)(%?)/.exec(color);
  if (oklch) return Number(oklch[1]) / (oklch[2] ? 100 : 1);
  let rgb: number[] | null = null;
  const hex = /^#([\da-f]{3,8})$/.exec(color)?.[1];
  if (hex) {
    const full =
      hex.length <= 4 ? [...hex.slice(0, 3)].map((c) => c + c).join("") : hex;
    rgb = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
  }
  const fn = /^rgba?\(([^)]+)\)/.exec(color)?.[1];
  if (fn)
    rgb = fn
      .split(/[\s,/]+/)
      .slice(0, 3)
      .map(Number);
  if (!rgb || rgb.some(Number.isNaN)) return null;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Props for the docs index cards: light tiles with no backdrop. Colors that
 * were light only because the component sits on a dark backdrop turn to ink,
 * then the config's own \`card.props\` win.
 */
function cardProps(config: Awaited<ReturnType<typeof loadComponentConfig>>) {
  const props: Record<string, unknown> = {};
  // Cards that keep their backdrop keep their colors too.
  if (config.card?.backdrop) return { ...config.card.props };
  const backdrop = config.previewBackdrop;
  // Anything but a light flat color (dark colors, gradients, images) is a
  // backdrop the light colors were chosen for.
  const darkBackdrop =
    !!backdrop &&
    !(backdrop.type === "color" && (lightness(backdrop.value) ?? 0) > 0.5);
  for (const [key, control] of Object.entries(config.controls)) {
    if (control.type !== "color") continue;
    if ((lightness(control.default) ?? 0) <= 0.5) continue;
    // On a dark backdrop every light color was chosen for it. With no
    // backdrop the component sits on the docs player's dark stage, but light
    // fills there can be UI surfaces, so only the main ink flips.
    if (darkBackdrop || (!backdrop && MAIN_INK.has(key))) {
      props[key] = CARD_INK;
    }
  }
  return { ...props, ...config.card?.props };
}

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
    const props = cardProps(config);
    const card: Record<string, unknown> = {};
    if (Object.keys(props).length > 0) card.props = props;
    if (config.card?.fit === false) card.fit = false;
    if (config.card?.backdrop) card.backdrop = true;
    if (Object.keys(card).length > 0) entry.card = card;
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
