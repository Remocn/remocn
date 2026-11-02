"use client";

import { useState } from "react";
import { HeroPill, HeroTag } from "./hero-pill";
import { HeroPlayer } from "./hero-player";

const loadScene = () =>
  import("./filter-hero-scene").then((m) => ({ default: m.FilterSplitScene }));

/**
 * Filters overview hero: one frame, source on the left and the same frame
 * through a filter on the right. The handle drags the split (a range input,
 * so it also works from the keyboard).
 */
export function FilterHero({
  count,
  filterLabel,
  tags = [],
}: {
  count: number;
  /** Label over the filtered half, e.g. "<VhsFilter>". */
  filterLabel: string;
  tags?: string[];
}) {
  const [split, setSplit] = useState(0.5);

  return (
    <figure className="not-prose group/split relative mt-2 h-60 overflow-hidden rounded-card bg-dark-surface select-none sm:h-80">
      <HeroPlayer
        load={loadScene}
        inputProps={{ split }}
        durationInFrames={90}
        stillFrame={30}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-white"
        style={{ left: `${split * 100}%` }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_#0e10124d] group-has-[input:focus-visible]/split:ring-3 group-has-[input:focus-visible]/split:ring-ring/60"
        style={{ left: `${split * 100}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px] fill-none stroke-[#0e1012] stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
        </svg>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={split}
        onChange={(event) =>
          setSplit(Math.min(Math.max(Number(event.target.value), 0.05), 0.95))
        }
        aria-label="Compare the source frame with the filtered frame"
        className="seek-range absolute inset-0 size-full cursor-ew-resize touch-pan-y opacity-0 [--seek-thumb:2px]"
      />
      <HeroTag className="pointer-events-none absolute top-4 left-4 bg-[#0e101280] sm:top-5 sm:left-5">
        source
      </HeroTag>
      <HeroTag
        mono
        className="pointer-events-none absolute top-4 right-4 bg-[#0e101280] sm:top-5 sm:right-5"
      >
        {filterLabel}
      </HeroTag>
      <figcaption className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2 sm:bottom-5 sm:left-5">
        <HeroPill lead>{count} filters</HeroPill>
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex h-8 items-center rounded-[10px] bg-[#0e10128c] px-3 text-caption leading-4 text-white"
          >
            {tag}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
