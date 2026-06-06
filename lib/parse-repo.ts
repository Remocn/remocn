// Client-safe repo parsing — no `process.env`, no GitHub token, no fetch. Lives
// apart from `github-stargazers.ts` (a server-only module) so the `/stars`
// client tool can validate input without pulling server code into the bundle.

// GitHub owner: alphanumerics + single hyphens, max 39 chars (lenient on edges).
const OWNER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
// Repo name: alphanumerics, dot, hyphen, underscore.
const REPO_RE = /^[a-zA-Z0-9._-]+$/;

/**
 * Normalize a user-supplied repo reference into `{ owner, repo }`.
 *
 * Accepts `owner/name`, a full `https://github.com/owner/name` URL, trailing
 * slashes, a `.git` suffix, and extra path segments (`/tree/main`, etc.).
 * Returns `null` on anything that doesn't yield a charset-valid owner + repo.
 */
export function parseRepoInput(
  input: string,
): { owner: string; repo: string } | null {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;

  // Drop scheme and a leading github.com host if present.
  s = s.replace(/^[a-z]+:\/\//i, "");
  s = s.replace(/^(?:www\.)?github\.com\//i, "");
  // Drop any query string or hash fragment (e.g. "?tab=readme", "#readme") so
  // it can't contaminate the repo segment after the slash split.
  s = s.replace(/[?#].*$/, "");
  // Collapse leading/trailing slashes.
  s = s.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!s) return null;

  const segments = s.split("/");
  if (segments.length < 2) return null;

  const owner = segments[0];
  let repo = segments[1];
  repo = repo.replace(/\.git$/i, "");

  if (!owner || !repo) return null;
  if (!OWNER_RE.test(owner)) return null;
  if (!REPO_RE.test(repo)) return null;
  // A bare "." or ".." repo is invalid on GitHub.
  if (repo === "." || repo === "..") return null;

  return { owner, repo };
}
