"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
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

const isRemocn = (label: string) => label.trim().toLowerCase() === "remocn";

/** gradients.sh "aurora" palette, laid along the hero series. */
const AURORA = {
  dark: ["#A0F0C8", "#3FB5A3", "#5147B6", "#B25C9C"],
  light: ["#2E9C86", "#3FB5A3", "#5147B6", "#B25C9C"],
} as const;

function mix(a: string, b: string, k: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (v: number, sh: number) => (v >> sh) & 255;
  const c = (sh: number) =>
    Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * k)
      .toString(16)
      .padStart(2, "0");
  return `#${c(16)}${c(8)}${c(0)}`;
}

function sample(stops: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

export interface DotSortGroup {
  label: string;
  value: number;
}

export interface DotSortProps {
  groups?: DotSortGroup[];
  highlight?: number;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_GROUPS: DotSortGroup[] = [
  { label: "remocn", value: 41 },
  { label: "Kitebase", value: 23 },
  { label: "Lumen", value: 17 },
  { label: "Fernway", value: 12 },
  { label: "Other", value: 7 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const FLIGHT = Easing.bezier(0.5, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    grays: ["#C9C7C2", "#8E8D93", "#69686F", "#4E4D53"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    grays: ["#3F3D3A", "#7A7873", "#A19F99", "#BDBBB4"],
    grain: 0.045,
  },
} as const;

const DOTS = 400;
const ROWS = 4;
const SORT_AT = 18;
const SWEEP = 24;
const JITTER = 9;
const FLY = 28;
const HIT = SORT_AT + SWEEP + JITTER + FLY + 2;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function split(values: number[], total: number) {
  const sum = values.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const raw = values.map((v) => (Math.max(0, v) / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((s, v) => s + v, 0);
  const order = raw
    .map((v, i) => ({ i, f: v - Math.floor(v) }))
    .sort((a, b) => b.f - a.f);
  for (const o of order) {
    if (left <= 0) break;
    out[o.i]++;
    left--;
  }
  return out;
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

export function DotSort({
  groups = DEFAULT_GROUPS,
  highlight = 0,
  caption,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DotSortProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];
  const aurora = AURORA[theme];

  const list = groups.slice(0, 5);
  const hl = Math.min(Math.max(0, Math.round(highlight)), list.length - 1);
  const total = list.reduce((s, g) => s + Math.max(0, g.value), 0) || 1;
  const counts = split(
    list.map((g) => g.value),
    DOTS,
  );

  let gray = 0;
  const bands = list
    .map((g, i) => ({
      ...g,
      i,
      count: counts[i],
      pct: Math.round((Math.max(0, g.value) / total) * 100),
      color: i === hl ? accent : "",
    }))
    .sort((a, b) => b.value - a.value || a.i - b.i)
    .map((b) => ({
      ...b,
      color: b.i === hl ? accent : p.grays[Math.min(gray++, 3)],
      cols: Math.max(1, Math.ceil(b.count / ROWS)),
    }));
  const maxCols = Math.max(1, ...bands.map((b) => b.cols));

  const labelW = 132 * u;
  const labelGap = 24 * u;
  const heroGap = 84 * u;
  const heroW = 300 * u;
  const pitch = Math.min(
    13.5 * u,
    (W * 0.86 - labelW - labelGap - heroGap - heroW) / maxCols,
  );
  const r = pitch * 0.33;
  const barsW = maxCols * pitch;
  const totalW = labelW + labelGap + barsW + heroGap + heroW;
  const x0 = (W - totalW) / 2;
  const barX = x0 + labelW + labelGap;
  const heroX = barX + barsW + heroGap;
  const bandH = ROWS * pitch;
  const bandGap = 26 * u;
  const blockH = bands.length * bandH + (bands.length - 1) * bandGap;
  const y0 = (H - blockH) / 2;

  const dots = useMemo(() => {
    const out: {
      k: number;
      band: number;
      color: string;
      sx: number;
      sy: number;
      tx: number;
      ty: number;
      bend: number;
      start: number;
      phase: number;
      appear: number;
    }[] = [];
    let k = 0;
    bands.forEach((b, bi) => {
      for (let j = 0; j < b.count; j++) {
        const col = Math.floor(j / ROWS);
        const row = j % ROWS;
        const seed = k * 3.17 + 1.1;
        out.push({
          k,
          band: bi,
          color:
            b.i === hl
              ? sample(aurora, col / Math.max(1, b.cols - 1))
              : b.color,
          sx: W * (0.08 + 0.84 * hash(seed)),
          sy: H * (0.12 + 0.76 * hash(seed + 7.7)),
          tx: barX + (col + 0.5) * pitch,
          ty: y0 + bi * (bandH + bandGap) + (row + 0.5) * pitch,
          bend: (hash(seed + 3.3) - 0.5) * 120 * u,
          start: SORT_AT + (col / maxCols) * SWEEP + hash(seed + 5.5) * JITTER,
          phase: hash(seed + 9.1) * Math.PI * 2,
          appear: hash(seed + 2.4) * 10 - 6,
        });
        k++;
      }
    });
    const order = out
      .map((d) => d.k)
      .sort((a, b) => hash(a * 1.9 + 0.3) - hash(b * 1.9 + 0.3));
    return order.map((i) => out[i]);
  }, [bands, W, H, u, barX, pitch, y0, bandH, bandGap, maxCols, hl, aurora]);

  const dim = interpolate(t, [HIT, HIT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const land = interpolate(t, [HIT + 2, HIT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [HIT + 2, HIT + 30], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const capIn = interpolate(t, [HIT + 12, HIT + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, HIT + 50], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const scale = 0.975 + 0.035 * push;

  const circles: React.ReactNode[] = [];
  for (const d of dots) {
    const a = interpolate(t - d.appear, [0, 12], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (a <= 0) continue;
    const e = FLIGHT(interpolate(t, [d.start, d.start + FLY], [0, 1], CLAMP));
    const drift = 1 - e;
    const dx = Math.sin(t * 0.06 + d.phase) * 7 * u * drift;
    const dy = Math.cos(t * 0.05 + d.phase * 1.3) * 7 * u * drift;
    const mx = (d.sx + d.tx) / 2;
    const my = (d.sy + d.ty) / 2 + d.bend;
    const q = 1 - e;
    const x = q * q * d.sx + 2 * q * e * mx + e * e * d.tx + dx;
    const y = q * q * d.sy + 2 * q * e * my + e * e * d.ty + dy;
    const isHl = bands[d.band].i === hl;
    const fade = isHl ? 1 : 1 - 0.3 * dim;
    circles.push(
      <circle
        key={d.k}
        cx={x}
        cy={y}
        r={r * (0.86 + 0.14 * e)}
        fill={d.color}
        opacity={a * fade}
      />,
    );
  }

  const target = bands.find((b) => b.i === hl);
  const hero = target ? Math.round(target.pct * count) : 0;
  const capText = caption ?? (target ? `choose ${target.label}` : "");
  const capLogo = caption === undefined && target && isRemocn(target.label);
  const auroraCss = `linear-gradient(90deg, ${aurora.join(", ")})`;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {circles}
        </svg>

        {bands.map((b, bi) => {
          const done = SORT_AT + SWEEP * 0.4 + FLY + bi * 3;
          const a = interpolate(t, [done, done + 16], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const isHl = b.i === hl;
          const fade = isHl ? 1 : 1 - 0.35 * dim;
          return (
            <div
              key={b.label}
              style={{
                position: "absolute",
                left: x0,
                top: y0 + bi * (bandH + bandGap),
                width: labelW,
                height: bandH,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 3 * u,
                opacity: a * fade,
                transform: `translateX(${(1 - a) * -10 * u}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {isRemocn(b.label) ? (
                <RemocnLogo fontSize={20 * u} color={p.fg} />
              ) : (
                <span
                  style={{
                    fontFamily: sans,
                    fontWeight: 500,
                    fontSize: 18 * u,
                    letterSpacing: "-0.01em",
                    color: p.fg,
                    lineHeight: 1,
                  }}
                >
                  {b.label}
                </span>
              )}
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 15 * u,
                  color: isHl ? aurora[0] : p.muted,
                  lineHeight: 1,
                }}
              >
                {b.pct}%
              </span>
            </div>
          );
        })}

        {target ? (
          <div
            style={{
              position: "absolute",
              left: heroX,
              top: 0,
              height: H,
              width: heroW,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 184 * u,
                lineHeight: 0.9,
                letterSpacing: "-0.005em",
                color: p.fg,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                opacity: land,
                filter:
                  land < 0.99 ? `blur(${(1 - land) * 8 * u}px)` : undefined,
                transform: `translateY(${(1 - land) * 20 * u}px)`,
              }}
            >
              {hero}
              <span
                style={{
                  fontSize: 104 * u,
                  marginLeft: 6 * u,
                  color: aurora[0],
                }}
              >
                %
              </span>
            </div>
            <div
              style={{
                marginTop: 18 * u,
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 8 * u}px)`,
              }}
            >
              <span
                style={{
                  width: 10 * u,
                  height: 10 * u,
                  borderRadius: "50%",
                  background: auroraCss,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 400,
                  fontSize: 24 * u,
                  letterSpacing: "-0.01em",
                  color: p.muted,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8 * u,
                }}
              >
                {capLogo ? (
                  <>
                    choose
                    <RemocnLogo fontSize={25 * u} color={p.fg} />
                  </>
                ) : (
                  capText
                )}
              </span>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
