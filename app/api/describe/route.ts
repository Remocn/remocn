import { getDb } from "@/lib/db";
import { withinBurst } from "@/lib/describe/burst";
import { modelCaller } from "@/lib/describe/claude";
import { clientAddress, clientKey } from "@/lib/describe/client-key";
import { loadControls } from "@/lib/describe/controls-server";
import { describe } from "@/lib/describe/describe";
import { matchPreset } from "@/lib/describe/match-server";
import { MAX_TEXT, REQUESTS_PER_MINUTE } from "@/lib/describe/policy";
import { loadPresets } from "@/lib/describe/presets-server";
import { prune } from "@/lib/describe/store";
import type { DescribeRequest } from "@/lib/describe/types";
import { getCatalog } from "@/lib/mcp/catalog";

export const runtime = "nodejs";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/** A request is a sentence and the panel's values; nothing honest is bigger. */
const MAX_BODY = 8 * 1024;

/**
 * POST /api/describe — the customizer's describe field: a sentence in, a
 * patch of the component's props out (lib/describe/describe.ts).
 *
 * The fetch-metadata check keeps other sites' pages from calling it through
 * their visitors' browsers. A script can send the header too, so the abuse
 * protection is the guard in lib/describe, not this.
 */
export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") !== "same-origin") {
    return error("Not available.", 403);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return error("Request too large.", 413);
  }

  let body: Partial<DescribeRequest>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return error("Request too large.", 413);
    body = JSON.parse(raw);
  } catch {
    return error("Invalid JSON.", 400);
  }
  const { name, text, values, mode } = body;
  const controls = typeof name === "string" ? await loadControls(name) : null;
  if (typeof name !== "string" || !controls) {
    return error("Unknown component.", 404);
  }
  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT) {
    return error(`Describe the look in 1–${MAX_TEXT} characters.`, 400);
  }
  if (!/\p{L}/u.test(text)) return error("Describe the look in words.", 400);

  const address = clientAddress(request.headers);
  const client = address ? clientKey(address) : null;
  if (client && !withinBurst(client, REQUESTS_PER_MINUTE)) {
    return error("Too many requests. Try again in a minute.", 429);
  }

  const facts = getCatalog().registry.get(name);
  const presets = await loadPresets(name, controls);
  const now = new Date();

  const result = await describe(
    { text, values: values ?? {}, mode: mode === "free" ? "free" : "auto" },
    {
      name,
      title: facts?.title ?? name,
      description: facts?.description ?? "",
      controls,
      presets,
    },
    { now, client, db: getDb, match: matchPreset, ask: modelCaller() },
  );

  if (Math.random() < 0.02) {
    void getDb()
      .then((db) => db && prune(db, now))
      .catch(() => {});
  }
  return Response.json(result);
}
