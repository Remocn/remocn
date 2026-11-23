import type { ControlConfig } from "@/lib/customizer-config";
import { sanitizePatch } from "./patch";
import type { Preset } from "./types";

/**
 * A component's presets, as `bun run presets:build` writes them to
 * registry/presets/<name>.json (one file per component, committed).
 */
export interface PresetFile {
  component: string;
  /** The model that wrote them, and when. */
  model: string;
  generatedAt: string;
  presets: Preset[];
}

export const PRESETS_DIR = "registry/presets";

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];

/**
 * The presets in a file that still fit the component: unknown props and
 * out-of-range values are dropped, and a preset left with nothing to set is
 * left out. Copy is never part of a preset.
 */
export function readPresets(raw: unknown, controls: ControlConfig): Preset[] {
  const list = (raw as Partial<PresetFile> | null)?.presets;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item): Preset[] => {
    if (!item || typeof item !== "object") return [];
    const { id, label, description, askedAs, props } = item as Partial<Preset>;
    if (typeof id !== "string" || typeof label !== "string") return [];
    const clean = sanitizePatch(
      controls,
      (props ?? {}) as Record<string, unknown>,
    );
    if (Object.keys(clean).length === 0) return [];
    return [
      {
        id,
        label,
        description: typeof description === "string" ? description : label,
        askedAs: strings(askedAs),
        props: clean,
      },
    ];
  });
}
