"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: condensed } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;

/** The "R" mark alone (viewBox 124.06 × 134.26). Fill follows `color`. */
function RemocnR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      viewBox={`0 0 ${R_W} ${R_H}`}
      height={height}
      width={(height * R_W) / R_H}
      style={{ display: "block" }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

export interface ReplayWipeProps {
  /** The shot before the first wipe (and after every second one). Defaults to a "Live" broadcast frame. */
  from?: React.ReactNode;
  /** The shot after the first wipe. Defaults to a slow-mo "Replay" frame. */
  to?: React.ReactNode;
  /** Frames where a wipe starts. Shots alternate from → to → from… */
  wipeAt?: number[];
  /** Frames the R takes to cross the frame. 15–20 reads as a stinger. */
  wipeLength?: number;
  /** The live marker in the default "Live" shot. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps, speed 1, defaults):
//   0–26    "Live" shot: huge type pans slowly, the clock bug ticks
//  26–44    stinger: the remocn R spins across on the head of a "fluted"
//           gradient streak; the streak's slanted head wipes Live → Replay,
//           speed lines run with it, a flash + camera kick at mid-frame
//  44–84    "Replay" shot in slow motion on the gradient ground
//  84–102   the same stinger back to Live
// 102–      Live holds
const SWEEP = Easing.bezier(0.55, 0, 0.4, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "fluted": bg #050507, #1d2a8f, #2f7bff, #ff7a3d, #ffe2c4.
const FLUTED = ["#1D2A8F", "#2F7BFF", "#FF7A3D", "#FFE2C4"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#86858C",
    tab: "#1C1C20",
    tabInk: "#F3F2EF",
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    tab: "#121214",
    tabInk: "#F5F4F0",
  },
} as const;

/** A short hit: up in 2 frames, eases back over 9. */
function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 9);
  return k * k;
}

