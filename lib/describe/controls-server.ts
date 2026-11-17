import "server-only";

import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { ControlConfig } from "@/lib/customizer-config";
import { CONTROLS_FILE } from "./controls";

let cached:
  | { mtime: number; controls: Record<string, ControlConfig> }
  | undefined;

/**
 * A component's customizer controls, or null for an unknown component. Read
 * again when the file changes, which `bun dev` does on every preview rebuild.
 */
export async function loadControls(
  name: string,
): Promise<ControlConfig | null> {
  const file = join(process.cwd(), CONTROLS_FILE);
  try {
    const { mtimeMs } = await stat(file);
    if (cached?.mtime !== mtimeMs) {
      cached = {
        mtime: mtimeMs,
        controls: JSON.parse(await readFile(file, "utf8")),
      };
    }
  } catch {
    console.warn(
      `[describe] ${CONTROLS_FILE} is missing; run \`bun run previews:build\`.`,
    );
    return null;
  }
  return Object.hasOwn(cached.controls, name) ? cached.controls[name] : null;
}
