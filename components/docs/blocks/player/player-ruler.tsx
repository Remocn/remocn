"use client";

import type { KeyboardEvent, PointerEvent, Ref } from "react";
import { formatTime } from "@/app/(home)/components/landing/ui/roll-player/roll-buttons";
import { cn } from "@/lib/utils";

/** Labels sit 6px inside the frame's travel so "0s" clears the frame edge. */
const MARKS_BOX = "absolute inset-y-0 inset-x-1.5";
const CLIP_START = "inset(0 100% 0 0)";

const LABEL_STEPS = [1, 2, 5, 10, 15, 30, 60];
const MAX_LABELS = 6;

type Mark = { at: number; label?: string; phone?: boolean; desktop?: boolean };

const seconds = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, "")}s`;

/**
 * Second labels on a round step that fits the clip (0s, 1s, 2s … and the exact
 * end), with ticks at thirds of a step on desktop and halves on phones.
 */
function rulerMarks(duration: number): Mark[] {
  const step =
    LABEL_STEPS.find((s) => duration / s <= MAX_LABELS) ?? LABEL_STEPS.at(-1);
  if (!step || duration <= 0) return [];
  const marks: Mark[] = [];
  for (let t = 0; t < duration - step * 0.4; t += step) {
    marks.push({ at: t, label: seconds(t) });
  }
  marks.push({ at: duration, label: seconds(duration) });

  for (let t = 0; t + step <= duration; t += step) {
    marks.push(
      { at: t + step / 3, desktop: true },
      { at: t + (step * 2) / 3, desktop: true },
      { at: t + step / 2, phone: true },
    );
  }
  // A short last stretch (3s → 3.5s) gets one centred tick when it has room.
  const rest = duration % step;
  if (rest >= step * 0.6) {
    marks.push({ at: duration - rest / 2 });
  }
  return marks;
}

function Marks({
  marks,
  duration,
  bright,
}: {
  marks: Mark[];
  duration: number;
  bright?: boolean;
}) {
  return marks.map((mark) => {
    const pct = (mark.at / duration) * 100;
    if (mark.label) {
      return (
        <span
          key={`l-${mark.at}`}
          className={cn(
            "absolute top-1/2 text-mono tabular-nums max-md:text-caption",
            bright ? "text-[#fafafa]" : "text-dark-subtle",
          )}
          style={{ left: `${pct}%`, transform: `translate(-${pct}%, -50%)` }}
        >
          {mark.label}
        </span>
      );
    }
    return (
      <span
        key={`t-${mark.at}`}
        className={cn(
          "absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2",
          bright ? "bg-white/30" : "bg-white/14",
          mark.desktop && "max-md:hidden",
          mark.phone && "md:hidden",
        )}
        style={{ left: `${pct}%` }}
      />
    );
  });
}

/**
 * The seek track: second labels and ticks, a soft frame from the start up to
 * the playhead with the labels inside it lit, and the white playhead itself.
 * Progress is written straight to the DOM by the bar (`frameRef`, `brightRef`,
 * `headRef`); `trackRef` is the seek target so playback never re-renders React.
 */
export function PlayerRuler({
  label,
  trackRef,
  duration,
  current,
  frameRef,
  brightRef,
  headRef,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  label: string;
  trackRef: Ref<HTMLDivElement>;
  duration: number;
  current: number;
  frameRef: Ref<HTMLDivElement>;
  brightRef: Ref<HTMLDivElement>;
  headRef: Ref<HTMLDivElement>;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  const marks = rulerMarks(duration);
  const total = Math.max(duration, 0);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`Seek ${label}`}
      aria-valuemin={0}
      aria-valuemax={Math.round(total * 10) / 10}
      aria-valuenow={Math.round(current * 10) / 10}
      aria-valuetext={`${formatTime(current)} of ${formatTime(total)}`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      ref={trackRef}
      className="relative h-10 min-w-0 flex-1 cursor-pointer touch-none overflow-clip rounded-control-sm bg-dark-raised outline-none select-none focus-visible:ring-2 focus-visible:ring-white/40 max-md:h-11 dark:bg-surface-muted"
    >
      <div className="pointer-events-none absolute inset-y-0 right-2 left-2 max-md:inset-x-1.5">
        <div className={MARKS_BOX}>
          <Marks marks={marks} duration={total} />
        </div>
        <div
          ref={frameRef}
          className="absolute inset-x-0 top-1 h-8 rounded-tile border border-white/10 bg-white/6 max-md:top-1.5"
          style={{ clipPath: CLIP_START }}
        />
        <div
          ref={brightRef}
          aria-hidden="true"
          className="absolute inset-0"
          style={{ clipPath: CLIP_START }}
        >
          <div className={MARKS_BOX}>
            <Marks marks={marks} duration={total} bright />
          </div>
        </div>
        <div ref={headRef} className="absolute inset-0 will-change-transform">
          <span className="absolute top-1.5 left-0 h-7 w-[3px] -translate-x-1/2 rounded-[2px] bg-white max-md:top-2" />
        </div>
      </div>
    </div>
  );
}
