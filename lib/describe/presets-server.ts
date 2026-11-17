import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ControlConfig } from "@/lib/customizer-config";
import { PRESETS_DIR, readPresets } from "./presets";
import type { Preset } from "./types";

/** A component's presets, or none when it has no presets file. */
export async function loadPresets(
  name: string,
  controls: ControlConfig,
): Promise<Preset[]> {
  try {
    const file = await readFile(
      join(process.cwd(), PRESETS_DIR, `${name}.json`),
      "utf8",
    );
    return readPresets(JSON.parse(file), controls);
  } catch {
    return [];
  }
}
