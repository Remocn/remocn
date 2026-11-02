"use client";

import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
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

const { fontFamily: sans } = loadSpace("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadPlexMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface ThreadWeaveProps {
  value?: string;
  motif?: "value" | "mark";
  caption?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

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
    weft: "#ECE9E2",
    warp: "#B9B4AA",
    shade: "rgba(10,10,11,0.28)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    weft: "#1E1E21",
    warp: "#6A6A71",
    shade: "rgba(0,0,0,0.45)",
    grain: 0.045,
  },
} as const;

const FONT: Record<string, string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", ".#.##", "#..##"],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
};

/** The remocn.dev R mark, rasterised from its outline (13 × 12, ≥42% coverage). */
const MARK = [
  "1111111111..",
  ".1111111111.",
  ".........11.",
  "..........11",
  "..........11",
  ".........111",
  ".....111111.",
  ".111111111..",
  "11111111....",
  "11....111...",
  "11.....11...",
  "11......11..",
  "11.......11.",
];

/**
 * gradients.sh "fluted" palette (#1d2a8f #2f7bff #ff7a3d #ffe2c4; the
 * accent stands in for #2f7bff on light cloth) dyes the figure threads,
 * bottom-left to top-right. Light cloth takes the dark end, dark cloth the
 * bright end.
 */
function figureColor(theme: "dark" | "light", accent: string, k: number) {
  return theme === "dark"
    ? interpolateColors(k, [0, 0.45, 1], ["#1d2a8f", accent, "#ff7a3d"])
    : interpolateColors(k, [0, 0.5, 1], ["#2f7bff", "#ff7a3d", "#ffe2c4"]);
}

/** Longest the weave may take, so dense motifs still hold their poster. */
const WEAVE_BUDGET = 108;

