"use client";

import { Player, type PlayerRef } from "@remotion/player";
import Link from "next/link";
import { useRef } from "react";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";
import type { ShaderPresetItem } from "@/lib/shader-presets";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { CopyButton } from "./copy-button";

export function ShaderPresetCard({ item }: { item: ShaderPresetItem }) {
  const entry = registry[item.name];
  const preview = previewManifest[item.name];
  const playerRef = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(playerRef);
  const command = `npx shadcn@latest add @remocn/${item.name}`;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="surface-card aspect-video w-full overflow-hidden rounded-xl"
      >
        {entry && preview ? (
          <Player
            ref={playerRef}
            lazyComponent={entry.load}
            inputProps={preview.defaults}
            durationInFrames={preview.durationInFrames}
            fps={preview.fps}
            compositionWidth={preview.compositionWidth}
            compositionHeight={preview.compositionHeight}
            style={{ width: "100%", height: "100%" }}
            controls={false}
            loop
            acknowledgeRemotionLicense
          />
        ) : (
          <div className="size-full bg-muted/40" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Link
          href={item.href}
          className="text-sm font-medium capitalize tracking-tight text-foreground hover:underline"
        >
          {item.label.replaceAll("-", " ")}
        </Link>
        <CopyButton value={command} />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
      <code className="text-xs text-muted-foreground">{item.name}</code>
    </div>
  );
}
