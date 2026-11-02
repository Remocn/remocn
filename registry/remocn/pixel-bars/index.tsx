"use client";

import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: grotesk } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PixelBarsProps {
  values?: number[];
  label?: string;
  metric?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_VALUES = [31, 38, 35, 44, 41, 50, 84];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const POP = Easing.bezier(0.3, 1.5, 0.5, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "fluted" palette, run bottom-to-top through the hero column.
const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"];

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#A9A8AD",
    cell: "#3E3E44",
    lead: "#A3A2A8",
    slot: "rgba(255,255,255,0.05)",
    hair: "rgba(255,255,255,0.2)",
    light: "rgba(255,255,255,0.045)",
    top: FLUTED[3],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    cell: "#BDBBB5",
    lead: "#6E6C67",
    slot: "rgba(18,18,20,0.05)",
    hair: "rgba(18,18,20,0.22)",
    light: "rgba(255,255,255,0.75)",
    top: "#ffb27f",
    grain: 0.045,
  },
} as const;

// Space Grotesk 500 advances (em), tabular digits.
const NUM_ADV: Record<string, number> = {
  "+": 0.62,
  "-": 0.443,
  "%": 0.765,
  ".": 0.276,
  ",": 0.273,
  x: 0.593,
  "×": 0.593,
  $: 0.609,
};
const NUM_TRACK = -0.03;

function numWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text)
    w += (/\d/.test(ch) ? 0.62 : (NUM_ADV[ch] ?? 0.6)) + NUM_TRACK;
  return (w - NUM_TRACK) * size;
}

const MAX_ROWS = 14;
const START = 6;
const COL_STAGGER = 5;
const PIXEL_STEP = 1.6;
const POP_DUR = 4;
const LEAD = 6;

function parseMetric(metric: string) {
  const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(metric);
  if (!m) return null;
  const raw = m[2].replace(/,/g, "");
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { prefix: m[1], value: Number(raw), decimals, suffix: m[3] };
}

