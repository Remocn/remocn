"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ColumnSlideProps {
  from?: string;
  to?: string;
  columns?: number;
  accent?: string;
  theme?: "dark" | "light";
  /** Text color of both headlines; overrides the theme. */
  ink?: string;
  /** Fill of the outgoing scene and the stage; "transparent" drops it. */
  background?: string;
  /** Typeface for the headlines. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  /** Weight of the headlines. */
  fontWeight?: number;
  /** Frames between columns starting to slide. */
  stagger?: number;
  /** Size of the headlines, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Film grain over the scene. */
  grain?: boolean;
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const MOVE_AT = 6;
const STEP = 4;
const LAND = 42;
const SETTLE_END = 66;

const SLIDE = Easing.bezier(0.72, 0, 0.18, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const TRACK = -0.035;

// Layout rounds a box and a baseline to whole pixels, so a scene eased by
// `top` clicks along pixel by pixel; the slide is a transform instead, and
// nothing at all once it sits at 0.
const slideY = (y: number) => (y === 0 ? undefined : `translateY(${y}px)`);

/** gradients.sh palettes: "beam" (dark) and "pixel-glass" (light). */
const STAGES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    dim: "rgba(243,242,239,0.1)",
    light: "rgba(255,255,255,0.06)",
    ground: "#02030a",
    colors: ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"],
    blobs: [
      [80, 4, 30, 34, 0.2],
      [84, 16, 48, 58, 0.55],
      [60, 66, 96, 96, 0.9],
      [8, 16, 72, 84, 1],
    ],
    toFg: "#F7F8FF",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    dim: "rgba(18,18,20,0.08)",
    light: "rgba(255,255,255,0.9)",
    ground: "#f4f3f1",
    colors: ["#ffffff", "#ff4fb8", "#3d6bff", "#7a3cff"],
    blobs: [
      [74, 8, 46, 40, 0.9],
      [86, 34, 62, 70, 0.55],
      [22, 88, 80, 85, 0.72],
      [8, 18, 70, 80, 0.8],
    ],
    toFg: "#121214",
  },
};

type Stage = {
  colors: string[];
  blobs: number[][];
  ground: string;
};

/** Bricolage Grotesque 500 advances (opsz 96), ASCII 32–126, per 1000 em. */
const ADV = [
  211, 220, 274, 584, 563, 913, 677, 149, 267, 271, 391, 486, 150, 300, 178,
  330, 594, 264, 534, 556, 572, 551, 591, 471, 599, 592, 182, 179, 486, 486,
  486, 398, 878, 621, 588, 625, 614, 531, 507, 645, 625, 209, 306, 594, 450,
  784, 664, 657, 566, 656, 591, 573, 504, 620, 606, 897, 579, 556, 534, 276,
  329, 276, 516, 588, 283, 514, 552, 524, 554, 526, 340, 546, 534, 197, 203,
  504, 197, 830, 534, 560, 551, 552, 359, 497, 339, 532, 515, 775, 502, 522,
  454, 323, 193, 331, 486,
];

function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c < 127 ? ADV[c - 32] : 560) / 1000 + TRACK;
  }
  return Math.max(w - TRACK, 0.5);
}

