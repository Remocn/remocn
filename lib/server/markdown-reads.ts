import "server-only";

import type { MarkdownVia } from "@/lib/agent-routing";
import { classifyAgentClient } from "@/lib/search/analytics-shape";
import { isCrawler, sendEvent } from "@/lib/server/analytics";

// Its own module so proxy tests can mock it without touching the OpenPanel
// client that the registry and MCP tests mock.

/**
 * An agent read the Markdown copy of a page, or an llms*.txt index. Counted in
 * proxy.ts per request: the Markdown routes are cached after the first render,
 * so a counter inside them would see one read per deploy.
 *
 * Crawlers are kept, unlike in the search events: a search-index bot reading
 * llms.txt is exactly what this event is for. `crawler` tells them apart.
 */
export function trackMarkdownRead(read: {
  /** The page the Markdown is a copy of (`/docs/x` for `/docs/x.md`). */
  page: string;
  /** The URL as requested. */
  path: string;
  via: MarkdownVia;
  userAgent: string;
}): Promise<void> {
  return sendEvent("markdown_read", {
    actor: "agent",
    page: read.page,
    path: read.path,
    via: read.via,
    client: classifyAgentClient(read.userAgent),
    crawler: isCrawler(read.userAgent),
    user_agent: read.userAgent.slice(0, 200),
  });
}
