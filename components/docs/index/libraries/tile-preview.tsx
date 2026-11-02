"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { FILTER_PHOTO_LOADERS } from "./filter-photo-scenes";
import { useInView } from "./use-in-view";

export type LibraryKind = "shader" | "filter" | "caption";

/**
 * A gallery tile's preview: a paused Remotion still that plays while the tile
 * is hovered or focused (never under reduced motion, where the still stays).
 * The player only exists while the tile is near the viewport, which keeps a
 * long grid of WebGL shaders under the browser's context limit. Covers its
 * box at 16:9, cropping the sides of narrower tiles.
 */
export function TilePreview({
  slug,
  kind,
  playing,
}: {
  slug: string;
  kind: LibraryKind;
  playing: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const inView = useInView(boxRef);
  const reduced = usePrefersReducedMotion();
  const preview = previewManifest[slug];
  const load =
    (kind === "filter" ? FILTER_PHOTO_LOADERS[slug] : undefined) ??
    registry[slug]?.load;
  const still = preview ? Math.round(preview.durationInFrames * 0.45) : 0;

  useEffect(() => {
    const player = playerRef.current;
    if (!inView || !player) return;
    if (playing && !reduced) {
      player.play();
    } else {
      player.pause();
      player.seekTo(still);
    }
  }, [playing, reduced, still, inView]);

  const backdrop =
    kind === "shader" && preview?.previewBackdrop?.type === "color"
      ? preview.previewBackdrop.value
      : undefined;

  return (
    <div
      ref={boxRef}
      className="absolute inset-0"
      style={{ background: backdrop }}
    >
      {inView && preview && load && (
        <div className="absolute top-0 left-1/2 aspect-video h-full -translate-x-1/2">
          <Player
            ref={playerRef}
            lazyComponent={load}
            inputProps={preview.defaults}
            durationInFrames={preview.durationInFrames}
            fps={preview.fps}
            compositionWidth={preview.compositionWidth}
            compositionHeight={preview.compositionHeight}
            initialFrame={still}
            style={{ width: "100%", height: "100%", background: "transparent" }}
            controls={false}
            clickToPlay={false}
            loop
            initiallyMuted
            numberOfSharedAudioTags={0}
            acknowledgeRemotionLicense
          />
        </div>
      )}
    </div>
  );
}
