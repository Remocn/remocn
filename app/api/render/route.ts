import { type NextRequest, NextResponse } from "next/server";

import { parseRenderInput, RenderInputError } from "@/lib/server/validate-input";
import { enqueueRender, QueueFullError } from "@/lib/server/render-queue";
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

  let jobId: string;
  try {
    jobId = enqueueRender(input);
  } catch (err) {
    if (err instanceof QueueFullError) {
      return NextResponse.json(
        { error: "Render queue is full. Please retry shortly.", code: "queue_full" },
        { status: 503 },
      );
    }
    throw err;
  }

  return NextResponse.json({ jobId }, { status: 202 });
}

/**
 * The real client IP, trusting only what Traefik (the one proxy in front of
 * this process) sets: `x-real-ip`, or else the LAST hop of `x-forwarded-for`
 * (Traefik appends the peer; earlier hops are client-controlled and spoofable).
 */
function clientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }

  return "unknown";
}
