"use client";

import { memo, useCallback, useState } from "react";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import { HeroTag } from "./hero-pill";
import { HeroPlayer } from "./hero-player";

const ROWS = 6;
const COMPOSITION = { width: 1280, height: 720 };

const VideoPlayer = memo(function VideoPlayer({
  slug,
  onFrame,
}: {
  slug: string;
  onFrame: (frame: number) => void;
}) {
  const entry = registry[slug];
  const preview = previewManifest[slug];
  if (!entry || !preview) return null;
  return (
    <HeroPlayer
      load={entry.load}
      inputProps={preview.defaults}
      durationInFrames={preview.durationInFrames}
      fps={preview.fps}
      stillFrame={Math.round(preview.durationInFrames * 0.45)}
      composition={COMPOSITION}
      onFrame={onFrame}
    />
  );
});

function timecode(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(2).padStart(5, "0");
  return `${minutes}:${seconds}`;
}

/**
 * Captions overview hero: a caption style playing over footage, next to the
 * transcript it reads. The table follows the player, highlighting the word
 * being spoken, so the link between `captions.json` and the video is visible.
 */
export function CaptionHero({
  name,
  photo,
}: {
  /** Registry name of the caption style that plays. */
  name: string;
  /** Footage behind the caption. */
  photo: string;
}) {
  const preview = previewManifest[name];
  const fps = preview?.fps ?? 30;
  const words = previewCaptions(
    typeof preview?.defaults.captions === "string"
      ? preview.defaults.captions
      : undefined,
  );
  const [frame, setFrame] = useState(
    Math.round((preview?.durationInFrames ?? 0) * 0.45),
  );
  const onFrame = useCallback((next: number) => setFrame(next), []);

  const ms = (frame / fps) * 1000;
  let active = words.findLastIndex((word) => word.startMs <= ms);
  if (active === -1) active = 0;
  const start = Math.min(
    Math.max(active - Math.floor(ROWS / 2) + 1, 0),
    Math.max(words.length - ROWS, 0),
  );
  const rows = words.slice(start, start + ROWS);

  return (
    <figure className="not-prose mt-2 flex flex-col overflow-hidden rounded-card bg-dark-surface sm:h-80 sm:flex-row">
      <div className="relative h-[220px] shrink-0 overflow-hidden sm:h-full sm:w-[62%]">
        {/* biome-ignore lint/performance/noImgElement: decorative footage under a transparent player */}
        <img
          src={photo}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,#0e10121a_30%,#0e1012bf_100%)]"
        />
        <VideoPlayer slug={name} onFrame={onFrame} />
        <HeroTag className="absolute top-4 left-4 bg-[#0e101299] tabular-nums sm:top-5 sm:left-5">
          {timecode(ms)}
        </HeroTag>
      </div>
      <figcaption className="flex grow flex-col gap-[3px] bg-[#16181a] px-3 py-4 sm:px-4 sm:py-5">
        <span className="flex items-center justify-between px-2 pb-2.5 text-mono leading-4">
          <span className="font-mono text-[#fafafa]">captions.json</span>
          <span className="text-dark-subtle">{words.length} words</span>
        </span>
        <span className="flex h-6 items-center px-2 font-mono text-micro leading-[14px] text-[#8b979c]">
          <span className="grow">text</span>
          <span className="w-16 text-right">startMs</span>
          <span className="w-16 text-right">endMs</span>
        </span>
        <ol aria-label="Transcript">
          {rows.map((word, index) => {
            const position = start + index;
            const state =
              position === active
                ? "active"
                : position < active
                  ? "spoken"
                  : "upcoming";
            return (
              <li
                key={`${position}-${word.startMs}`}
                aria-current={state === "active" ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-[10px] px-2 font-mono text-mono leading-4 tabular-nums sm:h-[34px]",
                  state === "active" && "bg-[#26292c]",
                )}
              >
                <span
                  className={cn(
                    "grow truncate",
                    state === "active"
                      ? "text-[#fde047]"
                      : state === "spoken"
                        ? "text-[#e4e5e7]"
                        : "text-[#8b979c]",
                  )}
                >
                  "{word.text.trim()}"
                </span>
                {[word.startMs, word.endMs].map((value, column) => (
                  <span
                    key={column}
                    className={cn(
                      "w-16 shrink-0 text-right",
                      state === "active"
                        ? "text-[#e4e5e7]"
                        : state === "spoken"
                          ? "text-dark-subtle"
                          : "text-[#8b979c]",
                    )}
                  >
                    {value}
                  </span>
                ))}
              </li>
            );
          })}
        </ol>
      </figcaption>
    </figure>
  );
}
