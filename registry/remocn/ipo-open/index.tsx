"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
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

export interface IpoOpenProps {
  /** Ticker symbol, set huge. Fictional, 1–5 capital letters reads best. */
  symbol?: string;
  /** Small mono line above the symbol. */
  label?: string;
  /** The IPO price the opening print starts from. */
  ipoPrice?: number;
  /** The first trade the price races to. */
  openPrice?: number;
  /** Clock in the corner; ticks over to this on the bell. */
  openTime?: string;
  /** Brand in the corner bug; "remocn" renders the real logo. */
  name?: string;
  /** Replaces the logo / name in the corner bug. */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Schibsted Grotesk 500 advances per em for A–Z (harfbuzz, wght 500),
// tabular figures .635, "$" .574, "." .287, cap height .703.
const SCHIBSTED: Record<string, number> = {
  A: 0.71,
  B: 0.654,
  C: 0.708,
  D: 0.708,
  E: 0.591,
  F: 0.567,
  G: 0.721,
  H: 0.729,
  I: 0.373,
  J: 0.55,
  K: 0.678,
  L: 0.555,
  M: 0.886,
  N: 0.739,
  O: 0.769,
  P: 0.63,
  Q: 0.769,
  R: 0.648,
  S: 0.623,
  T: 0.656,
  U: 0.685,
  V: 0.688,
  W: 0.955,
  X: 0.675,
  Y: 0.633,
  Z: 0.606,
};
const DIGIT = 0.635;
const DOLLAR = 0.574;
const DOT = 0.287;
const CAP = 0.703;
const SYM_TRACK = -0.035;
const PRICE_TRACK = -0.02;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_RACE = Easing.bezier(0.3, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beat sheet (30fps, speed 1):
//   0–26   LISTED TODAY, then the symbol rises letter by letter out of a
//          baseline window; the IPO price and its tag settle underneath
//  34–35   the bell: a two-frame inverted flash, the clock flips to the open,
//          a shockwave line tears out sideways from the centre
//  37–87   the opening print races up on rolling tabular reels, the live move
//          counting in the chip, the sunrise ground climbing with it
//  87–99   the price lands, the chip pops into the gradient
//  99–     poster holds
const BELL = 34;
const RACE_AT = 37;
const RACE_LEN = 50;
const LAND = RACE_AT + RACE_LEN;

// gradients.sh "rise" (bg #030306): #fff1e2 #ff8a3d #a3301a #2a0d0a.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F4F1",
    muted: "#85838A",
    hair: "rgba(245,244,241,0.16)",
    chipInk: "#1E0B07",
    chip: "linear-gradient(105deg, #FFF1E2 0%, #FFC59A 34%, #FF8A3D 72%, #E0703B 100%)",
    ground: (k: number) =>
      [
        `radial-gradient(${70 + 30 * k}% ${16 + 34 * k}% at 50% 104%, rgba(255,241,226,${0.95 * k}) 0%, rgba(255,138,61,${0.9 * k}) 22%, rgba(163,48,26,${0.75 * k}) 52%, rgba(42,13,10,${0.6 * k}) 76%, rgba(42,13,10,0) 100%)`,
        `radial-gradient(120% ${30 + 30 * k}% at 50% 100%, rgba(163,48,26,${0.28 * k}) 0%, rgba(42,13,10,0) 70%)`,
      ].join(", "),
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#8A8883",
    hair: "rgba(18,18,20,0.14)",
    chipInk: "#FFF1E2",
    chip: "linear-gradient(105deg, #2A0D0A 0%, #A3301A 46%, #E0703B 78%, #FF8A3D 100%)",
    ground: (k: number) =>
      [
        `radial-gradient(${70 + 30 * k}% ${16 + 34 * k}% at 50% 104%, rgba(255,138,61,${0.85 * k}) 0%, rgba(255,138,61,${0.42 * k}) 34%, rgba(255,241,226,${0.5 * k}) 70%, rgba(255,241,226,0) 100%)`,
      ].join(", "),
  },
} as const;