/** Mesh-style layered radial blobs; positions drift a few % over the shot. */
function ground(stage: Stage, k: number) {
  const drift = [
    [-6, 4],
    [-4, -3],
    [5, -4],
    [3, 5],
  ];
  const mix = (c: string, a: number) =>
    `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;
  return [
    ...stage.colors.map((c, i) => {
      const [x, y, w, h, a] = stage.blobs[i];
      return `radial-gradient(${w}% ${h}% at ${x + drift[i][0] * k}% ${y + drift[i][1] * k}%, ${mix(c, a)} 0%, transparent 68%)`;
    }),
    stage.ground,
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
          seed={13}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Scene({
  W,
  H,
  left,
  top,
  background,
  overlay,
  text,
  size,
  color,
  scale,
  fontFamily,
  fontWeight,
  glide,
  scaling,
}: {
  W: number;
  H: number;
  left: number;
  top: number;
  background: string;
  overlay: string;
  text: string;
  size: number;
  color: string;
  scale: number;
  fontFamily: string;
  fontWeight: number;
  glide: (moving: boolean) => string;
  scaling: boolean;
}) {
  const label: React.CSSProperties = {
    position: "absolute",
    left: 0,
    width: W,
    top: H / 2 - 0.56 * size,
    textAlign: "center",
    fontFamily,
    fontWeight,
    fontSize: size,
    letterSpacing: `${TRACK}em`,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color,
    paddingBottom: 0.12 * size,
    // The mark sits on the label, not the scene: the headline rides the
    // slide and the drift, and the ground needs no lean.
    transform: `scale(${scale})${glide(top !== 0 || scaling)}`,
    transformOrigin: `${W / 2}px ${0.56 * size}px`,
  };
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        transform: slideY(top),
        width: W,
        height: H,
        background,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: overlay }} />
      <div style={label}>{text}</div>
    </div>
  );
}

export function ColumnSlide({
  from = "Plan the launch",
  to = "Launch day",
  columns = 5,
  accent = "#3B5BFD",
  theme = "dark",
  ink,
  background,
  fontFamily = display,
  fontWeight = 500,
  stagger = STEP,
  scale = 1,
  delay = 0,
  grain = true,
  speed = 1,
}: ColumnSlideProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H } = useSceneConfig();
  const u = H / 720;
  const stage = STAGES[theme];
  const bg = background ?? stage.bg;
  const n = Math.min(7, Math.max(3, Math.round(columns)));

  const fsA = Math.min(128 * u, (0.8 * W) / widthEm(from));
  const fsB = Math.min(140 * u, (0.8 * W) / widthEm(to));
  const driftAt = (f: number) =>
    1 + 0.03 * SLIDE(interpolate(f, [0, LAND], [0, 1], CLAMP));
  const scaleAt = (f: number) =>
    1.05 -
    0.05 * SETTLE(interpolate(f, [LAND - 14, SETTLE_END], [0, 1], CLAMP));
  const driftA = driftAt(t);
  const scaleB = scaleAt(t);
  // Weighed by the distance from the label's centre to its far end.
  const changes = (at: (f: number) => number) =>
    [t - speed, t + speed].some(
      (f) => Math.abs(at(f) - at(t)) * W * 0.5 > 1e-3,
    );
  const driftingA = changes(driftAt);
  const settlingB = changes(scaleAt);
  const seam = Math.max(2, 3 * u);

  const lightA = `radial-gradient(ellipse 80% 90% at 24% 0%, ${stage.light}, transparent 70%)`;
  const sheenB =
    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%, rgba(0,0,0,0.08))";
  const guides = interpolate(t, [0, MOVE_AT], [0.35, 1], CLAMP);
  const groundB = ground(stage, interpolate(t, [0, 96], [0, 1], CLAMP));

  const cols = Array.from({ length: n }, (_, k) => {
    const x0 = Math.round((k * W) / n);
    const x1 = Math.round(((k + 1) * W) / n);
    const order = k % 2 === 0 ? k / 2 : Math.floor(n / 2) + (k + 1) / 2;
    // Capped so a long stagger can't push a column's start past the landing.
    const start = Math.min(LAND - 1, MOVE_AT + order * stagger);
    const p = SLIDE(interpolate(t, [start, LAND], [0, 1], CLAMP));
    const up = k % 2 === 0;
    const yA = up ? -p * H : p * H;
    const yB = up ? H - p * H : -H + p * H;
    const moving = p > 0 && p < 1;
    const seamY = up ? yB : yA;
    return { k, x0, x1, yA, yB, p, moving, seamY, up };
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {cols.map((c) => (
        <div
          key={c.k}
          style={{
            position: "absolute",
            left: c.x0,
            top: 0,
            width: c.x1 - c.x0,
            height: H,
            overflow: "hidden",
          }}
        >
          {c.p < 1 ? (
            <Scene
              W={W}
              H={H}
              left={-c.x0}
              top={c.yA}
              background={bg}
              overlay={lightA}
              text={from}
              size={fsA}
              color={ink ?? stage.fg}
              scale={driftA * scale}
              glide={glide}
              scaling={driftingA}
              fontFamily={fontFamily}
              fontWeight={fontWeight}
            />
          ) : null}
          {c.p > 0 ? (
            <Scene
              W={W}
              H={H}
              left={-c.x0}
              top={c.yB}
              background={groundB}
              overlay={sheenB}
              text={to}
              size={fsB}
              color={ink ?? stage.toFg}
              scale={scaleB * scale}
              glide={glide}
              scaling={settlingB}
              fontFamily={fontFamily}
              fontWeight={fontWeight}
            />
          ) : null}
          {c.moving ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                transform: slideY(c.up ? c.seamY : c.seamY - seam),
                height: seam,
                background: accent,
              }}
            />
          ) : null}
          {c.k > 0 && c.p < 1 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: slideY(c.yA),
                width: Math.max(1, u),
                height: H,
                background: stage.dim,
                opacity: guides,
              }}
            />
          ) : null}
        </div>
      ))}
      {grain ? <Grain opacity={theme === "light" ? 0.04 : 0.055} /> : null}
    </AbsoluteFill>
  );
}