function motifBitmap(value: string, motif: "value" | "mark") {
  if (motif === "mark") return MARK;
  const rows: string[] = ["", "", "", "", "", "", ""];
  const chars = value.split("").filter((ch) => FONT[ch]);
  chars.forEach((ch, i) => {
    const g = FONT[ch];
    for (let r = 0; r < 7; r++) {
      rows[r] += g[r].replace(/#/g, "1") + (i < chars.length - 1 ? "." : "");
    }
  });
  return rows;
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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const WARP_IN = [-6, 22] as const;
const WEAVE_START = 22;
const PAD = { value: [3, 2], mark: [2, 1] } as const;

export function ThreadWeave({
  value = "24",
  motif = "value",
  caption = "frames per second",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ThreadWeaveProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];

  const bitmap = motifBitmap(value, motif);
  const [PAD_X, PAD_Y] = PAD[motif];
  const bw = Math.max(...bitmap.map((r) => r.length), 1);
  const bh = bitmap.length;
  const pxW = bw + PAD_X * 2;
  const pxH = bh + PAD_Y * 2;
  const cols = pxW * 2;
  const rows = pxH * 2;

  const sy = Math.min((height * 0.6) / rows, (width * 0.7) / (cols * 0.94));
  const sx = sy * 0.94;
  const clothW = cols * sx;
  const clothH = rows * sy;
  const footer = 46 * u;
  const left = (width - clothW) / 2;
  const top = (height - clothH - footer) / 2;
  const fringe = 0.9 * sy;
  const barH = sy * 0.86;
  const warpW = sx * 0.3;

  const colorAt = (r: number, c: number) => {
    const py = Math.floor(r / 2) - PAD_Y;
    const px = Math.floor(c / 2) - PAD_X;
    const ch = bitmap[py]?.[px];
    if (ch !== "1") return p.weft;
    const gx = px / Math.max(1, bw - 1);
    const gy = py / Math.max(1, bh - 1);
    return figureColor(theme, accent, 0.55 * gx + 0.45 * (1 - gy));
  };

  const durs: number[] = [];
  const starts: number[] = [];
  const raw = Array.from({ length: rows }, (_, r) =>
    lerp(6.6, 3.4, EASE_OUT(r / Math.max(1, rows - 1))),
  );
  const fit = Math.min(1, WEAVE_BUDGET / raw.reduce((a, b) => a + b, 0));
  let acc = WEAVE_START;
  for (let r = 0; r < rows; r++) {
    const d = raw[r] * fit;
    starts.push(acc);
    durs.push(d);
    acc += d;
  }
  const weaveEnd = acc;
  const beatLen = 7;

  const rowState = (r: number) => {
    const s = starts[r];
    const e = s + durs[r];
    const prog = interpolate(t, [s, e], [0, 1], { ...CLAMP, easing: EASE_IO });
    const beat = interpolate(t, [e, e + beatLen], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const y = top + (r + 0.5) * sy - (1 - beat) * 0.32 * sy;
    const ltr = r % 2 === 0;
    return { prog, y, ltr, started: t >= s };
  };

  const states = Array.from({ length: rows }, (_, r) => rowState(r));
  const picks = states.filter((s) => s.prog >= 1).length;

  const settle = interpolate(t, [weaveEnd, weaveEnd + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const footA = interpolate(t, [10, 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capA = interpolate(t, [weaveEnd + 2, weaveEnd + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const warpEls = Array.from({ length: cols }, (_, c) => {
    const x = left + (c + 0.5) * sx;
    const mid = (cols - 1) / 2;
    const delay = (Math.abs(c - mid) / Math.max(1, mid)) * 10;
    const g = interpolate(
      t,
      [WARP_IN[0] + delay, WARP_IN[1] - 10 + delay],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const y0 = top - fringe;
    const y1 = top + clothH + fringe;
    return (
      <rect
        key={`w${x}`}
        x={x - warpW / 2}
        y={y0}
        width={warpW}
        height={(y1 - y0) * g}
        rx={warpW / 2}
        fill={p.warp}
      />
    );
  });

  const weftEls: React.ReactNode[] = [];
  const tickEls: React.ReactNode[] = [];
  const loopEls: React.ReactNode[] = [];
  const xL = left;
  const xR = left + clothW;
  const capR = barH / 2;

  for (let r = 0; r < rows; r++) {
    const st = states[r];
    if (!st.started) continue;
    const reach = st.prog;
    const tip = st.ltr ? lerp(xL, xR, reach) : lerp(xR, xL, reach);
    const visLo = st.ltr ? xL : tip;
    const visHi = st.ltr ? tip : xR;
    for (let c = 0; c < cols; c++) {
      const cx0 = left + c * sx;
      const cx1 = cx0 + sx;
      const lo = Math.max(cx0, visLo);
      const hi = Math.min(cx1, visHi);
      if (hi <= lo) continue;
      weftEls.push(
        <rect
          key={`f${r}-${c}`}
          x={lo - 0.4}
          y={st.y - barH / 2}
          width={hi - lo + 0.8}
          height={barH}
          fill={colorAt(r, c)}
        />,
      );
      const wx = cx0 + sx / 2;
      const passed = st.ltr ? tip >= wx + warpW : tip <= wx - warpW;
      if ((r + c) % 2 === 1 && passed) {
        tickEls.push(
          <g key={`t${r}-${c}`}>
            <rect
              x={wx - warpW / 2 - 1.6 * u}
              y={st.y - barH / 2}
              width={warpW + 3.2 * u}
              height={barH}
              fill={p.shade}
            />
            <rect
              x={wx - warpW / 2}
              y={st.y - barH / 2 - 0.5}
              width={warpW}
              height={barH + 1}
              fill={p.warp}
            />
          </g>,
        );
      }
    }
    const lead = st.prog > 0 && st.prog < 1 ? tip : null;
    if (lead !== null) {
      weftEls.push(
        <circle
          key={`h${r}`}
          cx={lead}
          cy={st.y}
          r={capR}
          fill={colorAt(
            r,
            Math.max(0, Math.min(cols - 1, Math.floor((lead - left) / sx))),
          )}
        />,
      );
    }
    if (r === 0 && st.prog > 0) {
      weftEls.push(
        <circle key="cap0" cx={xL} cy={st.y} r={capR} fill={p.weft} />,
      );
    }
    if (r === rows - 1 && st.prog >= 1) {
      weftEls.push(
        <circle
          key="cap1"
          cx={st.ltr ? xR : xL}
          cy={st.y}
          r={capR}
          fill={p.weft}
        />,
      );
    }
    if (r > 0) {
      const prev = states[r - 1];
      const side = prev.ltr ? xR : xL;
      const dir = prev.ltr ? 1 : -1;
      const k = interpolate(st.prog, [0, 0.12], [0, 1], CLAMP);
      if (k > 0) {
        const rr = (st.y - prev.y) / 2;
        const rx = sy * 0.3;
        const cyM = (st.y + prev.y) / 2;
        const ang = Math.PI * k;
        const ex = side + dir * Math.sin(ang) * rx;
        const ey = cyM - Math.cos(ang) * rr;
        loopEls.push(
          <path
            key={`l${r}`}
            d={`M${side} ${prev.y} A${rx} ${rr} 0 0 ${dir > 0 ? 1 : 0} ${ex} ${ey}`}
            fill="none"
            stroke={p.weft}
            strokeWidth={barH * 0.9}
          />,
        );
      }
    }
  }

  const scale = lerp(1.025, 1, EASE_IO(Math.min(1, t / (weaveEnd + 16))));

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "50% 46%",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {warpEls}
          {loopEls}
          {weftEls}
          {tickEls}
        </svg>
        <div
          style={{
            position: "absolute",
            left,
            top: top + clothH + fringe + 18 * u,
            width: clothW,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: sans,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              fontSize: 20 * u,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              color: p.fg,
              opacity: capA,
              transform: `translateY(${(1 - capA) * 8 * u}px)`,
            }}
          >
            {caption === "remocn" ? (
              <RemocnLogo fontSize={22 * u} color={p.fg} />
            ) : (
              caption
            )}
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 14 * u,
              fontWeight: 400,
              letterSpacing: "0.01em",
              color: p.muted,
              fontVariantNumeric: "tabular-nums",
              opacity: footA * lerp(1, 0.85, settle),
            }}
          >
            {`${cols} ends × ${picks} picks`}
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
