"use client";

import { type RefObject, useEffect, useState } from "react";

/** True while the element is within `margin` of the viewport. */
export function useInView(
  ref: RefObject<Element | null>,
  margin = "100px",
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, margin]);

  return inView;
}
