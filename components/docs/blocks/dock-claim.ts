"use client";

import { useEffect, useId, useSyncExternalStore } from "react";

/**
 * A docs page can hold several previews, but only one describe dock floats
 * at the bottom of the viewport: the first panel to mount owns it, and the
 * next one takes over when it unmounts.
 */
const claims: string[] = [];
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDockOwner(): boolean {
  const id = useId();
  useEffect(() => {
    claims.push(id);
    notify();
    return () => {
      claims.splice(claims.indexOf(id), 1);
      notify();
    };
  }, [id]);
  return useSyncExternalStore(
    subscribe,
    () => claims[0] === id,
    () => false,
  );
}
