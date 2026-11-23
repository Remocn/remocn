import { COMPONENT_COUNT, TRANSITION_PRESENTATIONS } from "@/config/site";
import { buildLlmsTxt } from "@/lib/agent-docs";
import { docsIndexPages } from "@/lib/docs-index";

export const revalidate = false;

// llms.txt — curated index of the docs for LLMs (https://llmstxt.org).
// Each entry links to the page's raw Markdown (`*.md`) served by app/llms.md.
export function GET() {
  return new Response(
    buildLlmsTxt(docsIndexPages(), {
      components: COMPONENT_COUNT,
      transitionPresentations: TRANSITION_PRESENTATIONS,
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // Agents fetch it by URL; in search it would compete with the docs.
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
