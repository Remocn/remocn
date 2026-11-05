"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
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

export interface PriceSlateProps {
  /** The new price, set huge. Digits roll in on reels. */
  price?: string;
  /** The old price, shown first, struck through, then set aside. */
  was?: string;
  /** Serif italic lead-in before the prices. */
  lead?: string;
  /** Small line under the price. */
  note?: string;
  /** Availability line at the foot of the slate. */
  availability?: string;
  /** Product name after the logo at the top; empty hides it. */
  product?: string;
  /** Brand at the top; "remocn" renders the real logo. */
  name?: string;
  /** Replaces the logo / name at the top. */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Hanken Grotesk 300 (fontTools, wght 300): tabular figures 0.56em, "$" 0.553,
// "." and "," 0.24; cap height 0.697. Instrument Serif italic: F r o m.
const HANKEN: Record<string, number> = { $: 0.553, ".": 0.24, ",": 0.24 };
const DIGIT = 0.56;
const CAP = 0.697;
const TRACK = -0.02;
const SERIF: Record<string, number> = {
  F: 0.411,
  r: 0.368,
  o: 0.414,
  m: 0.745,
  " ": 0.17,
};

const isDigit = (ch: string) => ch >= "0" && ch <= "9";
const adv = (ch: string) => (isDigit(ch) ? DIGIT : (HANKEN[ch] ?? 0.58));

function layoutPrice(s: string) {
  const glyphs: Array<{ ch: string; x: number; w: number }> = [];
  let x = 0;
  for (const ch of Array.from(s)) {
    glyphs.push({ ch, x, w: adv(ch) });
    x += adv(ch) + TRACK;
  }
  return { glyphs, width: Math.max(0, x - TRACK) };
}

const serifWidth = (s: string) =>
  Array.from(s).reduce((w, ch) => w + (SERIF[ch] ?? 0.42), 0);

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_REEL = Easing.bezier(0.12, 0.6, 0.18, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beat sheet (30fps, speed 1):
//   0–22   the old price reels in at hero size beside the serif lead-in
//  22–34   a clean line strikes it through
//  34–52   it steps aside: shrinks, greys out, slides left
//  47–73   the new price reels spin into the hero slot (digits 3 frames apart)
//  69–91   the halo gradient sweeps across it as the last reel lands
//  71–99   note and availability rise in; poster holds to the end
const STRIKE_AT = 22;
const MOVE_AT = 34;
const MOVE_LEN = 18;
const REEL_AT = 47;
const REEL_LEN = 24;

// gradients.sh "halo" (bg #030306): #fff4ec #ffb36b #e2457a #3d4dff.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F4F1",
    muted: "#7C7B81",
    hair: "rgba(245,244,241,0.14)",
    halo: ["#FFF4EC", "#FFB36B", "#E2457A", "#3D4DFF"],
    stops: [0, 0.3, 0.64, 1],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#8A8883",
    hair: "rgba(18,18,20,0.12)",
    halo: ["#F08A2C", "#E2457A", "#9B47C9", "#3D4DFF"],
    stops: [0, 0.34, 0.66, 1],
  },
} as const;

/** One reel position: spins `turns` digits and lands on `digit`. */
function reel(
  t: number,
  start: number,
  len: number,
  digit: number,
  turns: number,
) {
  const k = EASE_REEL(Math.max(0, Math.min(1, (t - start) / len)));
  return digit - turns * (1 - k);
}

