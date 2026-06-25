import type { PlayerRef } from "@remotion/player";
import { type RefObject, useEffect } from "react";

/**
 * Reliable autoplay for a `<Player>`. The `autoPlay` prop is discouraged and
 * programmatic `play()` is "not entirely deterministic" (Remotion docs) — the
 * player can mount a tick before its imperative handle is ready, and on the
 * landing page many Players mount at once, so a player often isn't ready within
 * a frame or two. Mount the Player paused and drive `play()` here, retrying each
 * animation frame until it actually reports playing (bounded so a genuinely
 * blocked player can't spin forever). These compositions have no audio, so the
 * browser autoplay policy permits programmatic playback.
 */
export function useAutoplay(
  playerRef: RefObject<PlayerRef | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // ~2s at 60fps, longer on a contended mount
    const tick = () => {
      const player = playerRef.current;
      if (player && !player.isPlaying()) player.play();
      attempts += 1;
      if ((!player || !player.isPlaying()) && attempts < MAX_ATTEMPTS) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerRef, enabled]);
}
