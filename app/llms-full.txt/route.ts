import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/source";

export const revalidate = false;

// llms-full.txt — every doc page concatenated as Markdown, for LLMs that want
// the entire corpus in one request.
export async function GET() {
  const pages = source.getPages();
  const docs = await Promise.all(pages.map((page) => getLLMText(page)));

  return new Response(docs.join("\n\n---\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
