"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const sans = manrope.fontFamily;
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface CollabLockupProps {
  left?: string;
  right?: string;
  leftLogo?: React.ReactNode;
  rightLogo?: React.ReactNode;
  joiner?: "×" | "&";
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_LEFT = "remocn";
const DEFAULT_RIGHT = "Kitebase";

/** Manrope 500 advance widths (per 1000 em) for ASCII 32–126. */
const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const TRACK = -0.03;
/** RemocnLogo width in em: R mark (0.76em tall) + 0.04em gap + "emocn" in Manrope 600 at -0.025em. */
const LOGO_EM = (0.76 * 124.06) / 134.26 + 0.04 + 3.271 - 5 * 0.025;
const MANROPE_BASELINE = 0.883;

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
        whiteSpace: "nowrap",
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

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  // gradients.sh "radial-glow": a lit horizon arc rising under the lockup.
  dark: {
    bg: "#020204",
    fg: "#F3F2EF",
    muted: "#9A98A6",
    rule: "rgba(243,241,255,0.26)",
    arc: [
      "rgba(243,241,255,0.78)",
      "rgba(157,180,255,0.42)",
      "rgba(90,70,203,0.26)",
    ],
    haze: "rgba(90,70,203,0.2)",
    grain: 0.07,
  },
  // gradients.sh "pixel-glass" (light): the same arc in violet, pink and blue.
  light: {
    bg: "#F4F3F1",
    fg: "#121214",
    muted: "#6A6870",
    rule: "rgba(18,18,20,0.22)",
    arc: [
      "rgba(122,60,255,0.46)",
      "rgba(255,79,184,0.24)",
      "rgba(61,107,255,0.12)",
    ],
    haze: "rgba(61,107,255,0.08)",
    grain: 0.045,
  },
} as const;

function em(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? MANROPE_500[code - 32] : 600) / 1000;
    w += TRACK;
  }
  return w;
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

function KiteMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M24 4 L41 20 L24 44 Z" fill={color} />
      <path d="M24 4 L7 20 L24 44 Z" fill={color} opacity={0.55} />
    </svg>
  );
}

function isRemocn(name: string) {
  return name.trim().toLowerCase() === "remocn";
}

function sideEm(name: string, logo: boolean) {
  if (isRemocn(name) && !logo) return LOGO_EM;
  return (logo ? 0.78 + 0.24 : 0) + em(name);
}

function Side({
  name,
  logo,
  size,
  color,
}: {
  name: string;
  logo: React.ReactNode;
  size: number;
  color: string;
}) {
  if (isRemocn(name) && !logo) {
    return <RemocnLogo fontSize={size} color={color} />;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: logo ? size * 0.24 : 0,
        whiteSpace: "nowrap",
      }}
    >
      {logo ? (
        <div
          style={{
            alignSelf: "baseline",
            display: "flex",
            transform: `translateY(${size * 0.02}px)`,
          }}
        >
          {logo}
        </div>
      ) : null}
      <span
        style={{
          fontFamily: sans,
          fontWeight: 500,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: `${TRACK}em`,
          color,
        }}
      >
        {name}
      </span>
    </div>
  );
}

