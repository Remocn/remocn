"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Showcase } from "@/lib/showcases";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { ShowcaseAuthor } from "./showcase-author";
import { useHoverCapable } from "./use-hover-capable";

const ACTIVE_THRESHOLD = 0.5;

export function ShowcaseGrid({ showcases }: { showcases: Showcase[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCapable = useHoverCapable();
  const reducedMotion = usePrefersReducedMotion();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [visibleSlug, setVisibleSlug] = useState<string | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || hoverCapable || typeof IntersectionObserver === "undefined") {
      return;
    }

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const slug = record.target.getAttribute("data-showcase-slug");
          if (slug) ratios.set(slug, record.intersectionRatio);
        }
        let best: string | null = null;
        let bestRatio = ACTIVE_THRESHOLD;
        for (const [slug, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = slug;
          }
        }
        setVisibleSlug(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const frame of root.querySelectorAll("[data-showcase-slug]")) {
      observer.observe(frame);
    }
    return () => observer.disconnect();
  }, [hoverCapable]);

  const playingSlug = hoverCapable ? hoveredSlug : visibleSlug;

  return (
    <div
      ref={containerRef}
      className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
    >
      {showcases.map((showcase) => (
        <ShowcaseCard
          key={showcase.slug}
          showcase={showcase}
          playing={!reducedMotion && showcase.slug === playingSlug}
          onHover={(hovered) =>
            setHoveredSlug((prev) =>
              hovered ? showcase.slug : prev === showcase.slug ? null : prev,
            )
          }
        />
      ))}
    </div>
  );
}

function ShowcaseCard({
  showcase,
  playing,
  onHover,
}: {
  showcase: Showcase;
  playing: boolean;
  onHover: (hovered: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      void video.play().catch(() => {});
      return;
    }
    video.pause();
    video.currentTime = 0;
  }, [playing]);

  return (
    <Link
      href={`/showcases/${showcase.slug}`}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className="group flex min-w-0 flex-col gap-4 focus-visible:outline-none"
    >
      <div
        data-showcase-slug={showcase.slug}
        className="surface-card aspect-video w-full overflow-hidden rounded-2xl transition-colors group-hover:border-foreground/20 group-focus-visible:border-foreground/40"
      >
        <video
          ref={videoRef}
          src={showcase.videoUrl}
          poster={showcase.posterUrl}
          muted
          loop
          playsInline
          preload="none"
          className="size-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-base font-medium leading-snug text-foreground">
          {showcase.title}
        </h2>
        <ShowcaseAuthor author={showcase.author} />
      </div>
    </Link>
  );
}
