"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Oswald";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
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

export interface TickerTapeProps {
  /** The hero symbol the middle band stops on. */
  symbol?: string;
  /** Hero price, shown as typed. */
  price?: string;
  /** Hero move in percent; negative reads as a down move. */
  change?: number;
  /** Other (fictional) symbols filling the bands. */
  symbols?: string[];
  /** Product under the poster; "remocn" renders the real logo. */
  name?: string;
  /** Replaces the logo / name under the poster. */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Oswald 500 advances per em for A–Z (fontTools, wght 500); cap height 0.81.
const OSWALD: Record<string, number> = {
  A: 0.522,
  B: 0.557,
  C: 0.54,
  D: 0.557,
  E: 0.428,
  F: 0.413,
  G: 0.559,
  H: 0.586,
  I: 0.275,
  J: 0.326,
  K: 0.532,
  L: 0.421,
  M: 0.683,
  N: 0.545,
  O: 0.563,
  P: 0.527,
  Q: 0.564,
  R: 0.561,
  S: 0.494,
  T: 0.43,
  U: 0.566,
  V: 0.516,
  W: 0.712,
  X: 0.499,
  Y: 0.487,
  Z: 0.425,
};
const CAP = 0.81;
/** JetBrains Mono: every glyph advances 0.6em, cap height 0.73. */
const MONO = 0.6;
const MONO_CAP = 0.73;

const symWidth = (s: string) =>
  Array.from(s).reduce((w, ch) => w + (OSWALD[ch] ?? 0.52), 0);

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.8, 0.2);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beat sheet (30fps, speed 1):
//   0–40   seven bands run at full tilt, alternating directions, fast ones smear
//  40–86   everything brakes; the middle band stops dead with the hero symbol
//          centred, the others slow to a crawl
//  84–108  the side bands clear out up and down, the hero's neighbours slide
//          off, and the hero quote scales up into the poster
//  108–    poster: symbol, price, move; the thin mono tapes keep crawling
const BRAKE_AT = 40;
const STOP_AT = 86;
const RISE_AT = 84;
const RISE_LEN = 26;

// gradients.sh "aurora" (bg #03050b): #a0f0c8 #3fb5a3 #5147b6 #b25c9c.
// Up moves take the mint/teal end; the glow under the poster uses the set.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#7E7D84",
    rule: "rgba(243,242,239,0.1)",
    up: ["#A0F0C8", "#3FB5A3"],
    down: "#C8675E",
    glow: ["#3FB5A3", "#5147B6", "#A0F0C8"],
    glowAlpha: 0.3,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#7A7873",
    rule: "rgba(18,18,20,0.1)",
    up: ["#2E9C8B", "#5147B6"],
    down: "#B24A40",
    glow: ["#A0F0C8", "#C9C4F2", "#A0F0C8"],
    glowAlpha: 0.45,
  },
} as const;

const SYMBOLS = [
  "KTBS",
  "KEYF",
  "EASE",
  "SPRG",
  "TWEN",
  "FRMS",
  "SEQN",
  "MOTN",
  "BLUR",
  "PXLS",
  "KERN",
  "GLYF",
  "WIPE",
  "CRVE",
  "TIMR",
  "FADE",
];

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Quote {
  sym: string;
  price: string;
  chg: number;
  hero: boolean;
}

interface Placed extends Quote {
  /** left edge inside the tile, px */
  x: number;
  w: number;
}

interface RowSpec {
  /** font size as a share of the frame height */
  size: number;
  kind: "big" | "mono";
  dir: 1 | -1;
  /** px per frame at 720p */
  v: number;
  hero?: boolean;
}

const ROWS: RowSpec[] = [
  { size: 0.026, kind: "mono", dir: -1, v: 2.6 },
  { size: 0.088, kind: "big", dir: 1, v: 7 },
  { size: 0.13, kind: "big", dir: -1, v: 11.5 },
  { size: 0.2, kind: "big", dir: -1, v: 17, hero: true },
  { size: 0.13, kind: "big", dir: 1, v: 10 },
  { size: 0.088, kind: "big", dir: -1, v: 7.5 },
  { size: 0.026, kind: "mono", dir: 1, v: 2.8 },
];

function fmtChg(c: number) {
  return `${Math.abs(c).toFixed(1)}%`;
}

/** Width of a quote at font size `fs`. Big: symbol + a two-line price/move stack. */
function quoteWidth(q: Quote, fs: number, kind: RowSpec["kind"]) {
  if (kind === "mono") {
    const chars = q.sym.length + 1 + q.price.length + 3 + fmtChg(q.chg).length;
    return chars * MONO * fs;
  }
  const sub = fs * 0.3;
  const stack = Math.max(
    q.price.length * MONO * sub,
    (fmtChg(q.chg).length + 1.4) * MONO * sub,
  );
  return symWidth(q.sym) * fs + fs * 0.16 + stack;
}