export function CollabLockup({
  left = DEFAULT_LEFT,
  right = DEFAULT_RIGHT,
  leftLogo,
  rightLogo,
  joiner = "×",
  caption = "Launch videos, rendered from every Kitebase workspace.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: CollabLockupProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];

  const joinerEm = joiner === "&" ? 0.62 : 0.42;
  const joinerScale = 1.7;
  const natural =
    sideEm(left, !!leftLogo) +
    sideEm(
      right,
      rightLogo === undefined ? right === DEFAULT_RIGHT : !!rightLogo,
    ) +
    joinerEm * joinerScale +
    0.9;
  const N = Math.min(92 * u, (W * 0.8) / natural);
  const lockupW = natural * N + N * 0.2;
  const J = N * joinerScale;
  const markSize = N * 0.78;

  const lLogo = leftLogo ?? null;
  const rLogo =
    rightLogo ??
    (right === DEFAULT_RIGHT ? (
      <KiteMark size={markSize} color={c.fg} />
    ) : null);

  const glide = (start: number) => (frame: number) =>
    interpolate(frame, [start, start + 26], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const gL = glide(0);
  const gR = glide(2);
  const travel = W * 0.36;

  const drop = spring({
    frame: t - 16,
    fps,
    config: { damping: 22, stiffness: 170, mass: 0.9 },
  });
  const dropIn = interpolate(t, [16, 22], [0, 1], CLAMP);
  const impact = spring({
    frame: t - 25,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.6 },
  });
  const recoil = Math.sin(Math.min(1, impact) * Math.PI) * 7 * u;

  const rule = interpolate(t, [34, 62], [0, 1], { ...CLAMP, easing: EASE_IO });
  const cap = interpolate(t, [54, 78], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const push = interpolate(t, [0, 150], [0, 1], CLAMP);

  const baseline = H * 0.47;
  const dawn = interpolate(t, [8, 70], [0, 1], { ...CLAMP, easing: EASE_IO });
  const arcY = 134 - dawn * 6 - push * 2;
  const ground = [
    `radial-gradient(64% 78% at 50% ${arcY}%, transparent 55%, ${c.arc[0]} 58.4%, ${c.arc[1]} 61.5%, ${c.arc[2]} 69%, transparent 84%)`,
    `radial-gradient(90% 55% at 50% ${arcY - 22}%, ${c.haze} 0%, transparent 70%)`,
  ].join(", ");
  const gap = N * 0.42;

  const sideLayer = (side: "l" | "r") => {
    const g = side === "l" ? gL : gR;
    const dir = side === "l" ? -1 : 1;
    const x = (frame: number) => dir * (1 - g(frame)) * travel;
    const now = x(t);
    const v = now - x(t - 1);
    const off = now + dir * recoil;
    const opacity = interpolate(t, side === "l" ? [0, 9] : [2, 11], [0, 1], {
      ...CLAMP,
    });
    const node = (
      <Side
        name={side === "l" ? left : right}
        logo={side === "l" ? lLogo : rLogo}
        size={N}
        color={c.fg}
      />
    );
    const speedPx = Math.abs(v);
    const ghosts = speedPx > 2 * u ? [1, 2, 3] : [];
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "baseline",
        }}
      >
        {ghosts.map((k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              opacity: opacity * (0.22 / k) * Math.min(1, speedPx / (20 * u)),
              transform: `translateX(${off - v * k * 0.45}px)`,
            }}
          >
            {node}
          </div>
        ))}
        <div
          style={{
            opacity,
            transform: `translateX(${off}px)`,
          }}
        >
          {node}
        </div>
      </div>
    );
  };

  const jy = (1 - drop) * -H * 0.55;
  const jr = (1 - drop) * (joiner === "×" ? -45 : -10);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ background: ground, opacity: 0.25 + 0.75 * dawn }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${1 + push * 0.03})`,
          transformOrigin: `50% ${(baseline / H) * 100}%`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: H - baseline - N * (1 - MANROPE_BASELINE),
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "baseline",
              gap,
            }}
          >
            {sideLayer("l")}
            {joiner === "&" ? (
              <span
                style={{
                  fontFamily: serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: J,
                  lineHeight: 0.8,
                  color: accent,
                  opacity: dropIn,
                  display: "inline-block",
                  transform: `translateY(${jy + J * 0.1}px) rotate(${jr}deg)`,
                  transformOrigin: "50% 70%",
                }}
              >
                &amp;
              </span>
            ) : (
              <svg
                width={N * 0.7}
                height={N * 0.7}
                viewBox="0 0 100 100"
                aria-hidden
                style={{
                  alignSelf: "baseline",
                  opacity: dropIn,
                  overflow: "visible",
                  transform: `translateY(${jy - N * 0.01}px) rotate(${jr}deg)`,
                }}
              >
                <path d="M8 18 L18 8 L92 82 L82 92 Z" fill={accent} />
                <path d="M82 8 L92 18 L18 92 L8 82 Z" fill={accent} />
              </svg>
            )}
            {sideLayer("r")}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: (W - lockupW) / 2,
            width: lockupW,
            top: baseline + N * 0.3,
            height: Math.max(1, u),
            background: c.rule,
            transform: `scaleX(${rule})`,
          }}
        />
        {caption ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: baseline + N * 0.3 + 30 * u,
              textAlign: "center",
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 21 * u,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: c.muted,
              opacity: cap,
              transform: `translateY(${(1 - cap) * 12 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {caption}
          </div>
        ) : null}
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
