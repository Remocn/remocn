import "server-only";
import * as fsPromises from "node:fs/promises";
import path from "node:path";
import { RENDER_WORK_DIR } from "./paths";
import { deleteJob, listJobs } from "./render-queue";

/**
 * Disk hygiene for the render work dir. Two mechanisms:
 *  - `deleteJobFile` removes a single MP4 right after it's been downloaded.
 *  - a guarded `setInterval` TTL sweep deletes any leftover files older than
 *    the TTL (downloads that never happened, crashed renders) so the disk can't
 *    fill up.
 */

/** How long a finished file may sit before the sweep reclaims it. */
function ttlMs(): number {
  const parsed = Number(process.env.RENDER_FILE_TTL_MS);
  return Number.isFinite(parsed) && parsed >= 1000
    ? Math.floor(parsed)
    : 600_000;
}

/** How often the sweep runs — derived from the TTL (at least once a minute). */
function sweepIntervalMs(): number {
  return Math.max(60_000, ttlMs());
}

/** Delete a single job's MP4 (best-effort) and drop it from the registry. */
export async function deleteJobFile(jobId: string): Promise<void> {
  const filePath = path.join(RENDER_WORK_DIR, `${jobId}.mp4`);
  try {
    await fsPromises.rm(filePath, { force: true });
  } finally {
    deleteJob(jobId);
  }
}

/** Remove every `.mp4` in the work dir older than the TTL. */
export async function sweepOnce(): Promise<void> {
  const ttl = ttlMs();
  const now = Date.now();

  let entries: string[];
  try {
    entries = await fsPromises.readdir(RENDER_WORK_DIR);
  } catch {
    entries = [];
  }

  await Promise.all(
    entries
      .filter((name) => name.endsWith(".mp4"))
      .map(async (name) => {
        const filePath = path.join(RENDER_WORK_DIR, name);
        try {
          const info = await fsPromises.stat(filePath);
          if (now - info.mtimeMs > ttl) {
            await fsPromises.rm(filePath, { force: true });
            deleteJob(path.basename(name, ".mp4"));
          }
        } catch {
          // File vanished between readdir and stat — ignore.
        }
      }),
  );

  for (const [jobId, job] of listJobs()) {
    if (now - job.createdAt <= ttl) continue;
    if (job.status === "error" || job.status === "done") deleteJob(jobId);
  }
}

// Module-level guard: ensure the sweep timer is installed exactly once per
// process, even if multiple routes import this module.
let sweepStarted = false;

/** Start the periodic TTL sweep (idempotent). */
export function ensureCleanupSweep(): void {
  if (sweepStarted) return;
  sweepStarted = true;

  const timer = setInterval(() => {
    void sweepOnce();
  }, sweepIntervalMs());
  // Don't keep the process alive just for the sweep.
  timer.unref?.();
}