const fmt = (cents: number) => {
  const c = Math.round(cents);
  return `${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
};

/** Odometer position for the column with place value `p` (in cents). */
function columnPos(cents: number, p: number) {
  if (p === 1) return cents;
  const below = ((cents % p) + p) % p;
  const carry = Math.max(0, (below - 0.9 * p) / (0.1 * p));
  return Math.floor(cents / p) + carry;
}

export function IpoOpen({
  symbol = "RMCN",
  label = "Listed today",
  ipoPrice = 18,
  openPrice = 42.6,
  openTime = "09:30",
  name = "remocn",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: IpoOpenProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // ---- symbol layout -------------------------------------------------------
  const letters = Array.from(symbol.toUpperCase());
  const symEm =
    letters.reduce((w, ch) => w + (SCHIBSTED[ch] ?? 0.68) + SYM_TRACK, 0) -
    SYM_TRACK;
  const S = Math.min(H * 0.43, (W * 0.74) / symEm);
  const symBase = H * 0.505;
  const symX0 = (W - symEm * S) / 2;

  // ---- price layout ($dd.cc, digits on reels) -------------------------------
  const startC = Math.round(ipoPrice * 100);
  const endC = Math.round(openPrice * 100);
  const intDigits = Math.max(1, String(Math.floor(endC / 100)).length);
  const places: number[] = [];
  for (let i = intDigits - 1; i >= 0; i--) places.push(10 ** (i + 2));
  places.push(10, 1);
  const P = H * 0.19;
  const priceBase = H * 0.815;
  const glyphs: Array<{ kind: "$" | "." | number; x: number; w: number }> = [];
  {
    let x = 0;
    glyphs.push({ kind: "$", x, w: DOLLAR });
    x += DOLLAR + PRICE_TRACK;
    places.forEach((pl, i) => {
      if (i === intDigits) {
        glyphs.push({ kind: ".", x, w: DOT });
        x += DOT + PRICE_TRACK;
      }
      glyphs.push({ kind: pl, x, w: DIGIT });
      x += DIGIT + PRICE_TRACK;
    });
  }
  const last = glyphs[glyphs.length - 1];
  const priceW = (last.x + last.w) * P;
  const chipH = 0.64 * P;
  const chipFont = 0.33 * P;
  const chipW = chipFont * 5.5;
  const gap = 0.22 * P;
  const rowX0 = (W - (priceW + gap + chipW)) / 2;
  const chipX = rowX0 + priceW + gap;
  const chipY = priceBase - (CAP * P) / 2 - chipH / 2;
  const ruleY = H * 0.588;

  // ---- timing ----------------------------------------------------------------
  const race = EASE_RACE(Math.max(0, Math.min(1, (t - RACE_AT) / RACE_LEN)));
  const raceAt = (tt: number) =>
    startC +
    (endC - startC) *
      EASE_RACE(Math.max(0, Math.min(1, (tt - RACE_AT) / RACE_LEN)));
  const cents = raceAt(t);
  const pct = (cents / startC - 1) * 100;
  const flash = t >= BELL && t < BELL + 2;
  const opened = t >= BELL;
  const landed = t >= LAND;
  const rise = (a: number, len = 18) =>
    interpolate(t, [a, a + len], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const kick = interpolate(t, [BELL, BELL + 14], [1.045, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const shock = interpolate(t, [BELL, BELL + 16], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
  });
  const shock2 = interpolate(t, [BELL + 3, BELL + 22], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
  });
  const pop = interpolate(t, [LAND - 2, LAND + 5, LAND + 14], [0, 1.09, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const fill = interpolate(t, [LAND - 2, LAND + 4], [0, 1], CLAMP);
  const groundK =
    0.12 * rise(BELL, 10) +
    0.7 * race +
    0.18 * interpolate(t, [LAND - 4, LAND + 16], [0, 1], CLAMP);

  // corner clock: one second before the bell, ticking after it
  const secs = Math.floor((t - BELL) / 30);
  const [hh, mm] = openTime.split(":").map((n) => Number(n));
  const clockMin = hh * 60 + mm + Math.floor(secs / 60);
  const clock = `${String(Math.floor(clockMin / 60) % 24).padStart(2, "0")}:${String(((clockMin % 60) + 60) % 60).padStart(2, "0")}:${String(((secs % 60) + 60) % 60).padStart(2, "0")}`;

  // ---- reels ------------------------------------------------------------------
  const step = (CAP + 0.3) * P;
  const digitOf = (n: number) => ((Math.floor(n) % 10) + 10) % 10;
  const reels = glyphs.map((g, i) => {
    const gx = rowX0 + (g.x + g.w / 2) * P;
    const enter = rise(14 + i * 2, 16);
    if (g.kind === "$" || g.kind === ".") {
      return (
        <text
          key={`m${g.kind}`}
          x={gx}
          y={priceBase + (1 - enter) * 0.3 * P}
          opacity={enter}
        >
          {g.kind}
        </text>
      );
    }
    const pl = g.kind;
    const pos = columnPos(cents, pl);
    const v = Math.abs(
      columnPos(raceAt(t + 0.5), pl) - columnPos(raceAt(t - 0.5), pl),
    );
    const base = Math.floor(pos);
    const f = pos - base;
    const sd = Math.min(0.09, v * 0.06) * P;
    // a leading zero stays hidden until the race carries into it
    const lead = pl >= 1000 && cents < pl;
    return (
      <g
        key={`d${pl}`}
        opacity={enter * (lead ? 0 : 1)}
        transform={`translate(0 ${(1 - enter) * 0.3 * P - f * step})`}
      >
        <g filter={sd > 0.2 ? `url(#${uid}b${pl})` : undefined}>
          <text x={gx} y={priceBase}>
            {digitOf(base)}
          </text>
          {f > 0.001 ? (
            <text x={gx} y={priceBase + step}>
              {digitOf(base + 1)}
            </text>
          ) : null}
        </g>
        <filter
          id={`${uid}b${pl}`}
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

  const shockW = shock * W * 0.62;
  const shockT = (1 - shock) ** 1.5 * 14 * u + 1.5 * u;
  const ruleSettle = interpolate(t, [BELL + 10, BELL + 26], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      {/* sunrise ground, climbing with the opening print */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: p.ground(groundK),
        }}
      />

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${symbol} opens at ${fmt(endC)}, IPO price ${fmt(startC)}`}
      >
        <defs>
          <linearGradient id={`${uid}feather`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.16" stopColor="#fff" />
            <stop offset="0.84" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask
            id={`${uid}win`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect
              x={0}
              y={priceBase - CAP * P - 0.16 * P}
              width={W}
              height={CAP * P + 0.32 * P}
              fill={`url(#${uid}feather)`}
            />
          </mask>
          <clipPath id={`${uid}symWin`}>
            <rect x={0} y={0} width={W} height={symBase + 0.02 * S} />
          </clipPath>
          <linearGradient id={`${uid}shock`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={p.fg} stopOpacity={0} />
            <stop offset="0.35" stopColor={p.fg} stopOpacity={0.5} />
            <stop offset="0.5" stopColor={p.fg} />
            <stop offset="0.65" stopColor={p.fg} stopOpacity={0.5} />
            <stop offset="1" stopColor={p.fg} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* the symbol rises out of its baseline, kicks on the bell */}
        <g
          clipPath={`url(#${uid}symWin)`}
          transform={`translate(${W / 2} ${symBase}) scale(${kick}) translate(${-W / 2} ${-symBase})`}
        >
          <g
            fontFamily={sans}
            fontWeight={500}
            fontSize={S}
            fill={p.fg}
            textAnchor="start"
          >
            {letters.map((ch, i) => {
              const x =
                symX0 +
                letters
                  .slice(0, i)
                  .reduce((w, c) => w + (SCHIBSTED[c] ?? 0.68) + SYM_TRACK, 0) *
                  S;
              const k = rise(4 + i * 3, 16);
              return (
                <text
                  key={`${ch}${x}`}
                  x={x}
                  y={symBase + (1 - k) * CAP * S * 1.05}
                >
                  {ch}
                </text>
              );
            })}
          </g>
        </g>

        {/* shockwave out of the centre, settling into a hairline rule */}
        {opened ? (
          <>
            <rect
              x={W / 2 - shockW}
              y={ruleY - shockT / 2}
              width={shockW * 2}
              height={shockT}
              fill={`url(#${uid}shock)`}
              opacity={1 - ruleSettle * 0.8}
            />
            <rect
              x={W / 2 - shock2 * W * 0.75}
              y={ruleY - 0.75 * u}
              width={shock2 * W * 1.5}
              height={1.5 * u}
              fill={`url(#${uid}shock)`}
              opacity={(1 - shock2) * 0.7}
            />
          </>
        ) : null}
        <rect
          x={W * 0.08}
          y={ruleY - 0.5 * u}
          width={W * 0.84}
          height={1 * u}
          fill={p.hair}
          opacity={ruleSettle}
        />

        {/* the price on reels */}
        <g
          fontFamily={sans}
          fontWeight={500}
          fontSize={P}
          fill={p.fg}
          textAnchor="middle"
          letterSpacing="0"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <g mask={`url(#${uid}win)`}>
            {reels.filter((_, i) => typeof glyphs[i].kind === "number")}
          </g>
          {reels.filter((_, i) => typeof glyphs[i].kind !== "number")}
        </g>
      </svg>

      {/* chip: IPO tag before the bell, live move during the race, gradient on the land */}
      <div
        style={{
          position: "absolute",
          left: chipX,
          top: chipY,
          width: chipW,
          height: chipH,
          borderRadius: chipH / 2,
          boxShadow: `inset 0 0 0 ${1.5 * u}px ${p.hair}`,
          opacity: rise(18, 16),
          transform: `translateY(${(1 - rise(18, 16)) * 0.2 * P}px) scale(${landed || t >= LAND - 2 ? pop : 1})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: p.chip,
            opacity: fill,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.32 * chipFont,
            color: fill > 0.5 ? p.chipInk : p.fg,
            lineHeight: 1,
          }}
        >
          {opened ? (
            <>
              <svg
                width={0.62 * chipFont}
                height={0.54 * chipFont}
                viewBox="0 0 10 8.66"
                aria-hidden
                style={{ display: "block" }}
              >
                <path
                  d="M5 0 L10 8.66 L0 8.66 Z"
                  fill={fill > 0.5 ? p.chipInk : accent}
                />
              </svg>
              <span
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: chipFont,
                  letterSpacing: "-0.01em",
                }}
              >
                {/* tabular digits so the live move doesn't wobble, a
                    proportional point so it doesn't gape */}
                {Array.from(`+${pct.toFixed(1)}%`).map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      fontVariantNumeric:
                        ch === "." ? "normal" : "tabular-nums",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </>
          ) : (
            <span
              style={{
                fontFamily: mono,
                fontWeight: 400,
                fontSize: chipFont * 0.6,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: p.muted,
              }}
            >
              IPO price
            </span>
          )}
        </div>
      </div>

      {/* label above the symbol */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.115,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12 * u,
          fontFamily: mono,
          fontWeight: 500,
          fontSize: 18 * u,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: p.fg,
          opacity: rise(0, 14),
          transform: `translateY(${(1 - rise(0, 14)) * 8 * u}px)`,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            width: 9 * u,
            height: 9 * u,
            borderRadius: 99,
            background: accent,
          }}
        />
        {label}
      </div>

      {/* corner bug: logo left, market clock right */}
      <div
        style={{
          position: "absolute",
          left: W * 0.045,
          top: H * 0.06,
          opacity: rise(-6, 14),
        }}
      >
        {logo ??
          (name.trim().toLowerCase() === "remocn" ? (
            <RemocnLogo fontSize={24 * u} color={p.fg} />
          ) : (
            <span
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 24 * u,
                letterSpacing: "-0.02em",
                color: p.fg,
              }}
            >
              {name}
            </span>
          ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: W * 0.045,
          top: H * 0.06 + 3 * u,
          fontFamily: mono,
          fontWeight: 400,
          fontSize: 17 * u,
          letterSpacing: "0.06em",
          color: opened ? p.fg : p.muted,
          fontVariantNumeric: "tabular-nums",
          opacity: rise(-6, 14),
          lineHeight: 1,
        }}
      >
        {clock}
      </div>

      {/* the bell: two inverted frames */}
      {flash ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#FFFFFF",
            mixBlendMode: "difference",
            opacity: 1,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