function Triangle({
  x,
  baseline,
  size,
  up,
  fill,
}: {
  x: number;
  baseline: number;
  size: number;
  up: boolean;
  fill: string;
}) {
  // sits on the cap height of the figures beside it
  const h = size * 0.56;
  const w = size * 0.62;
  const top = baseline - size * MONO_CAP + (size * MONO_CAP - h) / 2;
  const d = up
    ? `M${x} ${top + h} L${x + w / 2} ${top} L${x + w} ${top + h} Z`
    : `M${x} ${top} L${x + w} ${top} L${x + w / 2} ${top + h} Z`;
  return <path d={d} fill={fill} />;
}

function QuoteView({
  q,
  x,
  baseline,
  fs,
  kind,
  fg,
  muted,
  upFill,
  downFill,
}: {
  q: Quote;
  x: number;
  baseline: number;
  fs: number;
  kind: RowSpec["kind"];
  fg: string;
  muted: string;
  upFill: string;
  downFill: string;
}) {
  const up = q.chg >= 0;
  const col = up ? upFill : downFill;
  if (kind === "mono") {
    const a = x + (q.sym.length + 1) * MONO * fs;
    const b = a + (q.price.length + 1) * MONO * fs;
    return (
      <g fontFamily={mono} fontSize={fs}>
        <text x={x} y={baseline} fill={fg} fontWeight={500}>
          {q.sym}
        </text>
        <text x={a} y={baseline} fill={muted} fontWeight={400}>
          {q.price}
        </text>
        <Triangle
          x={b}
          baseline={baseline}
          size={fs}
          up={up}
          fill={up ? upFill : downFill}
        />
        <text x={b + 1.1 * MONO * fs} y={baseline} fill={col} fontWeight={400}>
          {fmtChg(q.chg)}
        </text>
      </g>
    );
  }
  const sub = fs * 0.3;
  const sx = x + symWidth(q.sym) * fs + fs * 0.16;
  const capTop = baseline - CAP * fs;
  return (
    <g>
      <text
        x={x}
        y={baseline}
        fill={fg}
        fontFamily={display}
        fontWeight={500}
        fontSize={fs}
      >
        {q.sym}
      </text>
      <g fontFamily={mono} fontSize={sub} fontWeight={400}>
        <text x={sx} y={capTop + MONO_CAP * sub} fill={muted}>
          {q.price}
        </text>
        <Triangle x={sx} baseline={baseline} size={sub} up={up} fill={col} />
        <text x={sx + 1.4 * MONO * sub} y={baseline} fill={col}>
          {fmtChg(q.chg)}
        </text>
      </g>
    </g>
  );
}

/** Distance travelled: full speed, then a cubic brake to `rest` × speed. */
function travel(t: number, v: number, stopAt: number, rest: number) {
  const L = stopAt - BRAKE_AT;
  if (t <= BRAKE_AT) return v * t;
  const tau = Math.min(1, (t - BRAKE_AT) / L);
  const brake = (v * (1 - rest) * L * (1 - (1 - tau) ** 3)) / 3;
  return v * BRAKE_AT + brake + v * rest * (t - BRAKE_AT);
}

function speedAt(t: number, v: number, stopAt: number, rest: number) {
  if (t <= BRAKE_AT) return v;
  const tau = Math.min(1, (t - BRAKE_AT) / (stopAt - BRAKE_AT));
  return v * rest + v * (1 - rest) * (1 - tau) ** 2;
}

