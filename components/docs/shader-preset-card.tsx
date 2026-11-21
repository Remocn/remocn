"use client";

import { Player, type PlayerRef } from "@remotion/player";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";
import registry from "@/lib/previews";
import { sitePreview } from "@/lib/previews/site-preview";
import type { ShaderPresetItem } from "@/lib/shader-presets";
import { CopyButton } from "./copy-button";

export function ShaderPresetCard({ item }: { item: ShaderPresetItem }) {
  const entry = registry[item.name];
  const preview = sitePreview(item.name);
  const playerRef = useRef<PlayerRef>(null);
  const { containerRef } = useAutoplay(playerRef);
  // The Player mounts after hydration: on the server its lazyComponent would
  // load the shader there, and previews load in the browser only
  // (lib/previews/index.ts).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const command = `npx shadcn@latest add @remocn/${item.name}`;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="surface-card aspect-video w-full overflow-hidden rounded-xl"
      >
        {!entry || !preview ? (
          <div className="size-full bg-muted/40" />
        ) : mounted ? (
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
        ) : null}
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
