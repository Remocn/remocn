/**
 * Pure catalog search for the MCP server. No I/O here — the records are built
 * from the docs frontmatter + registry.json files in `lib/mcp/catalog.ts` and
 * passed in, so the ranking is testable with plain fixtures.
 */

export type ComponentLength =
  | number
  | "state-driven"
  | "sustained"
  | "transcript-driven";

export interface ComponentRecord {
  name: string;
  title: string;
  description: string;
  /** First docs slug segment, e.g. `typography`. */
  section: string;
  /** Absolute URL of the raw-markdown docs page (`…/docs/<section>/<name>.md`). */
  docs: string;
  vibe?: string;
  length?: ComponentLength;
  /** Registry namespace: `remocn`, `remocn-ui`, `remocn-template`, … */
  tier?: string;
  useWhen: string[];
  avoidWhen: string[];
  install: string;
}

export interface SearchOptions {
  query: string;
  vibe?: string;
  maxLength?: number;
  limit?: number;
}

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "i",
  "in",
  "into",
  "is",
  "it",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "our",
  "some",
  "something",
  "that",
  "the",
  "this",
  "to",
  "want",
  "we",
  "with",
  "component",
  "components",
  "remocn",
]);

export function installCommand(name: string): string {
  return `npx shadcn@latest add @remocn/${name}`;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Exact match; a typed prefix of 4+ chars (`type` → `typewriter`); or a word
 * that is the query minus a short suffix (`counter` → `count`). The reverse
 * direction is capped so `typewriter` does not match every `type`.
 */
function tokenMatches(queryToken: string, word: string): boolean {
  if (queryToken === word) return true;
  if (queryToken.length >= 4 && word.startsWith(queryToken)) return true;
  if (
    word.length >= 4 &&
    queryToken.length - word.length <= 3 &&
    queryToken.startsWith(word)
  )
    return true;
  return false;
}

function fieldHit(queryToken: string, words: string[]): boolean {
  return words.some((w) => tokenMatches(queryToken, w));
}

const WEIGHTS = {
  name: 6,
  title: 5,
  description: 3,
  section: 2,
  useWhen: 2,
  vibe: 1,
} as const;

export function scoreComponent(
  record: ComponentRecord,
  queryTokens: string[],
  rawQuery: string,
): number {
  if (queryTokens.length === 0) return 0;
  const fields = {
    name: tokenize(record.name.replace(/-/g, " ")),
    title: tokenize(record.title),
    description: tokenize(record.description),
    section: tokenize(record.section.replace(/-/g, " ")),
    useWhen: tokenize(record.useWhen.join(" ")),
    vibe: record.vibe ? [record.vibe] : [],
  };

  let score = 0;
  let matchedTokens = 0;
  for (const token of queryTokens) {
    let tokenScore = 0;
    for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
      if (fieldHit(token, fields[key])) tokenScore += WEIGHTS[key];
    }
    if (tokenScore > 0) matchedTokens++;
    score += tokenScore;
  }
  if (score === 0) return 0;

  // Reward covering more of the query, so "number counter" beats a page that
  // just says "number" a lot.
  score *= 1 + matchedTokens / queryTokens.length;

  const normalized = rawQuery.trim().toLowerCase().replace(/\s+/g, "-");
  if (normalized === record.name) score += 50;
  else if (queryTokens.includes(record.name)) score += 15;
  else if (normalized.length >= 3 && record.name.includes(normalized))
    score += 10;

  return score;
}

function passesFilters(
  record: ComponentRecord,
  { vibe, maxLength }: SearchOptions,
): boolean {
  if (vibe && record.vibe !== vibe) return false;
  if (maxLength !== undefined) {
    // Only components with a measured frame count can be compared against a
    // budget — state-driven / sustained / transcript-driven ones are excluded.
    if (typeof record.length !== "number") return false;
    if (record.length > maxLength) return false;
  }
  return true;
}

export function searchComponents(
  records: ComponentRecord[],
  options: SearchOptions,
): ComponentRecord[] {
  const limit = Math.min(
    Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT)),
    MAX_LIMIT,
  );
  const candidates = records.filter((r) => passesFilters(r, options));
  const queryTokens = tokenize(options.query);

  if (queryTokens.length === 0) {
    return [...candidates]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  return candidates
    .map((record) => ({
      record,
      score: scoreComponent(record, queryTokens, options.query),
    }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name),
    )
    .slice(0, limit)
    .map((r) => r.record);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Normalize user input into a registry-style name: `Kinetic Center Build` → `kinetic-center-build`. */
export function normalizeName(input: string): string {
  const last =
    input
      .trim()
      .toLowerCase()
      .replace(/^@remocn\//, "")
      .replace(/\.md$/, "")
      .split("/")
      .pop() ?? "";
  return last.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Closest known names for an unknown lookup: substring hits first, then edit distance. */
export function closestNames(
  names: string[],
  input: string,
  count = 5,
): string[] {
  const target = normalizeName(input);
  if (!target) return [];
  const targetTokens = target.split("-").filter((t) => t.length > 2);
  return names
    .map((name) => {
      let score =
        levenshtein(target, name) / Math.max(target.length, name.length);
      if (name.includes(target) || target.includes(name)) score -= 1;
      const shared = targetTokens.filter((t) => name.split("-").includes(t));
      score -= shared.length * 0.4;
      return { name, score };
    })
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .filter((r) => r.score < 0.6)
    .slice(0, count)
    .map((r) => r.name);
}
