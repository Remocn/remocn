// Server-only module: reads `process.env.GITHUB_TOKEN` and is imported only by
// the `/api/stargazers` route handler. Never import this from a client component.
import { formatStars } from "@/lib/github";

// Re-export so the /stars consumer can format counts without a second import.
export { formatStars };

/** A single stargazer keyframe — mirrors the registry `github-stars` component. */
export type Stargazer = {
  login: string;
  avatarUrl: string;
  /** ISO timestamp, e.g. "2021-03-04T11:22:33Z". */
  starredAt: string;
};

export type StargazersResult = {
  stargazers: Stargazer[];
  totalStars: number;
  /** True when the repo exceeds GitHub's ~400-page (~40k-star) listing ceiling. */
  truncated: boolean;
};

export type StargazersErrorCode =
  | "invalid_repo"
  | "not_found"
  | "rate_limited"
  | "fetch_failed";

/** Typed error so the route handler can map cleanly to a status + JSON code. */
export class StargazersError extends Error {
  readonly code: StargazersErrorCode;
  readonly status: number;
  constructor(code: StargazersErrorCode, message: string, status: number) {
    super(message);
    this.name = "StargazersError";
    this.code = code;
    this.status = status;
  }
}

/**
 * We only need ~60 keyframes spread across the repo's whole star history, so we
 * fetch a small, evenly-spaced SAMPLE of pages instead of every page — a handful
 * of requests regardless of repo size (this used to page through up to 5000
 * stargazers). GitHub won't list stargazers past ~page 400 (~40k stars); beyond
 * that the newest are unreachable → `truncated: true`.
 */
const SAMPLE_PAGES = 8;
const GITHUB_MAX_LISTABLE_PAGES = 400;
const PER_PAGE = 100;
// High enough to fetch every sampled page in a single parallel round.
const CONCURRENCY = 8;
/**
 * Keyframe cap — how many avatars the clip animates. Fewer avatars = far less
 * image loading + decoding in BOTH the Player preview and the MP4 render, which
 * is the dominant cost here. Kept ≤ the component's own downsample cap.
 */
const KEYFRAME_CAP = 40;
/**
 * GitHub avatars honor an `s=<px>` size query. Requesting ~120px (retina-safe for
 * the ~60px on-screen size) downloads ~5KB instead of the default ~50-100KB+
 * image — the single biggest win for preview load time and render speed.
 */
const AVATAR_SIZE = 120;
const API_BASE = "https://api.github.com";

// `parseRepoInput` lives in a client-safe module so the `/stars` client tool can
// validate input without importing this server-only file. Re-exported here so
// the route handler + tests keep their existing `@/lib/github-stargazers` import.
export { parseRepoInput } from "@/lib/parse-repo";

function buildHeaders(accept: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Map a non-OK GitHub response to a typed error (rate limit vs. not found). */
function errorForResponse(res: Response, context: string): StargazersError {
  if (res.status === 404) {
    return new StargazersError("not_found", "Repository not found.", 404);
  }
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (res.status === 429 || (res.status === 403 && remaining === "0")) {
    return new StargazersError(
      "rate_limited",
      "GitHub API rate limit exceeded. Add a GITHUB_TOKEN to raise the limit.",
      429,
    );
  }
  return new StargazersError(
    "fetch_failed",
    `GitHub request failed (${context}): ${res.status} ${res.statusText}`,
    502,
  );
}

/** Pull the `rel="last"` page number out of a GitHub Link header, if any. */
function parseLastPage(link: string | null): number | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    const match = part.match(/[?&]page=(\d+)[^>]*>\s*;\s*rel="last"/);
    if (match) return Number(match[1]);
  }
  return null;
}

type RawStargazer = {
  starred_at?: string;
  user?: { login?: string; avatar_url?: string } | null;
};

/** Append GitHub's `s=` size query for a much smaller avatar download. */
function withAvatarSize(url: string): string {
  return url.includes("?")
    ? `${url}&s=${AVATAR_SIZE}`
    : `${url}?s=${AVATAR_SIZE}`;
}

function mapEntry(raw: RawStargazer): Stargazer | null {
  const user = raw?.user;
  if (!user?.login || !user.avatar_url || !raw.starred_at) return null;
  return {
    login: user.login,
    avatarUrl: withAvatarSize(user.avatar_url),
    starredAt: raw.starred_at,
  };
}

/**
 * Evenly sample down to `max` keyframes, always keeping the first and last
 * entry. Replicated from the component's `downsampleStargazers` so the data
 * layer stays free of the `"use client"` registry module.
 */
function downsample(stargazers: Stargazer[], max = KEYFRAME_CAP): Stargazer[] {
  const len = stargazers.length;
  if (len <= max) return stargazers;
  if (max <= 1) return len ? [stargazers[0]] : [];
  const out: Stargazer[] = [];
  for (let i = 0; i < max; i++) {
    out.push(stargazers[Math.round((i * (len - 1)) / (max - 1))]);
  }
  return out;
}

