"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

// gradients.sh "beam" palette: the peak bars, its bracket and a soft ground.
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

export interface RadialBarsProps {
  values?: number[];
  highlight?: number;
  value?: string;
  label?: string;
  ticks?: string[];
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GROW = Easing.bezier(0.25, 0.9, 0.3, 1.04);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const TAU = Math.PI * 2;

const THEMES = {
  dark: {
    bg: "#05060B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.16)",
    bar: "#9A999F",
    dimBar: "#2F3038",
    // Peak bars run from the ring outward: deep blue → light tips.
    beam: [BEAM[2], BEAM[1], BEAM[0]],
    bracket: BEAM[1],
    glowPeak: 0.5,
    glowDisc: 0.5,
    glowColor: BEAM[2],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    bar: "#6F6D68",
    dimBar: "#D6D4CE",
    beam: [BEAM[1], BEAM[2], BEAM[3]],
    bracket: BEAM[2],
    glowPeak: 0,
    glowDisc: 0,
    glowColor: BEAM[2],
    grain: 0.045,
  },
} as const;

function rgba(hex: string, a: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function circDist(a: number, b: number, n: number) {
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

function makeDefaultValues() {
  const n = 60;
  return Array.from({ length: n }, (_, i) => {
    const main = Math.exp(-((circDist(i, 41, n) / 6.5) ** 2));
    const second = Math.exp(-((circDist(i, 18, n) / 5) ** 2));
    return 0.16 + 0.84 * main + 0.3 * second + 0.14 * hash(i + 3);
  });
}

const DEFAULT_VALUES = makeDefaultValues();
const GROUP = 5;

function splitNumber(s: string) {
  const m = s.match(/^([^\d]*)([\d][\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2].replace(/,/g, "");
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return {
    pre: m[1],
    num: Number.parseFloat(raw),
    decimals,
    comma: m[2].includes(","),
    post: m[3],
  };
}

function formatCount(s: string, k: number) {
  const parts = splitNumber(s);
  if (!parts) return s;
  const v = parts.num * k;
  const fixed = v.toFixed(parts.decimals);
  const out = parts.comma
    ? Number(fixed).toLocaleString("en-US", {
        minimumFractionDigits: parts.decimals,
        maximumFractionDigits: parts.decimals,
      })
    : fixed;
  return `${parts.pre}${out}${parts.post}`;
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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function RadialBars({
  values = DEFAULT_VALUES,
  highlight,
  value = "2.4M",
  label = "renders in the peak hour",
  ticks = ["00:00", "06:00", "12:00", "18:00"],
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RadialBarsProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const list = values.length ? values : DEFAULT_VALUES;
  const n = list.length;
  const maxV = Math.max(...list, 0.0001);

  let center = 0;
  if (highlight !== undefined) {
    center = ((Math.round(highlight) % n) + n) % n;
  } else {
    let best = -1;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let k = -2; k <= 2; k++) sum += list[(i + k + n) % n];
      if (sum > best) {
        best = sum;
        center = i;
      }
    }
  }
  const inGroup = (i: number) => circDist(i, center, n) <= (GROUP - 1) / 2;

  const cx = width / 2;
  const cy = height / 2;
  const R0 = height * 0.215;
  const Lmin = 5 * u;
  const Lmax = height * 0.155;
  const Rmax = R0 + Lmax;
  const bw = Math.max(2, ((TAU * R0) / n) * 0.36);

  const SWEEP = 54;
  const GROW = 22;
  const START = 6;
  const step = n > 1 ? SWEEP / (n - 1) : 0;
  const HIT = START + SWEEP + GROW + 2;

  const stage = interpolate(t, [0, 10], [0, 1], CLAMP);
  const base = interpolate(t, [0, 26], [0, 1], { ...CLAMP, easing: EASE_IO });
  const spin = interpolate(t, [0, HIT + 6], [-24, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const push = interpolate(t, [0, HIT + 50], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.955 + 0.045 * push;
  const focus = interpolate(t, [HIT, HIT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const bracket = interpolate(t, [HIT + 6, HIT + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const land = interpolate(t, [HIT + 6, HIT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT + 6, HIT + 32], [0.6, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const labIn = interpolate(t, [HIT + 14, HIT + 32], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tickIn = interpolate(t, [10, 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const ang = (i: number) => (i / n) * TAU;
  const groupA0 = ang(center - (GROUP - 1) / 2) - TAU / n / 2;
  const groupA1 = ang(center + (GROUP - 1) / 2) + TAU / n / 2;
  let groupMax = 0;
  for (let i = 0; i < n; i++)
    if (inGroup(i)) groupMax = Math.max(groupMax, list[i]);
  const rBracket =
    R0 + Lmin + (Lmax - Lmin) * (groupMax / maxV) ** 1.5 + 12 * u;
  const bracketEnd = groupA0 + (groupA1 - groupA0) * bracket;
  const pt = (r: number, a: number) => ({
    x: cx + r * Math.sin(a),
    y: cy - r * Math.cos(a),
  });
  const bs = pt(rBracket, groupA0);
  const be = pt(rBracket, bracketEnd);

  const circumference = TAU * (R0 - 10 * u);
  const valueSize = 112 * u;
  const gid = `rb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Soft beam ground: a wide halo under the dial that blooms toward the peak
  // as the focus lands, drifting a few px with the frame.
  const mid = (groupA0 + groupA1) / 2;
  const drift = Math.sin(t / 40) * 6 * u;
  const gp = pt(R0 + Lmax * 0.55 + drift, mid);
  const glowA = p.glowPeak * (0.35 + 0.65 * focus) * stage;
  const ground = [
    `radial-gradient(${Rmax * 1.1}px ${Rmax * 0.95}px at ${gp.x}px ${gp.y}px, ${rgba(p.glowColor, 0.7 * glowA)} 0%, transparent 70%)`,
    p.glowDisc > 0
      ? `radial-gradient(${Rmax * 1.5}px ${Rmax * 1.5}px at ${cx}px ${cy}px, ${rgba(BEAM[3], 0.8 * p.glowDisc * stage)} 0%, transparent 72%)`
      : "none",
  ].join(", ");

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        <AbsoluteFill style={{ background: ground }} />
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: stage }}
          aria-hidden
        >
          <defs>
            <radialGradient
              id={gid}
              gradientUnits="userSpaceOnUse"
              cx={cx}
              cy={cy}
              r={Rmax}
            >
              <stop offset={R0 / Rmax} stopColor={p.beam[0]} />
              <stop offset={(R0 + Lmax * 0.55) / Rmax} stopColor={p.beam[1]} />
              <stop offset={1} stopColor={p.beam[2]} />
            </radialGradient>
          </defs>
          <g transform={`rotate(${spin} ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={R0 - 10 * u}
              fill="none"
              stroke={p.hair}
              strokeWidth={Math.max(1, u)}
              strokeDasharray={`${circumference * base} ${circumference}`}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
            <circle
              cx={cx}
              cy={cy}
              r={Rmax + 4 * u}
              fill="none"
              stroke={p.hair}
              strokeWidth={Math.max(1, u)}
              strokeDasharray={`${2 * u} ${7 * u}`}
              opacity={0.7 * tickIn * (1 - 0.5 * focus)}
            />
            {list.map((v, i) => {
              const s = START + i * step;
              const k = interpolate(t, [s, s + GROW], [0, 1], {
                ...CLAMP,
                easing: EASE_GROW,
              });
              const vis = interpolate(t, [s - 2, s + 3], [0, 1], CLAMP);
              if (vis <= 0) return null;
              const hl = inGroup(i);
              const len =
                Lmin + (Lmax - Lmin) * (Math.max(0, v) / maxV) ** 1.5 * k;
              const a = ang(i);
              const p0 = pt(R0, a);
              const p1 = pt(R0 + len, a);
              const line = {
                x1: p0.x,
                y1: p0.y,
                x2: p1.x,
                y2: p1.y,
                strokeWidth: bw,
                strokeLinecap: "round" as const,
              };
              if (!hl) {
                return (
                  <line
                    key={`b${i}`}
                    {...line}
                    stroke={interpolateColors(focus, [0, 1], [p.bar, p.dimBar])}
                    opacity={vis}
                  />
                );
              }
              return (
                <g key={`b${i}`} opacity={vis}>
                  {focus < 1 ? (
                    <line {...line} stroke={p.bar} opacity={1 - focus} />
                  ) : null}
                  {focus > 0 ? (
                    <line {...line} stroke={`url(#${gid})`} opacity={focus} />
                  ) : null}
                </g>
              );
            })}
            {bracket > 0 ? (
              <path
                d={`M ${bs.x} ${bs.y} A ${rBracket} ${rBracket} 0 0 1 ${be.x} ${be.y}`}
                fill="none"
                stroke={p.bracket}
                strokeWidth={2 * u}
                strokeLinecap="round"
              />
            ) : null}
          </g>
        </svg>

        {ticks.map((tk, i) => {
          const a = (i / ticks.length) * TAU + (spin * Math.PI) / 180;
          const q = pt(Rmax + 24 * u, a);
          const sx = Math.sin(a);
          const sy = -Math.cos(a);
          return (
            <div
              key={tk}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y,
                transform: `translate(${-50 + sx * 50}%, ${-50 + sy * 50}%)`,
                fontFamily: mono,
                fontWeight: 400,
                fontSize: 14 * u,
                letterSpacing: "0.02em",
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                opacity: tickIn * stage * (1 - 0.35 * focus),
              }}
            >
              {tk}
            </div>
          );
        })}

        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 400,
              fontSize: valueSize,
              lineHeight: 0.9,
              letterSpacing: "-0.042em",
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              opacity: land,
              filter: land < 0.99 ? `blur(${(1 - land) * 8 * u}px)` : undefined,
              transform: `translateY(${(1 - land) * 18 * u}px) scale(${1.04 - 0.04 * land})`,
              marginTop: 12 * u,
            }}
          >
            {formatCount(value, count)}
          </div>
          <div
            style={{
              marginTop: 16 * u,
              display: "flex",
              alignItems: "center",
              gap: 9 * u,
              opacity: labIn,
              transform: `translateY(${(1 - labIn) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 9 * u,
                height: 9 * u,
                borderRadius: "50%",
                background: accent,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 19 * u,
                letterSpacing: "-0.01em",
                color: p.muted,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        </AbsoluteFill>
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
