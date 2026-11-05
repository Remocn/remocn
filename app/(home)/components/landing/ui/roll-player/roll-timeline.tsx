"use client";

import {
  Fragment,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "./roll-buttons";

const LABEL_COUNT = 7;
const TICKS_BETWEEN = 2;

/** 0s … duration across seven evenly spaced labels, last one exact. */
function rulerLabels(duration: number) {
  return Array.from({ length: LABEL_COUNT }, (_, i) => ({
    id: `label-${i}`,
    value:
      i === LABEL_COUNT - 1
        ? Math.round(duration)
        : Math.floor((i * duration) / (LABEL_COUNT - 1)),
  }));
}

/** Labels and ticks; rendered twice (muted, then bright inside the frame). */
function Ruler({
  labels,
  bright,
}: {
  labels: ReturnType<typeof rulerLabels>;
  bright?: boolean;
}) {
  return labels.map((label, i) => (
    <Fragment key={label.id}>
      <span
        className={cn(
          "text-mono",
          bright ? "text-[#fafafa]" : "text-dark-body",
        )}
      >
        {label.value}s
      </span>
      {i < labels.length - 1 &&
        Array.from({ length: TICKS_BETWEEN }, (_, t) => (
          <span
            key={t}
            className={cn(
              "h-3 w-px shrink-0",
              bright ? "bg-[#4a4e52]" : "bg-[#3a3e42]",
            )}
          />
        ))}
    </Fragment>
  ));
}

const RULER_ROW =
  "absolute inset-0 flex items-center justify-between px-4 tabular-nums";

export type HandleSide = "start" | "end";

/** Seconds the frame spans: now, and at the zoom limits. */
export type VisibleSeconds = { now: number; min: number; max: number };

type HandlePointer = (
  side: HandleSide,
  event: ReactPointerEvent<HTMLSpanElement>,
) => void;

/**
 * A grip on one edge of the frame. Wider than the bar it draws, so it's easy
 * to catch; dragging it stretches or squeezes the frame (and with it how much
 * of the roll fits on screen).
 */
function Handle({
  side,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  visible,
}: {
  side: HandleSide;
  onPointerDown: HandlePointer;
  onPointerMove: HandlePointer;
  onPointerUp: HandlePointer;
  /** Only one handle is a keyboard slider; the other is pointer-only. */
  onKeyDown?: (event: KeyboardEvent<HTMLSpanElement>) => void;
  visible: VisibleSeconds;
}) {
  const grip = {
    onPointerDown: (event: ReactPointerEvent<HTMLSpanElement>) =>
      onPointerDown(side, event),
    onPointerMove: (event: ReactPointerEvent<HTMLSpanElement>) =>
      onPointerMove(side, event),
    onPointerUp: (event: ReactPointerEvent<HTMLSpanElement>) =>
      onPointerUp(side, event),
    onPointerCancel: (event: ReactPointerEvent<HTMLSpanElement>) =>
      onPointerUp(side, event),
    className: cn(
      "group/handle pointer-events-auto absolute inset-y-0 flex w-3 cursor-ew-resize touch-none items-center justify-center rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-white/50",
      side === "start" ? "left-0" : "right-0",
    ),
  };
  const bar = (
    <span className="h-3.5 w-[3px] rounded-[2px] bg-[#fafafa] transition-transform duration-150 ease-out group-hover/handle:scale-y-125 group-active/handle:scale-y-125" />
  );

  if (!onKeyDown) {
    return (
      <span aria-hidden="true" {...grip}>
        {bar}
      </span>
    );
  }
  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label="Frame length"
      aria-valuemin={Math.round(visible.min)}
      aria-valuemax={Math.round(visible.max)}
      aria-valuenow={Math.round(visible.now)}
      aria-valuetext={`${visible.now.toFixed(1)} seconds in frame`}
      onKeyDown={onKeyDown}
      {...grip}
    >
      {bar}
    </span>
  );
}

export function RollTimeline({
  className,
  label,
  current,
  duration,
  visible,
  trackRef,
  frameRef,
  brightRef,
  onSeekKeyDown,
  onSeekPointerDown,
  onSeekPointerMove,
  onSeekPointerUp,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandleKeyDown,
}: {
  className?: string;
  label: string;
  current: number;
  duration: number;
  visible: VisibleSeconds;
  trackRef: Ref<HTMLDivElement>;
  frameRef: Ref<HTMLDivElement>;
  brightRef: Ref<HTMLDivElement>;
  onSeekKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onSeekPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSeekPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSeekPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onHandlePointerDown: HandlePointer;
  onHandlePointerMove: HandlePointer;
  onHandlePointerUp: HandlePointer;
  onHandleKeyDown: (event: KeyboardEvent<HTMLSpanElement>) => void;
}) {
  const labels = rulerLabels(duration);
  const total = Math.round(duration);
  const handle = {
    onPointerDown: onHandlePointerDown,
    onPointerMove: onHandlePointerMove,
    onPointerUp: onHandlePointerUp,
    visible,
  };

  return (
    <div
      className={cn(
        "relative h-10 min-w-0 flex-1 overflow-clip rounded-[10px] bg-dark-raised select-none",
        className,
      )}
    >
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`Seek ${label}`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.floor(current)}
        aria-valuetext={`${formatTime(current)} of ${formatTime(total)}`}
        onKeyDown={onSeekKeyDown}
        onPointerDown={onSeekPointerDown}
        onPointerMove={onSeekPointerMove}
        onPointerUp={onSeekPointerUp}
        onPointerCancel={onSeekPointerUp}
        className={cn(
          RULER_ROW,
          "cursor-pointer touch-none rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset",
        )}
      >
        <Ruler labels={labels} />
      </div>
      <div
        ref={frameRef}
        className="pointer-events-none absolute top-1 left-0 h-8 w-[26%] rounded-tile border border-white/10 bg-white/[0.12] will-change-transform"
      >
        <Handle side="start" {...handle} />
        <Handle side="end" onKeyDown={onHandleKeyDown} {...handle} />
      </div>
      <div
        ref={brightRef}
        aria-hidden="true"
        className={cn(RULER_ROW, "pointer-events-none")}
        style={{ clipPath: "inset(0 74% 0 0)" }}
      >
        <Ruler labels={labels} bright />
      </div>
    </div>
  );
}
