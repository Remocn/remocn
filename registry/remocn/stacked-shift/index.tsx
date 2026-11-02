"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Newsreader";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface StackedSeries {
  label: string;
  values: number[];
}

export interface StackedShiftProps {
  series?: StackedSeries[];
  years?: string[];
  highlight?: number;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_SERIES: StackedSeries[] = [
  { label: "remocn", values: [6, 24, 52] },
  { label: "Kitebase", values: [34, 28, 18] },
  { label: "Lumen", values: [26, 22, 14] },
  { label: "Fernway", values: [18, 14, 9] },
  { label: "Other", values: [16, 12, 7] },
];
const DEFAULT_YEARS = ["2023", "2024", "2025"];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.14)",
    grays: ["#B4B2AE", "#8E8D92", "#6C6B71", "#4C4B51"],
    grain: 0.06,
    // gradients.sh "grain": bg #070505, [#ffd8b4, #e0703b, #8a2c1d, #2b1015]
    ember: ["#8a2c1d", "#e0703b", "#ffd8b4"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    grays: ["#5B5955", "#85837E", "#AAA8A2", "#CBC9C3"],
    grain: 0.045,
    ember: ["#8a2c1d", "#e0703b", "#f6b27e"],
  },
} as const;

const ENTER = [0, 26] as const;
const FIRST_SHIFT = 34;
const SHIFT_EVERY = 54;
const OUT = [0, 12] as const;
const MOVE = [10, 36] as const;
const IN = [32, 44] as const;

type Slot = { y0: number; y1: number; share: number };

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** The remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

