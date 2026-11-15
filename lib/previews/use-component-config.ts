"use client";

import { use, useSyncExternalStore } from "react";
import type { ResolvedComponentConfig } from "@/lib/customizer-config";
import { loadComponentConfig, onPreviewsUpdate, swappedConfig } from "./index";

const none = () => undefined;

/**
 * The resolved config of a preview. Suspends until the config's chunk has
 * loaded, then reads the cached promise synchronously; no other config is
 * fetched.
 *
 * In dev it renders again when a saved config is rebuilt. The rebuilt config
 * comes resolved, so that is an ordinary render and the preview stays on
 * screen. It is not a transition: one that suspends further down (the Player
 * loading a composition again) starts over on every retry and never commits.
 */
export function useComponentConfig(slug: string): ResolvedComponentConfig {
  const swapped = useSyncExternalStore(
    onPreviewsUpdate,
    () => swappedConfig(slug),
    none,
  );
  return swapped ?? use(loadComponentConfig(slug));
}
