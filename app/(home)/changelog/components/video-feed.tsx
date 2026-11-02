"use client";

import { useEffect, useRef, useState } from "react";
import { useLoopControls } from "../../components/site-page/use-loop-controls";
import { ChangelogEntry, EntryActionLink } from "./changelog-entry";

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: observers must re-attach to the frames rendered from entries
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
    <div ref={containerRef} className="landing-container pb-16 xl:pb-[120px]">
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
  const { reducedMotion, videoProps } = useLoopControls();

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
    <ChangelogEntry
      slug={entry.slug}
      iso={entry.iso}
      formattedDate={entry.formattedDate}
      title={entry.title}
    >
      {/* Screening-room frame: always dark, a hairline ring in dark mode. */}
      <div className="mt-6 rounded-card bg-dark-surface p-2 md:p-2.5 dark:bg-surface dark:shadow-[0_0_0_1px_var(--hairline)]">
        <div
          data-video-slug={entry.slug}
          className="aspect-video w-full overflow-hidden rounded-control-sm bg-dark-raised"
        >
          <video
            ref={videoRef}
            src={entry.video}
            poster={near ? entry.videoPoster : undefined}
            aria-label={entry.title}
            muted
            loop
            playsInline
            preload="none"
            className="size-full object-cover outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/60"
            {...videoProps}
          />
        </div>
      </div>

      <EntryActionLink href={`/changelog#${entry.slug}`} className="mt-4">
        Read the full entry
      </EntryActionLink>
    </ChangelogEntry>
  );
}
