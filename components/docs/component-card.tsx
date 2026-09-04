"use client";

import { Player, type PlayerRef } from "@remotion/player";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { Backdrop } from "@/registry/remocn/backdrop";
import type { CardItem } from "./component-card-grid";

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
  const preview = slug ? previewManifest[slug] : undefined;
  const playerRef = useRef<PlayerRef>(null);

  const { containerRef } = useAutoplay(playerRef);

  // Mirror PreviewStage's Backdrop wrap so card thumbnails with a
  // previewBackdrop (e.g. blocks) match their detail-page background.
  // Lazy to keep cards code-split: only the visible card's scene loads.
  const lazyComponent = useMemo(() => {
    if (!entry) return null;
    const fill = preview?.previewBackdrop;
    if (!fill) return entry.load;
    return () =>
      entry.load().then(({ default: Inner }) => ({
        // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded scene, props shape varies
        default: function CardStage(props: Record<string, any>) {
          return (
            <Backdrop fill={fill} padding={0} radius={0} shadow="">
              <Inner {...props} />
            </Backdrop>
          );
        },
      }));
  }, [entry, preview]);

  if (entry && preview && lazyComponent) {
    return (
      <div ref={containerRef} className="size-full">
        <Player
          ref={playerRef}
          lazyComponent={lazyComponent}
          inputProps={preview.defaults}
          durationInFrames={preview.durationInFrames}
          fps={preview.fps}
          compositionWidth={preview.compositionWidth}
          compositionHeight={preview.compositionHeight}
          style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5" }}
          controls={false}
          loop
          acknowledgeRemotionLicense
        />
      </div>
    );
  }

  return (
    <div className="size-full">
      <PreviewPlaceholder />
    </div>
  );
}

function CardBody({ item }: { item: CardItem }) {
  return (
    <>
      <div className="surface-card aspect-video w-full overflow-hidden rounded-xl transition-[transform,box-shadow] group-hover/card:-translate-y-0.5 group-hover/card:[box-shadow:var(--elevation-raised-hover)] group-focus-visible/card:-translate-y-0.5 group-focus-visible/card:[box-shadow:var(--elevation-raised-hover)]">
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
