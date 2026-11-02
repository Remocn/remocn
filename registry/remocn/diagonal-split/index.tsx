"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface DiagonalSplitProps {
  from?: React.ReactNode;
  to?: React.ReactNode;
  angle?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SEAM_AT = 12;
const SEAM_END = 22;
const SLIDE_AT = 16;
const SLIDE_END = 52;

const SEAM = Easing.bezier(0.22, 1, 0.36, 1);
const SLIDE = Easing.bezier(0.66, 0, 0.36, 1);
const BAND_OUT = Easing.bezier(0.5, 0, 0.2, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const B_TONE = { bg: "#050507", fg: "#F3F2EF", light: "rgba(255,255,255,0)" };

const STAGES = {
  dark: {
    a: { bg: "#0A0A0B", fg: "#F3F2EF", light: "rgba(255,255,255,0.055)" },
    b: B_TONE,
    edge: "rgba(255,226,196,0.5)",
    shadow: "rgba(0,0,0,0.5)",
  },
  light: {
    a: { bg: "#F5F4F0", fg: "#121214", light: "rgba(255,255,255,0.9)" },
    b: B_TONE,
    edge: "rgba(255,226,196,0.9)",
    shadow: "rgba(0,0,0,0.36)",
  },
};

// "fluted" palette from gradients.sh (bg #050507, #1d2a8f, #2f7bff → accent, #ff7a3d, #ffe2c4):
// cool light from the top-left, a warm streak running parallel to the seam, and faint flutes
// along the same angle, so the revealed ground carries the cut's direction. Drifts a few percent.
function flutedGround(angle: number, accent: string, k: number, u: number) {
  const n = 180 - angle;
  const c = 80 - 3 * k;
  // Unit normal of the seam in screen space: the warm streak sits on its + side, the cool
  // light on the opposite side, so the two never mix into mud whatever the angle.
  const nx = Math.sin((n * Math.PI) / 180);
  const ny = -Math.cos((n * Math.PI) / 180);
  const at = (d: number) =>
    `${(50 + d * nx).toFixed(1)}% ${(50 + d * ny).toFixed(1)}%`;
  return [
    `repeating-linear-gradient(${n}deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) ${u}px, rgba(255,255,255,0) ${u}px, rgba(255,255,255,0) ${22 * u}px)`,
    `linear-gradient(${n}deg, rgba(255,122,61,0) ${c - 16}%, rgba(255,122,61,0.5) ${c - 5}%, rgba(255,226,196,0.72) ${c}%, rgba(255,122,61,0.45) ${c + 5}%, rgba(255,122,61,0) ${c + 15}%)`,
    `radial-gradient(70% 80% at ${at(-34 + 4 * k)}, color-mix(in oklab, ${accent} 55%, transparent) 0%, rgba(47,123,255,0) 70%)`,
    `radial-gradient(95% 110% at ${at(-62)}, rgba(29,42,143,0.95) 0%, rgba(29,42,143,0) 72%)`,
    `radial-gradient(60% 70% at ${at(66)}, rgba(255,122,61,0.28) 0%, rgba(255,122,61,0) 70%)`,
    "#050507",
  ].join(", ");
}

// Geist 500 advances (1/1000 em, ASCII 32–126), from HarfBuzz.
const GEIST_ADV = [
  243, 228, 361, 515, 643, 810, 649, 186, 290, 290, 427, 562, 213, 418, 213,
  494, 673, 406, 630, 625, 629, 641, 604, 531, 624, 606, 302, 302, 546, 544,
  546, 570, 925, 689, 688, 713, 701, 609, 595, 713, 716, 280, 607, 656, 583,
  890, 745, 751, 657, 745, 680, 654, 568, 694, 688, 968, 633, 594, 561, 361,
  470, 361, 438, 558, 258, 565, 608, 563, 608, 576, 412, 607, 591, 256, 284,
  609, 282, 885, 591, 588, 608, 608, 394, 537, 410, 586, 560, 829, 607, 553,
  552, 395, 274, 395, 523,
];
const TRACK = -0.035;

function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c < 127 ? GEIST_ADV[c - 32] : 560) / 1000 + TRACK;
  }
  return Math.max(w, 0.5);
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
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Scene({
  content,
  tone,
  max,
  bare = false,
  ground,
}: {
  content: React.ReactNode;
  tone: { bg: string; fg: string; light: string };
  max: number;
  bare?: boolean;
  ground?: string;
}) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  return (
    <AbsoluteFill
      style={{ background: bare ? undefined : (ground ?? tone.bg) }}
    >
      {bare || ground ? null : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 80% 90% at 24% 0%, ${tone.light}, transparent 70%)`,
          }}
        />
      )}
      {typeof content === "string" ? (
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <div
            style={{
              fontFamily: display,
              fontWeight: 500,
              fontSize: Math.min(max * u, (0.82 * W) / widthEm(content)),
              letterSpacing: `${TRACK}em`,
              lineHeight: 1,
              whiteSpace: "nowrap",
              color: tone.fg,
              paddingBottom: 0.06 * Math.min(max * u, W / widthEm(content)),
            }}
          >
            {content}
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill>{content}</AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

export function DiagonalSplit({
  from = "Built in a weekend",
  to = "Launched on Monday",
  angle = 28,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DiagonalSplitProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = STAGES[theme];

  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = -Math.sin(rad);
  const nx = dy;
  const ny = -dx;
  const cx = W / 2;
  const cy = H / 2;
  const L = 2 * (W + H);

  const seam = SEAM(interpolate(t, [SEAM_AT, SEAM_END], [0, 1], CLAMP));
  const slide = SLIDE(interpolate(t, [SLIDE_AT, SLIDE_END], [0, 1], CLAMP));
  const reachN = (W * Math.abs(nx) + H * Math.abs(ny)) / 2;
  const travel = 0.32 * W * slide;
  const gap = 18 * u * seam + 2.3 * reachN * slide;
  const bandOut = BAND_OUT(interpolate(t, [24, 42], [0, 1], CLAMP));
  const band = 18 * u * seam * (1 - bandOut);
  const settle = SETTLE(
    interpolate(t, [SLIDE_AT, SLIDE_END + 18], [0, 1], CLAMP),
  );
  const bScale = 1.05 - 0.05 * settle;
  const gone = slide >= 0.999;
  const deg = -angle;

  const halfPoly = (side: 1 | -1) => {
    const ax = cx - dx * L;
    const ay = cy - dy * L;
    const bx = cx + dx * L;
    const by = cy + dy * L;
    const ox = nx * L * side;
    const oy = ny * L * side;
    return `polygon(${[
      [ax, ay],
      [bx, by],
      [bx + ox, by + oy],
      [ax + ox, ay + oy],
    ]
      .map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`)
      .join(", ")})`;
  };

  const half = (side: 1 | -1) => {
    const along = side * travel;
    const tx = dx * along + nx * side * (gap / 2);
    const ty = dy * along + ny * side * (gap / 2);
    return (
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px)`,
          filter:
            seam > 0
              ? `drop-shadow(${nx * side * 8 * u}px ${ny * side * 8 * u}px ${22 * u}px ${stage.shadow})`
              : undefined,
        }}
      >
        <AbsoluteFill style={{ clipPath: halfPoly(side) }}>
          <div
            style={{
              position: "absolute",
              left: -W,
              top: -H,
              width: 3 * W,
              height: 3 * H,
              background: `radial-gradient(ellipse ${0.8 * W}px ${0.9 * H}px at ${1.24 * W}px ${H}px, ${stage.a.light}, transparent 70%), ${stage.a.bg}`,
            }}
          />
          <Scene content={from} tone={stage.a} max={134} bare />
          <div
            style={{
              position: "absolute",
              left: cx - L / 2,
              top: cy - (side === 1 ? 1 : 0) * u,
              width: L,
              height: u,
              background: stage.edge,
              opacity: seam,
              transformOrigin: "50% 0",
              transform: `rotate(${deg}deg)`,
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  };

  return (
    <AbsoluteFill style={{ background: stage.b.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${bScale})` }}>
        <Scene
          content={to}
          tone={stage.b}
          max={134}
          ground={flutedGround(
            angle,
            accent,
            interpolate(t, [SLIDE_AT, SLIDE_END + 30], [0, 1], CLAMP),
            u,
          )}
        />
      </AbsoluteFill>
      {band > 0.2 ? (
        <div
          style={{
            position: "absolute",
            left: cx - L / 2,
            top: cy - band / 2,
            width: L,
            height: band,
            background:
              "linear-gradient(180deg, #ff7a3d 0%, #ffe2c4 50%, #ff7a3d 100%)",
            transform: `rotate(${deg}deg)`,
          }}
        />
      ) : null}
      {seam <= 0 ? <Scene content={from} tone={stage.a} max={134} /> : null}
      {gone || seam <= 0 ? null : (
        <>
          {half(1)}
          {half(-1)}
        </>
      )}
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
