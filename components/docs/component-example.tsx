"use client";

import { DocsPlayer } from "./blocks/player/docs-player";
import { UnknownBlock } from "./blocks/player/player-fallback";
import { BLOCK_SPACING } from "./blocks/spacing";
import { examples } from "./examples";

const NO_PROPS = {};
/** A fixed recipe scene in the docs player, without toolbar or customizer. */
export function ComponentExample({ name }: { name: string }) {
  const entry = examples[`${name}-example`];
  if (!entry) return <UnknownBlock kind="example" name={name} />;

  return (
    <DocsPlayer
      name={`${name}-example`}
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
