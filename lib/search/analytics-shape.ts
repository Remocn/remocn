/**
 * What the search analytics may say about a query without quoting it, and who
 * is asking. Pure and shared: the docs search dialog (client) and the MCP and
 * API handlers (server) describe a search with the same fields, so one chart
 * can split any of them by `actor`.
 */

import type { TopMatch } from "@/lib/search/hybrid";

export type SearchActor = "human" | "agent";

/** Where the search came from: the ⌘K dialog, an MCP tool call, or a direct call to `/api/search`. */
export type SearchSurface = "docs_dialog" | "mcp" | "api";

export type QueryScript = "latin" | "cyrillic" | "cjk" | "other" | "mixed";

/** Longest query text an event carries; the rest of a pasted paragraph is noise. */
export const MAX_LOGGED_QUERY = 200;

export interface QueryShape {
  query_words: number;
  query_chars: number;
  /** Writing system, as a stand-in for language: tells how much non-English search there is. */
  query_script: QueryScript;
}

const SCRIPTS: [QueryScript, RegExp][] = [
  ["latin", /\p{Script=Latin}/u],
  ["cyrillic", /\p{Script=Cyrillic}/u],
  [
    "cjk",
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u,
  ],
];

export function describeQuery(query: string): QueryShape {
  const text = query.trim();
  const found = SCRIPTS.filter(([, pattern]) => pattern.test(text)).map(
    ([script]) => script,
  );
  return {
    query_words: text ? text.split(/\s+/).length : 0,
    query_chars: text.length,
    query_script: found.length > 1 ? "mixed" : (found[0] ?? "other"),
  };
}

export function loggedQuery(query: string): string {
  return query.trim().slice(0, MAX_LOGGED_QUERY);
}

/**
 * How well a search's first result fits, as event properties. The score is
 * rounded: two decimals are all a chart can use, and `weak` already carries
 * the threshold of the mode the search ran in.
 */
export function topMatchShape(top: TopMatch): {
  top_score: number;
  weak: boolean;
} {
  return { top_score: Math.round(top.score * 100) / 100, weak: top.weak };
}

/**
 * Crawlers and search bots, by User-Agent. Shared by the server events and the
 * browser filter. The named ones identify as crawlers without the word "bot":
 * Google's non-search fetchers, skill and agent-site indexers, Exa, Baidu.
 */
export const CRAWLER_UA =
  /bot\b|bot[/_-]|crawler|crawling|spider|slurp|facebookexternalhit|feedfetcher|mediapartners|googleother|google-extended|skillscan|firecrawl|webindexer|agentwebmap|exasearch|exauser|baidu/i;

/**
 * Fetchers that run because a person asked an assistant to read a page. Their
 * User-Agent links to the vendor's bot or crawler docs page
 * (`+https://openai.com/bot`), which `CRAWLER_UA` would otherwise match.
 */
const USER_FETCHER_UA =
  /ChatGPT-User|Claude-User|Perplexity-User|MistralAI-User|OpenCode-User|Google-?Agent|Gemini-Deep-Research/i;

/** A crawler, not a fetch a person set off. This is the `crawler` property of the server events. */
export function isCrawlerUA(userAgent: string): boolean {
  return CRAWLER_UA.test(userAgent) && !USER_FETCHER_UA.test(userAgent);
}

/**
 * Which program is calling, from its User-Agent. A best guess for grouping:
 * clients name themselves freely and most MCP hosts send whatever their HTTP
 * library sends, so `script` and `other` are large buckets by nature.
 *
 * AI vendors keep their own name for their crawlers too (GPTBot is
 * `chatgpt`); `crawler` on the event tells them apart. Every other crawler
 * is `crawler`, checked before `gemini` because Googlebot and GoogleOther
 * are Google's but not Gemini.
 */
const NAMED_CLIENTS: [string, RegExp][] = [
  ["codex", /codex/i],
  ["claude", /claude|anthropic/i],
  ["chatgpt", /chatgpt|openai|oai-/i],
  ["cursor", /cursor/i],
  ["vscode", /vscode|visual studio code|copilot/i],
  ["windsurf", /windsurf|codeium/i],
  ["opencode", /opencode/i],
  ["cline", /\bcline\b/i],
  ["aider", /\baider\b/i],
  ["zed", /\bzed\b/i],
  ["antigravity", /antigravity/i],
  ["perplexity", /perplexity/i],
  ["mistral", /mistral/i],
];

const AFTER_CRAWLERS: [string, RegExp][] = [
  ["gemini", /gemini|google-?agent/i],
  [
    "script",
    /node|undici|bun\/|deno|python|httpx|aiohttp|go-http|curl|wget|axios|okhttp|powershell/i,
  ],
  ["browser", /mozilla/i],
];

export function classifyAgentClient(userAgent: string): string {
  if (!userAgent.trim()) return "unknown";
  const named = NAMED_CLIENTS.find(([, pattern]) => pattern.test(userAgent));
  if (named) return named[0];
  if (isCrawlerUA(userAgent)) return "crawler";
  return (
    AFTER_CRAWLERS.find(([, pattern]) => pattern.test(userAgent))?.[0] ??
    "other"
  );
}

/**
 * Browsers an agent drives report themselves in one of two ways: the
 * automation flag (`navigator.webdriver`) or a product token in the
 * User-Agent. An agent that drives an ordinary browser with an ordinary
 * User-Agent leaves neither and is counted as a human.
 */
const AGENT_BROWSER = /Claude-Agent|Google-Agent|ChatGPT-Agent|HeadlessChrome/i;

export function browserActor(
  userAgent: string,
  webdriver: boolean,
): SearchActor {
  return webdriver || AGENT_BROWSER.test(userAgent) ? "agent" : "human";
}
