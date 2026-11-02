"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

/** Starts `true` so desktop doesn't flash native controls before mount. */
function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover)");
    setHoverCapable(mql.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setHoverCapable(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return hoverCapable;
}

/**
 * Native controls for a muted autoplay loop: shown on hover or keyboard
 * focus, and always on touch screens or with reduced motion, so the loop can
 * be paused with any input.
 */
export function useLoopControls() {
  const reducedMotion = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return {
    reducedMotion,
    videoProps: {
      controls: !hoverCapable || hovered || focused || reducedMotion,
      tabIndex: 0,
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  };
}
