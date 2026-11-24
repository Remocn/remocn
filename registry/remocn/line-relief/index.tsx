"use client";

import { useId, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type LineReliefElementId, lineReliefTimeline } from "./timeline";

export interface LineReliefProps {
  word?: string;
  /** Number of horizontal lines in the field. */
  count?: number;
  /** Frames the rise takes to sweep from the left edge to the right. */
  sweep?: number;
  accent?: string;
  /** Color of the lines and the word; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the dusk sky; "transparent" drops it. */
  background?: string;
  /** Size of the line field, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the field's entry and spread, the rise, the
   * settle and the word's reveal, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<LineReliefElementId>;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_RISE = Easing.bezier(0.45, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "horizon" palette (dusk band: #b4553a, #c98f8a, #6f8fb0,
// #3a1f33, #dfe8ff) as the ground: night sky at the top (tinted by the accent),
// dusk glow at the bottom. The lines stay neutral so the relief reads cleanly.
const THEMES = {
  dark: {
    bg: "#050405",
    fg: "#F3F2EF",
    sky: [
      [0, "accent", 0.1],
      [0.36, "#0b0912", 0],
      [0.64, "#26141f", 0],
      [0.87, "#72372a", 0],
      [1, "#b4553a", 0],
    ],
    line: 0.36,
    lift: 0.95,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    sky: [
      [0, "accent", 0.08],
      [0.18, "#e9ecef", 0],
      [0.55, "#F5F4F0", 0],
      [0.84, "#ecd6cf", 0],
      [1, "#e2b4a2", 0],
    ],
    line: 0.34,
    lift: 0.92,
    grain: 0.045,
  },
} as const;

function mix(a: string, b: string, k: number) {
  const ch = (h: string, i: number) =>
    Number.parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  if (!/^#[0-9a-fA-F]{6}$/.test(a) || !/^#[0-9a-fA-F]{6}$/.test(b)) return a;
  return `rgb(${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k)).join(",")})`;
}

const LINES = 40;
const SAMPLES = 260;
const GAP = 1.7;
const STROKE = 0.5;

type Pt = [number, number];
type Glyph = { w: number; strokes: Pt[][] };

function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
): Pt[] {
  const n = Math.max(6, Math.ceil(Math.abs(to - from) / 12));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt;
  });
}

const GLYPHS: Record<string, Glyph> = {
  A: {
    w: 4.4,
    strokes: [
      [
        [0, 6],
        [2.2, 0],
        [4.4, 6],
      ],
      [
        [0.8, 4],
        [3.6, 4],
      ],
    ],
  },
  B: {
    w: 4.1,
    strokes: [
      [
        [0, 0],
        [0, 6],
      ],
      [[0, 0], ...arc(2.4, 1.5, 1.5, 1.5, -90, 90), [0, 3]],
      [[0, 3], ...arc(2.6, 4.5, 1.5, 1.5, -90, 90), [0, 6]],
    ],
  },
  C: { w: 4.4, strokes: [arc(2.5, 3, 2.5, 3, -45, -315)] },
  D: {
    w: 4.2,
    strokes: [
      [
        [0, 0],
        [0, 6],
      ],
      [[0, 0], ...arc(1.4, 3, 2.8, 3, -90, 90), [0, 6]],
    ],
  },
  E: {
    w: 3.8,
    strokes: [
      [
        [3.8, 0],
        [0, 0],
        [0, 6],
        [3.8, 6],
      ],
      [
        [0, 3],
        [3.2, 3],
      ],
    ],
  },
  F: {
    w: 3.8,
    strokes: [
      [
        [3.8, 0],
        [0, 0],
        [0, 6],
      ],
      [
        [0, 3],
        [3.2, 3],
      ],
    ],
  },
  G: { w: 5, strokes: [[...arc(2.5, 3, 2.5, 3, -45, -360), [2.8, 3]]] },
  H: {
    w: 4.2,
    strokes: [
      [
        [0, 0],
        [0, 6],
      ],
      [
        [4.2, 0],
        [4.2, 6],
      ],
      [
        [0, 3],
        [4.2, 3],
      ],
    ],
  },
  I: {
    w: 0,
    strokes: [
      [
        [0, 0],
        [0, 6],
      ],
    ],
  },
  J: {
    w: 3.4,
    strokes: [[[3.4, 0], [3.4, 4.3], ...arc(1.7, 4.3, 1.7, 1.7, 0, 180)]],
  },
  K: {
    w: 4,
    strokes: [
      [
        [0, 0],
        [0, 6],
      ],
      [
        [4, 0],
        [0, 3.8],
      ],
      [
        [1.4, 2.5],
        [4, 6],
      ],
    ],
  },
  L: {
    w: 3.6,
    strokes: [
      [
        [0, 0],
        [0, 6],
        [3.6, 6],
      ],
    ],
  },
  M: {
    w: 5.2,
    strokes: [
      [
        [0, 6],
        [0, 0],
        [2.6, 4.2],
        [5.2, 0],
        [5.2, 6],
      ],
    ],
  },
  N: {
    w: 4.2,
    strokes: [
      [
        [0, 6],
        [0, 0],
        [4.2, 6],
        [4.2, 0],
      ],
    ],
  },
  O: { w: 5.2, strokes: [arc(2.6, 3, 2.6, 3, 0, 360)] },
  P: {
    w: 4,
    strokes: [
      [
        [0, 6],
        [0, 0],
        [2.3, 0],
        ...arc(2.3, 1.65, 1.65, 1.65, -90, 90),
        [0, 3.3],
      ],
    ],
  },
  Q: {
    w: 5.2,
    strokes: [
      arc(2.6, 3, 2.6, 3, 0, 360),
      [
        [3.3, 4.3],
        [5.2, 6.2],
      ],
    ],
  },
  R: {
    w: 4.1,
    strokes: [
      [
        [0, 6],
        [0, 0],
        [2.3, 0],
        ...arc(2.3, 1.65, 1.65, 1.65, -90, 90),
        [0, 3.3],
      ],
      [
        [2.2, 3.3],
        [4.1, 6],
      ],
    ],
  },
  S: {
    w: 4,
    strokes: [
      [...arc(2, 1.5, 1.9, 1.5, -25, -270), ...arc(2, 4.5, 2, 1.5, -90, 155)],
    ],
  },
  T: {
    w: 4.4,
    strokes: [
      [
        [0, 0],
        [4.4, 0],
      ],
      [
        [2.2, 0],
        [2.2, 6],
      ],
    ],
  },
  U: {
    w: 4.2,
    strokes: [[[0, 0], ...arc(2.1, 3.9, 2.1, 2.1, 180, 0), [4.2, 0]]],
  },
  V: {
    w: 4.6,
    strokes: [
      [
        [0, 0],
        [2.3, 6],
        [4.6, 0],
      ],
    ],
  },
  W: {
    w: 6,
    strokes: [
      [
        [0, 0],
        [1.5, 6],
        [3, 1.4],
        [4.5, 6],
        [6, 0],
      ],
    ],
  },
  X: {
    w: 4.2,
    strokes: [
      [
        [0, 0],
        [4.2, 6],
      ],
      [
        [4.2, 0],
        [0, 6],
      ],
    ],
  },
  Y: {
    w: 4.4,
    strokes: [
      [
        [0, 0],
        [2.2, 3.2],
        [4.4, 0],
      ],
      [
        [2.2, 3.2],
        [2.2, 6],
      ],
    ],
  },
  Z: {
    w: 4,
    strokes: [
      [
        [0, 0],
        [4, 0],
        [0, 6],
        [4, 6],
      ],
    ],
  },
  "0": { w: 4, strokes: [arc(2, 3, 2, 3, 0, 360)] },
  "1": {
    w: 2,
    strokes: [
      [
        [0, 1.3],
        [2, 0],
        [2, 6],
      ],
    ],
  },
  "2": { w: 4, strokes: [[...arc(2, 2, 2, 2, -165, 25), [0, 6], [4, 6]]] },
  "3": {
    w: 4,
    strokes: [
      [...arc(2, 1.5, 1.8, 1.5, -160, 90), ...arc(2, 4.5, 2, 1.5, -90, 160)],
    ],
  },
  "4": {
    w: 4.2,
    strokes: [
      [
        [3.2, 6],
        [3.2, 0],
        [0, 4.3],
        [4.2, 4.3],
      ],
    ],
  },
  "5": {
    w: 4,
    strokes: [
      [[3.7, 0], [0.4, 0], [0.2, 2.7], ...arc(2, 4.1, 2, 1.9, -125, 150)],
    ],
  },
  "6": {
    w: 4,
    strokes: [
      arc(2, 4.1, 2, 1.9, 0, 360),
      [
        [0.05, 3.9],
        [0.7, 1.5],
        [1.9, 0.2],
        [3.4, 0],
      ],
    ],
  },
  "7": {
    w: 4,
    strokes: [
      [
        [0, 0],
        [4, 0],
        [1.4, 6],
      ],
    ],
  },
  "8": {
    w: 4,
    strokes: [arc(2, 1.45, 1.75, 1.45, 0, 360), arc(2, 4.4, 2, 1.6, 0, 360)],
  },
  "9": {
    w: 4,
    strokes: [
      arc(2, 1.9, 2, 1.9, 0, 360),
      [
        [3.95, 2.1],
        [3.3, 4.5],
        [2.1, 5.8],
        [0.6, 6],
      ],
    ],
  },
  ".": {
    w: 0,
    strokes: [
      [
        [0, 5.95],
        [0, 6],
      ],
    ],
  },
  "!": {
    w: 0,
    strokes: [
      [
        [0, 0],
        [0, 4],
      ],
      [
        [0, 5.95],
        [0, 6],
      ],
    ],
  },
  "-": {
    w: 2.8,
    strokes: [
      [
        [0, 3.2],
        [2.8, 3.2],
      ],
    ],
  },
  "+": {
    w: 3.6,
    strokes: [
      [
        [0, 3],
        [3.6, 3],
      ],
      [
        [1.8, 1.2],
        [1.8, 4.8],
      ],
    ],
  },
};

function layoutWord(word: string) {
  const segs: Array<[Pt, Pt]> = [];
  const paths: Pt[][] = [];
  let x = 0;
  const chars = word.toUpperCase().split("");
  chars.forEach((ch, i) => {
    if (ch === " ") {
      x += 2.6;
      return;
    }
    const g = GLYPHS[ch];
    if (!g) return;
    for (const stroke of g.strokes) {
      const moved = stroke.map(([px, py]) => [px + x, py] as Pt);
      paths.push(moved);
      for (let k = 1; k < moved.length; k++)
        segs.push([moved[k - 1], moved[k]]);
    }
    x += g.w + (i < chars.length - 1 ? GAP : 0);
  });
  return { segs, paths, width: Math.max(1, x) };
}

function segDist(px: number, py: number, [a, b]: [Pt, Pt]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const k =
    l2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l2));
  const ex = px - (a[0] + k * dx);
  const ey = py - (a[1] + k * dy);
  return Math.sqrt(ex * ex + ey * ey);
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LineRelief(props: LineReliefProps) {
  const {
    word = "LAUNCH",
    count = LINES,
    accent = "#3B5BFD",
    ink,
    background,
    scale = 1,
    delay = 0,
    grain = true,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    lineReliefTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const enterEl = tl.get("enter");
  const spreadEl = tl.get("spread");
  const riseEl = tl.get("rise");
  const settleEl = tl.get("settle");
  const revealEl = tl.get("reveal");
  const u = height / 720;
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const sky =
    background === undefined
      ? p.sky.map(
          ([o, c, k]) =>
            [o, c === "accent" ? mix(p.sky[1][1], accent, k) : c] as const,
        )
      : ([
          [0, background],
          [1, background],
        ] as const);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const left = width * 0.08;
  const right = width * 0.92;
  const top = height * 0.2;
  const bottom = height * 0.84;
  const fieldW = right - left;
  const step = (bottom - top) / (count - 1);

  const glyphs = useMemo(() => layoutWord(word), [word]);
  const unit = Math.min((fieldW * 0.8) / glyphs.width, (height * 0.3) / 6);
  const wordX = left + (fieldW - glyphs.width * unit) / 2;
  const wordY = (top + bottom) / 2 - 3 * unit + step * 0.5;
  const lift = step * 2.5;

  const field = useMemo(() => {
    const rows: number[][] = [];
    for (let j = 0; j < count; j++) {
      const gy = (top + j * step - wordY) / unit;
      const row: number[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const gx = (left + (fieldW * i) / SAMPLES - wordX) / unit;
        let d = Number.POSITIVE_INFINITY;
        if (gx > -2 && gx < glyphs.width + 2 && gy > -2 && gy < 8) {
          for (const s of glyphs.segs) d = Math.min(d, segDist(gx, gy, s));
        }
        row.push(1 - smooth(0.05, 0.95, d));
      }
      rows.push(row);
    }
    return rows;
  }, [glyphs, left, fieldW, top, step, unit, wordX, wordY, count]);

  const settle = interpolate(t, [settleEl.start, settleEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const reveal = interpolate(t, [revealEl.start, revealEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const enter = interpolate(t, [enterEl.start, enterEl.end], [0.45, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const sec = t / 30;

  const lines = field.map((row, j) => {
    const base = top + j * step;
    const ring = Math.abs(j - (count - 1) / 2);
    const reachAt = spreadEl.start + ring * spreadEl.beat("step");
    const reach = interpolate(
      t,
      [reachAt, reachAt + spreadEl.beat("reach")],
      [0.2, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    let d = "";
    let hi = "";
    let inHi = false;
    let maxLift = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      const xn = i / SAMPLES;
      if (xn > reach + 0.0001) continue;
      const grow = interpolate(
        t,
        [
          riseEl.start + xn * riseEl.beat("sweep"),
          riseEl.start + riseEl.beat("grow") + xn * riseEl.beat("sweep"),
        ],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_RISE,
        },
      );
      const h = row[i] * grow * (1 - settle);
      maxLift = Math.max(maxLift, h);
      const drift =
        1.2 *
          u *
          Math.sin(xn * 19 + sec * 1.6 + j * 0.7 + hash(j) * 6) *
          (1 - settle) +
        0.8 * u * Math.sin(xn * 47 - sec * 2.3 + j * 1.3);
      const y = base - lift * h - drift * (1 - h);
      const pt = `${(left + xn * fieldW).toFixed(2)} ${y.toFixed(2)}`;
      d += `${d ? "L" : "M"}${pt}`;
      const on = row[i] > 0.015;
      if (on) hi += `${inHi ? "L" : "M"}${pt}`;
      inHi = on;
    }
    const x0 = left;
    const x1 =
      left +
      Math.min(1, Math.floor(reach * SAMPLES + 0.0001) / SAMPLES) * fieldW;
    return {
      d,
      fill: `${d} L${x1.toFixed(2)} ${(base + step * 0.6).toFixed(2)} L${x0.toFixed(2)} ${(base + step * 0.6).toFixed(2)} Z`,
      hi,
      maxLift,
      j,
    };
  });

  const wordPaths = glyphs.paths.map((path) =>
    path
      .map(
        ([gx, gy], k) =>
          `${k ? "L" : "M"}${(wordX + gx * unit).toFixed(2)} ${(wordY + gy * unit).toFixed(2)}`,
      )
      .join(" "),
  );
  const strokeW = STROKE * unit;
  const wordShift = (1 - reveal) * -lift * 0.45;
  // The sky shares one SVG with the lines, so the field scales as an SVG
  // transform rather than a ScaleLayer; the line fills then need the sky
  // gradient stretched back so they still match the sky behind them.
  const scaleT =
    scale === 1
      ? undefined
      : `translate(${width / 2} ${height / 2}) scale(${scale}) translate(${-width / 2} ${-height / 2})`;
  const occlude = scale === 1 ? `url(#${id}d)` : `url(#${id}f)`;

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined
            ? p.bg
            : background === "transparent"
              ? undefined
              : background,
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${id}d`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={height}
          >
            {sky.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          {scaleT ? (
            <linearGradient
              id={`${id}f`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={height / 2 - height / (2 * scale)}
              x2={0}
              y2={height / 2 + height / (2 * scale)}
            >
              {sky.map(([o, c]) => (
                <stop key={o} offset={o} stopColor={c} />
              ))}
            </linearGradient>
          ) : null}
          <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.07" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.93" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask
            id={`${id}m`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <rect
              x={left}
              y={0}
              width={fieldW}
              height={height}
              fill={`url(#${id}e)`}
            />
            <g transform={`translate(0 ${wordShift})`} opacity={reveal}>
              {wordPaths.map((d) => (
                <path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="#000"
                  strokeWidth={strokeW + step * 1.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </g>
          </mask>
        </defs>
        <rect width={width} height={height} fill={`url(#${id}d)`} />
        <g mask={`url(#${id}m)`} opacity={enter} transform={scaleT}>
          {lines.map((l) => (
            <g key={l.j}>
              <path d={l.fill} fill={occlude} />
              <path
                d={l.d}
                fill="none"
                stroke={fg}
                strokeOpacity={p.line}
                strokeWidth={1.3 * u}
                strokeLinejoin="round"
              />
              {l.hi && l.maxLift > 0.001 && (
                <path
                  d={l.hi}
                  fill="none"
                  stroke={fg}
                  strokeOpacity={
                    (p.lift - p.line) * Math.min(1, l.maxLift * 1.4)
                  }
                  strokeWidth={1.3 * u}
                  strokeLinejoin="round"
                />
              )}
            </g>
          ))}
        </g>
        <g
          transform={`${scaleT ? `${scaleT} ` : ""}translate(0 ${wordShift})`}
          opacity={reveal}
          style={{ filter: `blur(${(1 - reveal) * 6 * u}px)` }}
        >
          {wordPaths.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke={fg}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, ${background ?? p.bg} 100%)`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
