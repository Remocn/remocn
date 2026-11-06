import { buildLlmsTxt, MARKDOWN_CONTENT_TYPE } from "@/lib/agent-docs";
import { docsIndexPages } from "@/lib/docs-index";

export const revalidate = false;

// The home page (and `/docs`) as Markdown: the llms.txt index, served as
// text/markdown. Agents reach it at `/` through the rewrites in next.config.ts;
// `Vary: Accept, User-Agent` is set there for the URLs that negotiate.
export function GET() {
  return new Response(buildLlmsTxt(docsIndexPages()), {
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      // A copy of the HTML home page for agents; search should index the HTML.
      "X-Robots-Tag": "noindex",
    },
  });
}
