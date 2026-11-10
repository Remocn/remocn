import { markdownNotFound } from "@/lib/agent-docs";
import { corpusResponse } from "@/lib/llms-corpus";
import { source } from "@/source";

export const revalidate = false;

/** Top-level docs sections, e.g. "transitions" for /docs/transitions/*. */
function sections(): string[] {
  return [...new Set(source.getPages().flatMap((page) => page.slugs[0] ?? []))];
}

export function generateStaticParams() {
  return sections().map((section) => ({ file: `${section}.txt` }));
}

// /llms-full/<section>.txt — one docs section as a single Markdown file, small
// enough to read in one request, unlike the whole corpus at /llms-full.txt.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const section = file.replace(/\.txt$/, "");
  const pages = source.getPages().filter((page) => page.slugs[0] === section);
  if (!file.endsWith(".txt") || pages.length === 0) {
    return markdownNotFound(`/llms-full/${file}`);
  }
  return corpusResponse(pages);
}
