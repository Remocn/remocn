"use client";

import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { HeroPlayer } from "./hero-player";

/** Hero preview of a registry component with its manifest defaults. */
export function RegistryHeroPlayer({
  slug,
  inputProps,
}: {
  slug: string;
  /** Overrides on top of the component's preview defaults. */
  inputProps?: Record<string, unknown>;
}) {
  const entry = registry[slug];
  const preview = previewManifest[slug];
  if (!entry || !preview) return null;
  return (
    <HeroPlayer
      load={entry.load}
      inputProps={{ ...preview.defaults, ...inputProps }}
      durationInFrames={preview.durationInFrames}
      fps={preview.fps}
      stillFrame={Math.round(preview.durationInFrames * 0.45)}
    />
  );
}
