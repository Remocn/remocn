/**
 * Warm the browser cache for the stargazer avatars BEFORE the Remotion Player
 * mounts. The composition renders them with Remotion's <Img> (which blocks the
 * first frame via delayRender until each image loads). If the Player autoPlays
 * into a batch of un-cached remote avatars it buffers and doesn't reliably
 * resume — the preview appears frozen until you manually pause/play. Preloading
 * first makes <Img> resolve from cache instantly, so autoPlay just works.
 *
 * `crossOrigin = "anonymous"` MUST match Remotion's <Img> so the CORS-enabled
 * cache entry is reused (otherwise the browser keeps a separate entry and
 * Remotion re-fetches). Each image resolves on load OR error (a broken avatar
 * must not block), and the whole batch is bounded by a timeout so one slow image
 * can't stall the transition to the ready state.
 */
export function preloadAvatars(urls: string[], timeoutMs = 2500): Promise<void> {
  if (typeof window === "undefined" || urls.length === 0) {
    return Promise.resolve();
  }

  const loads = urls.map(
    (url) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      }),
  );

  const all = Promise.all(loads).then(() => undefined);
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });
  return Promise.race([all, timeout]);
}
