"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export interface ChangelogVideoEntry {
  slug: string;
  title: string;
  iso: string;
  formattedDate: string;
  video: string;
  videoPoster?: string;
}

const ACTIVE_THRESHOLD = 0.5;

export function ChangelogVideoFeed({
  entries,
}: {
  entries: ChangelogVideoEntry[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [nearSlugs, setNearSlugs] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const frames = root.querySelectorAll<HTMLElement>("[data-video-slug]");

    const ratios = new Map<string, number>();
    const dominant = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const slug = record.target.getAttribute("data-video-slug");
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
        setActiveSlug(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    const approaching = new IntersectionObserver(
      (records) => {
        const arrived = records
          .filter((record) => record.isIntersecting)
          .map((record) => record.target.getAttribute("data-video-slug"))
          .filter((slug): slug is string => slug !== null);
        if (arrived.length === 0) return;
        setNearSlugs((prev) => {
          const next = new Set(prev);
          for (const slug of arrived) next.add(slug);
          return next;
        });
      },
      { rootMargin: "300px 0px" },
    );

    for (const frame of frames) {
      dominant.observe(frame);
      approaching.observe(frame);
    }
    return () => {
      dominant.disconnect();
      approaching.disconnect();
    };
  }, [entries]);

  return (
    <div ref={containerRef} className="section flex flex-col gap-16">
      {entries.map((entry) => (
        <ChangelogVideoCard
          key={entry.slug}
          entry={entry}
          active={entry.slug === activeSlug}
          near={nearSlugs.has(entry.slug)}
        />
      ))}
    </div>
  );
}

function ChangelogVideoCard({
  entry,
  active,
  near,
}: {
  entry: ChangelogVideoEntry;
  active: boolean;
  near: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && !reducedMotion) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, reducedMotion]);

  return (
    <article
      id={entry.slug}
      className="scroll-mt-24 border-t border-border pt-8 md:grid md:grid-cols-[10rem_1fr] md:gap-8"
    >
      <div className="md:sticky md:top-24 md:self-start">
        <time
          dateTime={entry.iso}
          className="font-mono text-xs font-medium text-muted-foreground"
        >
          {entry.formattedDate}
        </time>
      </div>

      <div className="mt-4 min-w-0 md:mt-0">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          <a href={`#${entry.slug}`} className="hover:underline">
            {entry.title}
          </a>
        </h2>

        <div
          data-video-slug={entry.slug}
          className="surface-card mt-6 aspect-video w-full overflow-hidden rounded-2xl"
        >
          <video
            ref={videoRef}
            src={entry.video}
            poster={near ? entry.videoPoster : undefined}
            controls={hovered || reducedMotion}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            muted
            loop
            playsInline
            preload="none"
            className="size-full object-cover"
          />
        </div>

        <Link
          href={`/changelog#${entry.slug}`}
          className="mt-4 inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Read the full entry
        </Link>
      </div>
    </article>
  );
}
