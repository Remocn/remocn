import { type NextRequest, NextResponse } from "next/server";
import { negotiate, notAcceptableBody } from "@/lib/accept";
import {
  DOCS_HOME,
  FETCHER_USER_AGENT,
  markdownPathFor,
  VARIANT_HEADER,
} from "@/lib/agent-routing";

const VARY = "Accept, User-Agent";

/**
 * Markdown for agents at the same URLs people use. The home page and docs
 * pages negotiate on Accept (q-values included) and answer with Markdown,
 * HTML or 406. Elsewhere the negotiated variant is passed on as a request
 * header, so a 404 comes back as Markdown to a client that asked for it (see
 * the fallback rewrite in lib/agent-routing.ts).
 */
export function proxy(request: NextRequest) {
  // Only reads negotiate. Server Actions POST with their own Accept.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept");
  const variant = negotiate(accept, {
    preferMarkdown: FETCHER_USER_AGENT.test(
      request.headers.get("user-agent") ?? "",
    ),
  });
  const { pathname } = request.nextUrl;
  const markdownPath = markdownPathFor(pathname);

  if (!markdownPath) return tagVariant(request, variant);

  if (variant === "none") {
    return new NextResponse(notAcceptableBody(accept ?? ""), {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        Vary: VARY,
      },
    });
  }

  if (variant === "markdown") {
    const response = NextResponse.rewrite(new URL(markdownPath, request.url));
    response.headers.set("Vary", VARY);
    return response;
  }

  // `/docs` has no HTML page; people land on the introduction.
  const response =
    pathname === "/docs"
      ? NextResponse.redirect(new URL(DOCS_HOME, request.url), 308)
      : NextResponse.next();
  response.headers.set("Vary", VARY);
  return response;
}

/** Pass the variant on, dropping any value the client sent itself. */
function tagVariant(request: NextRequest, variant: string) {
  const headers = new Headers(request.headers);
  if (variant === "markdown") headers.set(VARIANT_HEADER, "markdown");
  else headers.delete(VARIANT_HEADER);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Everything but build assets, the JSON API, MCP, registry and images.
    "/((?!_next/|api/|mcp|r/|og/|embed/|favicon\\.ico).*)",
  ],
};
