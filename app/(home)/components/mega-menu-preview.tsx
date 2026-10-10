"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useRef } from "react";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { useAutoplay } from "./use-autoplay";

export default function MegaMenuPreview({ name }: { name: string }) {
  const entry = registry[name];
  const preview = previewManifest[name];
  const playerRef = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(playerRef);

  if (!entry || !preview) return null;

  const backdrop = preview.previewBackdrop;
  const background =
    backdrop && backdrop.type !== "image" ? backdrop.value : "#f5f5f5";

  // Слот в панели всегда 16:9, композиции — нет (иконки 48×48). Плеер получает
  // бокс с аспектом композиции, вписанный в слот, — иначе Remotion обрезает.
  const wide = preview.compositionWidth / preview.compositionHeight >= 16 / 9;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none flex size-full items-center justify-center"
    >
      <Player
        ref={playerRef}
        lazyComponent={entry.load}
        inputProps={preview.defaults}
        durationInFrames={preview.durationInFrames}
        fps={preview.fps}
        compositionWidth={preview.compositionWidth}
        compositionHeight={preview.compositionHeight}
        style={{
          aspectRatio: `${preview.compositionWidth} / ${preview.compositionHeight}`,
          width: wide ? "100%" : "auto",
          height: wide ? "auto" : "100%",
          borderRadius: 8,
          background,
        }}
        controls={false}
        loop
        acknowledgeRemotionLicense
      />
    </div>
  );
}
