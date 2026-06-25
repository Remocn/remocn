"use client";

import type { PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Owns the Remotion Player play/pause control + a `playing` flag that mirrors the
 * ACTUAL player (driven by its play/pause events, not a guess).
 *
 * The `<Player autoPlay>` prop is unreliable here — the player tends to mount a
 * tick before its imperative handle is ready (and React Strict Mode's dev
 * double-mount makes it worse), so it silently fails to start and the preview
 * looks frozen until you manually pause/play. Instead we imperatively call
 * `play()` once mounted (on the next animation frame, after avatars are
 * preloaded) and retry if it didn't take.
 */
export function usePlayerControls(initialPlaying: boolean) {
  const ref = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(initialPlaying);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);

    let raf1 = 0;
    let raf2 = 0;
    if (initialPlaying) {
      // Defer to the next frame so the player's imperative API is fully wired,
      // then start. A second rAF retries if the first play() didn't take (e.g.
      // the player was still finishing its initial buffering pass).
      raf1 = requestAnimationFrame(() => {
        ref.current?.play();
        raf2 = requestAnimationFrame(() => {
          if (ref.current && !ref.current.isPlaying()) ref.current.play();
        });
      });
    }

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [initialPlaying]);

  const togglePlay = useCallback(() => {
    const player = ref.current;
    if (!player) return;
    // `playing` updates via the play/pause event listeners above.
    if (player.isPlaying()) player.pause();
    else player.play();
  }, []);

  return { ref, playing, togglePlay };
}
