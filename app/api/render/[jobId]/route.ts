import { NextResponse } from "next/server";

import { getJob } from "@/lib/server/render-queue";

// Node runtime: shares the in-memory job registry with the render route.
export const runtime = "nodejs";

/**
 * GET /api/render/[jobId]
 *
 * Poll a render's progress. Returns:
 *   { status, progress, downloadUrl?, error? }
 * where status is "queued" | "rendering" | "done" | "error", progress is in
 * [0, 1], `downloadUrl` is present only when done, and `error` only on failure.
 * 404 `{ error, code }` for an unknown job.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "Unknown render job.", code: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    ...(job.status === "done"
      ? { downloadUrl: `/api/render/${jobId}/download` }
      : {}),
    ...(job.status === "error" ? { error: job.error } : {}),
  });
}
