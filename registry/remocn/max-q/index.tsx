"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type MaxQElementId, maxQTimeline } from "./timeline";

const { fontFamily: condensed } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface MaxQProps {
  /** Left number at the end of the climb. */
  velocity?: number;
  /** Right number at the end of the climb, one decimal. */
  altitude?: number;
  speedLabel?: string;
  speedUnit?: string;
  altitudeLabel?: string;
  altitudeUnit?: string;
  /** The event banner that flashes across at the peak. */
  event?: string;
  /** Small line inside the banner. Pass "" to hide it. */
  eventDetail?: string;
  /** The status that settles at the end. */
  status?: string;
  /** Vehicle dot on the trajectory and small marks. */
  accent?: string;
  /** Text color of the numbers, clock and trajectory; overrides the theme. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Barlow Condensed by default. */
  fontFamily?: string;
  /** Frames the event banner holds across the frame. */
  bandHold?: number;
  /** Mission clock reading at the first frame, in seconds. */
  clockStart?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  /** Playback multiplier. */
  speed?: number;
  /**
   * Moves, trims or stretches the intro, the climb, the ground drift, the
   * Max Q band, its marker and the status, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<MaxQElementId>;
}

// Beat sheet (30fps):
//   0–8     labels and both numbers rise in, already at zero and climbing
//   0–112   SPEED and ALTITUDE race up in tabular digits (slow start, fast
//           middle, settle); the trajectory draws between them, the vehicle
//           dot riding its head; the mission clock runs up top
//   60      MAX Q: a "beam" gradient band wipes across the frame, the marker
//           drops on the trajectory; the band holds, then wipes out (88)
//   92–104  NOMINAL settles under the numbers; values freeze at 112
//   112–    poster hold
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.7, 0, 0.2, 1);
const CLIMB = Easing.bezier(0.5, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam": bg #02030a, #f4f7ff #8fb4ff #3d5bff #1a1660.
const BEAM = ["#F4F7FF", "#8FB4FF", "#3D5BFF", "#1A1660"] as const;

const THEMES = {
  dark: {
    stage: "#04050B",
    ink: "#F2F3F7",
    dim: "#7A7C88",
    faint: "#24263A",
    bandInk: "#05061A",
    groundOp: 0.85,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#111216",
    dim: "#7F7E79",
    faint: "#D9D7D0",
    bandInk: "#05061A",
    groundOp: 0.5,
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Point on a cubic bezier. */
function bez(
  p: number,
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
): [number, number] {
  const q = 1 - p;
  const w0 = q * q * q;
  const w1 = 3 * q * q * p;
  const w2 = 3 * q * p * p;
  const w3 = p * p * p;
  return [
    w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0],
    w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1],
  ];
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

