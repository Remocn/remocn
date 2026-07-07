import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import { renderStarsVideo } from "./render";
import type { RenderInput } from "./validate-input";
import { RENDER_WORK_DIR } from "./paths";

/**
 * In-process render orchestration: a global concurrency semaphore plus a job
 * registry so the API can return a `jobId` immediately (202) and let the client
 * poll for progress. Renders are CPU-heavy (native Chromium), so at most
 * `RENDER_MAX_CONCURRENT` run at once; the rest wait in the limiter's queue.
 *
 * State is intentionally in-memory: a single long-lived Node process owns the
 * work dir, and a job only matters until its MP4 is downloaded (then swept).
 * Restarting the process drops in-flight jobs by design — clients re-POST.
 */

export type JobStatus = "queued" | "rendering" | "done" | "error";

export interface JobState {
  status: JobStatus;
  /** Render progress in [0, 1]. */
  progress: number;
  /** Absolute path to the finished MP4 (only once status === "done"). */
  outputPath?: string;
  /** Human-readable failure reason (only once status === "error"). */
  error?: string;
  /** Original repo slug, used to name the downloaded file. */
  repo: string;
  createdAt: number;
}

/** Max simultaneous renders; the rest queue. Sized for the 8-vCPU box. */
function maxConcurrent(): number {
  const parsed = Number(process.env.RENDER_MAX_CONCURRENT);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 2;
}

/** Hard ceiling on a single render before it's aborted as stuck. */
function renderTimeoutMs(): number {
  const parsed = Number(process.env.RENDER_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed >= 1000 ? Math.floor(parsed) : 120_000;
}

/** Max jobs allowed in flight or waiting before new ones are rejected. */
function maxQueueDepth(): number {
  const parsed = Number(process.env.RENDER_MAX_QUEUE);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 10;
}

const limit = pLimit(maxConcurrent());
const jobs = new Map<string, JobState>();

/** Thrown by enqueueRender when the queue is already at maxQueueDepth(). */
export class QueueFullError extends Error {
  constructor() {
    super("Render queue is full");
    this.name = "QueueFullError";
  }
}

/**
 * Register a render and kick it off through the concurrency limiter. Returns the
 * `jobId` synchronously — the actual render runs in the background and updates
 * the registry. Never await the returned render work in the request handler.
 */
export function enqueueRender(input: RenderInput): string {
  if (limit.activeCount + limit.pendingCount >= maxQueueDepth()) {
    throw new QueueFullError();
  }

  const jobId = randomUUID();
  const outputPath = path.join(RENDER_WORK_DIR, `${jobId}.mp4`);

  const job: JobState = {
    status: "queued",
    progress: 0,
    repo: input.repo,
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Fire-and-forget: the limiter serializes execution, errors are captured into
  // the job state, and we swallow the promise so it never becomes unhandled.
  void limit(() => runRender(jobId, input, outputPath)).catch((err) => {
    const current = jobs.get(jobId);
    if (current && current.status !== "done") {
      current.status = "error";
      current.error = err instanceof Error ? err.message : "Render failed";
    }
  });

  return jobId;
}

/** Snapshot of a job's state, or undefined if the id is unknown. */
export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}

/** Drop a job from the registry (called after its file is cleaned up). */
export function deleteJob(jobId: string): void {
  jobs.delete(jobId);
}

/** Read-only view of the registry for the TTL sweep. */
export function listJobs(): ReadonlyMap<string, JobState> {
  return jobs;
}

async function runRender(
  jobId: string,
  input: RenderInput,
  outputPath: string,
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return; // deleted before it got a slot

  job.status = "rendering";

  await mkdir(RENDER_WORK_DIR, { recursive: true });

  // Per-render timeout: abort stuck Chromium so a wedged render can't hold a
  // semaphore slot forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), renderTimeoutMs());

  try {
    await renderStarsVideo({
      inputProps: input,
      orientation: input.orientation,
      outputPath,
      signal: controller.signal,
      onProgress: (progress) => {
        const current = jobs.get(jobId);
        if (current) current.progress = progress;
      },
    });

    job.status = "done";
    job.progress = 1;
    job.outputPath = outputPath;
  } catch (err) {
    job.status = "error";
    job.error = controller.signal.aborted
      ? "Render timed out"
      : err instanceof Error
        ? err.message
        : "Render failed";
  } finally {
    clearTimeout(timeout);
  }
}
