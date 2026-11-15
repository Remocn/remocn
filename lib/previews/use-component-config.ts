"use client";

import { startTransition, use, useEffect, useState } from "react";
import type { ResolvedComponentConfig } from "@/lib/customizer-config";
import { loadComponentConfig, onPreviewsUpdate } from "./index";

/**
 * The resolved config of a preview. Suspends until the config's chunk has
 * loaded, then reads the cached promise synchronously; no other config is
 * fetched.
 *
 * In dev it renders again when a saved config is rebuilt. The update is a
 * transition, so the preview stays on screen while the new config loads
 * instead of falling back to its Suspense placeholder.
 */
export function useComponentConfig(slug: string): ResolvedComponentConfig {
  const [, refresh] = useState(0);
  useEffect(
    () => onPreviewsUpdate(() => startTransition(() => refresh((n) => n + 1))),
    [],
  );
  return use(loadComponentConfig(slug));
}
