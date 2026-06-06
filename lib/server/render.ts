import "server-only";
import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { getServeUrl } from "./bundle";
import type { Orientation, RenderInput } from "./validate-input";

/**
 * Server-side MP4 render of the `github-stars` composition. Runs full native
 * quality (this is the 8-core box, not a weak client): horizontal 1280×720,
 * vertical 720×1280, 30fps — no downscale. Width/height are overridden per
 * orientation on the selected composition so a single bundle entry serves both.
 */

const COMPOSITION_ID = "github-stars";

/** Native render dimensions per orientation (no client downscale). */
function dimsFor(orientation: Orientation): { width: number; height: number } {
  return orientation === "vertical"
    ? { width: 720, height: 1280 }
    : { width: 1280, height: 720 };
}

/** Concurrency (Chromium tabs) for a single render; env-tunable, default 4. */
function remotionConcurrency(): number {
  const parsed = Number(process.env.REMOTION_CONCURRENCY);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 4;
}

export interface RenderStarsVideoOptions {
  /** Validated, render-ready props (see parseRenderInput). */
  inputProps: RenderInput;
  /** Drives the output dimensions (overrides the composition defaults). */
  orientation: Orientation;
  /** Absolute path the encoded MP4 is written to. */
  outputPath: string;
  /** Render progress in [0, 1]. */
  onProgress?: (progress: number) => void;
  /** Abort the render (e.g. client disconnect / timeout) → cancels Chromium. */
  signal?: AbortSignal;
}

/**
 * Render the composition to `outputPath` and resolve with that same path.
 * Bridges a standard AbortSignal onto Remotion's CancelSignal so callers can
 * kill a stuck/abandoned render.
 */
export async function renderStarsVideo({
  inputProps,
  orientation,
  outputPath,
  onProgress,
  signal,
}: RenderStarsVideoOptions): Promise<string> {
  if (signal?.aborted) {
    throw new Error("Render aborted before it started");
  }

  const serveUrl = await getServeUrl();
  const { width, height } = dimsFor(orientation);

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  // Bridge AbortSignal → Remotion CancelSignal.
  const { cancelSignal, cancel } = makeCancelSignal();
  const onAbort = () => cancel();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    await renderMedia({
      composition: { ...composition, width, height },
      serveUrl,
      codec: "h264",
      inputProps,
      outputLocation: outputPath,
      concurrency: remotionConcurrency(),
      cancelSignal,
      onProgress: onProgress
        ? ({ progress }) => onProgress(progress)
        : undefined,
    });
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  return outputPath;
}
