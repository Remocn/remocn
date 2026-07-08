import { SITE_URL } from "@/lib/get-llm-text";
import { source } from "@/source";

export const revalidate = false;

// llms.txt — curated index of the docs for LLMs (https://llmstxt.org).
// Each entry links to the page's raw Markdown (`*.md`) served by app/llms.md.
export function GET() {
  const scanned: string[] = [];

  scanned.push("# remocn");
  scanned.push(
    "\n> shadcn registry of production-ready Remotion components — animations, transitions, backgrounds, and full scenes. Install with `npx shadcn add remocn/<component>`.",
  );
  scanned.push(
    "\nDocs are also available as raw Markdown: append `.md` to any docs URL, or read [/llms-full.txt](" +
      `${SITE_URL}/llms-full.txt) for the full corpus in a single file.`,
  );

  // Group pages by their top-level section (first slug segment).
  const sections = new Map<string, ReturnType<typeof source.getPages>>();
  for (const page of source.getPages()) {
    const key = page.slugs[0] ?? "";
    const bucket = sections.get(key) ?? [];
    bucket.push(page);
    sections.set(key, bucket);
  }

  for (const [key, pages] of sections) {
    const heading = key
      ? key.replace(/(^|-)([a-z])/g, (_, sep, c) => (sep ? " " : "") + c.toUpperCase())
      : "Overview";
    scanned.push(`\n## ${heading}`);
    for (const page of pages) {
      const data = page.data;
      const desc = data.description ? `: ${data.description}` : "";
      scanned.push(`- [${data.title}](${SITE_URL}${page.url}.md)${desc}`);
    }
  }

  return new Response(scanned.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