export function TickerTape({
  symbol = "RMCN",
  price = "128.40",
  change = 12.4,
  symbols = SYMBOLS,
  name = "remocn",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: TickerTapeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const heroSym = symbol.trim().toUpperCase() || "RMCN";

  // One tile of quotes per row, wide enough to cover the frame twice.
  const rows = useMemo(() => {
    let seed = 0;
    return ROWS.map((r, ri) => {
      const fs = r.size * H;
      const placed: Placed[] = [];
      let x = 0;
      const gap = r.kind === "mono" ? 2.4 * MONO * fs : fs * 0.5;
      let k = 0;
      while (x < W * 2.2 || (r.hero && k < 7)) {
        const isHero = Boolean(r.hero) && k === 5;
        const sym = isHero
          ? heroSym
          : symbols[
              (ri * 5 + k * 3 + Math.floor(hash(seed) * 4)) % symbols.length
            ];
        const up = hash(seed * 1.7 + 3) < 0.6;
        const q: Quote = isHero
          ? { sym, price, chg: change, hero: true }
          : {
              sym,
              price: (8 + hash(seed * 2.9) * 390).toFixed(2),
              chg: (up ? 1 : -1) * (0.2 + hash(seed * 4.3 + 1) * 8.6),
              hero: false,
            };
        const w = quoteWidth(q, fs, r.kind);
        placed.push({ ...q, x, w });
        x += w + gap;
        k++;
        seed++;
      }
      return { ...r, fs, placed, period: x };
    });
  }, [H, W, heroSym, price, change, symbols]);

  // vertical stack: rows separated by hairlines, centred in the frame
  const gaps = rows.map((r) => (r.kind === "mono" ? 0.03 : 0.036) * H);
  const heights = rows.map((r) => CAP * r.fs);
  const total =
    heights.reduce((a, b) => a + b, 0) +
    gaps.slice(0, -1).reduce((a, b) => a + b, 0) * 1;
  let yCursor = (H - total) / 2;
  const baselines = rows.map((_, i) => {
    const b = yCursor + heights[i];
    yCursor = b + gaps[i];
    return b;
  });

  const heroRowIdx = rows.findIndex((r) => r.hero);
  const heroRow = rows[heroRowIdx];
  const heroQ = heroRow.placed.find((q) => q.hero) as Placed;

  // poster scale and position
  const rise = interpolate(t, [RISE_AT, RISE_AT + RISE_LEN], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.7, 0, 0.2, 1),
  });
  const posterScale = Math.min((W * 0.74) / heroQ.w, (H * 0.36) / heroRow.fs);
  const scale = 1 + (posterScale - 1) * rise;
  const heroBaseline0 = baselines[heroRowIdx];
  const heroCy0 = heroBaseline0 - (CAP * heroRow.fs) / 2;
  const heroCy1 = H * 0.46;
  const heroCy = heroCy0 + (heroCy1 - heroCy0) * rise;

  const clear = interpolate(t, [RISE_AT - 4, RISE_AT + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IN,
  });
  const caption = (d: number) =>
    interpolate(
      t,
      [RISE_AT + RISE_LEN - 6 + d, RISE_AT + RISE_LEN + 14 + d],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
  const glowIn = interpolate(t, [RISE_AT, RISE_AT + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const drift = interpolate(t, [0, 160], [0, 1], CLAMP);

  const upId = `${uid}up`;
  const upFill = `url(#${upId})`;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      {/* aurora glow lands under the poster */}
      <AbsoluteFill
        style={{
          opacity: p.glowAlpha * glowIn,
          background: p.glow
            .map(
              (c, i) =>
                `radial-gradient(30% 42% at ${22 + i * 28 + drift * 4}% ${heroCy1 / (H / 100) + (i % 2 ? 5 : -3)}%, ${c} 0%, transparent 70%)`,
            )
            .join(", "),
        }}
      />
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${heroSym} ${price} ${change >= 0 ? "up" : "down"} ${fmtChg(change)}`}
      >
        <defs>
          <linearGradient id={upId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={p.up[0]} />
            <stop offset="1" stopColor={p.up[1]} />
          </linearGradient>
          <clipPath id={`${uid}stage`}>
            <rect
              x={0}
              y={baselines[0] + gaps[0] / 2}
              width={W}
              height={
                baselines[rows.length - 1] -
                heights[rows.length - 1] -
                gaps[rows.length - 2] / 2 -
                (baselines[0] + gaps[0] / 2)
              }
            />
          </clipPath>
          {rows.map((r, i) => {
            const v = speedAt(
              t,
              r.v * u,
              r.hero ? STOP_AT : STOP_AT - 8 + i * 3,
              r.hero ? 0 : 0.12,
            );
            return (
              <filter
                key={`blur${r.size}${r.dir}${r.v}`}
                id={`${uid}blur${i}`}
                x="-5%"
                y="-50%"
                width="110%"
                height="200%"
              >
                <feGaussianBlur stdDeviation={`${(v * 0.2).toFixed(2)} 0`} />
              </filter>
            );
          })}
        </defs>

        {rows.map((r, i) => {
          const stopAt = r.hero ? STOP_AT : STOP_AT - 8 + i * 3;
          const rest = r.hero ? 0 : r.kind === "mono" ? 0.35 : 0.12;
          const D = travel(t, r.v * u, stopAt, rest);
          // the hero row is offset so the hero quote lands dead centre
          const Dstop = travel(stopAt + 1000, r.v * u, stopAt, 0);
          const x0 = r.hero
            ? W / 2 - (heroQ.x + heroQ.w / 2) - r.dir * Dstop
            : -hash(i * 3.3) * r.period;
          const shift = x0 + r.dir * D;
          const off = ((shift % r.period) + r.period) % r.period;
          const baseline = baselines[i];
          // side bands clear: upper ones up, lower ones down
          const away =
            r.kind === "mono" || r.hero
              ? 0
              : (i < heroRowIdx ? -1 : 1) * clear * H * 0.55;
          const fade = r.kind === "mono" ? 1 - 0.35 * clear : 1 - clear;
          const copies = [-1, 0, 1, 2];
          return (
            <g
              key={`row${r.size}${r.dir}${r.v}`}
              clipPath={r.kind === "mono" ? undefined : `url(#${uid}stage)`}
            >
              <g opacity={fade} transform={`translate(0 ${away})`}>
                {/* hairlines between bands, carried away by the side bands */}
                {i !== heroRowIdx ? (
                  <line
                    x1={0}
                    x2={W}
                    y1={
                      i < heroRowIdx
                        ? baseline + gaps[i] / 2
                        : baseline - heights[i] - gaps[i - 1] / 2
                    }
                    y2={
                      i < heroRowIdx
                        ? baseline + gaps[i] / 2
                        : baseline - heights[i] - gaps[i - 1] / 2
                    }
                    stroke={p.rule}
                    strokeWidth={Math.max(1, u)}
                  />
                ) : null}
                <g filter={`url(#${uid}blur${i})`}>
                  {copies.flatMap((c) =>
                    r.placed.map((q) => {
                      if (q.hero) return null;
                      let x =
                        q.x + c * r.period + (r.hero ? shift : off - r.period);
                      if (r.hero) {
                        // neighbours make room for the growing hero quote
                        const heroX = heroQ.x + c * r.period + shift;
                        const dirSide = x < heroX ? -1 : 1;
                        x +=
                          dirSide *
                          ((scale - 1) * heroQ.w * 0.5 + rise * W * 0.12);
                      }
                      if (x > W + 20 * u || x + q.w < -20 * u) return null;
                      return (
                        <g key={`${c}-${q.x}`} opacity={r.hero ? 1 - rise : 1}>
                          <QuoteView
                            q={q}
                            x={x}
                            baseline={baseline}
                            fs={r.fs}
                            kind={r.kind}
                            fg={p.fg}
                            muted={p.muted}
                            upFill={upFill}
                            downFill={p.down}
                          />
                        </g>
                      );
                    }),
                  )}
                </g>
              </g>
            </g>
          );
        })}

        {/* hero quote: rides its band, then scales into the poster */}
        {(() => {
          const r = heroRow;
          const D = travel(t, r.v * u, STOP_AT, 0);
          const Dstop = travel(STOP_AT + 1000, r.v * u, STOP_AT, 0);
          const x0 = W / 2 - (heroQ.x + heroQ.w / 2) - r.dir * Dstop;
          const shift = x0 + r.dir * D;
          // nearest copy to the centre
          const raw = heroQ.x + shift;
          const n = Math.round((W / 2 - heroQ.w / 2 - raw) / r.period);
          const left = raw + n * r.period;
          const cx = left + heroQ.w / 2;
          return (
            <g
              transform={`translate(${cx} ${heroCy}) scale(${scale}) translate(${-cx} ${-heroCy0})`}
            >
              <g filter={`url(#${uid}blur${heroRowIdx})`}>
                <QuoteView
                  q={heroQ}
                  x={left}
                  baseline={heroBaseline0}
                  fs={r.fs}
                  kind="big"
                  fg={p.fg}
                  muted={p.muted}
                  upFill={upFill}
                  downFill={p.down}
                />
              </g>
            </g>
          );
        })()}
      </svg>

      {/* caption under the poster */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: heroCy1 + (CAP * heroRow.fs * posterScale) / 2 + 46 * u,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14 * u,
          fontFamily: mono,
          fontSize: 15 * u,
          letterSpacing: "0.12em",
          color: p.muted,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            opacity: caption(0),
            transform: `translateY(${(1 - caption(0)) * 12 * u}px)`,
          }}
        >
          {logo ??
            (name.trim().toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={30 * u} color={p.fg} />
            ) : (
              <span
                style={{
                  fontFamily: display,
                  fontWeight: 500,
                  fontSize: 30 * u,
                  letterSpacing: "0.01em",
                  color: p.fg,
                }}
              >
                {name}
              </span>
            ))}
        </div>
        <div
          style={{
            width: Math.max(1, u),
            height: 20 * u,
            background: p.rule,
            transform: `scaleY(${caption(3)})`,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9 * u,
            opacity: caption(6),
            transform: `translateY(${(1 - caption(6)) * 12 * u}px)`,
          }}
        >
          <div
            style={{
              width: 7 * u,
              height: 7 * u,
              borderRadius: 99,
              background: accent,
            }}
          />
          <span>MARKET CLOSE</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
