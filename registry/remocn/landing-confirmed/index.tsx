"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
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

export interface LandingConfirmedProps {
  /** Altitude the descent starts from, in metres. */
  from?: number;
  /** The slam at touchdown. Two words read best (one per line). */
  confirm?: string;
  /** The first resolve line, set big in caps. */
  title?: string;
  /** The second resolve line, set in a serif italic. */
  subtitle?: string;
  /** Replaces the remocn logo under the resolve. */
  logo?: React.ReactNode;
  /** Gauge marker and small marks. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1):
//   0–50    altitude counts down fast from 1,200 m; the gauge marker rides the
//           vertical scale down to the pad line; velocity bleeds off top right
//   50      0 m: hard stop with a kick, the pad line lights; holds 6 frames
//   56–57   two-frame "aurora" flash
//   58      TOUCHDOWN / CONFIRMED slams in; the aurora glows up from the pad
//   88–102  it shrinks up into a label; SHIPPED. slams, "Nailed the landing."
//           and the logo rise in under it
//   104–    poster hold
const DESCENT = 50;
const FLASH_AT = DESCENT + 6;
const SLAM_AT = FLASH_AT + 2;
const RESOLVE_AT = SLAM_AT + 30;

const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "aurora": bg #03050b, #a0f0c8 #3fb5a3 #5147b6 #b25c9c.
const AURORA = ["#A0F0C8", "#3FB5A3", "#5147B6", "#B25C9C"] as const;

const THEMES = {
  dark: {
    stage: "#03050B",
    ink: "#F1F4F2",
    dim: "#737A7A",
    faint: "#22282B",
    glowOp: 0.95,
    titleFill: `linear-gradient(100deg, #EFFFF7 0%, ${AURORA[0]} 38%, ${AURORA[1]} 70%, #9C93F0 100%)`,
    flash: `radial-gradient(120% 100% at 50% 100%, #F2FFF8 0%, ${AURORA[0]} 30%, ${AURORA[1]} 58%, ${AURORA[2]} 85%, ${AURORA[3]} 100%)`,
    grain: 0.06,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#111315",
    dim: "#7D7C77",
    faint: "#D8D6CF",
    glowOp: 0.6,
    titleFill: `linear-gradient(100deg, #1F7A6C 0%, ${AURORA[1]} 35%, ${AURORA[2]} 72%, ${AURORA[3]} 100%)`,
    flash: `radial-gradient(120% 100% at 50% 100%, #FFFFFF 0%, ${AURORA[0]} 40%, ${AURORA[1]} 75%, ${AURORA[2]} 100%)`,
    grain: 0.04,
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function kick(d: number, len: number) {
  if (d < 0 || d > len + 1) return 0;
  if (d < 1) return d;
  const k = 1 - (d - 1) / len;
  return k * k;
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
          seed={21}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LandingConfirmed({
  from = 1200,
  confirm = "Touchdown confirmed",
  title = "Shipped.",
  subtitle = "Nailed the landing.",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: LandingConfirmedProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  // ── Descent ───────────────────────────────────────────────────────────────
  // Fast off the top, still moving when it hits the pad: a hard stop.
  const p = ramp(t, 0, DESCENT);
  const frac = (1 - p) * (1 - 0.55 * p);
  const alt = Math.max(0, Math.round(from * frac));
  const landed = t >= DESCENT;
  const vel = landed ? 0 : 2 + 238 * (1 - p) ** 1.4;

  // ── Layout ────────────────────────────────────────────────────────────────
  const padY = H - 110 * u;
  const gaugeX = 118 * u;
  const gaugeTop = 92 * u;
  const markerY = interpolate(frac, [0, 1], [padY, gaugeTop]);
  const numFs = 290 * u;
  const numCX = W * 0.54;
  const numCY = H * 0.47;
  const margin = 56 * u;

  const intro = OUT(ramp(t, -4, 10));
  const stopKick = kick(t - DESCENT, 7);
  const flash = t >= FLASH_AT && t < FLASH_AT + 2;
  const glow = OUT(ramp(t, FLASH_AT, 18));

  const slam = OUT(ramp(t, SLAM_AT - 1, 8));
  const slamHit = kick(t - SLAM_AT - 4, 8);
  const resolve = MOVE(ramp(t, RESOLVE_AT, 14));
  const exit = Easing.bezier(0.55, 0, 1, 0.45)(ramp(t, RESOLVE_AT, 6));
  const labelIn = OUT(ramp(t, RESOLVE_AT + 6, 10));
  const titleIn = OUT(ramp(t, RESOLVE_AT + 5, 9));
  const titleHit = kick(t - RESOLVE_AT - 8, 8);
  const subIn = OUT(ramp(t, RESOLVE_AT + 9, 12));
  const logoIn = OUT(ramp(t, RESOLVE_AT + 14, 12));
  const descentOut = landed ? 1 - ramp(t, FLASH_AT, 1) : 1;
  const gaugeOut = 1 - ramp(t, SLAM_AT, 10);

  const words = confirm.split(" ");
  const confirmA = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const confirmB = words.slice(Math.ceil(words.length / 2)).join(" ");

  const drift = ramp(t, FLASH_AT, 120);
  const aurora = [
    ...AURORA.map(
      (col, i) =>
        `radial-gradient(42% 30% at ${14 + i * 24 + drift * (i % 2 ? -4 : 4)}% ${(padY / H) * 100 + 2}%, color-mix(in oklab, ${col} 70%, transparent) 0%, transparent 72%)`,
    ),
    `linear-gradient(180deg, transparent 55%, color-mix(in oklab, ${AURORA[1]} 18%, transparent) ${(padY / H) * 100}%, transparent 100%)`,
  ].join(", ");

  const small: React.CSSProperties = {
    fontFamily: sans,
    fontWeight: 400,
    fontSize: 15 * u,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: c.dim,
    whiteSpace: "nowrap",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  };

  const ticks: number[] = [];
  for (let m = 0; m <= from; m += from / 12) ticks.push(m);

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      {/* Aurora from the pad. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: aurora,
          opacity: c.glowOp * glow,
          transform: `translateY(${(1 - glow) * 80 * u}px)`,
        }}
      />
      <Grain opacity={c.grain} />

      {/* Gauge. */}
      <div style={{ opacity: intro * gaugeOut }}>
        <div
          style={{
            position: "absolute",
            left: gaugeX,
            top: gaugeTop,
            width: 2 * u,
            height: padY - gaugeTop,
            background: c.faint,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: gaugeX,
            top: markerY,
            width: 3 * u,
            height: padY - markerY,
            background: c.ink,
          }}
        />
        {ticks.map((m, i) => {
          const y = interpolate(m / from, [0, 1], [padY, gaugeTop]);
          const major = i % 3 === 0;
          return (
            <div key={m}>
              <div
                style={{
                  position: "absolute",
                  left: gaugeX - (major ? 14 : 8) * u,
                  top: y - 0.5 * u,
                  width: (major ? 14 : 8) * u,
                  height: 1.5 * u,
                  background: y >= markerY ? c.ink : c.dim,
                }}
              />
              {major ? (
                <div
                  style={{
                    ...small,
                    position: "absolute",
                    right: W - gaugeX + 24 * u,
                    top: y - 7 * u,
                    letterSpacing: "0.04em",
                  }}
                >
                  {Math.round(m)}
                </div>
              ) : null}
            </div>
          );
        })}
        {/* Marker. */}
        <div
          style={{
            position: "absolute",
            left: gaugeX + 10 * u,
            top: markerY - 1.5 * u,
            width: 40 * u,
            height: 3 * u,
            background: accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: gaugeX + 10 * u,
            top: markerY - 7 * u,
            width: 0,
            height: 0,
            borderTop: `${7 * u}px solid transparent`,
            borderBottom: `${7 * u}px solid transparent`,
            borderRight: `${10 * u}px solid ${accent}`,
            transform: `translateX(${-10 * u}px)`,
          }}
        />
      </div>

      {/* Pad line. */}
      <div
        style={{
          position: "absolute",
          left: margin,
          right: margin,
          top: padY,
          height: 2 * u,
          background: landed ? c.ink : c.faint,
          opacity: intro * (1 - resolve * 0.6),
        }}
      />

      {/* Telemetry. */}
      <div
        style={{
          ...small,
          position: "absolute",
          left: margin,
          top: margin - 6 * u,
          opacity: intro * gaugeOut,
        }}
      >
        Descent{" "}
        <span style={{ color: c.ink }}>
          {landed ? "Complete" : "Landing burn"}
        </span>
      </div>
      <div
        style={{
          ...small,
          position: "absolute",
          right: margin,
          top: margin - 6 * u,
          textAlign: "right",
          opacity: intro * gaugeOut,
        }}
      >
        Vel <span style={{ color: c.ink }}>{vel.toFixed(1)}</span> m/s
      </div>

      {/* Altitude. */}
      <div
        style={{
          position: "absolute",
          left: numCX,
          top: numCY,
          opacity: intro * descentOut,
          transform: `translate(-50%, -50%) translateY(${(1 - intro) * -40 * u}px) scale(${1 + 0.05 * stopKick})`,
        }}
      >
        <div
          style={{
            ...small,
            fontSize: 18 * u,
            marginBottom: 6 * u,
            marginLeft: 8 * u,
          }}
        >
          Altitude
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: numFs,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            color: c.ink,
            whiteSpace: "nowrap",
          }}
        >
          {alt.toLocaleString("en-US")}
          <span
            style={{
              fontSize: numFs * 0.3,
              letterSpacing: 0,
              marginLeft: 0.04 * numFs,
              color: c.dim,
              fontWeight: 400,
            }}
          >
            m
          </span>
        </div>
      </div>

      {/* TOUCHDOWN CONFIRMED: slams, then lifts away as the label fades in. */}
      {t >= SLAM_AT - 1 && exit < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H * 0.47,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 148 * u,
            letterSpacing: "-0.035em",
            lineHeight: 0.96,
            textTransform: "uppercase",
            color: c.ink,
            whiteSpace: "nowrap",
            transform: `translateY(-50%) translateY(${-exit * 110 * u}px) scale(${(1.22 - 0.22 * slam) * (1 + 0.02 * slamHit) * (1 - 0.12 * exit)})`,
            opacity: ramp(slam, 0, 0.2) * (1 - exit),
          }}
        >
          <span>{confirmA}</span>
          <span>{confirmB}</span>
        </div>
      ) : null}
      <div
        style={{
          ...small,
          position: "absolute",
          left: 0,
          right: 0,
          top: 86 * u,
          textAlign: "center",
          fontSize: 20 * u,
          letterSpacing: "0.18em",
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 14 * u}px)`,
        }}
      >
        {confirm}
      </div>

      {/* Resolve. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H * 0.45,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 196 * u,
            lineHeight: 1,
            letterSpacing: "-0.045em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            paddingRight: "0.02em",
            backgroundImage: c.titleFill,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            opacity: ramp(titleIn, 0, 0.25),
            transform: `scale(${(1.2 - 0.2 * titleIn) * (1 + 0.02 * titleHit)})`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 84 * u,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: c.ink,
            whiteSpace: "nowrap",
            marginTop: 4 * u,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 28 * u}px)`,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Logo on the pad. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: padY + 28 * u,
          display: "flex",
          justifyContent: "center",
          opacity: logoIn,
          transform: `translateY(${(1 - logoIn) * 18 * u}px)`,
        }}
      >
        {logo ?? <RemocnLogo fontSize={40 * u} color={c.ink} />}
      </div>

      {flash ? (
        <div style={{ position: "absolute", inset: 0, background: c.flash }} />
      ) : null}
    </AbsoluteFill>
  );
}