function YearTicker({
  from,
  to,
  k,
  size,
  color,
}: {
  from: string;
  to: string;
  k: number;
  size: number;
  color: string;
}) {
  const len = Math.max(from.length, to.length);
  const a = from.padStart(len, " ");
  const b = to.padStart(len, " ");
  const lh = size * 1.15;
  const travel = size * 0.42;
  return (
    <div
      style={{
        display: "flex",
        fontFamily: display,
        fontWeight: 400,
        fontSize: size,
        letterSpacing: "-0.02em",
        color,
        fontVariantNumeric: "tabular-nums",
        height: lh,
        lineHeight: `${lh}px`,
      }}
    >
      {a.split("").map((ch, i) => {
        const key = `c${i}`;
        if (ch === b[i]) return <span key={key}>{ch}</span>;
        const outA = interpolate(k, [0, 0.6], [1, 0], CLAMP);
        const inA = interpolate(k, [0.4, 1], [0, 1], CLAMP);
        const blur = Math.sin(k * Math.PI) * size * 0.06;
        return (
          <span
            key={key}
            style={{ position: "relative", display: "inline-block" }}
          >
            <span style={{ visibility: "hidden" }}>{b[i]}</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: outA,
                transform: `translateY(${-k * travel}px)`,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {ch}
            </span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: inA,
                transform: `translateY(${(1 - k) * travel}px)`,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {b[i]}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function StackedShift({
  series = DEFAULT_SERIES,
  years = DEFAULT_YEARS,
  highlight = 0,
  caption = "of launch videos",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: StackedShiftProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const clipId = `ss${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const list = series.slice(0, 6);
  const n = list.length;
  const Y = Math.max(
    1,
    Math.min(years.length, ...list.map((s) => s.values.length)),
  );
  const hl = Math.min(Math.max(0, Math.round(highlight)), n - 1);

  const colH = height * 0.7;
  const colTop = (height - colH) / 2 - 16 * u;
  const colBottom = colTop + colH;
  const colW = width * 0.165;
  const colX = width * 0.365;
  const colR = colX + colW;
  const gap = 4 * u;
  const radius = 5 * u;
  const laneDx = colW + 18 * u;

  const slots: Slot[][] = Array.from({ length: Y }, (_, k) => {
    const vals = list.map((s) => Math.max(0, s.values[k] ?? 0));
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    const avail = colH - gap * (n - 1);
    const order = vals
      .map((_, i) => i)
      .sort((a, b) => vals[b] - vals[a] || a - b);
    const out: Slot[] = new Array(n);
    let y = colBottom;
    for (const i of order) {
      const h = (vals[i] / total) * avail;
      out[i] = { y0: y - h, y1: y, share: (vals[i] / total) * 100 };
      y = y - h - gap;
    }
    return out;
  });

  let yearK = 0;
  let laneK = 0;
  for (let k = 0; k < Y - 1; k++) {
    const T = FIRST_SHIFT + k * SHIFT_EVERY;
    const mv = interpolate(t, [T + MOVE[0], T + MOVE[1]], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    yearK += mv;
    const o = interpolate(t, [T + OUT[0], T + OUT[1]], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const back = interpolate(t, [T + IN[0], T + IN[1]], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    laneK += o - back;
  }
  const kA = Math.min(Math.floor(yearK), Y - 1);
  const kB = Math.min(kA + 1, Y - 1);
  const f = yearK - kA;
  const cur = list.map((_, i) => {
    const a = slots[kA][i];
    const b = slots[kB][i];
    return {
      y0: lerp(a.y0, b.y0, f),
      y1: lerp(a.y1, b.y1, f),
      share: lerp(a.share, b.share, f),
    };
  });

  const lastEnd = FIRST_SHIFT + (Y - 2) * SHIFT_EVERY + IN[1];
  const reveal = interpolate(t, [ENTER[0], ENTER[1]], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const revealTop = colBottom - (colH + 4 * u) * reveal;
  const finalK = interpolate(t, [lastEnd - 6, lastEnd + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const capIn = interpolate(t, [lastEnd - 2, lastEnd + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const yearIn = interpolate(t, [8, 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, lastEnd + 30], [1.025, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const shares = slots.map((s) => s[hl].share);
  const minS = Math.min(...shares);
  const maxS = Math.max(...shares);
  const acc = cur[hl];
  const heroSize =
    interpolate(acc.share, [minS, Math.max(maxS, minS + 1)], [30, 150], CLAMP) *
    u;
  const nameSize = interpolate(heroSize / u, [30, 150], [18, 24], CLAMP) * u;
  const offX = laneDx * laneK;
  const sheen = interpolate(t, [0, lastEnd + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  let gi = 0;
  const colors = list.map((_, i) =>
    i === hl ? accent : p.grays[Math.min(gi++, p.grays.length - 1)],
  );

  const labelIn = (y: number) =>
    interpolate(y + 20 * u - revealTop, [0, 30 * u], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${clipId}e`}
              x1={0.15 + 0.1 * sheen}
              y1={1}
              x2={0.85 - 0.1 * sheen}
              y2={0}
            >
              <stop offset={0} stopColor={p.ember[0]} />
              <stop offset={0.55} stopColor={p.ember[1]} />
              <stop offset={1} stopColor={p.ember[2]} />
            </linearGradient>
            <clipPath id={clipId}>
              <rect
                x={0}
                y={revealTop}
                width={width}
                height={Math.max(0, colBottom - revealTop + 2 * u)}
              />
            </clipPath>
          </defs>
          <line
            x1={colX - 18 * u}
            x2={colR + 18 * u}
            y1={colBottom + 0.5}
            y2={colBottom + 0.5}
            stroke={p.hair}
            strokeWidth={Math.max(1, u)}
            opacity={yearIn}
          />
          <g clipPath={`url(#${clipId})`}>
            {cur.map((s, i) =>
              i === hl ? null : (
                <rect
                  key={list[i].label}
                  x={colX}
                  y={s.y0}
                  width={colW}
                  height={Math.max(0, s.y1 - s.y0)}
                  rx={Math.min(radius, (s.y1 - s.y0) / 2)}
                  fill={colors[i]}
                />
              ),
            )}
            <rect
              x={colX + offX}
              y={acc.y0}
              width={colW}
              height={Math.max(0, acc.y1 - acc.y0)}
              rx={Math.min(radius, (acc.y1 - acc.y0) / 2)}
              fill={`url(#${clipId}e)`}
            />
          </g>
        </svg>

        {cur.map((s, i) => {
          if (i === hl) return null;
          const a = labelIn(s.y0) * (1 - 0.45 * finalK);
          return (
            <div
              key={list[i].label}
              style={{
                position: "absolute",
                right: width - colX + 22 * u,
                top: (s.y0 + s.y1) / 2,
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "baseline",
                gap: 12 * u,
                opacity: a,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 19 * u,
                  letterSpacing: "-0.01em",
                  color: p.fg,
                }}
              >
                {list[i].label}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 19 * u,
                  color: p.muted,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 42 * u,
                  textAlign: "right",
                }}
              >
                {Math.round(s.share)}%
              </span>
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: colR + offX + 26 * u,
            top: (acc.y0 + acc.y1) / 2,
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            opacity: labelIn(acc.y0),
          }}
        >
          <div
            style={{
              fontFamily: display,
              fontWeight: 400,
              fontSize: heroSize,
              lineHeight: 0.92,
              letterSpacing: `${interpolate(heroSize / u, [30, 150], [-0.01, -0.045], CLAMP)}em`,
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {Math.round(acc.share)}
            <span style={{ fontSize: heroSize * 0.56 }}>%</span>
          </div>
          <div
            style={{
              marginTop: interpolate(heroSize / u, [30, 150], [4, 14]) * u,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              whiteSpace: "nowrap",
            }}
          >
            {list[hl].label.toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={nameSize * 1.12} color={p.fg} />
            ) : (
              <>
                <span
                  style={{
                    width: 10 * u,
                    height: 10 * u,
                    borderRadius: "50%",
                    background: accent,
                  }}
                />
                <span
                  style={{
                    fontFamily: sans,
                    fontWeight: 500,
                    fontSize: nameSize,
                    letterSpacing: "-0.01em",
                    color: p.fg,
                  }}
                >
                  {list[hl].label}
                </span>
              </>
            )}
          </div>
          {caption ? (
            <div
              style={{
                position: "absolute",
                left: 2 * u,
                top: "100%",
                marginTop: 6 * u,
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 20 * u,
                color: p.muted,
                whiteSpace: "nowrap",
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 6 * u}px)`,
              }}
            >
              {caption}
            </div>
          ) : null}
        </div>

        <div
          style={{
            position: "absolute",
            left: colX + colW / 2,
            top: colBottom + 16 * u,
            transform: `translateX(-50%) translateY(${(1 - yearIn) * 8 * u}px)`,
            opacity: yearIn,
          }}
        >
          <YearTicker
            from={years[kA] ?? ""}
            to={years[kB] ?? ""}
            k={f}
            size={34 * u}
            color={p.fg}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
