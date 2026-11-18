/**
 * How the site answers agents at the same URLs people use. Imported by
 * next.config.ts, so it uses relative imports only (no `@/` alias there).
 */

type HeaderSignal = { type: "header"; key: string; value: string };

type Rewrite = {
  source: string;
  destination: string;
  has?: HeaderSignal[];
};

/**
 * Fetchers that read a page for a user. They get Markdown whenever their
 * Accept allows it. Crawlers that build a search index (Googlebot,
 * OAI-SearchBot, Claude-SearchBot) and agentic browsers (Atlas, Claude-Agent,
 * Google-Agent) still get HTML: the first would see cloaking, the second needs
 * the real UI to click through.
 */
export const FETCHER_USER_AGENT =
  /Claude-User|ChatGPT-User|Perplexity-User|MistralAI-User/;

/**
 * Set by proxy.ts on the request when it negotiated Markdown, so the fallback
 * rewrite below can answer a 404 in the same representation.
 */
export const VARIANT_HEADER = "x-remocn-variant";

/** The home page and `/docs` as Markdown (app/index.md). */
export const HOME_MARKDOWN = "/index.md";

/** The Markdown 404 body (app/missing.md). */
export const NOT_FOUND_MARKDOWN = "/missing.md";

/** The page people land on at the bare `/docs`, which has no page. */
export const DOCS_HOME = "/docs/getting-started/introduction";

/** URLs whose response depends on Accept and User-Agent. */
export const NEGOTIATED_SOURCES = ["/", "/docs", "/docs/:path*"];

/**
 * The Markdown route behind a page URL that has both representations, or null
 * when the URL has only HTML. Explicit `.md` URLs are rewritten in
 * next.config.ts instead.
 */
export function markdownPathFor(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/" || path === "/docs") return HOME_MARKDOWN;
  if (path.startsWith("/docs/") && !path.endsWith(".md")) {
    return `/llms.md/${path.slice("/docs/".length)}`;
  }
  return null;
}

/**
 * How a Markdown read reached us: a URL that is Markdown by itself (`.md`,
 * llms*.txt), an Accept header that asked for it, or a fetcher User-Agent
 * whose Accept only allowed it.
 */
export type MarkdownVia = "url" | "accept" | "user_agent";

const AGENT_INDEX_FILES = new Set([
  "/llms.txt",
  "/llms-full.txt",
  "/llms-components.txt",
]);

/**
 * The page a Markdown-only URL is a copy of, or null when the URL is not one.
 * Lets analytics count `/docs/x.md` and an Accept-negotiated `/docs/x` as reads
 * of the same page. The llms*.txt indexes stand for themselves.
 */
export function markdownUrlPage(pathname: string): string | null {
  if (AGENT_INDEX_FILES.has(pathname) || pathname.startsWith("/llms-full/")) {
    return pathname;
  }
  if (pathname === HOME_MARKDOWN) return "/";
  if (pathname === "/docs.md") return "/docs";
  if (pathname.startsWith("/docs/") && pathname.endsWith(".md")) {
    return pathname.slice(0, -".md".length);
  }
  if (pathname.startsWith("/llms.md/")) {
    return `/docs/${pathname.slice("/llms.md/".length)}`;
  }
  return null;
}

/**
 * RFC 8288 `Link` to the Markdown copy of a docs page, for clients that read
 * headers (a HEAD request, a fetcher that skips `<head>`). The HTML carries the
 * same pointer as `<link rel="alternate">`.
 */
export function markdownLinkFor(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "");
  if (!path.startsWith("/docs/") || path.endsWith(".md")) return null;
  return `<${path}.md>; rel="alternate"; type="text/markdown"`;
}

export function agentBeforeFilesRewrites(): Rewrite[] {
  // Explicit Markdown URLs. The same URLs with an Accept header are
  // negotiated in proxy.ts, which can read q-values; a `has` regex can't.
  return [
    { source: "/docs.md", destination: HOME_MARKDOWN },
    { source: "/docs/:path*.md", destination: "/llms.md/:path*" },
  ];
}

/**
 * Fallback rewrites run only after every page, public file and dynamic route
 * missed, i.e. exactly when Next would render the HTML 404. An agent that
 * asked for Markdown gets a Markdown 404 there instead, still with status 404.
 */
export function agentFallbackRewrites(): Rewrite[] {
  return [
    {
      source: "/:path*",
      has: [{ type: "header", key: VARIANT_HEADER, value: "markdown" }],
      destination: `${NOT_FOUND_MARKDOWN}/:path*`,
    },
  ];
}

export function agentHeaders() {
  // The response at these URLs depends on Accept and User-Agent, so a cache
  // must not hand the Markdown variant to a browser or the other way round.
  const negotiated = NEGOTIATED_SOURCES.map((source) => ({
    source,
    headers: [{ key: "Vary", value: "Accept, User-Agent" }],
  }));
  // RFC 8631: point API clients from the home page at the OpenAPI document,
  // and header readers at the Markdown copy (docs pages get theirs in proxy.ts).
  const home = {
    source: "/",
    headers: [
      {
        key: "Link",
        value: `</openapi.json>; rel="service-desc"; type="application/openapi+json", <${HOME_MARKDOWN}>; rel="alternate"; type="text/markdown"`,
      },
    ],
  };
  return [...negotiated, home];
}
