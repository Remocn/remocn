"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface ContributionHeatmapProps {
  value?: number;
  label?: string;
  weeks?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_POP = Easing.bezier(0.3, 1.25, 0.6, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    empty: "rgba(255,255,255,0.055)",
    // gradients.sh "beam": the year warms from the accent into ice white.
    ramp: ["#7E9BFF", "#F4F7FF"],
    toward: [18, 22, 64],
    levels: [0.68, 0.46, 0.22, 0],
    glow: "rgba(61,91,255,0.20)",
    ground: "rgba(61,91,255,0.14)",
    dim: 0.42,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    empty: "rgba(18,18,20,0.06)",
    // gradients.sh "pixel-glass" (light): accent → violet → pink.
    ramp: ["#7A3CFF", "#FF4FB8"],
    toward: [245, 244, 240],
    levels: [0.74, 0.52, 0.28, 0],
    glow: "rgba(122,60,255,0.10)",
    ground: "rgba(255,79,184,0.06)",
    dim: 0.36,
    grain: 0.045,
  },
} as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

const SWEEP = [4, 50] as const;
const CELL_IN = 10;
const HIT = 62;

function rgb(hex: string): number[] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const v = Number.parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function mix(hex: string, toward: readonly number[], amt: number) {
  const a = rgb(hex);
  if (!a) return hex;
  const c = a.map((v, i) => Math.round(v + (toward[i] - v) * amt));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hash(a: number, b: number, seed: number) {
  let h = Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function levelOf(week: number, day: number, weeks: number) {
  const r = hash(week, day, 0x51ed);
  const trend = 0.42 + 0.58 * (week / Math.max(1, weeks - 1)) ** 0.8;
  const weekend = day === 0 || day === 6 ? 0.42 : 1;
  const quiet = hash(week, 99, 0x2b1) > 0.9 ? 0.3 : 1;
  const burst = hash(week, day, 0x9e37) > 0.94 ? 0.45 : 0;
  const a = r * trend * weekend * quiet + burst;
  if (a < 0.12) return 0;
  if (a < 0.28) return 1;
  if (a < 0.47) return 2;
  if (a < 0.67) return 3;
  return 4;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
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

export function ContributionHeatmap({
  value = 12480,
  label = "renders this year",
  weeks = 52,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ContributionHeatmapProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const cols = Math.max(4, Math.round(weeks));

  const pitch = Math.min((width * 0.8) / cols, 34 * u);
  const cell = pitch * 0.8;
  const radius = cell * 0.26;
  const gridW = cols * pitch - (pitch - cell);
  const gridH = 7 * pitch - (pitch - cell);
  const gx = (width - gridW) / 2;
  const gy = height / 2 - gridH / 2;

  const gradId = `r${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const flashColor =
    theme === "dark" ? mix(accent, [255, 255, 255], 0.6) : accent;
  const diag = 2.4;
  const span = cols + 6 * diag;
  const startOf = (c: number, r: number) =>
    SWEEP[0] + ((c + r * diag) / span) * (SWEEP[1] - SWEEP[0]);

  const stage = interpolate(t, [0, 8], [0.45, 1], CLAMP);
  const settle = interpolate(t, [HIT - 4, HIT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const drift = interpolate(t, [0, HIT + 60], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const zoom = interpolate(t, [0, HIT - 2], [1.12, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gridScale = zoom * (1 - 0.1 * settle);
  const gridY = settle * 0.16 * height;
  const gridOpacity = 1 - p.dim * settle;
  const gridBlur = 0.9 * u * settle;
  const axisO =
    interpolate(t, [2, 14], [0, 1], { ...CLAMP, easing: EASE_OUT }) *
    interpolate(t, [HIT - 4, HIT + 6], [1, 0], CLAMP);

  const land = interpolate(t, [HIT + 6, HIT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT + 6, HIT + 34], [0.8, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const labIn = interpolate(t, [HIT + 14, HIT + 32], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const shown = Math.round(value * count).toLocaleString("en-US");

  const cells: ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      const lv = levelOf(c, r, cols);
      const s0 = startOf(c, r);
      const k = interpolate(t, [s0, s0 + CELL_IN], [0, 1], CLAMP);
      const pop = EASE_POP(k);
      const flash = interpolate(t - s0, [0, 3, 13], [0, 1, 0], CLAMP);
      const x = gx + c * pitch;
      const y = gy + r * pitch;
      const sz = cell * (0.66 + 0.34 * pop);
      const off = (cell - sz) / 2;
      cells.push(
        <g key={`${c}-${r}`}>
          <rect
            x={x}
            y={y}
            width={cell}
            height={cell}
            rx={radius}
            fill={p.empty}
          />
          {lv > 0 && k > 0 ? (
            <rect
              x={x + off}
              y={y + off}
              width={sz}
              height={sz}
              rx={radius * (sz / cell)}
              fill={`url(#${gradId}${lv - 1})`}
              opacity={EASE_OUT(k)}
            />
          ) : null}
          {flash > 0.01 ? (
            <rect
              x={x + off}
              y={y + off}
              width={sz}
              height={sz}
              rx={radius * (sz / cell)}
              fill={flashColor}
              opacity={flash * (lv > 0 ? 0.75 : 0.18)}
            />
          ) : null}
        </g>,
      );
    }
  }

  const valueSize = 200 * u;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 55% at ${58 + 10 * drift}% 108%, ${p.ground}, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translate(${(0.5 - drift) * 14 * u}px, ${gridY}px) scale(${gridScale})`,
          transformOrigin: "50% 50%",
          opacity: stage * gridOpacity,
          filter: gridBlur > 0.05 ? `blur(${gridBlur}px)` : undefined,
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            {p.levels.map((amt, i) => (
              <linearGradient
                key={amt}
                id={`${gradId}${i}`}
                gradientUnits="userSpaceOnUse"
                x1={gx - gridW * 0.08 * (1 - drift)}
                y1={gy + gridH}
                x2={gx + gridW * (1.02 - 0.06 * drift)}
                y2={gy}
              >
                <stop offset="0" stopColor={mix(accent, p.toward, amt)} />
                <stop offset="0.6" stopColor={mix(p.ramp[0], p.toward, amt)} />
                <stop
                  offset="0.86"
                  stopColor={mix(p.ramp[1], p.toward, amt * 0.9 + 0.12)}
                />
                <stop offset="1" stopColor={mix(p.ramp[1], p.toward, amt)} />
              </linearGradient>
            ))}
          </defs>
          {cells}
        </svg>
        {MONTHS.map((m, i) => {
          const c = Math.round((i * cols) / 12);
          const a = interpolate(t, [2 + i * 1.5, 14 + i * 1.5], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={m}
              style={{
                position: "absolute",
                left: gx + c * pitch,
                top: gy - 30 * u,
                fontFamily: mono,
                fontWeight: 400,
                fontSize: 12 * u,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: p.muted,
                opacity: a * axisO,
                transform: `translateY(${(1 - a) * 6 * u}px)`,
              }}
            >
              {m}
            </div>
          );
        })}
        {DAYS.map((d, r) =>
          d ? (
            <div
              key={d}
              style={{
                position: "absolute",
                right: width - gx + 14 * u,
                top: gy + r * pitch + cell / 2 - 8 * u,
                fontFamily: mono,
                fontWeight: 400,
                fontSize: 12 * u,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: `${16 * u}px`,
                color: p.muted,
                opacity: axisO,
              }}
            >
              {d}
            </div>
          ) : null,
        )}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 46% 34% at 50% 36%, ${p.glow}, transparent 72%)`,
          opacity: land,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transform: `translateY(${-0.15 * height}px)`,
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: valueSize,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            color: p.fg,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            opacity: land,
            filter: land < 0.99 ? `blur(${(1 - land) * 10 * u}px)` : undefined,
            transform: `translateY(${(1 - land) * 28 * u}px) scale(${1.04 - 0.04 * land})`,
          }}
        >
          {shown}
        </div>
        <div
          style={{
            marginTop: 22 * u,
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
            opacity: labIn,
            transform: `translateY(${(1 - labIn) * 10 * u}px)`,
          }}
        >
          <span
            style={{
              width: 44 * u,
              height: 12 * u,
              borderRadius: 4 * u,
              background: `linear-gradient(90deg, ${accent}, ${p.ramp[0]} 62%, ${p.ramp[1]})`,
            }}
          />
          <span
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 24 * u,
              letterSpacing: "-0.015em",
              color: p.muted,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