export function MaxQ(props: MaxQProps) {
  const {
    velocity = 1880,
    altitude = 14.2,
    speedLabel = "Speed",
    speedUnit = "km/h",
    altitudeLabel = "Altitude",
    altitudeUnit = "km",
    event = "Max Q",
    eventDetail = "Maximum dynamic pressure",
    status = "Nominal",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = condensed,
    clockStart = 38,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(maxQTimeline, props, durationInFrames * speed, timing);
  const introEl = tl.get("intro");
  const raceEl = tl.get("race");
  const driftEl = tl.get("drift");
  const band = tl.get("band");
  const marker = tl.get("marker");
  const statusEl = tl.get("status");
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const bg =
    background === "transparent" ? "transparent" : (background ?? c.stage);
  const u = Math.min(W / 1280, H / 720);

  // ── Values ────────────────────────────────────────────────────────────────
  const race = CLIMB(ramp(t, raceEl.start, raceEl.length));
  const altRace = Easing.bezier(
    0.6,
    0,
    0.3,
    1,
  )(ramp(t, raceEl.start, raceEl.length));
  const spd = Math.round(velocity * race);
  const alt = altitude * altRace;
  const spdText = spd.toLocaleString("en-US");
  const altText = alt.toFixed(1);
  const clockS = clockStart + Math.floor((t / 30) * 1);
  const clock = `T+00:${pad(Math.floor(clockS / 60))}:${pad(clockS % 60)}`;

  // ── Layout ────────────────────────────────────────────────────────────────
  const margin = 64 * u;
  const numFs = 292 * u;
  const numCY = H / 2 + 62 * u;
  const labelY = numCY - numFs * 0.5 - 12 * u;
  const intro = OUT(ramp(t, introEl.start, introEl.length));

  // Trajectory: a gravity turn from the bottom centre to the top right.
  const P0: [number, number] = [W * 0.505, H + 10 * u];
  const P1: [number, number] = [W * 0.515, H * 0.52];
  const P2: [number, number] = [W * 0.6, H * 0.2];
  const P3: [number, number] = [W + 20 * u, H * 0.1];
  const pathD = `M ${P0[0]} ${P0[1]} C ${P1[0]} ${P1[1]}, ${P2[0]} ${P2[1]}, ${P3[0]} ${P3[1]}`;
  const drawP = interpolate(altRace, [0, 1], [0.02, 0.86]);
  const head = bez(drawP, P0, P1, P2, P3);
  const qP = interpolate(
    Easing.bezier(
      0.6,
      0,
      0.3,
      1,
    )(ramp(marker.start, raceEl.start, raceEl.length)),
    [0, 1],
    [0.02, 0.86],
  );
  const qPt = bez(qP, P0, P1, P2, P3);

  // ── Event band ────────────────────────────────────────────────────────────
  const bandIn = OUT(ramp(t, band.start, band.beat("in")));
  const bandOut = MOVE(
    ramp(t, band.start + band.beat("in") + band.beat("hold"), band.beat("out")),
  );
  const bandOn = t >= band.start && bandOut < 1;
  const bandH = 262 * u;
  const bandY = numCY + numFs * 0.04 - bandH / 2;
  const bandHit = kick(t - band.start - band.beat("hitAt"), band.beat("hit"));
  const textIn = OUT(
    ramp(t, band.start + band.beat("textAt"), band.beat("text")),
  );
  const markerIn = OUT(ramp(t, marker.start, marker.length));

  const statusIn = OUT(ramp(t, statusEl.start, statusEl.length));
  const settle = raceEl.beat("settle");
  const settleHit = kick(t - raceEl.end, settle);
  const settling =
    kick(t + 1 - raceEl.end, settle) !== settleHit ||
    kick(t - 1 - raceEl.end, settle) !== settleHit;

  const drift = ramp(t, driftEl.start, driftEl.length);
  const ground = [
    `radial-gradient(60% 55% at ${70 + drift * 6}% 0%, color-mix(in oklab, ${BEAM[2]} 45%, transparent) 0%, transparent 70%)`,
    `radial-gradient(40% 40% at 50% 115%, color-mix(in oklab, ${theme === "dark" ? BEAM[3] : BEAM[1]} 70%, transparent) 0%, transparent 75%)`,
  ].join(", ");

  const label: React.CSSProperties = {
    fontFamily,
    fontWeight: 500,
    fontSize: 24 * u,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: c.dim,
    whiteSpace: "nowrap",
    lineHeight: 1,
  };
  const rise = `translateY(${(1 - intro) * 30 * u}px)${glide(intro < 1)}`;
  const number: React.CSSProperties = {
    fontFamily,
    fontWeight: 500,
    fontSize: numFs,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
    color: fg,
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ground,
          opacity:
            c.groundOp * (0.55 + 0.45 * ramp(t, band.start, band.beat("glow"))),
        }}
      />

      <ScaleLayer scale={scale}>
        {/* Trajectory. */}
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <path
            d={pathD}
            fill="none"
            stroke={c.faint}
            strokeWidth={2 * u}
            strokeDasharray={`${2 * u} ${8 * u}`}
            opacity={intro}
          />
          <path
            d={pathD}
            fill="none"
            stroke={fg}
            strokeWidth={2.5 * u}
            pathLength={1}
            strokeDasharray={`${drawP} 1`}
            opacity={0.9 * intro}
          />
          {/* Max Q marker. */}
          <g opacity={markerIn}>
            <line
              x1={qPt[0] - 16 * u}
              y1={qPt[1]}
              x2={qPt[0] + 16 * u}
              y2={qPt[1]}
              stroke={fg}
              strokeWidth={2 * u}
            />
            <text
              x={qPt[0] - 26 * u}
              y={qPt[1] + 7 * u}
              textAnchor="end"
              fontFamily={fontFamily}
              fontWeight={500}
              fontSize={20 * u}
              letterSpacing="0.16em"
              fill={c.dim}
            >
              {event.toUpperCase()}
            </text>
          </g>
          <circle
            cx={head[0]}
            cy={head[1]}
            r={14 * u}
            fill="none"
            stroke={accent}
            strokeWidth={2 * u}
            opacity={0.45 * intro}
          />
          <circle cx={head[0]} cy={head[1]} r={6 * u} fill={accent} />
        </svg>

        {/* Mission clock. */}
        <div
          style={{
            ...label,
            position: "absolute",
            left: 0,
            right: 0,
            top: margin - 10 * u,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            color: fg,
            opacity: intro,
          }}
        >
          {clock}
        </div>

        {/* SPEED. */}
        <div
          style={{
            position: "absolute",
            left: margin,
            top: 0,
            opacity: intro,
            transform: rise,
          }}
        >
          <div
            style={{
              ...label,
              position: "absolute",
              left: 4 * u,
              top: labelY - 24 * u,
            }}
          >
            {speedLabel}
            <span style={{ color: fg, marginLeft: 14 * u }}>{speedUnit}</span>
          </div>
          <div
            style={{
              ...number,
              position: "absolute",
              left: 0,
              top: numCY - numFs / 2,
              transform: `scale(${1 + 0.015 * settleHit})${glide(settling)}`,
              transformOrigin: "left center",
            }}
          >
            {spdText}
          </div>
        </div>

        {/* ALTITUDE. */}
        <div
          style={{
            position: "absolute",
            right: margin,
            top: 0,
            opacity: intro,
            transform: rise,
          }}
        >
          <div
            style={{
              ...label,
              position: "absolute",
              right: 4 * u,
              top: labelY - 24 * u,
              textAlign: "right",
            }}
          >
            {altitudeLabel}
            <span style={{ color: fg, marginLeft: 14 * u }}>
              {altitudeUnit}
            </span>
          </div>
          <div
            style={{
              ...number,
              position: "absolute",
              right: 0,
              top: numCY - numFs / 2,
              transform: `scale(${1 + 0.015 * settleHit})${glide(settling)}`,
              transformOrigin: "right center",
            }}
          >
            {altText}
          </div>
        </div>

        {/* Status. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: margin + 52 * u,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16 * u,
            opacity: statusIn,
            transform: `translateY(${(1 - statusIn) * -22 * u}px)${glide(statusIn > 0 && statusIn < 1)}`,
          }}
        >
          <div
            style={{
              width: 12 * u,
              height: 12 * u,
              borderRadius: 99,
              background: `linear-gradient(135deg, ${BEAM[1]}, ${BEAM[2]})`,
            }}
          />
          <div
            style={{
              fontFamily,
              fontWeight: 500,
              fontSize: 54 * u,
              letterSpacing: "0.14em",
              lineHeight: 1,
              textTransform: "uppercase",
              backgroundImage: `linear-gradient(90deg, ${theme === "dark" ? BEAM[0] : BEAM[3]} 0%, ${theme === "dark" ? BEAM[1] : BEAM[2]} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {status}
          </div>
        </div>

        {/* MAX Q band. */}
        {bandOn ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: bandY,
              width: W,
              height: bandH,
              clipPath: `inset(0 ${(1 - bandIn) * 100}% 0 ${bandOut * 100}%)`,
              background: `linear-gradient(90deg, ${BEAM[3]} 0%, ${BEAM[2]} 22%, ${BEAM[1]} 40%, ${BEAM[0]} 52%, ${BEAM[1]} 66%, ${BEAM[2]} 84%, ${BEAM[3]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 40 * u,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: BEAM[0],
                opacity: bandHit * 0.8,
              }}
            />
            <div
              style={{
                fontFamily,
                fontWeight: 500,
                fontSize: 168 * u,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                color: c.bandInk,
                whiteSpace: "nowrap",
                transform: `translateX(${(1 - textIn) * -60 * u}px)`,
                opacity: textIn,
              }}
            >
              {event}
            </div>
            {eventDetail ? (
              <div
                style={{
                  fontFamily,
                  fontWeight: 500,
                  fontSize: 24 * u,
                  letterSpacing: "0.16em",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                  color: c.bandInk,
                  width: 200 * u,
                  opacity: textIn,
                  transform: `translateX(${(1 - textIn) * -40 * u}px)`,
                }}
              >
                {eventDetail}
              </div>
            ) : null}
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
