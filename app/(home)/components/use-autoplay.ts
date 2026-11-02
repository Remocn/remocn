import type { PlayerRef } from "@remotion/player";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

/** Plays the player while it is near the viewport; never under reduced motion. */
export function useAutoplay(
  playerRef: RefObject<PlayerRef | null>,
  enabled = true,
): { containerRef: (node: Element | null) => void } {
  const [observerRef, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "200px",
  });

  const reducedMotion = usePrefersReducedMotion();
  const attached = useRef(false);
  const containerRef = useCallback(
    (node: Element | null) => {
      if (node) attached.current = true;
      observerRef(node);
    },
    [observerRef],
  );

  useEffect(() => {
    if (reducedMotion) {
      playerRef.current?.pause();
      return;
    }
    if (!enabled) return;

    const visible = attached.current ? Boolean(entry?.isIntersecting) : true;

    if (!visible) {
      playerRef.current?.pause();
      return;
    }

    let raf = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 120;
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
  }, [enabled, reducedMotion, entry, playerRef]);

  return { containerRef };
}
