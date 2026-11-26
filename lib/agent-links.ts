import { SITE_URL } from "@/lib/get-llm-text";

/**
 * UTM tags on the links agents pass on to people, so a visit from a link in a
 * ChatGPT or Claude answer shows up in analytics as the AI channel instead of
 * a direct visit. Only links to HTML pages are tagged: the Markdown copies,
 * llms*.txt, registry JSON and the MCP endpoint are what agents fetch as data,
 * and the `URL:` line of a Markdown copy names the page itself.
 */

export const AGENT_UTM_MEDIUM = "agent";

/** `utm_source` for the static Markdown and llms*.txt files, which are cached and not per client. */
export const STATIC_AGENT_SOURCE = "llms";

const SITE_ORIGIN = new URL(SITE_URL).origin;

const DATA_PATH =
  /\.(md|txt|json|xml)$|^\/(r|mcp|api|og|embed|_next|_previews)(\/|$)/;

/** `utm_source` for an MCP answer: the calling client, or `mcp` when it is not known. */
export function mcpAgentSource(client: string): string {
  return client === "unknown" || client === "other" ? "mcp" : client;
}

export function agentLink(href: string, source: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (
    url.origin !== SITE_ORIGIN ||
    DATA_PATH.test(url.pathname) ||
    url.searchParams.has("utm_source")
  ) {
    return href;
  }
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", AGENT_UTM_MEDIUM);
  return url.toString();
}

const LINK_TARGET = /\]\((https?:\/\/[^\s)]+)/g;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** Tag the destination of every Markdown link outside fenced code. */
export function tagAgentLinks(markdown: string, source: string): string {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line.replace(
        LINK_TARGET,
        (_match, href: string) => `](${agentLink(href, source)}`,
      );
    })
    .join("\n");
}