export function PixelBars({
  values = DEFAULT_VALUES,
  label = "this quarter",
  metric = "+64%",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: PixelBarsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pal = THEMES[theme];

  const list = values.length ? values.slice(0, 16) : DEFAULT_VALUES;
  const maxV = Math.max(...list.map((v) => Math.max(0, v)), 1);
  const heights = list.map((v) =>
    Math.max(1, Math.round((Math.max(0, v) / maxV) * MAX_ROWS)),
  );
  const last = heights.length - 1;
  const prevMax = Math.max(1, ...heights.slice(0, last));

  const P = (H * 0.58) / MAX_ROWS;
  const sq = P * 0.82;
  const colW = P + sq;
  const colPitch = P * 2.75;
  const chartW = (heights.length - 1) * colPitch + colW;
  const chartH = MAX_ROWS * P;

  const numSize = 156 * u;
  const labelSize = 30 * u;
  const parsed = parseMetric(metric);
  const numW = numWidth(metric, numSize);
  const numGap = 44 * u;
  const groupW = chartW + numGap + numW;
  const left = W / 2 - groupW / 2;
  const base = H / 2 + chartH / 2;

  const colStart = (i: number) => START + i * COL_STAGGER;
  const pixelTime = (i: number, k: number) => {
    if (i !== last || k < prevMax) return colStart(i) + k * PIXEL_STEP;
    const extra = k - prevMax;
    return (
      colStart(i) +
      prevMax * PIXEL_STEP +
      extra * PIXEL_STEP * 1.3 +
      extra * extra * 0.14
    );
  };
  const finish = pixelTime(last, heights[last] - 1) + POP_DUR;
  const passAt = pixelTime(last, prevMax);

  const slots: React.ReactNode[] = [];
  const cells: React.ReactNode[] = [];
  heights.forEach((rows, i) => {
    const x = left + i * colPitch;
    const isLast = i === last;
    const slotIn = interpolate(
      t,
      [colStart(i) - 6, colStart(i) + 2],
      [0, 1],
      CLAMP,
    );
    for (let k = 0; k < MAX_ROWS; k++) {
      const y = base - (k + 1) * P + (P - sq);
      for (let j = 0; j < 2; j++) {
        slots.push(
          <rect
            key={`s${i}-${k}-${j}`}
            x={x + j * P}
            y={y}
            width={sq}
            height={sq}
            fill={pal.slot}
            opacity={slotIn}
          />,
        );
      }
      if (k >= rows) continue;
      const tp = pixelTime(i, k);
      const age = t - tp;
      if (age < 0) continue;
      const pop = POP(interpolate(age, [0, POP_DUR], [0, 1], CLAMP));
      const on = interpolate(age, [0, 2], [0, 1], CLAMP);
      const s = sq * (0.7 + 0.3 * pop);
      const lead = isLast ? 0 : interpolate(age, [0, LEAD], [1, 0], CLAMP);
      cells.push(
        <g key={`c${i}-${k}`} opacity={on}>
          {[0, 1].map((j) => (
            <rect
              key={j}
              x={x + j * P + (sq - s) / 2}
              y={y + (sq - s) / 2}
              width={s}
              height={s}
              fill={isLast ? `url(#${uid}-hot)` : pal.cell}
            />
          ))}
          {lead > 0
            ? [0, 1].map((j) => (
                <rect
                  key={`l${j}`}
                  x={x + j * P + (sq - s) / 2}
                  y={y + (sq - s) / 2}
                  width={s}
                  height={s}
                  fill={pal.lead}
                  opacity={lead}
                />
              ))
            : null}
        </g>,
      );
    }
  });

  const lastX = left + last * colPitch;
  const refY = base - prevMax * P + (P - sq) - (P - sq) / 2;
  const refK = EASE_OUT(
    interpolate(t, [passAt - 4, passAt + 8], [0, 1], CLAMP),
  );

  let litRows = 0;
  for (let k = 0; k < heights[last]; k++) {
    const tp = pixelTime(last, k);
    if (t < tp) break;
    litRows = Math.max(
      litRows,
      k + EASE_OUT(interpolate(t - tp, [0, POP_DUR], [0, 1], CLAMP)),
    );
  }
  const topY = base - litRows * P + (P - sq);
  const countK = EASE_OUT(
    interpolate(t, [passAt - 6, finish + 2], [0, 1], CLAMP),
  );
  const numIn = EASE_OUT(
    interpolate(t, [passAt - 2, passAt + 6], [0, 1], CLAMP),
  );
  const shown = parsed
    ? `${parsed.prefix}${(parsed.value * countK).toLocaleString("en-US", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`
    : metric;
  const numY = topY - numSize * 0.146 + (1 - numIn) * 14 * u;
  const labelK = EASE_OUT(interpolate(t, [finish, finish + 14], [0, 1], CLAMP));
  // Colour turns hot exactly where the hero column passes the previous best.
  const passK = Math.min(0.9, prevMax / heights[last]);
  const baseK = EASE_OUT(interpolate(t, [0, 14], [0, 1], CLAMP));
  const cam = interpolate(t, [0, finish + 30], [1.035, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  // Chart alone sits centred; the frame slides over as the number arrives.
  const slide = EASE_IO(
    interpolate(t, [passAt - 10, finish + 8], [0, 1], CLAMP),
  );
  const camX = ((numGap + numW) / 2) * (1 - slide);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at 50% 48%, ${pal.light}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translateX(${camX}px) scale(${cam})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${uid}-hot`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={base}
              x2={0}
              y2={base - heights[last] * P}
            >
              <stop offset={0} stopColor={FLUTED[0]} />
              <stop offset={passK * 0.55} stopColor={accent} />
              <stop offset={passK} stopColor={accent} />
              <stop offset={Math.min(1, passK + 0.1)} stopColor={FLUTED[2]} />
              <stop offset={1} stopColor={pal.top} />
            </linearGradient>
          </defs>
          {slots}
          <rect
            x={left - 10 * u}
            y={base + 10 * u}
            width={(chartW + 20 * u) * baseK}
            height={1.25 * u}
            fill={pal.hair}
          />
          <line
            x1={left - 10 * u}
            x2={left - 10 * u + (lastX - left + colW + 20 * u) * refK}
            y1={refY}
            y2={refY}
            stroke={pal.hair}
            strokeWidth={1.25 * u}
            strokeDasharray={`${3 * u} ${5 * u}`}
            opacity={refK}
          />
          {cells}
        </svg>
        <div
          style={{
            position: "absolute",
            left: lastX + colW + numGap,
            top: numY,
            opacity: numIn,
            fontFamily: grotesk,
            fontWeight: 500,
            fontSize: numSize,
            lineHeight: 1,
            letterSpacing: `${NUM_TRACK}em`,
            fontVariantNumeric: "tabular-nums",
            color: pal.fg,
            whiteSpace: "nowrap",
          }}
        >
          {shown}
        </div>
        {label ? (
          <div
            key={uid}
            style={{
              position: "absolute",
              left: lastX + colW + numGap + 6 * u,
              top: numY + numSize * 1.08,
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              opacity: labelK,
              transform: `translateY(${(1 - labelK) * 8 * u}px)`,
              fontFamily: grotesk,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: 1.2,
              letterSpacing: "-0.005em",
              color: pal.muted,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                width: 10 * u,
                height: 24 * u,
                background: `linear-gradient(0deg, ${accent}, ${FLUTED[2]})`,
              }}
            />
            {label}
          </div>
        ) : null}
      </AbsoluteFill>
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: pal.grain,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <filter id={`${uid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={17}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}-grain)`} />
      </svg>
    </AbsoluteFill>
  );
}
