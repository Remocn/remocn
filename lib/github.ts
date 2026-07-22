const GITHUB_REPO = "Remocn/remocn";

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

export function formatStars(count: number): string {
  const formatter = new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" })

  return formatter.format(count);
}
