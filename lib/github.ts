const GITHUB_REPO = "Remocn/remocn";

/**
 * Fetches the repository star count from the GitHub REST API.
 * Cached at the edge for an hour so we never hammer the (unauthenticated)
 * rate limit. Returns `null` on any failure so callers can degrade
 * gracefully to a bare GitHub link.
 */
export async function getGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

/** 1234 → "1.2k", 980 → "980". */
export function formatStars(count: number): string {
  if (count < 1000) return String(count);
  const k = count / 1000;
  return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
}
