import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Archetype } from "@/lib/mcp/archetypes";

/**
 * Archetype recipes live with the remocn skill in the plugin at
 * `plugins/remocn/skills/remocn`. They are plain repo files: the Dockerfile
 * copies the whole tree and the app runs `next start` from it, and
 * `outputFileTracingIncludes` in next.config.ts covers traced output. The
 * folder is spelled out literally so the bundler traces only it, not the
 * whole project.
 */
const REFERENCES = path.join(
  process.cwd(),
  "plugins",
  "remocn",
  "skills",
  "remocn",
  "references",
);

const fileCache = new Map<string, string | null>();

function read(key: string, load: () => string): string | undefined {
  if (!fileCache.has(key)) {
    let text: string | null = null;
    try {
      text = load();
    } catch {
      text = null;
    }
    fileCache.set(key, text);
  }
  return fileCache.get(key) ?? undefined;
}

export function readArchetypeRecipe(archetype: Archetype): string | undefined {
  return read(archetype, () =>
    readFileSync(
      path.join(REFERENCES, "archetypes", `${archetype}.md`),
      "utf8",
    ),
  );
}

export function readAnatomy(): string | undefined {
  return read("anatomy.md", () =>
    readFileSync(path.join(REFERENCES, "anatomy.md"), "utf8"),
  );
}
