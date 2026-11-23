/** The frame rate every preview on the site plays at. */
export const PREVIEW_FPS = 60;

/**
 * A preview's own timing, as its config or the manifest states it, at the
 * site's frame rate: the same seconds in more frames. Components keep their
 * timing at any rate (`@/lib/remocn/frame-rate`), so only what the Player is
 * told changes. A preview already at the site's rate (the templates) comes
 * back as it is, and one that names its own `previewFps` plays at that.
 */
export function atPreviewRate<
  T extends { fps: number; durationInFrames: number; previewFps?: number },
>(timing: T): T {
  const k = previewScale(timing.fps, timing.previewFps);
  return k === 1
    ? timing
    : {
        ...timing,
        fps: timing.fps * k,
        durationInFrames: Math.round(timing.durationInFrames * k),
      };
}

/** How many of the site's frames one frame of a preview's config lasts. */
export function previewScale(fps: number, target = PREVIEW_FPS): number {
  return Math.max(1, Math.round(target / fps));
}
