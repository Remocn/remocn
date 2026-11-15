import "server-only";

import { OpenPanel } from "@openpanel/sdk";
import {
  classifyAgentClient,
  describeQuery,
  loggedQuery,
  type SearchSurface,
} from "@/lib/search/analytics-shape";

const CRAWLER_UA =
  /bot\b|bot[/_-]|crawler|crawling|spider|slurp|facebookexternalhit|feedfetcher|mediapartners/i;

let client: OpenPanel | null | undefined;

function openPanel(): OpenPanel | null {
  if (client !== undefined) return client;

  const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
  const clientSecret = process.env.OPENPANEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    client = null;
    return client;
  }

  client = new OpenPanel({
    clientId,
    clientSecret,
    apiUrl: process.env.NEXT_PUBLIC_OPENPANEL_API_URL,
  });
  return client;
}

export function isCrawler(userAgent: string): boolean {
  return CRAWLER_UA.test(userAgent);
}

export async function trackRegistryInstall(
  component: string,
  userAgent: string,
): Promise<void> {
  if (isCrawler(userAgent)) return;

  try {
    await openPanel()?.track("registry_install", {
      component,
      user_agent: userAgent,
    });
  } catch {
    // A metrics outage must never surface to the caller — the payload already shipped.
  }
}

function send(event: string, properties: Record<string, unknown>): void {
  // Never awaited: analytics must not add to a response time, and a metrics
  // outage must never reach the caller.
  void Promise.resolve()
    .then(() => openPanel()?.track(event, properties))
    .catch(() => {});
}

export interface AgentSearch {
  surface: Extract<SearchSurface, "mcp" | "api">;
  userAgent: string;
  query: string;
  /** Component names in the order they were returned. */
  results: string[];
  /** `keyword` when the semantic index or model was not available. */
  mode?: "hybrid" | "keyword";
  latencyMs: number;
  vibe?: string;
  maxLength?: number;
}

/**
 * A search made by a program: an MCP `search_components` call or a direct
 * call to `/api/search`. Same event name as the dialog's, told apart by
 * `actor` and `surface`.
 *
 * The query text is recorded, cut to `MAX_LOGGED_QUERY`. The privacy policy
 * (`app/(home)/legal/content.tsx`, "MCP server") says so and names the limit:
 * search queries only. Video briefs and component props stay out of
 * analytics, and widening this needs that paragraph changed first.
 */
export function trackAgentSearch(search: AgentSearch): void {
  if (isCrawler(search.userAgent)) return;
  send("search_performed", {
    actor: "agent",
    surface: search.surface,
    client: classifyAgentClient(search.userAgent),
    user_agent: search.userAgent.slice(0, 200),
    query: loggedQuery(search.query),
    ...describeQuery(search.query),
    result_count: search.results.length,
    component_count: search.results.length,
    has_results: search.results.length > 0,
    top_components: search.results.slice(0, 6).join(","),
    ...(search.mode ? { mode: search.mode } : {}),
    latency_ms: Math.round(search.latencyMs),
    ...(search.vibe ? { vibe: search.vibe } : {}),
    ...(search.maxLength !== undefined ? { max_length: search.maxLength } : {}),
  });
}

/**
 * An agent asked for one component by name (`get_component`,
 * `preview_component`). Set against the searches that returned that component,
 * it is the closest thing to a click: the agent went on to read or show it.
 * `found: false` is a name the agent made up or misread.
 */
export function trackAgentComponentFetch(fetch: {
  tool: "get_component" | "preview_component";
  userAgent: string;
  /** Resolved component name, or the raw input when nothing matched. */
  component: string;
  found: boolean;
}): void {
  if (isCrawler(fetch.userAgent)) return;
  send("component_fetched", {
    actor: "agent",
    surface: "mcp",
    client: classifyAgentClient(fetch.userAgent),
    tool: fetch.tool,
    component: fetch.found ? fetch.component : "",
    found: fetch.found,
  });
}
