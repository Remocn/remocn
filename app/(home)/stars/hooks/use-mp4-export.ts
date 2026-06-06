"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GitHubStarsInputProps } from "../lib/types";

/**
 * Owns the server-side MP4 export: POST the inputProps to `/api/render`, then
 * poll the job until it's done and trigger a browser download of the result.
 * Server renders work in every browser, so there's no feature-detect — the
 * Download button is always available. `cancel()` stops the client polling.
 */

type RenderStatus = "queued" | "rendering" | "done" | "error";

type JobState = {
  status: RenderStatus;
  progress: number;
  downloadUrl?: string;
  error?: string;
};

const POLL_INTERVAL_MS = 700;

export function useMp4Export() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  // Pending poll timer + a flag so cancel()/unmount can abandon a live job.
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Drop any in-flight poll if the component unmounts mid-export.
  useEffect(() => stopPolling, [stopPolling]);

  const download = useCallback(
    async (inputProps: GitHubStarsInputProps) => {
      cancelledRef.current = false;
      setExporting(true);
      setProgress(0);

      try {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputProps),
        });
        if (!res.ok) {
          throw new Error(await readError(res));
        }
        const { jobId } = (await res.json()) as { jobId: string };

        await new Promise<void>((resolve, reject) => {
          const tick = async () => {
            if (cancelledRef.current) return resolve();
            try {
              const r = await fetch(`/api/render/${jobId}`);
              if (!r.ok) throw new Error("Lost track of the render job");
              const job = (await r.json()) as JobState;
              if (cancelledRef.current) return resolve();

              setProgress(job.progress ?? 0);

              if (job.status === "done" && job.downloadUrl) {
                triggerDownload(job.downloadUrl);
                return resolve();
              }
              if (job.status === "error") {
                return reject(new Error(job.error || "Render failed"));
              }
              pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
            } catch (err) {
              reject(err);
            }
          };
          void tick();
        });
      } catch (err) {
        // Cancellation isn't an error; anything else is retryable (the Download
        // button comes back when exporting flips false) and gets a toast.
        if (!cancelledRef.current) {
          console.error("[stars] MP4 export failed:", err);
          const detail = err instanceof Error ? err.message : String(err);
          toast.error("Export failed", { description: detail });
        }
      } finally {
        stopPolling();
        setExporting(false);
      }
    },
    [stopPolling],
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    setExporting(false);
    setProgress(0);
  }, [stopPolling]);

  return { exporting, progress, download, cancel };
}

/** Navigate a transient anchor to the download route; the server's
 *  Content-Disposition supplies the filename and keeps the page in place. */
function triggerDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Best-effort human-readable message from a failed render response. */
async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // non-JSON body — fall through to a status-based message
  }
  if (res.status === 429) return "Too many requests. Please wait and retry.";
  return `Render request failed (${res.status})`;
}
