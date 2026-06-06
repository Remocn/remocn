import { type NextRequest, NextResponse } from "next/server";

import { parseRenderInput, RenderInputError } from "@/lib/server/validate-input";
import { enqueueRender } from "@/lib/server/render-queue";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { ensureCleanupSweep } from "@/lib/server/cleanup";

// Node runtime: native Remotion render (Chromium) needs full Node, not edge.
export const runtime = "nodejs";

/**
 * POST /api/render
 *
 * Body: the render props (see RenderInput) —
 *   { repo, totalStars, stargazers[], orientation, accentColor?, speed?, theme? }
 *
 * Rate-limits per IP, validates the payload, enqueues a background render, and
 * returns `{ jobId }` (202) immediately. The render never blocks the request;
 * poll `GET /api/render/[jobId]` for progress. Errors: `{ error, code }`.
 */
export async function POST(request: NextRequest) {
  // Install the TTL sweep on first request (idempotent).
  ensureCleanupSweep();

  const ip = clientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many render requests. Please wait and retry.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", code: "invalid_json" },
      { status: 400 },
    );
  }

  let input;
  try {
    input = parseRenderInput(body);
  } catch (err) {
    if (err instanceof RenderInputError) {
      return NextResponse.json(
        { error: err.message, code: "invalid_input" },
        { status: err.status },
      );
    }
    throw err;
  }

  const jobId = enqueueRender(input);
  return NextResponse.json({ jobId }, { status: 202 });
}

/** First hop of x-forwarded-for (the real client behind the proxy), else fallback. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
