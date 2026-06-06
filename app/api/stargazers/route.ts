import { type NextRequest, NextResponse } from "next/server";

import {
  fetchStargazers,
  parseRepoInput,
  StargazersError,
} from "@/lib/github-stargazers";

// Node runtime: the GitHub token + larger paginated responses want full Node.
export const runtime = "nodejs";

/**
 * GET /api/stargazers?repo=<owner/name | github.com URL>
 *
 * Validates the repo reference, fetches stargazers server-side (token never
 * leaves the server), and returns a compact, downsampled payload for the
 * `github-stars` animation. Errors come back as `{ error, code }` with a status.
 */
export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo");

  if (!repoParam) {
    return NextResponse.json(
      { error: "Missing ?repo= parameter.", code: "invalid_repo" },
      { status: 400 },
    );
  }

  const parsed = parseRepoInput(repoParam);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "Invalid repository. Use owner/name or a github.com URL.",
        code: "invalid_repo",
      },
      { status: 400 },
    );
  }

  const { owner, repo } = parsed;

  try {
    const { stargazers, totalStars, truncated } = await fetchStargazers({
      owner,
      repo,
      signal: request.signal,
    });

    return NextResponse.json({ owner, repo, totalStars, truncated, stargazers });
  } catch (err) {
    if (err instanceof StargazersError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    // Client aborted (AbortController) — not an application error.
    if (err instanceof Error && err.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }
    return NextResponse.json(
      { error: "Failed to fetch stargazers.", code: "fetch_failed" },
      { status: 502 },
    );
  }
}
