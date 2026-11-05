"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Sora";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sora } = loadFont("normal", {
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

export interface SpeedTrapProps {
  /** Speed the readout locks on. */
  value?: number;
  /** Last year's mark, drawn as a line on the bar. The delta is computed from it. */
  previous?: number;
  /** Full scale of the bar. */
  max?: number;
  /** Unit after the number. */
  unit?: string;
  /** Banner that flashes when the readout locks. */
  banner?: string;
  /** Label on the previous mark. */
  previousLabel?: string;
  /** Text after the delta, e.g. "vs last year". */
  comparison?: string;
  /** Small label at the top left. */
  label?: string;
  /** The live dot next to the label. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 3, 30fps, speed 1):
//   0–8    the three-sector bar track snaps out from the left, labels up
//   3–42   the readout floods up to 348 and the gradient bar races with it
//          (fast off the line, tapering into the top end); each sector label
//          lights as the fill crosses into it; the frame pushes in a touch
//  42      lock: the number kicks, the bar flashes white for two frames
//  44–56   the "Top speed" banner wipes in white beside the number, turns
//          orange and blinks once, broadcast style
//  50–70   last year's mark drops onto the bar, the delta slice between the
//          two marks lights up, the comparison line slides out under it
//  70–     poster hold
const COUNT_AT = 3;
const LOCK_AT = 42;

const SLAM = Easing.bezier(0.22, 1, 0.36, 1);
const RUN = Easing.bezier(0.3, 0.55, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "fluted": bg #050507, #1d2a8f #2f7bff #ff7a3d #ffe2c4.
const FLUTED = ["#1D2A8F", "#2F7BFF", "#FF7A3D", "#FFE2C4"] as const;
const FILL = `linear-gradient(90deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 42%, ${FLUTED[2]} 84%, ${FLUTED[3]} 100%)`;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#86858C",
    track: "#1A1A1E",
    mark: "#F3F2EF",
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    track: "#E2E0D9",
    mark: "#121214",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** A short hit: up in 1 frame, eases back over `len`. */
function kick(d: number, len: number) {
  if (d < 0 || d > len + 1) return 0;
  if (d < 1) return d;
  const k = 1 - (d - 1) / len;
  return k * k;
}

export function SpeedTrap({
  value = 348,
  previous = 300,
  max = 360,
  unit = "km/h",
  banner = "Top speed",
  previousLabel = "2025",
  comparison = "vs last year",
  label = "Speed trap · Sector 3",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SpeedTrapProps) {
  // Starts three frames in, so frame 0 already shows the bar snapping out.
  const t = useCurrentFrame() * speed + 3;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  // ── Readout ───────────────────────────────────────────────────────────────
  const run = RUN(ramp(t, COUNT_AT, LOCK_AT - COUNT_AT));
  const locked = t >= LOCK_AT;
  const now = locked ? value : Math.floor(value * run);
  const digits = String(Math.max(0, Math.round(value))).length;
  const shown = String(now).padStart(digits, " ");
  const lockKick = kick(t - LOCK_AT, 9);
  const barFlash = locked && t < LOCK_AT + 2 ? 1 : 0;

  // ── Layout ────────────────────────────────────────────────────────────────
  const marginX = 76 * u;
  const barX = marginX;
  const barW = W - 2 * marginX;
  const barH = 64 * u;
  const barY = H * 0.69;
  const sectorGap = 6 * u;
  const sectors = 3;
  const sectorW = (barW - (sectors - 1) * sectorGap) / sectors;
  const xAt = (v: number) => barX + (Math.min(v, max) / max) * barW;

  const numFs = 290 * u;
  const cellW = 0.64 * numFs;
  const numTop = barY - 64 * u - numFs * 0.98;

  const trackIn = SLAM(ramp(t, 0, 8));
  const labelsIn = ramp(t, 3, 8);
  const fillFrac = (locked ? value : value * run) / max;

  const bannerIn = SLAM(ramp(t, LOCK_AT + 2, 6));
  const bannerBlink = t >= LOCK_AT + 11 && t < LOCK_AT + 14 ? 0 : 1;
  const markIn = SLAM(ramp(t, LOCK_AT + 8, 8));
  const deltaIn = SLAM(ramp(t, LOCK_AT + 13, 8));
  const compIn = SLAM(ramp(t, LOCK_AT + 16, 10));

  const push = 1 + 0.035 * Easing.bezier(0.65, 0, 0.35, 1)(ramp(t, 0, LOCK_AT));
  const scale = push * (1 + 0.012 * lockKick);

  const delta = Math.round(value - previous);
  const deltaText = `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} ${unit}`;

  const small: React.CSSProperties = {
    fontFamily: mono,
    fontWeight: 400,
    fontSize: 16 * u,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: c.dim,
  };

  const prevX = xAt(previous);
  const valX = xAt(value);

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: `${W / 2}px ${barY}px`,
        }}
      >
        {/* Top row: label and logo. */}
        <div
          style={{
            ...small,
            position: "absolute",
            left: marginX,
            top: 64 * u,
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
            opacity: labelsIn,
          }}
        >
          <div
            style={{
              width: 8 * u,
              height: 8 * u,
              background: accent,
              opacity: locked ? 1 : Math.floor(t / 6) % 2 === 0 ? 1 : 0.3,
            }}
          />
          {label}
        </div>
        <div
          style={{
            position: "absolute",
            right: marginX,
            top: 58 * u,
            opacity: labelsIn,
          }}
        >
          <RemocnLogo fontSize={28 * u} color={c.ink} />
        </div>

        {/* Readout. */}
        <div
          style={{
            position: "absolute",
            left: marginX - 0.04 * numFs,
            top: numTop,
            display: "flex",
            alignItems: "baseline",
            fontFamily: sora,
            fontWeight: 500,
            color: c.ink,
            transform: `scale(${1 + 0.05 * lockKick})`,
            transformOrigin: "0% 100%",
          }}
        >
          {shown.split("").map((ch, i) => (
            <div
              key={i}
              style={{
                width: cellW,
                textAlign: "center",
                fontSize: numFs,
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {ch === " " ? "" : ch}
            </div>
          ))}
          <div
            style={{
              marginLeft: 14 * u,
              fontSize: 64 * u,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: c.dim,
            }}
          >
            {unit}
          </div>
        </div>

        {/* Top speed banner. */}
        <div
          style={{
            position: "absolute",
            left: marginX + digits * cellW + 190 * u,
            top: numTop + numFs * 0.22,
            height: 72 * u,
            clipPath: `inset(0 ${(1 - bannerIn) * 100}% 0 0)`,
            opacity: bannerBlink,
            background:
              t < LOCK_AT + 4
                ? "#FFFFFF"
                : `linear-gradient(100deg, ${FLUTED[2]} 0%, #FF9A5E 100%)`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 22 * u,
            paddingRight: 26 * u,
            fontFamily: sora,
            fontWeight: 500,
            fontSize: 38 * u,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "#0A0A0B",
            whiteSpace: "nowrap",
          }}
        >
          {banner}
        </div>

        {/* Sector labels. */}
        {Array.from({ length: sectors }, (_, i) => {
          const lit = fillFrac * barW >= i * (sectorW + sectorGap);
          return (
            <div
              key={`s${i + 1}`}
              style={{
                ...small,
                position: "absolute",
                left: barX + i * (sectorW + sectorGap),
                top: barY - 30 * u,
                color: lit ? c.ink : c.dim,
                opacity: labelsIn,
              }}
            >
              S{i + 1}
            </div>
          );
        })}

        {/* Bar: three sector tracks, gradient fill clipped to the speed. */}
        {Array.from({ length: sectors }, (_, i) => {
          const x0 = i * (sectorW + sectorGap);
          const fillPx = Math.max(0, Math.min(sectorW, fillFrac * barW - x0));
          const vis = Math.max(0, Math.min(sectorW, trackIn * barW - x0));
          return (
            <div
              key={`b${i + 1}`}
              style={{
                position: "absolute",
                left: barX + x0,
                top: barY,
                width: vis,
                height: barH,
                background: c.track,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: fillPx,
                  height: barH,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -x0,
                    top: 0,
                    width: barW,
                    height: barH,
                    background: barFlash ? "#FFFFFF" : FILL,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Leading edge while the bar runs. */}
        {!locked && run > 0 ? (
          <div
            style={{
              position: "absolute",
              left: barX + fillFrac * barW - 3 * u,
              top: barY - 8 * u,
              width: 3 * u,
              height: barH + 16 * u,
              background: c.mark,
            }}
          />
        ) : null}

        {/* Delta slice between last year's mark and the new top speed. */}
        <div
          style={{
            position: "absolute",
            left: prevX,
            top: barY,
            width: (valX - prevX) * deltaIn,
            height: barH,
            boxShadow: `inset 0 0 0 ${3 * u}px ${c.mark}`,
          }}
        />

        {/* Last year's mark. */}
        <div
          style={{
            position: "absolute",
            left: prevX - 1.5 * u,
            top: barY - 46 * u,
            width: 3 * u,
            height: barH + 46 * u,
            background: c.mark,
            transformOrigin: "50% 100%",
            transform: `scaleY(${markIn})`,
          }}
        />
        <div
          style={{
            ...small,
            position: "absolute",
            right: W - prevX + 12 * u,
            top: barY - 48 * u,
            color: c.ink,
            opacity: markIn,
            transform: `translateY(${(1 - markIn) * 10 * u}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {previousLabel} · {previous}
        </div>

        {/* Comparison line, sliding out from under the bar. */}
        <div
          style={{
            position: "absolute",
            right: W - valX,
            top: barY + barH,
            height: 90 * u,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14 * u,
              paddingTop: 18 * u,
              transform: `translateY(${-(1 - compIn) * 90 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: sora,
                fontWeight: 500,
                fontSize: 52 * u,
                letterSpacing: "-0.02em",
                color: c.ink,
              }}
            >
              {deltaText}
            </span>
            <span
              style={{
                fontFamily: sora,
                fontWeight: 400,
                fontSize: 30 * u,
                color: c.dim,
              }}
            >
              {comparison}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
