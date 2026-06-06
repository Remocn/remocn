import "server-only";
import os from "node:os";
import path from "node:path";

/**
 * Shared filesystem location for rendered MP4s. A single dir owned by the Node
 * process; the queue writes `${jobId}.mp4` here, the download route streams from
 * it, and the cleanup sweep prunes it. Overridable via `RENDER_WORK_DIR` (e.g.
 * a tmpfs/volume on the box); defaults to the OS temp dir.
 */
export const RENDER_WORK_DIR =
  process.env.RENDER_WORK_DIR?.trim() ||
  path.join(os.tmpdir(), "remocn-renders");
