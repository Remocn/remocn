"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import {
  PauseGlyph,
  PlayGlyph,
} from "../../../components/site-page/play-glyph";
import type { Reel } from "../../lib/reel-types";
import { SUBMIT_SHOWCASE_URL } from "../showcases-header";

/** Thumbnail strip scale: 2px per second, like the editor's zoomed-in view. */
const STRIP_PX_PER_SECOND = 2;
const STRIP_MIN_WIDTH = 40;
const LABEL_STEPS_MIN = [1, 2, 5, 10, 15, 30, 60];
/** Minimum px between ruler labels. */
const LABEL_GAP = 96;
const LABEL_GAP_COMPACT = 44;
/** Room kept free at the ruler end (for the total, shown from `md`). */
const END_GAP = 72;
const END_GAP_COMPACT = 36;
const COMPACT_RULER = 400;

const LABEL_COLUMN = "w-[146px] shrink-0 pr-2 md:w-[150px]";

/**
 * Reel timeline: play key and time, a ruler with the playhead, the clip
 * strip (scrolls), and one row per most-used component showing which clips
 * used it. Ruler and rows fit the whole reel into the available width.
 */
export function Timeline({
  reel,
  index,
  reelTime,
  playing,
  onToggle,
  onSelect,
  onSeek,
}: {
  reel: Reel;
  index: number;
  reelTime: number;
  playing: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
  onSeek: (seconds: number) => void;
}) {
  const { clips, total, tracks } = reel;
  const clip = clips[index];
  const rulerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(0);
  const pct = (seconds: number) => `${(seconds / total) * 100}%`;

  useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const observer = new ResizeObserver(([entry]) =>
      setRulerWidth(entry.contentRect.width),
    );
    observer.observe(ruler);
    return () => observer.disconnect();
  }, []);

  // Keep the selected clip inside the strip's visible window.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-clip="${index}"]`);
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.offsetLeft;
    const right = left + thumb.offsetWidth;
    if (
      left < strip.scrollLeft ||
      right > strip.scrollLeft + strip.clientWidth
    ) {
      strip.scrollTo({
        left: left - strip.clientWidth / 3,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }, [index]);

  const compact = rulerWidth > 0 && rulerWidth < COMPACT_RULER;
  const gap = compact ? LABEL_GAP_COMPACT : LABEL_GAP;
  const step =
    LABEL_STEPS_MIN.find(
      (minutes) =>
        rulerWidth === 0 || (minutes * 60 * rulerWidth) / total >= gap,
    ) ?? 60;
  const labels: number[] = [];
  const endRoom =
    rulerWidth > 0
      ? ((compact ? END_GAP_COMPACT : END_GAP) / rulerWidth) * total
      : 0;
  for (let t = 0; t < total - endRoom; t += step * 60) labels.push(t);

  return (
    <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-cta bg-dark-raised p-3 md:gap-1.5 md:rounded-capsule">
      {/* Transport + ruler */}
      <div className="flex h-9 items-center md:h-10">
        <div className={cn(LABEL_COLUMN, "flex items-center gap-2.5")}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "Pause the reel" : "Play the reel"}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[#fafafa] outline-none transition-[background-color,translate] duration-150 ease-out after:absolute after:-inset-1 hover:bg-white focus-visible:ring-3 focus-visible:ring-white/40 active:translate-y-px md:size-8"
          >
            {playing ? <PauseGlyph /> : <PlayGlyph />}
          </button>
          <span className="text-caption text-[#fafafa] tabular-nums">
            {formatDuration(reelTime)}
          </span>
        </div>
        <div
          ref={rulerRef}
          className="relative h-8 min-w-0 grow rounded-tile bg-[#25282b] md:h-10 md:rounded-[10px]"
        >
          {labels.map((t) => (
            <span
              key={t}
              aria-hidden="true"
              className="absolute top-2 ml-1 text-caption text-dark-body tabular-nums md:top-3 md:ml-2"
              style={{ left: pct(t) }}
            >
              {formatDuration(t)}
            </span>
          ))}
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 hidden text-caption text-dark-subtle tabular-nums md:top-3 md:block"
          >
            {formatDuration(total)}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-0 h-3.5 w-3 -translate-x-1/2 rounded-t-[3px] rounded-b-md bg-primary-soft"
            style={{ left: pct(reelTime) }}
          />
          <input
            type="range"
            min={0}
            max={total}
            step={1}
            value={reelTime}
            aria-label="Position on the reel"
            aria-valuetext={`${formatDuration(reelTime)} of ${formatDuration(total)}`}
            onChange={(event) => onSeek(Number(event.currentTarget.value))}
            className="seek-range absolute inset-0 size-full rounded-[inherit] opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          />
        </div>
      </div>

      {/* Clip strip */}
      <div className="flex flex-col gap-2 md:h-16 md:flex-row md:items-center md:gap-0">
        <div
          className={cn(
            LABEL_COLUMN,
            "flex items-baseline gap-2 md:flex-col md:gap-0.5",
          )}
        >
          <span className="text-small text-[#fafafa]">Showcases</span>
          <span className="text-caption text-dark-subtle">
            {clips.length} clips
          </span>
        </div>
        <div
          ref={stripRef}
          className="relative flex min-w-0 grow gap-[3px] overflow-x-auto p-[3px] [scrollbar-width:none] md:gap-0.5 [&::-webkit-scrollbar]:hidden"
        >
          {clips.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              data-clip={i}
              onClick={() => onSelect(i)}
              aria-label={`Cue ${item.title}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-14 shrink-0 overflow-hidden rounded-tag bg-dark-surface outline-none transition-[box-shadow,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-white/60",
                i === index
                  ? "shadow-[0_0_0_2px_var(--color-primary-soft)]"
                  : "opacity-80 hover:opacity-100",
              )}
              style={{
                width: Math.max(
                  STRIP_MIN_WIDTH,
                  Math.round(item.duration * STRIP_PX_PER_SECOND),
                ),
              }}
            >
              {/* biome-ignore lint/performance/noImgElement: remote showcase posters of arbitrary origin */}
              <img
                src={item.poster}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          ))}
          <a
            href={SUBMIT_SHOWCASE_URL}
            className="flex h-14 w-24 shrink-0 items-center justify-center gap-1.5 rounded-tag border border-dashed border-white/22 text-caption text-dark-body outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/60 md:w-[84px]"
          >
            <span aria-hidden="true" className="text-ui text-primary-soft">
              +
            </span>
            Your video
          </a>
        </div>
      </div>

      {/* Component rows */}
      {tracks.length > 0 && (
        <ul
          aria-label="Most used components"
          className="relative flex flex-col gap-0.5 border-t border-dark-border pt-1.5"
        >
          <li
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 left-[146px] md:left-[150px]"
          >
            <span
              className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-primary-soft"
              style={{ left: pct(reelTime) }}
            />
          </li>
          {tracks.map((track) => {
            const lit = clip.components.some((c) => c.name === track.name);
            return (
              <li key={track.name} className="flex h-7 items-center">
                <span
                  className={cn(
                    LABEL_COLUMN,
                    "flex justify-between gap-2 text-caption md:pr-3.5",
                  )}
                >
                  <span
                    className={cn(
                      "truncate",
                      lit ? "text-[#fafafa]" : "text-dark-body",
                    )}
                  >
                    {track.name}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums",
                      lit
                        ? "text-dark-body md:text-primary-soft"
                        : "text-dark-subtle",
                    )}
                  >
                    {track.count}
                  </span>
                </span>
                <span aria-hidden="true" className="relative h-7 min-w-0 grow">
                  {clips.map((item, i) =>
                    item.components.some((c) => c.name === track.name) ? (
                      <span
                        key={item.slug}
                        className={cn(
                          "absolute top-[7px] h-3.5 min-w-[3px] rounded-[3px] md:top-1.5 md:h-4 md:rounded-sm",
                          i === index ? "bg-primary-bright" : "bg-white/14",
                        )}
                        style={{
                          left: pct(item.start),
                          width: `calc(${pct(item.duration)} - 2px)`,
                        }}
                      />
                    ) : null,
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
