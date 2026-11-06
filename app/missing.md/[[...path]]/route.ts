import { markdownNotFound, safeRequestedPath } from "@/lib/agent-docs";

// The 404 an agent gets when it asked for Markdown. Reached through the
// `fallback` rewrite in next.config.ts, which only runs once no page, file or
// dynamic route matched; the original path arrives as the catch-all segments.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  return markdownNotFound(
    path?.length ? safeRequestedPath(`/${path.join("/")}`) : undefined,
  );
}