function LiveShot({
  theme,
  accent,
  speed,
}: {
  theme: "dark" | "light";
  accent: string;
  speed: number;
}) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);
  const pan = interpolate(t, [0, 150], [0.025 * W, -0.025 * W], CLAMP);
  const secs = 12 + Math.floor(t / 30);
  const clock = `89:${String(secs % 60).padStart(2, "0")}`;
  return (
    <AbsoluteFill style={{ background: c.stage }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${pan}px)`,
          fontFamily: condensed,
          fontWeight: 500,
          fontSize: 640 * u,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: c.ink,
          paddingTop: 70 * u,
        }}
      >
        LIVE
      </div>
      <div
        style={{
          position: "absolute",
          left: 48 * u,
          top: 44 * u,
          display: "flex",
          height: 46 * u,
          fontFamily: condensed,
          fontWeight: 500,
          fontSize: 26 * u,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            padding: `0 ${16 * u}px`,
            background: accent,
            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              width: 10 * u,
              height: 10 * u,
              background: "#FFFFFF",
              opacity: Math.floor(t / 15) % 2 === 0 ? 1 : 0.35,
            }}
          />
          <span style={{ paddingTop: 2 * u }}>Live</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: `0 ${16 * u}px`,
            background: c.tab,
            color: c.tabInk,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ paddingTop: 2 * u }}>{clock}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ReplayShot({ speed }: { speed: number }) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  // Slow motion: the type creeps and the ground barely drifts.
  const creep = interpolate(t, [0, 150], [-0.012 * W, 0.012 * W], CLAMP);
  const grow = interpolate(t, [0, 150], [1, 1.03], CLAMP);
  const drift = interpolate(t, [0, 150], [0, 12], CLAMP);
  const ground = [
    `repeating-linear-gradient(90deg, rgba(5,5,7,0.16) 0px, rgba(255,255,255,0.07) ${22 * u}px, rgba(5,5,7,0.16) ${44 * u}px)`,
    `radial-gradient(60% 80% at ${86 - drift}% 110%, ${FLUTED[3]} 0%, transparent 60%)`,
    `radial-gradient(70% 90% at ${70 - drift}% 90%, ${FLUTED[2]} 0%, transparent 70%)`,
    `linear-gradient(125deg, #0B1250 0%, ${FLUTED[0]} 30%, ${FLUTED[1]} 62%, #7A6BD0 100%)`,
  ].join(", ");
  return (
    <AbsoluteFill style={{ background: ground }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${creep}px) scale(${grow})`,
          fontFamily: condensed,
          fontWeight: 500,
          fontSize: 420 * u,
          lineHeight: 1,
          letterSpacing: "0.005em",
          color: "#FFFFFF",
          paddingTop: 44 * u,
        }}
      >
        REPLAY
      </div>
      <div
        style={{
          position: "absolute",
          left: 48 * u,
          top: 44 * u,
          display: "flex",
          height: 46 * u,
          fontFamily: condensed,
          fontWeight: 500,
          fontSize: 26 * u,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            padding: `0 ${16 * u}px`,
            background: "#FFFFFF",
            color: "#0A0A0B",
          }}
        >
          <RemocnR height={20 * u} color="#0A0A0B" />
          <span style={{ paddingTop: 2 * u }}>Replay</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: `0 ${16 * u}px`,
            background: "rgba(5,5,7,0.55)",
            color: "#FFFFFF",
          }}
        >
          <span style={{ paddingTop: 2 * u }}>Super slow-mo</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function ReplayWipe({
  from,
  to,
  wipeAt = [26, 84],
  wipeLength = 18,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ReplayWipeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const shots = [
    from ?? <LiveShot theme={theme} accent={accent} speed={speed} />,
    to ?? <ReplayShot speed={speed} />,
  ];

  const len = Math.max(1, wipeLength);
  const starts = [...wipeAt].sort((a, b) => a - b);
  const done = starts.filter((w) => t >= w + len).length;
  const active = starts.find((w) => t >= w && t < w + len);
  const outgoing = shots[done % 2];
  const incoming = shots[(done + 1) % 2];

  // Streak geometry: a slanted band whose head (x at mid-height = X) is the
  // wipe edge. The incoming shot shows left of the head.
  const slant = 0.3 * H;
  const tail = 0.62 * W;
  const x0 = -slant / 2 - 20 * u;
  const x1 = W + tail + slant / 2 + 20 * u;
  const p = active === undefined ? 0 : SWEEP((t - active) / len);
  const X = x0 + (x1 - x0) * p;
  const edgeTop = X + slant / 2;
  const edgeBottom = X - slant / 2;

  // Flash and camera kick when the head crosses the middle of the frame.
  const midAt = starts.map((w) => {
    // Solve SWEEP(q) ≈ crossing for the head at W/2, sampled on 40 steps.
    const target = (W / 2 - x0) / (x1 - x0);
    let q = 0;
    for (let i = 0; i <= 40; i++) {
      if (SWEEP(i / 40) >= target) {
        q = i / 40;
        break;
      }
    }
    return w + q * len;
  });
  const hit = midAt.reduce((a, m) => Math.max(a, kick(t - m)), 0);
  const flash = midAt.reduce((a, m) => {
    const d = t - m + 1;
    if (d < 0 || d > 5) return a;
    return Math.max(a, d < 1 ? d : 1 - (d - 1) / 4);
  }, 0);
  // The flash band: a white slash that opens just ahead of the head.
  const bandGap = 0.03 * W * (1 - flash) + 6 * u;
  const bandW = 0.075 * W * flash;
  const cam = `translateX(${-14 * u * hit}px) scale(${1 + 0.035 * hit})`;

  const leftOf = `polygon(${-W}px 0, ${edgeTop}px 0, ${edgeBottom}px ${H}px, ${-W}px ${H}px)`;
  const rightOf = `polygon(${edgeTop}px 0, ${2 * W}px 0, ${2 * W}px ${H}px, ${edgeBottom}px ${H}px)`;

  // The R rides on the blue part of the streak, spinning a turn and a half.
  const rH = 0.5 * H;
  const rX = X - 0.42 * tail;
  const spin = (p - 0.5) * 540;
  const rScale = 0.92 + 0.16 * Math.sin(Math.PI * p);

  // Speed lines that run with the head.
  const lines = [
    { y: 0.13, h: 7, lead: 0.05, len: 0.5, color: FLUTED[3] },
    { y: 0.21, h: 3, lead: -0.08, len: 0.42, color: FLUTED[1] },
    { y: 0.79, h: 12, lead: 0.02, len: 0.6, color: FLUTED[2] },
    { y: 0.88, h: 4, lead: 0.09, len: 0.35, color: FLUTED[3] },
  ];

  return (
    <AbsoluteFill
      style={{ background: THEMES[theme].stage, overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: cam,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: active === undefined ? undefined : rightOf,
          }}
        >
          {outgoing}
        </div>
        {active !== undefined ? (
          <div style={{ position: "absolute", inset: 0, clipPath: leftOf }}>
            {incoming}
          </div>
        ) : null}
      </div>

      {active !== undefined ? (
        <>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <defs>
              <linearGradient
                id={`${uid}-streak`}
                gradientUnits="userSpaceOnUse"
                x1={X - tail}
                y1={0}
                x2={X}
                y2={0}
              >
                <stop offset="0" stopColor={FLUTED[0]} stopOpacity={0} />
                <stop offset="0.3" stopColor={FLUTED[0]} stopOpacity={0.85} />
                <stop offset="0.62" stopColor={FLUTED[1]} />
                <stop offset="0.76" stopColor="#A9509E" />
                <stop offset="0.87" stopColor={FLUTED[2]} />
                <stop offset="0.965" stopColor={FLUTED[3]} />
                <stop offset="1" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
            <polygon
              points={`${edgeTop - tail},0 ${edgeTop},0 ${edgeBottom},${H} ${edgeBottom - tail},${H}`}
              fill={`url(#${uid}-streak)`}
            />
            {lines.map((l) => {
              const y = l.y * H;
              const headX = X + slant * (0.5 - l.y) + l.lead * W;
              return (
                <rect
                  key={l.y}
                  x={headX - l.len * W}
                  y={y - (l.h * u) / 2}
                  width={l.len * W}
                  height={l.h * u}
                  fill={l.color}
                />
              );
            })}
          </svg>
          <div
            style={{
              position: "absolute",
              left: rX - (rH * R_W) / R_H / 2,
              top: H / 2 - rH / 2,
              transform: `rotate(${spin}deg) scale(${rScale})`,
            }}
          >
            <RemocnR height={rH} color="#FFFFFF" />
          </div>
        </>
      ) : null}

      {flash > 0 && active !== undefined ? (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <polygon
            points={`${edgeTop + bandGap},0 ${edgeTop + bandGap + bandW},0 ${edgeBottom + bandGap + bandW},${H} ${edgeBottom + bandGap},${H}`}
            fill="#FFFFFF"
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
}
