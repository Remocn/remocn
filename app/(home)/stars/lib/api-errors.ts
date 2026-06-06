/** Map an /api/stargazers error (code + HTTP status) to a friendly toast string. */
export function messageForApiError(code?: string, status?: number): string {
  if (code === "not_found" || status === 404) {
    return "Repository not found — check owner/name";
  }
  if (code === "rate_limited" || status === 429) {
    return "GitHub rate limit hit — try again shortly";
  }
  if (code === "invalid_repo" || status === 400) {
    return "Invalid repository. Use owner/name";
  }
  return "Couldn't reach GitHub — retry";
}
