import { STATIC_AGENT_SOURCE, tagAgentLinks } from "@/lib/agent-links";
import { getLLMText } from "@/lib/get-llm-text";
import type { source } from "@/source";

type DocPage = ReturnType<typeof source.getPages>[number];

/** Docs pages as one Markdown file, separated by horizontal rules. */
export async function corpusResponse(pages: DocPage[]): Promise<Response> {
  const docs = await Promise.all(pages.map((page) => getLLMText(page)));
  return new Response(
    tagAgentLinks(docs.join("\n\n---\n\n"), STATIC_AGENT_SOURCE),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // The same text as the docs pages; keep search on the HTML.
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
