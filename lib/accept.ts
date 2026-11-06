/**
 * Accept-header negotiation between the two representations of a page: HTML
 * (the default) and Markdown. Follows RFC 9110 §12.5.1 and the test vectors at
 * acceptmarkdown.com/guides/accept-parsing: each type scores the q-value of
 * its most specific matching entry (exact > type/* > *\/*), `q=0` rules a type
 * out, and nothing acceptable means 406.
 */

export type Variant = "markdown" | "html" | "none";

type Entry = { type: string; subtype: string; q: number };

type Match = { q: number; specificity: number };

const NO_MATCH: Match = { q: 0, specificity: -1 };

export function parseAccept(header: string): Entry[] {
  const entries: Entry[] = [];
  for (const part of header.split(",")) {
    const [range, ...params] = part.split(";").map((s) => s.trim());
    const [type, subtype] = range.toLowerCase().split("/");
    if (!type || !subtype) continue;
    let q = 1;
    for (const param of params) {
      const [key, value] = param.split("=").map((s) => s.trim());
      if (key?.toLowerCase() !== "q") continue;
      q = Number(value);
    }
    if (!Number.isFinite(q) || q < 0 || q > 1) continue;
    entries.push({ type, subtype, q });
  }
  return entries;
}

/** The q-value the most specific matching entry gives `mime`. */
export function matchType(entries: Entry[], mime: string): Match {
  const [type, subtype] = mime.split("/");
  let best = NO_MATCH;
  for (const entry of entries) {
    let specificity = -1;
    if (entry.type === type && entry.subtype === subtype) specificity = 2;
    else if (entry.type === type && entry.subtype === "*") specificity = 1;
    else if (entry.type === "*" && entry.subtype === "*") specificity = 0;
    if (specificity > best.specificity) best = { q: entry.q, specificity };
  }
  return best;
}

// What the HTML route can answer with: the page itself, or the RSC payload
// Next's client router asks for with `Accept: text/x-component`.
const HTML_TYPES = ["text/html", "application/xhtml+xml", "text/x-component"];

/**
 * Pick the representation for a request.
 *
 * - No Accept header, or `*\/*`: HTML, the default.
 * - Markdown wins when the client names `text/markdown` with a q-value at
 *   least as high as HTML's (so `text/markdown, text/html, *\/*`, which Claude
 *   Code sends, gets Markdown).
 * - `preferMarkdown` (a fetcher reading the page for a user) takes Markdown
 *   whenever the client accepts it at all.
 * - Neither type acceptable: `none`, which the caller answers with 406.
 */
export function negotiate(
  header: string | null,
  { preferMarkdown = false }: { preferMarkdown?: boolean } = {},
): Variant {
  if (!header?.trim()) return preferMarkdown ? "markdown" : "html";

  const entries = parseAccept(header);
  if (entries.length === 0) return preferMarkdown ? "markdown" : "html";

  const markdown = matchType(entries, "text/markdown");
  const html = HTML_TYPES.map((t) => matchType(entries, t)).reduce((a, b) =>
    b.q > a.q ? b : a,
  );

  if (markdown.q > 0 && preferMarkdown) return "markdown";
  if (markdown.q > 0 && markdown.specificity === 2 && markdown.q >= html.q) {
    return "markdown";
  }
  if (html.q > 0) return "html";
  if (markdown.q > 0) return "markdown";
  return "none";
}

/** Body of the 406: what the URL can be served as. */
export function notAcceptableBody(accept: string): string {
  return [
    "406 Not Acceptable",
    "",
    `Requested: ${accept.slice(0, 200)}`,
    "Available: text/html, text/markdown",
    "",
    "Retry with Accept: text/html or Accept: text/markdown.",
    "",
  ].join("\n");
}
