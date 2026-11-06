import { apiError } from "@/lib/api-error";

// Any /api path with no route of its own. Without this Next answers with the
// HTML 404 page, which an API client can't parse.
function notFound(request: Request): Response {
  const { pathname } = new URL(request.url);
  return apiError(
    404,
    "not_found",
    `No API endpoint at ${pathname}.`,
    "See https://remocn.dev/openapi.json for the available endpoints.",
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
