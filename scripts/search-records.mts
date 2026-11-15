import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Glob } from "bun";
import { type ComponentRecord, installCommand } from "@/lib/mcp/search";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..");

/**
 * The component catalog straight from the docs frontmatter, for scripts that
 * run outside Next (the server builds the same records from the fumadocs
 * source in `lib/mcp/catalog.ts`). Files are read in sorted order and a
 * component belongs to the first page that declares it.
 */
export function loadComponentRecords(): ComponentRecord[] {
  const records: ComponentRecord[] = [];
  const seen = new Set<string>();
  const files = [...new Glob("content/docs/**/*.mdx").scanSync(ROOT)].sort();
  for (const file of files) {
    const src = readFileSync(path.join(ROOT, file), "utf8");
    const end = src.indexOf("\n---", 3);
    if (!src.startsWith("---") || end === -1) continue;
    const data = (Bun.YAML.parse(src.slice(4, end)) ?? {}) as Record<
      string,
      unknown
    >;
    const name = data.component;
    if (typeof name !== "string" || seen.has(name)) continue;
    seen.add(name);
    const strings = (value: unknown): string[] =>
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === "string")
        : [];
    records.push({
      name,
      title: typeof data.title === "string" ? data.title : name,
      description: typeof data.description === "string" ? data.description : "",
      section: file.split("/")[2] ?? "",
      docs: "",
      vibe: typeof data.vibe === "string" ? data.vibe : undefined,
      length: data.length as ComponentRecord["length"],
      useWhen: strings(data.useWhen),
      avoidWhen: strings(data.avoidWhen),
      askedAs: strings(data.askedAs),
      install: installCommand(name),
    });
  }
  return records;
}
