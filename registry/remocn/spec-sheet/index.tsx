"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
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

export interface SpecRow {
  label: string;
  value: string;
}

export interface SpecSheetProps {
  rows?: SpecRow[];
  highlight?: number;
  title?: string;
  name?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ROWS: SpecRow[] = [
  { label: "Resolution", value: "4K" },
  { label: "Frame rate", value: "60 fps" },
  { label: "Components", value: "236" },
  { label: "Install", value: "1 command" },
  { label: "License", value: "MIT" },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.14)",
    rule: "rgba(243,242,239,0.9)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.14)",
    rule: "rgba(18,18,20,0.9)",
    grain: 0.045,
  },
} as const;

const STAGGER = 5;
const EXPAND = 62;
const FIGURE_SPACE = " ";

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
          seed={13}
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

/** remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
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

// gradients.sh "halo" palette (its blue stop is the accent): the highlighted
// value fills with it as it grows.
const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;

function haloFill(
  theme: "dark" | "light",
  t: number,
  veil: string,
  blue: string,
) {
  const a = 100 + 6 * Math.sin(t / 60);
  const hi = 18 + 10 * Math.sin(t / 50);
  const stops =
    theme === "dark"
      ? `${HALO[1]} 0%, ${HALO[2]} 48%, ${blue} 100%`
      : `${HALO[2]} 0%, #b8357f 45%, ${blue} 100%`;
  const glint =
    theme === "dark"
      ? `radial-gradient(40% 90% at ${hi}% 20%, color-mix(in oklab, ${HALO[0]} 85%, transparent) 0%, transparent 70%), `
      : "";
  return `linear-gradient(${veil}, ${veil}), ${glint}linear-gradient(${a}deg, ${stops})`;
}

function rgba(hex: string, a: number) {
  const v = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function Value({ value, p }: { value: string; p: number }) {
  const m = /^(\d[\d,.]*)(.*)$/.exec(value);
  const num = m ? m[1] : "";
  const rest = m ? m[2] : value;
  const countP = m ? Math.min(1, p / 0.7) : 0;
  let shown = "";
  if (num) {
    const target = Number(num.replace(/,/g, ""));
    const decimals = num.includes(".") ? num.split(".")[1].length : 0;
    const cur = EASE_OUT(countP) * target;
    const formatted = cur.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: num.includes(","),
    });
    shown = formatted.padStart(num.length, FIGURE_SPACE);
    if (countP === 0) shown = FIGURE_SPACE.repeat(num.length);
  }
  const typeStart = num ? 0.45 : 0;
  const chars = Array.from(rest);
  const per = (1 - typeStart) / (chars.length + 0.6);
  return (
    <>
      {shown}
      {chars.map((ch, i) => {
        const a = interpolate(
          p,
          [typeStart + i * per, typeStart + (i + 1.6) * per],
          [0, 1],
          CLAMP,
        );
        return (
          <span key={`${i}-${ch}`} style={{ opacity: a }}>
            {ch}
          </span>
        );
      })}
    </>
  );
}

export function SpecSheet({
  rows = DEFAULT_ROWS,
  highlight = 3,
  title = "Tech specs",
  name = "3.0",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SpecSheetProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const n = Math.max(1, rows.length);
  const hl = Math.min(Math.max(0, Math.round(highlight)), n - 1);

  const mX = W * 0.075;
  const cw = W - mX * 2;
  const col = cw / 12;
  const tableX = mX + col * 4;
  const tableW = W - mX - tableX;
  const hair = Math.max(1, u);

  const baseH = Math.min(82 * u, (H * 0.6) / n);
  const extra = 66 * u;
  const valueF = 40 * u;
  const longestLabel = Math.max(...rows.map((r) => r.label.length), 1);
  const labelW = longestLabel * 22 * u * 0.56 + 48 * u;
  const hlF = Math.min(
    84 * u,
    (tableW - labelW) / Math.max(rows[hl]?.value.length ?? 1, 1) / 0.56,
  );
  const hScale = valueF / hlF;

  const grow = interpolate(t, [EXPAND, EXPAND + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const heights = rows.map((_, i) => baseH + (i === hl ? extra * grow : 0));
  const total = heights.reduce((a, b) => a + b, 0);
  const top = (H - total) / 2;
  const rowTop = (i: number) => {
    let y = top;
    for (let k = 0; k < i; k++) y += heights[k];
    return y;
  };

  const rule = (i: number) =>
    interpolate(t, [4 + i * STAGGER, 26 + i * STAGGER], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const rise = (d: number) =>
    interpolate(t, [d, d + 18], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const valueP = (i: number) =>
    interpolate(t, [12 + i * STAGGER, 34 + i * STAGGER], [0, 1], CLAMP);

  const titleF = 84 * u;
  const titleP = rise(0);
  const lockP = rise(8);
  const bottom = top + total;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 30% 30%, ${c.key}, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: mX,
          top: top - 2 * u,
          height: titleF * 1.2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: titleF,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            color: c.fg,
            transform: `translateY(${(1 - titleP) * titleF * 1.2}px)`,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: mX,
          top: bottom - 24 * u - 28 * u,
          height: 28 * u,
          display: "flex",
          alignItems: "baseline",
          gap: 10 * u,
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 22 * u,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: c.muted,
          opacity: lockP,
          transform: `translateY(${(1 - lockP) * 10 * u}px)`,
        }}
      >
        {logo ?? <RemocnLogo fontSize={26 * u} color={c.fg} />}
        {name}
      </div>

      {Array.from({ length: n + 1 }, (_, i) => {
        const strong = i === 0;
        const th = strong ? 2 * u : hair;
        return (
          <div
            key={`r${i}`}
            style={{
              position: "absolute",
              left: tableX,
              top: rowTop(i) - th / 2,
              width: tableW * rule(i),
              height: th,
              background: strong ? c.rule : c.hair,
            }}
          />
        );
      })}

      {rows.map((row, i) => {
        const y = rowTop(i);
        const h = heights[i];
        const isHl = i === hl;
        const lp = rise(10 + i * STAGGER);
        const scale = isHl ? hScale + (1 - hScale) * grow : 1;
        const fill =
          isHl && grow > 0
            ? {
                backgroundImage: haloFill(
                  theme,
                  t,
                  rgba(c.fg, 1 - grow),
                  accent,
                ),
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : { color: c.fg };
        const labelColor = isHl
          ? interpolateColors(grow, [0, 1], [c.muted, c.fg])
          : c.muted;
        return (
          <div key={`${i}-${row.label}`}>
            <div
              style={{
                position: "absolute",
                left: tableX,
                top: y,
                height: h,
                display: "flex",
                alignItems: "center",
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 22 * u,
                lineHeight: 1,
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap",
                color: labelColor,
                opacity: lp,
                transform: `translateY(${(1 - lp) * 12 * u}px)`,
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                position: "absolute",
                right: mX,
                top: y,
                height: h,
                display: "flex",
                alignItems: "center",
                fontFamily: sans,
                fontWeight: 500,
                fontSize: isHl ? hlF : valueF,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "pre",
                ...fill,
                transform: `scale(${scale})`,
                transformOrigin: "100% 50%",
              }}
            >
              <Value value={row.value} p={valueP(i)} />
            </div>
          </div>
        );
      })}

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
