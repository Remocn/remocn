"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Unbounded";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: geist } = loadGeist("normal", {
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

export interface GotEmProps {
  /** The suspense line; an animated ellipsis follows it. */
  pending?: string;
  /** The payoff, exploded huge. Use a real apostrophe (’). */
  title?: string;
  /** Subline under the payoff. "remocn" inside it renders the real logo. */
  subline?: string;
  /** Replaces the logo inside the subline. */
  logo?: React.ReactNode;
  /** Frames everything stops dead before the payoff explodes. */
  pause?: number;
  /** Ticks on the ring, and rays after the boom. */
  rays?: number;
  /** Kept for the shared draft API; the rays take the "halo" gradient. */
  accent?: string;
  /** Text and tick color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the payoff. Load it yourself; Unbounded by default. Its size is fitted to Unbounded. */
  fontFamily?: string;
  /** Size of the ring and copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
}

// Unbounded 500 (fontTools, wght 500): cap 0.75; G .955 O .956 T .801
// space .256 ’ .277 E .78 M 1.206. Geist 400: "…" 0.571em, dots end at
// 0.157 / 0.342 / 0.527em.
const CAP = 0.75;
const ADV: Record<string, number> = {
  G: 0.955,
  O: 0.956,
  T: 0.801,
  " ": 0.256,
  "’": 0.277,
  "'": 0.252,
  E: 0.78,
  M: 1.206,
};
const TRACK = -0.03;
const DOTS = [0, 0.2, 0.385, 0.571];

// Beat sheet (30fps, speed 1):
//   0–10   "Entry submitted" rises; a ring of 40 ticks draws on around it
//  10–48   a spinner head sweeps the ring; the ellipsis counts 1-2-3
//  48–62   the pause: everything stops dead, the ring settles, a slow creep
//  62–70   GOT ’EM explodes from 1.6× with a flash and a zoom-punch; the
//          ticks shoot out into full-frame gradient rays
//  74–     subline with the logo rises; poster hold, the rays turn slowly
const PAUSE_AT = 48;
const BOOM_AT = 62;
const RAYS = 40;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "halo" (bg #030306): #fff4ec #ffb36b #e2457a #3d4dff,
// laid out as rings: cool at the core, warm at the edge (reversed on light).
const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#8A8990",
    rays: ["#3d4dff", "#e2457a", "#ffb36b", "#fff4ec"],
    rayAlpha: 0.95,
    flash: "#F3F2EF",
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#77766F",
    rays: ["#ffb36b", "#e2457a", "#3d4dff", "#3d4dff"],
    rayAlpha: 0.9,
    flash: "#FFFFFF",
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

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function GotEm({
  pending = "Entry submitted",
  title = "GOT ’EM",
  subline = "You got remocn 2.0.",
  logo,
  pause = BOOM_AT - PAUSE_AT,
  rays: rayCount = RAYS,
  ink,
  background,
  fontFamily = display,
  scale = 1,
  delay = 0,
  theme = "dark",
  speed = 1,
}: GotEmProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.stage);
  // The subline's pill cuts the rays behind it, so it stays opaque.
  const pill =
    background === undefined || background === "transparent"
      ? c.stage
      : background;
  const boomAt = PAUSE_AT + pause;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const cx = W / 2;
  const cy = H * 0.47;

  // ── Suspense ──
  const boomed = t >= boomAt;
  const intro = SLAM(ramp(t, 0, 12));
  const paused = t >= PAUSE_AT;
  const dots = paused
    ? 3
    : t < 8
      ? 0
      : Math.min(3, Math.floor((t - 8) / 6) % 4);
  const head = (Math.min(t, PAUSE_AT) - 6) * 13; // degrees, clockwise
  const settle = ramp(t, PAUSE_AT, 6);
  const creep = interpolate(t, [PAUSE_AT, boomAt], [1, 1.035], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });

  // ── Boom ──
  const d = t - boomAt;
  const zoom = SLAM(ramp(t, boomAt, 8));
  const camScale = boomed ? 1.16 - 0.16 * zoom + 0.03 * kick(d - 5) : creep;
  const sh = shake(d - 5, 11 * u, 2.2);
  // The camera eases, kicks and shakes; it moves while any of that does.
  const camAt = (f: number) => {
    const dd = f - boomAt;
    const s = shake(dd - 5, 11 * u, 2.2);
    const k =
      f >= boomAt
        ? 1.16 - 0.16 * SLAM(ramp(f, boomAt, 8)) + 0.03 * kick(dd - 5)
        : interpolate(f, [PAUSE_AT, boomAt], [1, 1.035], {
            ...CLAMP,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          });
    return Math.abs(s.x) + Math.abs(s.y) + k * W;
  };
  const camMoving =
    Math.abs(camAt(t + speed) - camAt(t)) > 1e-3 ||
    Math.abs(camAt(t) - camAt(t - speed)) > 1e-3;
  const titleP = SLAM(ramp(t, boomAt, 6));
  const titleScale = 1.6 - 0.6 * titleP;
  const titleBlur = (1 - titleP) * 18;
  const flash = interpolate(
    t,
    [boomAt, boomAt + 1, boomAt + 5],
    [0, 0.7, 0],
    CLAMP,
  );
  const spin = boomed ? d * 0.12 : 0;
  const drift = ramp(t, boomAt, 70);
  const rise = SLAM(ramp(t, boomAt + 12, 16));

  // ── Rays: ticks on a ring, then full-frame bars ──
  const R0 = 0.29 * H;
  const tickLen = 0.04 * H;
  const reach = Math.hypot(W, H) * 0.62;
  const rays = Array.from({ length: rayCount }, (_, i) => {
    const a0 = (i / rayCount) * 360;
    const drawn = SLAM(ramp(t, (i / rayCount) * 10, 6));
    // spinner brightness: a tail behind the head
    const behind = (((head - a0) % 360) + 360) % 360;
    const lit = Math.max(0, 1 - behind / 150) ** 1.6;
    const glow = (0.22 + 0.78 * lit) * (1 - settle) + 0.4 * settle;
    const shoot = SLAM(ramp(t, boomAt + (i % 3), 9));
    const inner = R0 + (0.15 * H - R0) * shoot;
    const outer =
      R0 + tickLen + (reach * (0.86 + 0.14 * (i % 2)) - R0 - tickLen) * shoot;
    const w0 = 0.007 * H;
    const w1 = boomed ? w0 + (0.06 * H - w0) * shoot : w0;
    return { a: a0 + spin, drawn, glow, inner, outer, w0, w1 };
  });

  const titleChars = Array.from(title);
  const titleEm =
    titleChars.reduce((w, ch) => w + (ADV[ch] ?? 0.85), 0) +
    TRACK * (titleChars.length - 1) -
    0.041 -
    0.076;
  const titleFs = Math.min((0.92 * W) / titleEm, (0.4 * H) / CAP);
  const titleBase = cy + (CAP * titleFs) / 2;

  const pendFs = 0.058 * H;
  const parts = subline.split(/(remocn)/i);
  const subFs = 0.05 * H;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${boomed ? sh.x : 0}px, ${boomed ? sh.y : 0}px) scale(${camScale})${glide(camMoving)}`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            role="img"
            aria-label={boomed ? `${title} ${subline}` : `${pending}…`}
          >
            <defs>
              <radialGradient
                id={`${uid}rays`}
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={reach * (0.95 + 0.08 * drift)}
              >
                <stop offset="0.12" stopColor={c.rays[0]} />
                <stop offset={0.42 - 0.04 * drift} stopColor={c.rays[1]} />
                <stop offset={0.7 - 0.04 * drift} stopColor={c.rays[2]} />
                <stop offset="1" stopColor={c.rays[3]} />
              </radialGradient>
            </defs>

            <g
              fill={boomed ? `url(#${uid}rays)` : fg}
              opacity={boomed ? c.rayAlpha : 1}
            >
              {rays.map((r) => {
                const rad = ((r.a - 90) * Math.PI) / 180;
                const nx = Math.cos(rad);
                const ny = Math.sin(rad);
                const px = -ny;
                const py = nx;
                const len = r.inner + (r.outer - r.inner) * r.drawn;
                const pts = [
                  [r.inner, -r.w0 / 2],
                  [len, -r.w1 / 2],
                  [len, r.w1 / 2],
                  [r.inner, r.w0 / 2],
                ]
                  .map(
                    ([along, across]) =>
                      `${(cx + nx * along + px * across).toFixed(2)},${(cy + ny * along + py * across).toFixed(2)}`,
                  )
                  .join(" ");
                return (
                  <polygon
                    key={r.a - spin}
                    points={pts}
                    opacity={boomed ? 1 : r.glow * r.drawn}
                  />
                );
              })}
            </g>

            {boomed ? (
              <text
                x={cx}
                y={titleBase}
                textAnchor="middle"
                fontFamily={fontFamily}
                fontWeight={500}
                fontSize={titleFs}
                fill={fg}
                style={{
                  letterSpacing: `${TRACK}em`,
                  transform: `scale(${titleScale})`,
                  transformOrigin: `${cx}px ${cy}px`,
                  filter:
                    titleBlur > 0.2 ? `blur(${titleBlur * u}px)` : undefined,
                }}
                opacity={ramp(t, boomAt, 2)}
              >
                {title}
              </text>
            ) : null}
          </svg>

          {/* Suspense line inside the ring. */}
          {!boomed ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: cy - pendFs * 0.62,
                display: "flex",
                justifyContent: "center",
                fontFamily: geist,
                fontWeight: 400,
                fontSize: pendFs,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: fg,
                opacity: intro,
                transform: `translateY(${(1 - intro) * 12 * u}px)${glide(intro > 0 && (1 - intro) * 12 * u > 1e-3 && !camMoving)}`,
                whiteSpace: "nowrap",
              }}
            >
              <span>{pending}</span>
              <span
                style={{
                  display: "inline-block",
                  width: `${DOTS[3]}em`,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: `${DOTS[dots]}em`,
                    overflow: "hidden",
                    verticalAlign: "top",
                  }}
                >
                  …
                </span>
              </span>
            </div>
          ) : null}

          {/* Subline with the logo. */}
          {boomed ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: titleBase + 0.06 * H,
                display: "flex",
                justifyContent: "center",
                fontFamily: geist,
                fontWeight: 400,
                fontSize: subFs,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: fg,
                whiteSpace: "pre",
                opacity: rise,
                transform: `translateY(${(1 - rise) * 14 * u}px)${glide(rise > 0 && (1 - rise) * 14 * u > 1e-3 && !camMoving)}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  background: pill,
                  borderRadius: 999,
                  padding: `${0.024 * H}px ${0.034 * H}px ${0.026 * H}px`,
                }}
              >
                {parts.map((p, i) =>
                  p.toLowerCase() === "remocn" ? (
                    <span
                      key={`${i}${p}`}
                      style={{ display: "inline-flex", alignItems: "baseline" }}
                    >
                      {logo ?? (
                        <RemocnLogo fontSize={subFs * 1.04} color={fg} />
                      )}
                    </span>
                  ) : (
                    <span key={`${i}${p}`}>{p}</span>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </div>
      </ScaleLayer>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.flash,
          opacity: flash,
        }}
      />
    </AbsoluteFill>
  );
}
