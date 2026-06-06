import type { StargazersPayload } from "./types";

/** Carries the GitHub-side `code` + HTTP `status` so callers can map a message. */
export class StargazersApiError extends Error {
  code?: string;
  status: number;

  constructor(status: number, code?: string) {
    super(`stargazers request failed (${status})`);
    this.name = "StargazersApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Fetch the stargazers payload for a raw repo reference.
 *
 * Throws {@link StargazersApiError} on a non-OK response. Returns the payload
 * unmodified on success — including the zero-star 200 case, so the caller can
 * branch into a friendly inline state rather than a hard error.
 */
export async function fetchStargazers(
  rawRepo: string,
  signal: AbortSignal,
): Promise<StargazersPayload> {
  const res = await fetch(
    `/api/stargazers?repo=${encodeURIComponent(rawRepo)}`,
    { signal },
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      code?: string;
    } | null;
    throw new StargazersApiError(res.status, body?.code);
  }

  return (await res.json()) as StargazersPayload;
}