export function PriceSlate({
  price = "$0",
  was = "$29",
  lead = "From",
  note = "per seat · billed yearly",
  availability = "Available today",
  product = "Pro",
  name = "remocn",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: PriceSlateProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const newL = layoutPrice(price);
  const oldL = layoutPrice(was);
  const leadW = serifWidth(lead);

  // Final line: lead (S) · old price (S, struck) · new price (P), centred.
  const ratio = 0.4;
  const gapA = 0.26; // in S units, between lead and old price
  const gapB = 0.34; // in S units, between old price and new price
  const finalEm = (leadW + gapA + oldL.width + gapB) * ratio + newL.width;
  const P = Math.min(H * 0.4, (W * 0.78) / finalEm);
  const S = P * ratio;
  const baseline = H * 0.62;

  // Opening line: lead (S) · old price (P), centred.
  const openW = (leadW + gapA) * S + oldL.width * P;
  const finalW = finalEm * P;
  const leadX0 = (W - openW) / 2;
  const oldX0 = leadX0 + (leadW + gapA) * S;
  const leadX1 = (W - finalW) / 2;
  const oldX1 = leadX1 + (leadW + gapA) * S;
  const newX = oldX1 + (oldL.width + gapB) * S;

  const m = EASE_IO(Math.max(0, Math.min(1, (t - MOVE_AT) / MOVE_LEN)));
  const leadX = leadX0 + (leadX1 - leadX0) * m;
  const oldX = oldX0 + (oldX1 - oldX0) * m;
  const oldSize = P + (S - P) * m;
  const oldColor = interpolateColors(m, [0, 1], [p.fg, p.muted]);

  const leadIn = interpolate(t, [-6, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const strike = interpolate(t, [STRIKE_AT, STRIKE_AT + 12], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.6, 0, 0.25, 1),
  });
  // the halo sweeps in as the last reel lands
  const reels = newL.glyphs.filter((g) => isDigit(g.ch)).length;
  const landAt = REEL_AT + Math.max(0, reels - 1) * 3 + REEL_LEN + reels * 2;
  const sweep = interpolate(t, [landAt - 4, landAt + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rise = (a: number) =>
    interpolate(t, [a, a + 20], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const drift = interpolate(t, [0, 130], [0, 1], CLAMP);

  /** Renders a price on reels; returns elements in user space. */
  const renderPrice = (
    L: ReturnType<typeof layoutPrice>,
    x0: number,
    size: number,
    start: number,
    len: number,
    turns: number,
    key: string,
    only: "digits" | "marks",
  ) => {
    const step = (CAP + 0.26) * size;
    let di = 0;
    return L.glyphs.map((g, i) => {
      const gx = x0 + (g.x + g.w / 2) * size;
      if (!isDigit(g.ch)) {
        if (only === "digits") return null;
        // the old price's marks are there from the first frame; the new
        // price's wait for the old one to clear the slot
        const lag = key === "o" ? -8 : 0;
        const k = interpolate(
          t,
          [start + lag + i * 2, start + lag + 12 + i * 2],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        );
        return (
          <text
            key={`${key}${i}`}
            x={gx}
            y={baseline + (1 - k) * 0.35 * size}
            opacity={k}
          >
            {g.ch}
          </text>
        );
      }
      const d = Number(g.ch);
      const s0 = start + di * 3;
      const extra = turns + di * 2;
      di++;
      if (only === "marks") return null;
      const pos = reel(t, s0, len + di * 2, d, extra);
      const v = Math.abs(
        reel(t + 0.5, s0, len + di * 2, d, extra) -
          reel(t - 0.5, s0, len + di * 2, d, extra),
      );
      const base = Math.floor(pos);
      const f = pos - base;
      const show = interpolate(t, [s0 - 2, s0 + 6], [0, 1], CLAMP);
      const sd = Math.min(0.06, v * 0.05) * size;
      const digit = (n: number) => ((n % 10) + 10) % 10;
      return (
        <g
          key={`${key}${i}`}
          opacity={show}
          transform={`translate(0 ${-f * step})`}
        >
          <g filter={sd > 0.05 ? `url(#${uid}b${key}${i})` : undefined}>
            <text x={gx} y={baseline}>
              {digit(base)}
            </text>
            {f > 0.001 ? (
              <text x={gx} y={baseline + step}>
                {digit(base + 1)}
              </text>
            ) : null}
          </g>
          <filter
            id={`${uid}b${key}${i}`}
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <feGaussianBlur stdDeviation={`0 ${sd.toFixed(2)}`} />
          </filter>
        </g>
      );
    });
  };

  const newCap = CAP * P;
  const oldCap = CAP * oldSize;
  const strikeY = baseline - oldCap * 0.44;
  const strikeX0 = oldX - 0.05 * oldSize;
  const strikeX1 = oldX + (oldL.width + 0.05) * oldSize;
  const strikeT = Math.max(1.5 * u, 0.034 * oldSize);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${lead} ${price}, was ${was}`}
      >
        <defs>
          <linearGradient id={`${uid}feather`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.14" stopColor="#fff" />
            <stop offset="0.86" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          {/* reel windows: one for the old price (it shrinks), one for the new */}
          <mask
            id={`${uid}winOld`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect
              x={0}
              y={baseline - oldCap - 0.14 * oldSize}
              width={W}
              height={oldCap + 0.28 * oldSize}
              fill={`url(#${uid}feather)`}
            />
          </mask>
          <mask
            id={`${uid}winNew`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect
              x={0}
              y={baseline - newCap - 0.14 * P}
              width={W}
              height={newCap + 0.28 * P}
              fill={`url(#${uid}feather)`}
            />
          </mask>
          <linearGradient
            id={`${uid}halo`}
            gradientUnits="userSpaceOnUse"
            x1={newX - newL.width * P * (0.1 - 0.12 * drift)}
            y1={baseline - newCap}
            x2={newX + newL.width * P * (1.05 + 0.1 * drift)}
            y2={baseline}
          >
            {p.halo.map((c, i) => (
              <stop key={c} offset={p.stops[i]} stopColor={c} />
            ))}
          </linearGradient>
          {/* the gradient sweeps across the landed price, left to right */}
          <linearGradient
            id={`${uid}wipe`}
            gradientUnits="userSpaceOnUse"
            x1={newX - 0.4 * P + sweep * (newL.width * P + 0.8 * P)}
            y1={0}
            x2={newX + sweep * (newL.width * P + 0.8 * P)}
            y2={0}
          >
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask
            id={`${uid}sweep`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect width={W} height={H} fill={`url(#${uid}wipe)`} />
          </mask>
          <linearGradient
            id={`${uid}wipeInv`}
            gradientUnits="userSpaceOnUse"
            x1={newX - 0.4 * P + sweep * (newL.width * P + 0.8 * P)}
            y1={0}
            x2={newX + sweep * (newL.width * P + 0.8 * P)}
            y2={0}
          >
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask
            id={`${uid}ink`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect width={W} height={H} fill={`url(#${uid}wipeInv)`} />
          </mask>
        </defs>

        {/* lead-in */}
        <text
          x={leadX}
          y={baseline}
          fontFamily={serif}
          fontStyle="italic"
          fontWeight={400}
          fontSize={S}
          fill={p.fg}
          opacity={leadIn}
          transform={`translate(0 ${(1 - leadIn) * 0.2 * S})`}
        >
          {lead}
        </text>

        {/* old price, then its strike */}
        <g
          fontFamily={sans}
          fontWeight={300}
          fontSize={oldSize}
          textAnchor="middle"
          fill={oldColor}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <g mask={`url(#${uid}winOld)`}>
            {renderPrice(oldL, oldX, oldSize, 0, 20, 7, "o", "digits")}
          </g>
          {renderPrice(oldL, oldX, oldSize, 0, 20, 7, "o", "marks")}
        </g>
        <line
          x1={strikeX0}
          x2={strikeX0 + (strikeX1 - strikeX0) * strike}
          y1={strikeY}
          y2={strikeY}
          stroke={interpolateColors(m, [0, 1], [p.fg, p.muted])}
          strokeWidth={strikeT}
          strokeLinecap="round"
          opacity={strike > 0 ? 1 : 0}
        />

        {/* new price: ink while it rolls, halo gradient once it lands */}
        <g
          fontFamily={sans}
          fontWeight={300}
          fontSize={P}
          textAnchor="middle"
          fill={p.fg}
          style={{ fontVariantNumeric: "tabular-nums" }}
          mask={sweep > 0 ? `url(#${uid}ink)` : undefined}
        >
          <g mask={`url(#${uid}winNew)`}>
            {renderPrice(newL, newX, P, REEL_AT, REEL_LEN, 13, "n", "digits")}
          </g>
          {renderPrice(newL, newX, P, REEL_AT, REEL_LEN, 13, "n", "marks")}
        </g>
        <g
          mask={`url(#${uid}sweep)`}
          fontFamily={sans}
          fontWeight={300}
          fontSize={P}
          textAnchor="middle"
          fill={`url(#${uid}halo)`}
          style={{ fontVariantNumeric: "tabular-nums" }}
          opacity={sweep > 0 ? 1 : 0}
        >
          {newL.glyphs.map((g) => (
            <text
              key={`h${g.x}${g.ch}`}
              x={newX + (g.x + g.w / 2) * P}
              y={baseline}
            >
              {g.ch}
            </text>
          ))}
        </g>
      </svg>

      {/* brand + product, top */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.115,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 12 * u,
          opacity: rise(-8),
          transform: `translateY(${(1 - rise(-8)) * 10 * u}px)`,
          lineHeight: 1,
        }}
      >
        {logo ??
          (name.trim().toLowerCase() === "remocn" ? (
            <RemocnLogo fontSize={34 * u} color={p.fg} />
          ) : (
            <span
              style={{
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 34 * u,
                letterSpacing: "-0.02em",
                color: p.fg,
              }}
            >
              {name}
            </span>
          ))}
        {product ? (
          <span
            style={{
              fontFamily: sans,
              fontWeight: 300,
              fontSize: 34 * u,
              letterSpacing: "-0.02em",
              color: p.fg,
            }}
          >
            {product}
          </span>
        ) : null}
      </div>

      {/* note under the price */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: baseline + 0.2 * P,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 30 * u,
          letterSpacing: "-0.01em",
          color: p.muted,
          opacity: rise(landAt - 2),
          transform: `translateY(${(1 - rise(landAt - 2)) * 12 * u}px)`,
          lineHeight: 1,
        }}
      >
        {note}
      </div>

      {/* availability */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.855,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12 * u,
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 24 * u,
          letterSpacing: "-0.005em",
          color: p.fg,
          opacity: rise(landAt + 6),
          transform: `translateY(${(1 - rise(landAt + 6)) * 12 * u}px)`,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            width: 8 * u,
            height: 8 * u,
            borderRadius: 99,
            background: accent,
          }}
        />
        {availability}
      </div>
    </AbsoluteFill>
  );
}
