"use client";

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

const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
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

export interface RingCutProps {
  from?: string;
  to?: string;
  origin?: { x: number; y: number };
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type RingKind = "a" | "b" | "line" | "final";

const START = 6;
const DUR = 24;
const RINGS: { kind: RingKind; at: number }[] = [
  { kind: "b", at: 0 },
  { kind: "line", at: 3 },
  { kind: "a", at: 6 },
  { kind: "b", at: 9 },
  { kind: "line", at: 12 },
  { kind: "a", at: 15 },
  { kind: "final", at: 19 },
];

const EXPAND = Easing.bezier(0.3, 0, 0.2, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

/** Final ground: gradients.sh "mesh" (dark) and "pixel-glass" (light). */
const STAGES = {
  dark: {
    a: "#0A0A0B",
    aFg: "#F3F2EF",
    b: "#F5F4F0",
    aLight: "rgba(255,255,255,0.06)",
    end: "#0a0d24",
    endFg: "#F6F4FB",
    blobs: [
      ["#ecdcf2", 88, 8, 0.3],
      ["#8796ee", 84, 30, 0.5],
      ["#2e45b7", 58, 74, 1],
      ["#0e1645", 12, 18, 1],
    ] as [string, number, number, number][],
  },
  light: {
    a: "#F5F4F0",
    aFg: "#121214",
    b: "#0A0A0B",
    aLight: "rgba(255,255,255,0.9)",
    end: "#f4f3f1",
    endFg: "#121214",
    blobs: [
      ["#ff4fb8", 84, 22, 0.5],
      ["#3d6bff", 74, 90, 0.6],
      ["#7a3cff", 16, 18, 0.62],
      ["#ffffff", 50, 50, 0.85],
    ] as [string, number, number, number][],
  },
};

/** Manrope 500 advances, ASCII 32–126, per 1000 em. */
const ADV = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const TRACK = -0.03;

function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c < 127 ? ADV[c - 32] : 600) / 1000 + TRACK;
  }
  return Math.max(w - TRACK, 0.5);
}

/** Logo width in em: R mark + gap + "emocn" (Manrope 600, -0.025em). */
const LOGO_EM = (0.76 * 124.06) / 134.26 + 0.04 + 3.26 - 0.125;

function meshGround(stage: (typeof STAGES)["dark"], k: number) {
  const drift = [
    [5, 3],
    [-4, 4],
    [-5, -3],
    [4, -4],
  ];
  return [
    ...stage.blobs.map(
      ([c, x, y, a], i) =>
        `radial-gradient(85% 95% at ${x + drift[i][0] * k}% ${y + drift[i][1] * k}%, color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent) 0%, transparent 68%)`,
    ),
    stage.end,
  ].join(", ");
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Title({
  text,
  size,
  color,
  scale,
  lift,
  logo,
}: {
  text: string;
  size: number;
  color: string;
  scale: number;
  lift: number;
  logo?: boolean;
}) {
  const style: React.CSSProperties = {
    fontFamily: manrope.fontFamily,
    fontWeight: 500,
    fontSize: size,
    letterSpacing: `${TRACK}em`,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color,
    paddingBottom: 0.06 * size,
    transform: `translateY(${lift}px) scale(${scale})`,
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={style}>
        {logo ? <RemocnLogo fontSize={size} color={color} /> : text}
      </div>
    </AbsoluteFill>
  );
}

export function RingCut({
  from = "One idea",
  to = "remocn",
  origin = { x: 0.2, y: 0.74 },
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RingCutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = STAGES[theme];

  const cx = origin.x * W;
  const cy = origin.y * H;
  const reach = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(W - cx, cy),
    Math.hypot(cx, H - cy),
    Math.hypot(W - cx, H - cy),
  );
  const rMax = 1.18 * reach;
  const line = Math.max(3, 4.5 * u);
  const radius = (at: number) =>
    rMax *
    EXPAND(interpolate(t, [START + at, START + at + DUR], [0, 1], CLAMP));

  const isLogo = to.trim().toLowerCase() === "remocn";
  const fsA = Math.min(150 * u, (0.8 * W) / widthEm(from));
  const fsB = Math.min(
    (isLogo ? 172 : 160) * u,
    (0.66 * W) / (isLogo ? LOGO_EM : widthEm(to)),
  );
  const finalAt = RINGS[RINGS.length - 1].at;
  const finalR = radius(finalAt);
  const titleDist = Math.hypot(W / 2 - cx, H / 2 - cy);
  let tReach = START + finalAt;
  for (let f = START + finalAt; f <= START + finalAt + DUR; f += 0.25) {
    const r =
      rMax *
      EXPAND(interpolate(f, [START + finalAt, START + finalAt + DUR], [0, 1]));
    if (r >= titleDist) {
      tReach = f;
      break;
    }
  }
  const settle = SETTLE(
    interpolate(t, [tReach - 8, tReach + 26], [0, 1], CLAMP),
  );
  const scaleB = 1.07 - 0.07 * settle;
  const liftB = 14 * u * (1 - settle);
  const driftA =
    1 + 0.03 * interpolate(t, [0, START + finalAt + 10], [0, 1], CLAMP);
  const covered = finalR >= reach + line;
  const drift = interpolate(t, [0, 96], [0, 1], CLAMP);

  const light = (c: string) =>
    `radial-gradient(ellipse 80% 90% at 24% 0%, ${c}, transparent 70%)`;
  const clip = (r: number) => `circle(${r}px at ${cx}px ${cy}px)`;

  return (
    <AbsoluteFill style={{ background: stage.a, overflow: "hidden" }}>
      {covered ? null : (
        <>
          <AbsoluteFill style={{ background: light(stage.aLight) }} />
          <Title
            text={from}
            size={fsA}
            color={stage.aFg}
            scale={driftA}
            lift={0}
          />
        </>
      )}
      {RINGS.map((ring) => {
        const r = radius(ring.at);
        if (r <= 0) return null;
        if (ring.kind === "final") {
          return (
            <AbsoluteFill
              key={ring.at}
              style={{
                background: meshGround(stage, drift),
                clipPath: covered ? undefined : clip(r),
              }}
            >
              <Title
                text={to}
                size={fsB}
                color={stage.endFg}
                scale={scaleB}
                lift={liftB}
                logo={isLogo}
              />
            </AbsoluteFill>
          );
        }
        if (covered) return null;
        if (ring.kind === "line") {
          return (
            <svg
              key={ring.at}
              width={W}
              height={H}
              style={{ position: "absolute", inset: 0 }}
              aria-hidden
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={accent}
                strokeWidth={line}
              />
            </svg>
          );
        }
        return (
          <AbsoluteFill
            key={ring.at}
            style={{
              background: ring.kind === "a" ? stage.a : stage.b,
              clipPath: clip(r),
            }}
          />
        );
      })}
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
