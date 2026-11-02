"use client";

import { loadFont } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
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

export interface DropTimerProps {
  /** Small line over the countdown. */
  label?: string;
  /** Seconds on the clock when the shot opens; it counts down to zero. */
  from?: number;
  /** Frames per counted second (a film second, not a real one). */
  tick?: number;
  /** Unit captions under the three digit pairs. */
  units?: [string, string, string];
  /** What the clock smashes into at zero, set full-bleed. */
  live?: string;
  /** Brand over the payoff; "remocn" renders the real logo. */
  name?: string;
  /** Replaces the logo / name over the payoff. */
  logo?: React.ReactNode;
  /** Line under the payoff. */
  url?: string;
  /** The small "live" dot beside the url. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Big Shoulders 500 (fontTools, wght 500): cap 0.8; advances in em.
// Digits sit in fixed 0.46em cells (true tabular), colons in 0.24em cells.
const CAP = 0.8;
const CELL = 0.46;
const COLON = 0.24;
const ADV: Record<string, number> = {
  L: 0.359,
  I: 0.2175,
  V: 0.4405,
  E: 0.3845,
  N: 0.541,
  O: 0.457,
  W: 0.7235,
  " ": 0.212,
  D: 0.453,
  R: 0.4395,
  P: 0.4295,
  S: 0.438,
};
const LSB: Record<string, number> = { L: 0.056, D: 0.056, I: 0.056 };
const RSB: Record<string, number> = { W: 0.0295, N: 0.056, E: 0.0275 };
const TRACK_LIVE = -0.01;

function inkWidth(s: string, track: number) {
  const chars = Array.from(s);
  let w = 0;
  for (const ch of chars) w += ADV[ch] ?? 0.38;
  w += track * Math.max(0, chars.length - 1);
  const first = chars[0] ?? " ";
  const last = chars[chars.length - 1] ?? " ";
  return w - (LSB[first] ?? 0.04) - (RSB[last] ?? 0.04);
}

// Beat sheet (30fps, speed 1, from 5, tick 14):
//   0–6    the clock punches in at 00:00:05 from 1.3× and a blur
//   6–76   every 14 frames: a one-frame inverted flash, a hard cut to the next
//          digit and a new ground colour from the palette, a bump and a shake
//  76–84   00:00:00 holds on black, the digits lit in the gradient
//  84–90   smash: the clock rushes past the lens, LIVE NOW slams in full-bleed
//  92–     logo and url rise; poster hold, the gradient drifts
const START = 6;
const ZERO_HOLD = 8;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const RUSH = Easing.bezier(0.6, 0, 0.9, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Ground {
  bg: string;
  ink: string;
}

// Dark: gradients.sh "fluted" (bg #050507): #1d2a8f #2f7bff #ff7a3d #ffe2c4.
// Light: gradients.sh "ribbon" (bg #ffffff): #ff3d9a #ff8a3d #ffc83d #7a5cff.
const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    flash: "#F3F2EF",
    flashInk: "#0A0A0B",
    grounds: [
      {
        bg: "radial-gradient(70% 90% at 80% 10%, #1d2a8f 0%, transparent 70%), #0A0A0B",
        ink: "#F3F2EF",
      },
      {
        bg: "radial-gradient(80% 110% at 18% 0%, #8fb6ff 0%, transparent 62%), #2f7bff",
        ink: "#F3F2EF",
      },
      {
        bg: "radial-gradient(80% 110% at 85% 100%, #ffe2c4 0%, transparent 62%), #ff7a3d",
        ink: "#0A0A0B",
      },
      {
        bg: "radial-gradient(90% 110% at 10% 100%, #ffb98a 0%, transparent 60%), #ffe2c4",
        ink: "#0A0A0B",
      },
      {
        bg: "radial-gradient(80% 110% at 82% 0%, #2f7bff 0%, transparent 64%), #1d2a8f",
        ink: "#F3F2EF",
      },
    ] as Ground[],
    zero: "#050507",
    hero: ["#ffe2c4", "#ff7a3d", "#2f7bff"],
    haze: "#1d2a8f",
    hazeHi: "#2f7bff",
    hazeAlpha: 0.9,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    flash: "#121214",
    flashInk: "#F5F4F0",
    grounds: [
      {
        bg: "radial-gradient(70% 90% at 80% 10%, #ffe9f3 0%, transparent 70%), #F5F4F0",
        ink: "#121214",
      },
      {
        bg: "radial-gradient(80% 110% at 18% 0%, #b8a6ff 0%, transparent 62%), #7a5cff",
        ink: "#F5F4F0",
      },
      {
        bg: "radial-gradient(80% 110% at 85% 100%, #ff8a3d 0%, transparent 62%), #ff3d9a",
        ink: "#121214",
      },
      {
        bg: "radial-gradient(90% 110% at 10% 100%, #ff8a3d 0%, transparent 60%), #ffc83d",
        ink: "#121214",
      },
      {
        bg: "radial-gradient(80% 110% at 82% 0%, #ffc83d 0%, transparent 64%), #ff8a3d",
        ink: "#121214",
      },
    ] as Ground[],
    zero: "#F5F4F0",
    hero: ["#7a5cff", "#ff3d9a", "#ff8a3d"],
    haze: "#ff3d9a",
    hazeHi: "#ffc83d",
    hazeAlpha: 0.22,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 2 frames, eases back over 8. */
function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

/** A decaying shake that dies in 7 frames. Deterministic. */
function shake(d: number, amp: number, seed: number) {
  if (d < 0 || d > 7) return { x: 0, y: 0 };
  const k = (1 - d / 7) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.7 + seed),
    y: amp * 0.7 * k * Math.cos(d * 3.3 + seed * 1.7),
  };
}

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export function DropTimer({
  label = "DROPS IN",
  from = 5,
  tick = 14,
  units = ["HRS", "MIN", "SEC"],
  live = "LIVE NOW",
  name = "remocn",
  logo,
  url = "remocn.dev",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DropTimerProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const total = Math.max(1, Math.round(from));
  const zeroAt = START + total * tick;
  const smashAt = zeroAt + ZERO_HOLD;

  // ── Clock state ──
  const elapsed = Math.max(0, Math.floor((t - START) / tick));
  const left = Math.max(0, total - elapsed);
  const tickIdx = Math.min(total, elapsed);
  const lastTick = START + tickIdx * tick;
  const sinceTick = t - lastTick;
  const isFlash = t >= START + tick && sinceTick >= 0 && sinceTick < 1;
  const atZero = left === 0;
  const ground = c.grounds[tickIdx % c.grounds.length];

  const hh = Math.floor(left / 3600);
  const mm = Math.floor((left % 3600) / 60);
  const ss = left % 60;
  const clock = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;

  // ── Clock layout: fixed cells, fitted to the frame width ──
  const cells = Array.from(clock).map((ch) => (ch === ":" ? COLON : CELL));
  const clockEm = cells.reduce((a, b) => a + b, 0);
  const fs = Math.min((0.9 * W) / clockEm, (0.56 * H) / CAP);
  const clockW = clockEm * fs;
  const clockX = (W - clockW) / 2;
  const capH = CAP * fs;
  const baseline = H * 0.5 + capH * 0.5 + 0.02 * H;
  let cx = clockX;
  const glyphs = Array.from(clock).map((ch, i) => {
    const mid = cx + (cells[i] * fs) / 2;
    cx += cells[i] * fs;
    return { ch, mid, i };
  });
  const pairMid = [0, 3, 6].map((i) => (glyphs[i].mid + glyphs[i + 1].mid) / 2);

  // ── Camera ──
  const enter = SLAM(ramp(t, 0, START));
  const enterScale = 1.3 - 0.3 * enter;
  const enterBlur = (1 - enter) * 16;
  let bump = 0;
  let sx = 0;
  let sy = 0;
  for (let k = 1; k <= total; k++) {
    const d = t - (START + k * tick);
    if (d < -1 || d > 12) continue;
    // hits grow as the clock runs out
    const g = 0.7 + (0.6 * k) / total;
    bump = Math.max(bump, g * kick(d));
    const s = shake(d, 6 * u * g, k * 1.3);
    sx += s.x;
    sy += s.y;
  }
  const smashD = t - smashAt;
  bump = Math.max(bump, 1.4 * kick(smashD - 4));
  const s3 = shake(smashD - 4, 12 * u, 4.4);
  sx += s3.x;
  sy += s3.y;
  const camScale = 1 + 0.04 * bump;

  // ── Smash ──
  const rush = RUSH(ramp(t, smashAt, 5));
  const clockScale = enterScale * (1 + 1.8 * rush);
  const clockBlur = enterBlur + 26 * rush;
  const clockOpacity = Math.min(ramp(t, 0, 2), 1 - ramp(t, smashAt + 2, 3));
  const liveP = SLAM(ramp(t, smashAt + 1, 7));
  const liveScale = 1.7 - 0.7 * liveP;
  const liveBlur = (1 - liveP) * 18;
  const liveOpacity = ramp(t, smashAt + 1, 2);
  const flashSmash = interpolate(
    t,
    [smashAt, smashAt + 1, smashAt + 5],
    [0, 1, 0],
    CLAMP,
  );
  const after = t >= smashAt + 1;
  const rise = (a: number) => SLAM(ramp(t, a, 16));
  const drift = ramp(t, smashAt, 70);
  const haze = SLAM(ramp(t, smashAt + 1, 24));

  // ── Payoff layout ──
  const liveEm = inkWidth(live.toUpperCase(), TRACK_LIVE);
  const liveFs = Math.min((0.9 * W) / liveEm, (0.5 * H) / CAP);
  const liveCap = CAP * liveFs;
  const liveBase = H * 0.535 + liveCap * 0.5;

  const bgNow = after
    ? c.zero
    : isFlash
      ? c.flash
      : atZero
        ? c.zero
        : ground.bg;
  const digitInk = isFlash ? c.flashInk : ground.ink;
  const labelInk = isFlash ? c.flashInk : atZero ? c.ink : ground.ink;

  const heroGrad = `${uid}hero`;
  const zeroGrad = `${uid}zero`;

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: bgNow }} />
      {/* Payoff haze rising from the bottom. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: after ? haze * c.hazeAlpha : 0,
          background: [
            `radial-gradient(60% 50% at ${44 + 10 * drift}% ${122 - 18 * haze}%, ${c.hazeHi} 0%, transparent 70%)`,
            `radial-gradient(95% 70% at 50% ${130 - 16 * haze}%, ${c.haze} 0%, transparent 76%)`,
          ].join(", "),
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${sx}px, ${sy}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          role="img"
          aria-label={after ? `${live} — ${name} ${url}` : `${label} ${clock}`}
        >
          <defs>
            <linearGradient
              id={zeroGrad}
              gradientUnits="userSpaceOnUse"
              x1={clockX}
              y1={baseline - capH}
              x2={clockX + clockW}
              y2={baseline}
            >
              <stop offset="0" stopColor={c.hero[2]} />
              <stop offset="0.55" stopColor={c.hero[1]} />
              <stop offset="1" stopColor={c.hero[0]} />
            </linearGradient>
            <linearGradient
              id={heroGrad}
              gradientUnits="userSpaceOnUse"
              x1={W * (0.02 + 0.06 * drift)}
              y1={liveBase}
              x2={W * (0.92 + 0.06 * drift)}
              y2={liveBase - liveCap}
            >
              <stop offset="0" stopColor={c.hero[1]} />
              <stop offset="0.62" stopColor={c.hero[0]} />
              <stop offset="1" stopColor={c.hero[0]} />
            </linearGradient>
          </defs>

          {/* The clock. */}
          {t < smashAt + 6 ? (
            <g
              style={{
                transform: `scale(${clockScale})`,
                transformOrigin: `${W / 2}px ${baseline - capH / 2}px`,
                filter:
                  clockBlur > 0.2 ? `blur(${clockBlur * u}px)` : undefined,
              }}
              opacity={clockOpacity}
            >
              <text
                x={W / 2}
                y={baseline - capH - 0.075 * H}
                textAnchor="middle"
                fontFamily={display}
                fontWeight={500}
                fontSize={0.068 * H}
                fill={labelInk}
                style={{ letterSpacing: "0.08em" }}
              >
                {label}
              </text>
              <g
                fontFamily={display}
                fontWeight={500}
                fontSize={fs}
                textAnchor="middle"
                fill={atZero && !isFlash ? `url(#${zeroGrad})` : digitInk}
              >
                {glyphs.map((g) => (
                  <text
                    key={g.i}
                    x={g.mid}
                    y={g.ch === ":" ? baseline - 0.035 * fs : baseline}
                  >
                    {g.ch}
                  </text>
                ))}
              </g>
              <g
                fontFamily={mono}
                fontWeight={400}
                fontSize={0.03 * H}
                textAnchor="middle"
                fill={labelInk}
                opacity={0.8}
                style={{ letterSpacing: "0.14em" }}
              >
                {units.map((un, i) => (
                  <text key={un} x={pairMid[i]} y={baseline + 0.075 * H}>
                    {un}
                  </text>
                ))}
              </g>
            </g>
          ) : null}

          {/* LIVE NOW, full-bleed. */}
          {after ? (
            <text
              x={W / 2}
              y={liveBase}
              textAnchor="middle"
              fontFamily={display}
              fontWeight={500}
              fontSize={liveFs}
              fill={`url(#${heroGrad})`}
              opacity={liveOpacity}
              style={{
                letterSpacing: `${TRACK_LIVE}em`,
                transform: `scale(${liveScale})`,
                transformOrigin: `${W / 2}px ${liveBase - liveCap / 2}px`,
                filter: liveBlur > 0.2 ? `blur(${liveBlur * u}px)` : undefined,
              }}
            >
              {live.toUpperCase()}
            </text>
          ) : null}
        </svg>

        {/* Brand over the payoff. */}
        {after ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: liveBase - liveCap - 0.135 * H,
              display: "flex",
              justifyContent: "center",
              opacity: rise(smashAt + 7),
              transform: `translateY(${(1 - rise(smashAt + 7)) * 14 * u}px)`,
            }}
          >
            {logo ??
              (name.trim().toLowerCase() === "remocn" ? (
                <RemocnLogo fontSize={0.064 * H} color={c.ink} />
              ) : (
                <span
                  style={{
                    fontFamily: display,
                    fontWeight: 500,
                    fontSize: 0.064 * H,
                    color: c.ink,
                    lineHeight: 1,
                  }}
                >
                  {name}
                </span>
              ))}
          </div>
        ) : null}

        {/* Url under the payoff. */}
        {after ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: liveBase + 0.075 * H,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12 * u,
              fontFamily: mono,
              fontWeight: 400,
              fontSize: 0.032 * H,
              letterSpacing: "0.04em",
              color: c.ink,
              lineHeight: 1,
              opacity: rise(smashAt + 11),
              transform: `translateY(${(1 - rise(smashAt + 11)) * 14 * u}px)`,
            }}
          >
            <div
              style={{
                width: 0.016 * H,
                height: 0.016 * H,
                borderRadius: 99,
                background: accent,
                opacity:
                  0.8 + 0.2 * Math.cos(((t - smashAt) / 22) * Math.PI * 2),
              }}
            />
            {url}
          </div>
        ) : null}
      </div>

      {/* The smash flash. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.flash,
          opacity: flashSmash,
        }}
      />
    </AbsoluteFill>
  );
}
