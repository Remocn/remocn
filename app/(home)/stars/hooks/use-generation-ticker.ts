"use client";

import { useEffect, useState } from "react";

/**
 * The fake "Fetching… N" progress ticker for the generating view. Eases a
 * progress bar toward 90% and counts a jittery stargazer tally, or snaps
 * straight to 90% when reduced motion is requested.
 */
export function useGenerationTicker(reduced: boolean) {
  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) {
      setProgress(90);
      return;
    }
    const id = setInterval(() => {
      setCount((t) => t + Math.floor(Math.random() * 40) + 10);
      setProgress((v) => Math.min(v + (90 - v) * 0.12, 90));
    }, 160);
    return () => clearInterval(id);
  }, [reduced]);

  return { progress, count };
}
