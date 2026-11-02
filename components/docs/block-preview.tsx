"use client";

import { DocsPlayer } from "./blocks/player/docs-player";
import { UnknownBlock } from "./blocks/player/player-fallback";
import { BLOCK_SPACING } from "./blocks/spacing";
import { blockExamples } from "./examples/blocks";

const NO_PROPS = {};
/**
 * Composition blocks: the live scene and its copyable snippet behind the
 * Preview / Code tabs. Blocks have no registry config, so no customizer.
 */
export function BlockPreview({ name }: { name: string }) {
  const entry = blockExamples[name];
  if (!entry) return <UnknownBlock kind="block" name={name} />;

  // The code field may be a string or a zero-arg function; normalize to string.
  const code = typeof entry.code === "function" ? entry.code() : entry.code;

  return (
    <DocsPlayer
      name={name}
      code={code}
      className={BLOCK_SPACING}
      composition={{
        Component: entry.Component,
        inputProps: NO_PROPS,
        durationInFrames: entry.durationInFrames,
        fps: entry.fps,
        compositionWidth: entry.width,
        compositionHeight: entry.height,
        previewBackdrop: entry.previewBackdrop,
      }}
    />
  );
}
