"use client";

import { Player, type PlayerRef } from "@remotion/player";
import Link from "next/link";
import { useRef } from "react";
import { getDefaults } from "@/lib/customizer-config";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import type { CardItem } from "./component-card-grid";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";

function slugFromHref(href?: string) {
  if (!href) return undefined;
  return href.split("/").filter(Boolean).pop();
}

function PreviewPlaceholder() {
  return <div className="size-full bg-muted/40" />;
}

function CardPreview({ item }: { item: CardItem }) {
  const slug = slugFromHref(item.href);
  const entry = slug ? registry[slug] : undefined;
  const playerRef = useRef<PlayerRef>(null);

  useAutoplay(playerRef);

  if (!entry) {
    return (
      <div className="size-full">
        <PreviewPlaceholder />
      </div>
    );
  }

  const { load, config } = entry;
  const inputProps = getDefaults(config.controls);

  return (
    <div className="size-full">
      <Player
        ref={playerRef}
        lazyComponent={load}
        inputProps={inputProps}
        durationInFrames={config.durationInFrames}
        fps={config.fps}
        compositionWidth={config.compositionWidth}
        compositionHeight={config.compositionHeight}
        style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5" }}
        controls={false}
        loop
        acknowledgeRemotionLicense
      />
    </div>
  );
}

function CardBody({ item }: { item: CardItem }) {
  return (
    <>
      <div className="surface-card aspect-video w-full overflow-hidden rounded-xl transition-[transform,border-color] group-hover/card:-translate-y-0.5 group-hover/card:border-foreground/20 group-focus-visible/card:-translate-y-0.5 group-focus-visible/card:border-foreground/20">
        <CardPreview item={item} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium tracking-tight text-foreground">
          {item.name}
        </h3>
        {item.status === "soon" && (
          <span className="rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/60">
            Soon
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
    </>
  );
}

export function ComponentCard({ item }: { item: CardItem }) {
  if (item.status === "stable" && item.href) {
    return (
      <Link
        href={item.href}
        className={cn(
          "group/card flex h-full flex-col gap-2 rounded-2xl outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      >
        <CardBody item={item} />
      </Link>
    );
  }

  return (
    <div className="group/card flex h-full flex-col gap-2 rounded-2xl opacity-60">
      <CardBody item={item} />
    </div>
  );
}
