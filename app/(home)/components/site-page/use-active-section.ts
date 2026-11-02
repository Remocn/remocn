"use client";

import { useEffect, useState } from "react";

/**
 * Id of the section currently being read: the last one whose top has crossed
 * the upper third of the viewport. Falls back to the first id.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const passed = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const above = entry.boundingClientRect.top < window.innerHeight / 3;
          if (entry.isIntersecting || above) passed.add(entry.target.id);
          if (!above) passed.delete(entry.target.id);
        }
        const current = ids.findLast((id) => passed.has(id));
        setActive(current ?? ids[0]);
      },
      { rootMargin: "0px 0px -66% 0px", threshold: [0, 1] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
