import { OPENAPI_SPEC } from "@/lib/openapi";

export const dynamic = "force-static";

// OpenAPI 3.1 description of the public API; see lib/openapi.ts.
export function GET() {
  return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Readable by browser-based agents and API explorers on other origins.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
