import { createMcpHandler } from "@modelcontextprotocol/server";
import { createRemocnMcpServer } from "@/lib/mcp/server";

/**
 * Remote MCP server at https://remocn.dev/mcp — read-only, no auth, stateless.
 *
 * `createMcpHandler` (@modelcontextprotocol/server v2) builds a fresh server
 * per request. It serves 2026-07-28 clients natively and 2025-era clients
 * through its stateless streamable-HTTP fallback (POST only; GET/DELETE, the
 * 2025 session operations, answer 405). Responses are plain JSON — no tool here
 * streams progress, so SSE buys nothing.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMcpHandler(() => createRemocnMcpServer(), {
  responseMode: "json",
  // Tool inputs are short strings; the SDK's 4 MiB default is far more than
  // any legitimate call needs.
  maxRequestBodySize: 64_000,
});

const EXPOSED_HEADERS = "Mcp-Session-Id, Mcp-Protocol-Version";

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      request.headers.get("Access-Control-Request-Headers") ??
      "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Mcp-Method, Mcp-Name, Last-Event-ID",
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "86400",
  });
  headers.append("Vary", "Access-Control-Request-Headers");
  return headers;
}

async function serve(request: Request): Promise<Response> {
  const response = await handler.fetch(request);
  const headers = new Headers(response.headers);
  for (const [key, value] of corsHeaders(request)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export const GET = serve;
export const POST = serve;
export const DELETE = serve;