/**
 * Evenly spaced page numbers across `[1..last]`, inclusive of the first (oldest
 * stargazers) and last (newest) page, de-duplicated. For small repos
 * (`last <= count`) this is simply every page.
 */
function samplePageNumbers(last: number, count: number): number[] {
  if (last <= count) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  for (let i = 0; i < count; i++) {
    pages.add(1 + Math.round((i * (last - 1)) / (count - 1)));
  }
  return [...pages].sort((a, b) => a - b);
}

/** Run `fn` over `items` with a bounded number of in-flight requests. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function fetchStargazerPage(
  owner: string,
  repo: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ entries: RawStargazer[]; link: string | null }> {
  const url = `${API_BASE}/repos/${owner}/${repo}/stargazers?per_page=${PER_PAGE}&page=${page}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: buildHeaders("application/vnd.github.star+json"),
      signal,
      next: { revalidate: 3600 },
    });
  } catch (err) {
    if (err instanceof StargazersError) throw err;
    throw new StargazersError(
      "fetch_failed",
      `Network error fetching stargazers page ${page}.`,
      502,
    );
  }
  if (!res.ok) throw errorForResponse(res, `stargazers page ${page}`);
  const entries = (await res.json()) as RawStargazer[];
  return { entries, link: res.headers.get("link") };
}

/**
 * Fetch a repository's stargazers with `starred_at` timestamps, sorted oldest
 * → newest and downsampled to a small keyframe set for the animation.
 *
 * - Uses `Accept: application/vnd.github.star+json` (required for `starred_at`).
 * - Sends `Authorization: Bearer ${GITHUB_TOKEN}` only when the env var is set;
 *   works unauthenticated (60/hr) too.
 * - Reads the page count from the first response's Link header, then fetches a
 *   small evenly-spaced SAMPLE of pages (including the newest) in parallel — fast
 *   regardless of repo size. `truncated: true` only when GitHub can't list past
 *   its ~40k-star ceiling.
 * - Throws {@link StargazersError} for not-found / rate-limited / fetch failures.
 */
export async function fetchStargazers({
  owner,
  repo,
  signal,
}: {
  owner: string;
  repo: string;
  signal?: AbortSignal;
}): Promise<StargazersResult> {
  // 1. Repo endpoint → existence check (404) + authoritative star total.
  let repoRes: Response;
  try {
    repoRes = await fetch(`${API_BASE}/repos/${owner}/${repo}`, {
      headers: buildHeaders("application/vnd.github+json"),
      signal,
      next: { revalidate: 3600 },
    });
  } catch (err) {
    if (err instanceof StargazersError) throw err;
    throw new StargazersError(
      "fetch_failed",
      "Network error fetching repository.",
      502,
    );
  }
  if (!repoRes.ok) throw errorForResponse(repoRes, "repo");
  const repoData = (await repoRes.json()) as { stargazers_count?: number };
  const totalStars =
    typeof repoData.stargazers_count === "number"
      ? repoData.stargazers_count
      : 0;

  // 2. Zero-star repo: nothing to paginate, render gracefully.
  if (totalStars === 0) {
    return { stargazers: [], totalStars: 0, truncated: false };
  }

  // 3. First page drives the page count via its Link header.
  const first = await fetchStargazerPage(owner, repo, 1, signal);
  const lastPage = parseLastPage(first.link) ?? 1;
  const listableLast = Math.min(lastPage, GITHUB_MAX_LISTABLE_PAGES);
  // "truncated" only when GitHub itself can't list the newest stargazers (repos
  // beyond its ~40k-star ceiling); a normal sample still spans first → last.
  const truncated = lastPage > GITHUB_MAX_LISTABLE_PAGES;

  const rawEntries: RawStargazer[] = [...first.entries];

  // 4. Fetch a small, evenly-spaced SAMPLE of the remaining pages in parallel —
  //    enough to span the whole history (including the genuine newest page)
  //    without paging through thousands of stargazers we'd only downsample away.
  const samplePages = samplePageNumbers(listableLast, SAMPLE_PAGES).filter(
    (p) => p !== 1,
  );
  if (samplePages.length) {
    const pageResults = await mapWithConcurrency(
      samplePages,
      CONCURRENCY,
      (page) => fetchStargazerPage(owner, repo, page, signal),
    );
    for (const result of pageResults) rawEntries.push(...result.entries);
  }

  // 5. Map → filter → sort ascending by starredAt → downsample.
  const mapped = rawEntries
    .map(mapEntry)
    .filter((s): s is Stargazer => s !== null)
    .sort((a, b) => a.starredAt.localeCompare(b.starredAt));

  const stargazers = downsample(mapped);

  return { stargazers, totalStars, truncated };
}
