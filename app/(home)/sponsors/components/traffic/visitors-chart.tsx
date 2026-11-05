"use client";

import { type PointerEvent, useId, useState } from "react";
import { areaPath, smoothPath, spread } from "./curve";

export type ChartPoint = {
  /** "Sun, Oct 18" */
  label: string;
  visitors: number;
  /** "614 visitors" */
  valueLabel: string;
};

// Plot space, stretched to the box. The baseline sits 6px above the bottom
// and the busiest day peaks at y=20.5, like the design.
const VIEW_W = 760;
const VIEW_H = 220;
const BASELINE = 214;
const PEAK_Y = 20.5;

const pctY = (y: number) => `${(y / VIEW_H) * 100}%`;
const pctX = (x: number) => (x / VIEW_W) * 100;

/** 1, 2 or 5 × 10ⁿ, close to `value`. */
function niceStep(value: number) {
  const power = 10 ** Math.floor(Math.log10(value));
  const f = value / power;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * power;
}

const DASH_X =
  "repeating-linear-gradient(90deg, color-mix(in oklab, var(--color-foreground) 10%, transparent) 0 3px, transparent 3px 8px)";
const DASH_Y =
  "repeating-linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 35%, transparent) 0 2px, transparent 2px 5px)";

export function VisitorsChart({
  points,
  summary,
}: {
  points: ChartPoint[];
  /** Accessible description of the whole chart. */
  summary: string;
}) {
  const gradientId = `visitors-fill-${useId().replace(/[^\w-]/g, "")}`;
  const values = points.map((p) => p.visitors);
  const max = Math.max(...values, 0);
  const yMax = max > 0 ? (max * BASELINE) / (BASELINE - PEAK_Y) : 1;
  const toY = (v: number) => BASELINE - (v / yMax) * BASELINE;
  const plotted = spread(values, VIEW_W, toY);

  const step = max > 0 ? niceStep(max / 3) : 0;
  const grid: number[] = [];
  for (let v = step; step > 0 && v <= max; v += step) grid.push(toY(v));

  const peak = values.indexOf(max);
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? peak;
  const point = points[active];
  const at = plotted[active];

  const track = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((event.clientX - box.left) / box.width, 0),
      1,
    );
    setHovered(Math.round(ratio * (points.length - 1)));
  };

  if (!point || !at) return null;
  const x = pctX(at.x);
  const flip = x < 50;

  return (
    <div
      role="img"
      aria-label={summary}
      onPointerDown={track}
      onPointerMove={track}
      onPointerLeave={() => setHovered(null)}
      className="relative h-[180px] w-full shrink-0 touch-pan-y select-none md:h-[220px]"
    >
      {grid.map((y) => (
        <div
          key={y}
          aria-hidden="true"
          className="absolute inset-x-0 h-px"
          style={{ top: pctY(y), backgroundImage: DASH_X }}
        />
      ))}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 h-px bg-foreground/14"
        style={{ top: pctY(BASELINE) }}
      />
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C026D3" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#C026D3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath(plotted, BASELINE)} fill={`url(#${gradientId})`} />
        <path
          d={smoothPath(plotted)}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute w-px -translate-x-1/2"
        style={{
          left: `${x}%`,
          top: pctY(at.y),
          bottom: pctY(VIEW_H - BASELINE),
          backgroundImage: DASH_Y,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card"
        style={{ left: `${x}%`, top: pctY(at.y) }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 flex flex-col gap-0.5 rounded-control-sm bg-dark-surface px-3 py-2 whitespace-nowrap dark:bg-secondary dark:shadow-[0_0_0_1px_var(--color-hairline)]"
        style={
          flip
            ? { left: `calc(${x}% + 16px)` }
            : { right: `calc(${100 - x}% + 16px)` }
        }
      >
        <span className="text-caption text-dark-subtle">{point.label}</span>
        <span className="text-small text-[#fafafa] tabular-nums">
          {point.valueLabel}
        </span>
      </div>
    </div>
  );
}
