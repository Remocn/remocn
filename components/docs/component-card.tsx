"use client";

import { Player, Thumbnail } from "@remotion/player";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { getDefaults } from "@/lib/customizer-config";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import type { CardItem } from "./component-card-grid";

function slugFromHref(href?: string) {
  if (!href) return undefined;
  return href.split("/").filter(Boolean).pop();
}

/** Calm static surface shown when there is no live preview to render. */
function PreviewPlaceholder() {
  return <div className="size-full bg-muted/40" />;
}

/**
 * Preview area. The Remotion composition is only mounted once the card nears
 * the viewport (IntersectionObserver) — index pages render dozens of cards, so
 * eagerly mounting every Thumbnail would render dozens of compositions on load.
 * Until then, and for non-stable / unknown components, a calm placeholder shows.
 * In view + motion allowed: the live <Player> auto-plays (looping) — no hover
 * needed. Under prefers-reduced-motion it falls back to a static <Thumbnail>
 * first frame. Off-screen cards never mount a player.
 */
function CardPreview({ item }: { item: CardItem }) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  const slug = slugFromHref(item.href);
  const entry = slug ? registry[slug] : undefined;

  let content: ReactNode;
  if (item.status !== "stable" || !entry || !inView) {
    content = <PreviewPlaceholder />;
  } else {
    const { Component, config } = entry;
    const inputProps = getDefaults(config.controls);
    const playing = !reducedMotion;
    content = playing ? (
      <Player
        component={Component}
        inputProps={inputProps}
        durationInFrames={config.durationInFrames}
        fps={config.fps}
        compositionWidth={config.compositionWidth}
        compositionHeight={config.compositionHeight}
        style={{ width: "100%", height: "100%" }}
        controls={false}
        loop
        autoPlay
        acknowledgeRemotionLicense
      />
    ) : (
      <Thumbnail
        component={Component}
        inputProps={inputProps}
        durationInFrames={config.durationInFrames}
        fps={config.fps}
        compositionWidth={config.compositionWidth}
        compositionHeight={config.compositionHeight}
        frameToDisplay={0}
        style={{ width: "100%", height: "100%" }}
        acknowledgeRemotionLicense
      />
    );
  }

  return (
    <div ref={ref} className="size-full">
      {content}
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
