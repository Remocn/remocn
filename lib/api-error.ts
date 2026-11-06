const OPENAPI_URL = "https://remocn.dev/openapi.json";

/**
 * The API's error shape: `{ error, code }` like every route under app/api,
 * plus a `hint` on what to do next and a link to the API description.
 */
export function apiError(
  status: number,
  code: string,
  error: string,
  hint?: string,
): Response {
  return Response.json(
    { error, code, ...(hint ? { hint } : {}), docs: OPENAPI_URL },
    { status },
  );
}
