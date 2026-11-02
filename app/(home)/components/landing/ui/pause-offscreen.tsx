"use client";

import { useEffect } from "react";

/**
 * Marks every `[data-section]` that's out of view with `data-offscreen`, which
 * pauses its CSS loops (see globals.css; mark a new loop with `data-loop`).
 * Off screen Chrome has no layer to hand a loop to the compositor, so it would
 * tick every one of them on the main thread, every frame, for nothing.
 */
export function PauseOffscreen() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
        }
      },
      { rootMargin: "150px 0px" },
    );
    for (const section of document.querySelectorAll("[data-section]")) {
      observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
