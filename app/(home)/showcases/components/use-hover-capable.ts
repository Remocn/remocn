"use client";

import { useEffect, useState } from "react";

export function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(hover: hover)");
    setHoverCapable(mql.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setHoverCapable(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return hoverCapable;
}
