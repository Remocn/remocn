import { customizerUrlKey } from "@/lib/customizer-config";
import { SITE_URL } from "@/lib/get-llm-text";

/** URI of the MCP App view shared by `preview_component` and `plan_video`. */
export const PREVIEW_RESOURCE_URI = "ui://remocn/preview";

/**
 * MCP Apps constants, verified against `@modelcontextprotocol/ext-apps@2.0.3`
 * (`dist/src/constants.d.ts`, `spec.types.d.ts`). Inlined rather than imported
 * so the server does not pull the ext-apps client/core peer dependencies.
 */
export const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app";

/**
 * Origin that serves the chrome-less `/embed/<name>` player pages the MCP App
 * view iframes. Defaults to production; set `REMOCN_EMBED_BASE_URL` (e.g.
 * `http://localhost:3123`) to test against a local dev server.
 */
export function embedBaseUrl(): string {
  const raw = process.env.REMOCN_EMBED_BASE_URL?.trim();
  if (!raw) return SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return SITE_URL;
  }
}

export function embedUrl(
  name: string,
  props?: Record<string, unknown>,
): string {
  const url = new URL(`/embed/${encodeURIComponent(name)}`, embedBaseUrl());
  if (props && Object.keys(props).length > 0) {
    url.searchParams.set("props", JSON.stringify(props));
  }
  return url.toString();
}

/**
 * A docs page with the customizer already set to `props`, so a chat preview
 * can hand off to the full panel. Only scalar props have a control; the page
 * ignores keys it has no control for and values its control can't take.
 */
export function customizedDocsUrl(
  page: string,
  name: string,
  props?: Record<string, unknown>,
): string {
  const url = new URL(page);
  for (const [key, value] of Object.entries(props ?? {})) {
    const scalar =
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value));
    if (scalar)
      url.searchParams.set(customizerUrlKey(name, key), String(value));
  }
  return url.toString();
}
