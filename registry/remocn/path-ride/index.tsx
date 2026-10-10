"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import {
  getLength,
  getPointAtLength,
  getTangentAtLength,
} from "@remotion/paths";
import { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["100", "900"],
  subsets: ["latin"],
});

export interface PathRideProps {
  text?: string;
  path?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  color?: string;
  lineColor?: string;
  lineWidth?: number;
  speed?: number;
  className?: string;
}

/** An S-curve across a 1280×720 frame. */
export const pathRideDefaultPath =
  "M 120 560 C 360 120 560 120 640 360 S 920 600 1160 160";

export const pathRideDefaults = {
  text: "Follow the line",
  path: pathRideDefaultPath,
  fontSize: 44,
  fontWeight: 700,
  fontFamily: INTER,
  color: "#fafafa",
  lineColor: "#D97757",
  lineWidth: 3,
  speed: 1,
} satisfies Required<Omit<PathRideProps, "className">>;

/** Beats on the 30 fps clock. */
export const pathRideTiming = {
  draw: [0, 40],
  straighten: [50, 68],
  erase: [52, 70],
} as const;

/** Gap between the head and the last letter, in em. */
const LEAD = 0.3;
/** Letters fade in over this much arc length, in em. */
const FADE_IN = 0.5;
/** Extra lift of the baseline above the line, in em. */
const LIFT = 0.08;
/** Samples along the path; the line and the letters read positions from them. */
const SAMPLES = 400;
const MEASURE_SIZE = 100;
/** Inter's baseline and cap height in a `line-height: 1` box, until measured. */
const INTER_METRICS = { baseline: 0.8637, capHeight: 0.7275 };

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeInOutCubic = Easing.inOut(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getPathRideTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

/** Arc length drawn so far. */
export function getPathRideHead(t: number, length: number) {
  return interpolate(t, [...pathRideTiming.draw], [0, length], {
    ...CLAMP,
    easing: easeInOutCubic,
  });
}

/** Arc length erased from the start. */
export function getPathRideTail(t: number, length: number) {
  return interpolate(t, [...pathRideTiming.erase], [0, length], {
    ...CLAMP,
    easing: easeInOutCubic,
  });
}

/** How far the curve has pulled straight, 0..1. */
export function getPathRideStraighten(t: number) {
  return interpolate(t, [...pathRideTiming.straighten], [0, 1], {
    ...CLAMP,
    easing: easeInOutCubic,
  });
}

/** Frame where the line has erased and the text rests on its baseline. */
export const pathRideLength = Math.max(
  pathRideTiming.straighten[1],
  pathRideTiming.erase[1],
);

/** Letter centers from the text start, and the total width. */
export function getPathRideCenters(advances: readonly number[]) {
  let x = 0;
  const centers = advances.map((a) => {
    const c = x + a / 2;
    x += a;
    return c;
  });
  return { centers, width: x };
}

/**
 * Arc length of a letter's center: it trails the head by the lead plus the
 * text after it, so the last letter follows the head most closely.
 */
export function getPathRideArc(
  head: number,
  center: number,
  width: number,
  fontSize: number,
) {
  return head - LEAD * fontSize - (width - center);
}

/** Opacity of a letter from how far onto the curve it has come. */
export function getPathRideFade(arc: number, fontSize: number) {
  return Math.min(1, Math.max(0, arc / (FADE_IN * fontSize)));
}

export interface Point {
  x: number;
  y: number;
}

export interface PathSamples {
  length: number;
  points: Point[];
  tangents: Point[];
}

/** Points and unit tangents at evenly spaced arc lengths along `path`. */
export function samplePath(path: string, count = SAMPLES): PathSamples {
  const length = getLength(path);
  const n = Math.max(2, Math.round(count));
  const points: Point[] = [];
  const tangents: Point[] = [];
  for (let i = 0; i < n; i++) {
    const at = (length * i) / (n - 1);
    // Both can come back null on a degenerate path; reuse the last sample.
    const p = getPointAtLength(path, at) ?? points[i - 1] ?? { x: 0, y: 0 };
    const tangent = getTangentAtLength(path, at) ??
      tangents[i - 1] ?? { x: 1, y: 0 };
    points.push({ x: p.x, y: p.y });
    tangents.push({ x: tangent.x, y: tangent.y });
  }
  return { length, points, tangents };
}

/** Position and unit tangent at arc length `s`, clamped to the path. */
export function getPathSample(samples: PathSamples, s: number) {
  const n = samples.points.length;
  const u = samples.length > 0 ? (s / samples.length) * (n - 1) : 0;
  const i = Math.min(n - 2, Math.max(0, Math.floor(u)));
  const f = Math.min(1, Math.max(0, u - i));
  const a = samples.points[i];
  const b = samples.points[i + 1];
  const ta = samples.tangents[i];
  const tb = samples.tangents[i + 1];
  const tx = ta.x + (tb.x - ta.x) * f;
  const ty = ta.y + (tb.y - ta.y) * f;
  const norm = Math.hypot(tx, ty) || 1;
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    tx: tx / norm,
    ty: ty / norm,
  };
}

export interface PathRideStraight {
  /** Arc length that lands on the text's left edge. */
  start: number;
  /** Reference x of the text's left edge on the straight baseline. */
  left: number;
  /** Reference y of the straight baseline. */
  baseline: number;
}

export interface PathRidePose {
  x: number;
  y: number;
  angle: number;
}

/**
 * A point of the path pulled `k` of the way from the curve to the straight
 * baseline, lifted `lift` along its normal. Arc length maps to x one to one,
 * so the text keeps its spacing while the curve pulls taut.
 */
