import { notFound } from "next/navigation";
import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/source";

export const revalidate = false;

// Serves the processed Markdown for a single doc page.
// Reached via the `/docs/:path*.md` rewrite in next.config.ts, so a request to
// `/docs/getting-started/introduction.md` returns raw Markdown for AI agents.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
