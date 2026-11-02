import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DOCS_DIR = path.join(process.cwd(), "content/docs");
const COMPONENT_LINE = /^component:\s*["']?([\w-]+)["']?\s*$/m;

let pending: Promise<Map<string, string>> | null = null;

/**
 * Registry name → docs page URL, read from the `component:` frontmatter of
 * `content/docs`. Read from disk instead of the docs loader so the showcase
 * routes don't pull every docs MDX module into their bundle. Empty when the
 * folder isn't available.
 */
export function getDocsUrlsByComponent(): Promise<Map<string, string>> {
  pending ??= readDocsUrls().catch(() => new Map());
  return pending;
}

async function readDocsUrls() {
  const files = await readdir(DOCS_DIR, { recursive: true });
  const urls = new Map<string, string>();
  await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const source = await readFile(path.join(DOCS_DIR, file), "utf8");
        const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1];
        const name = frontmatter?.match(COMPONENT_LINE)?.[1];
        if (!name || urls.has(name)) return;
        const slug = file
          .replace(/\.mdx$/, "")
          .split(path.sep)
          .filter((part) => part !== "index")
          .join("/");
        urls.set(name, `/docs/${slug}`);
      }),
  );
  return urls;
}