export function getPathRidePoint(
  samples: PathSamples,
  s: number,
  k: number,
  straight: PathRideStraight,
  lift = 0,
): PathRidePose {
  const p = getPathSample(samples, s);
  const x = p.x + (straight.left + (s - straight.start) - p.x) * k;
  const y = p.y + (straight.baseline - p.y) * k;
  const tx = p.tx + (1 - p.tx) * k;
  const ty = p.ty * (1 - k);
  const norm = Math.hypot(tx, ty) || 1;
  return {
    x: x + (ty / norm) * lift,
    y: y - (tx / norm) * lift,
    angle: Math.atan2(ty, tx),
  };
}

/** Polyline of the pulled path between two arc lengths. */
export function getPathRideLine(
  samples: PathSamples,
  from: number,
  to: number,
  k: number,
  straight: PathRideStraight,
) {
  if (to <= from) return "";
  const step = samples.length / (samples.points.length - 1);
  const stops = [from];
  for (let s = Math.ceil(from / step) * step; s < to; s += step) {
    if (s > from) stops.push(s);
  }
  stops.push(to);
  return stops
    .map((s, i) => {
      const p = getPathRidePoint(samples, s, k, straight);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join("");
}

function useMetrics(text: string, font: string, fallback: number) {
  const chars = Array.from(text);
  const key = chars.join("");
  const [metrics, setMetrics] = useState<{
    advances: number[];
    baseline: number;
    capHeight: number;
  } | null>(null);

  useEffect(() => {
    const handle = delayRender("path-ride: measuring the text");
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    const measure = () => {
      if (released) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.font = font;
        const m = ctx.measureText("H");
        const ascent = m.fontBoundingBoxAscent / MEASURE_SIZE;
        const descent = m.fontBoundingBoxDescent / MEASURE_SIZE;
        setMetrics({
          advances: Array.from(key).map(
            (c) => ctx.measureText(c).width / MEASURE_SIZE,
          ),
          baseline:
            ascent > 0
              ? (1 - (ascent + descent)) / 2 + ascent
              : INTER_METRICS.baseline,
          capHeight:
            m.actualBoundingBoxAscent > 0
              ? m.actualBoundingBoxAscent / MEASURE_SIZE
              : INTER_METRICS.capHeight,
        });
      }
      release();
    };
    document.fonts.load(font, key).then(measure, measure);
    return release;
  }, [key, font]);

  return (
    metrics ?? {
      advances: chars.map(() => fallback),
      baseline: INTER_METRICS.baseline,
      capHeight: INTER_METRICS.capHeight,
    }
  );
}

export function PathRide({
  text = pathRideDefaults.text,
  path = pathRideDefaults.path,
  fontSize = pathRideDefaults.fontSize,
  fontWeight = pathRideDefaults.fontWeight,
  fontFamily = pathRideDefaults.fontFamily,
  color = pathRideDefaults.color,
  lineColor = pathRideDefaults.lineColor,
  lineWidth = pathRideDefaults.lineWidth,
  speed = pathRideDefaults.speed,
  className,
}: PathRideProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const unit = height / 720;
  const t = getPathRideTime(frame, { fps, speed });
  const metrics = useMetrics(
    text,
    `${fontWeight} ${MEASURE_SIZE}px ${fontFamily}`,
    0.55,
  );
  const samples = useMemo(() => samplePath(path), [path]);
  const chars = Array.from(text);
  const advances = metrics.advances.map((a) => a * fontSize);
  const { centers, width: textWidth } = getPathRideCenters(advances);
  const length = samples.length;
  const head = getPathRideHead(t, length);
  const tail = getPathRideTail(t, length);
  const k = getPathRideStraighten(t);
  const lift = lineWidth / 2 + LIFT * fontSize;
  // The line settles `lift` below the text so the capitals center on the frame.
  const straight: PathRideStraight = {
    start: getPathRideArc(length, 0, textWidth, fontSize),
    left: 640 - textWidth / 2,
    baseline: 360 + (metrics.capHeight * fontSize) / 2 + lift,
  };
  const tip = getPathRidePoint(samples, head, k, straight);
  const tipOpacity = interpolate(
    head,
    [0, length * 0.02, length * 0.98, length],
    [0, 1, 1, 0],
    CLAMP,
  );
  // Reference space (1280×720, y down) mapped onto the composition.
  const toX = (x: number) => width / 2 + (x - 640) * unit;
  const toY = (y: number) => height / 2 + (y - 360) * unit;
  const size = fontSize * unit;
  const line = getPathRideLine(samples, tail, head, k, straight);

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <g
          transform={`translate(${toX(0)} ${toY(0)}) scale(${unit})`}
          fill="none"
        >
          {line ? (
            <path
              d={line}
              stroke={lineColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {tipOpacity > 0 ? (
            <circle
              cx={tip.x}
              cy={tip.y}
              r={lineWidth * 1.6}
              fill={lineColor}
              opacity={tipOpacity}
            />
          ) : null}
        </g>
      </svg>
      {chars.map((char, j) => {
        const arc = getPathRideArc(head, centers[j], textWidth, fontSize);
        const fade = getPathRideFade(arc, fontSize);
        if (fade <= 0) return null;
        const pose = getPathRidePoint(samples, arc, k, straight, lift);
        return (
          <span
            key={j}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              fontFamily,
              fontSize: size,
              lineHeight: 1,
              fontWeight,
              fontVariationSettings: `"wght" ${fontWeight}`,
              color,
              whiteSpace: "pre",
              opacity: fade,
              transformOrigin: "0 0",
              transform: `translate(${toX(pose.x)}px, ${toY(pose.y)}px) rotate(${pose.angle}rad) translate(-50%, ${-metrics.baseline * size}px)`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}
