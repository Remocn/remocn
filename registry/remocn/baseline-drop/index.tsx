"use client";

import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface BaselineDropProps {
  text?: string;
  words?: string[];
  stagger?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/** Schibsted Grotesk 500 advance widths (per 1000 em) for ASCII 32–126. */
const SCHIBSTED_500 = [
  242, 251, 366, 672, 574, 867, 688, 205, 319, 319, 433, 635, 272, 481, 287,
  454, 617, 360, 579, 583, 596, 590, 601, 541, 588, 600, 287, 276, 635, 635,
  635, 539, 895, 710, 654, 707, 708, 591, 567, 721, 729, 373, 550, 678, 555,
  886, 739, 769, 630, 769, 648, 623, 656, 685, 688, 955, 675, 633, 606, 324,
  454, 324, 635, 500, 500, 563, 600, 560, 600, 580, 349, 562, 577, 253, 280,
  567, 271, 883, 591, 601, 600, 600, 417, 521, 351, 591, 567, 830, 572, 564,
  515, 336, 249, 336, 635,
];
const TRACK = -0.03;
const SPACE = 0.24;
const BASELINE = 0.8594;
const CAP = 0.703;

const DRAW = [4, 28] as const;
const FIRST_LAND = 30;
const FALL = 15;
const RETRACT_AFTER = 20;
const RETRACT_LEN = 22;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_FALL = Easing.bezier(0.5, 0, 0.9, 0.5);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  // gradients.sh "aurora": the ground under the baseline glows as words land.
  dark: {
    bg: "#03050B",
    fg: "#F2F4F1",
    line: "rgba(242,244,241,0.66)",
    grain: 0.07,
    glow: ["#A0F0C8", "#3FB5A3", "#5147B6", "#B25C9C"],
    glowMix: 62,
    bandMix: 34,
  },
  // gradients.sh "ribbon" (light): the same ground in pink, orange, gold and violet.
  light: {
    bg: "#F6F4F0",
    fg: "#121214",
    line: "rgba(18,18,20,0.55)",
    grain: 0.045,
    glow: ["#FF8A3D", "#FF3D9A", "#7A5CFF", "#FFC83D"],
    glowMix: 34,
    bandMix: 22,
  },
} as const;

function auroraGround(
  colors: readonly string[],
  mix: number,
  band: number,
  drift: number,
) {
  const n = colors.length;
  const blobs = colors.map((col, i) => {
    const x = 15 + (70 * i) / (n - 1) + Math.sin(drift * 2.4 + i * 1.9) * 3;
    const y = 4 + Math.cos(drift * 2 + i * 1.3) * 3;
    return `radial-gradient(30% 62% at ${x.toFixed(2)}% ${y.toFixed(2)}%, color-mix(in oklab, ${col} ${mix}%, transparent) 0%, transparent 70%)`;
  });
  return [
    ...blobs,
    `linear-gradient(180deg, color-mix(in oklab, ${colors[0]} ${band}%, transparent) 0%, transparent 46%)`,
  ].join(", ");
}

function em(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? SCHIBSTED_500[code - 32] : 600) / 1000;
    w += TRACK;
  }
  return w;
}

function landing(tau: number, amp: number) {
  if (tau <= 0) return 0;
  const omega = (2 * Math.PI) / 13;
  return amp * Math.exp(-tau * 0.26) * Math.sin(omega * tau);
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function BaselineDrop({
  text = "Ship the story.",
  words: wordsProp,
  stagger = 11,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BaselineDropProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const words = useMemo(
    () => wordsProp ?? text.trim().split(/\s+/),
    [wordsProp, text],
  );
  const total = useMemo(
    () => words.reduce((s, w) => s + em(w), 0) + SPACE * (words.length - 1),
    [words],
  );
  const F = Math.min(H * 0.2, (W * 0.78) / total);
  const baseY = H / 2 + (CAP * F) / 2;
  const rowTop = baseY - BASELINE * F;
  const line = Math.max(1, (H / 720) * 1.5);
  const margin = W * 0.08;

  const land = (k: number) => FIRST_LAND + k * stagger;
  const lastLand = land(words.length - 1);
  const retractStart = lastLand + RETRACT_AFTER;

  const drawn = interpolate(t, DRAW, [0, 1], { ...CLAMP, easing: EASE_IO });
  const retracted = interpolate(
    t,
    [retractStart, retractStart + RETRACT_LEN],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const push = interpolate(t, [0, retractStart + 60], [0, 1], CLAMP);

  const dropOf = (k: number) => {
    const tau = t - land(k);
    if (tau >= 0) return { y: landing(tau, F * 0.04), seen: true };
    const p = interpolate(t, [land(k) - FALL, land(k)], [0, 1], {
      ...CLAMP,
      easing: EASE_FALL,
    });
    const fallFrom = rowTop + F * 1.4;
    return { y: -fallFrom * (1 - p), seen: t > land(k) - FALL };
  };

  const landed = words.reduce(
    (sum, _, k) =>
      sum + interpolate(t, [land(k) - 2, land(k) + 10], [0, 1], CLAMP),
    0,
  );
  const glowLevel = 0.3 + (0.7 * landed) / Math.max(1, words.length);
  const ground = auroraGround(
    c.glow,
    c.glowMix,
    c.bandMix,
    interpolate(t, [0, retractStart + 60], [0, 1], CLAMP),
  );

  const contact = (k: number) =>
    interpolate(t - land(k), [0, 2, 24], [0, 1, 0], CLAMP);

  const row = (children: (w: string, k: number) => React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: rowTop,
        display: "flex",
        justifyContent: "center",
        gap: SPACE * F,
        whiteSpace: "pre",
        fontFamily: sans,
        fontWeight: 500,
        fontSize: F,
        lineHeight: 1,
        letterSpacing: `${TRACK}em`,
      }}
    >
      {words.map((w, k) => children(w, k))}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${1 + push * 0.02})`,
          transformOrigin: `50% ${(baseY / H) * 100}%`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: baseY + line,
            bottom: -H * 0.05,
            background: ground,
            opacity: glowLevel * drawn,
            maskImage: `linear-gradient(90deg, transparent ${(1 - drawn) * 40}%, black ${8 + (1 - drawn) * 40}%, black ${92 - (1 - drawn) * 40}%, transparent ${100 - (1 - drawn) * 40}%)`,
            WebkitMaskImage: `linear-gradient(90deg, transparent ${(1 - drawn) * 40}%, black ${8 + (1 - drawn) * 40}%, black ${92 - (1 - drawn) * 40}%, transparent ${100 - (1 - drawn) * 40}%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: margin,
            width: W - margin * 2,
            top: baseY,
            height: line,
            background: c.line,
            clipPath: `inset(0 ${(1 - drawn) * 100}% 0 ${retracted * 100}%)`,
          }}
        />
        {row((w, k) => (
          <span
            key={`c${k}`}
            style={{
              position: "relative",
              display: "inline-block",
              color: "transparent",
            }}
          >
            {w}
            <span
              style={{
                position: "absolute",
                left: -F * 0.04,
                right: -F * 0.04,
                top: BASELINE * F,
                height: line * 2.5,
                background: accent,
                opacity: contact(k) * (1 - retracted),
                transform: `scaleX(${0.6 + 0.4 * contact(k) ** 0.5})`,
              }}
            />
          </span>
        ))}
        {row((w, k) => {
          const { y, seen } = dropOf(k);
          return (
            <span
              key={`w${k}`}
              style={{
                display: "inline-block",
                color: c.fg,
                opacity: seen ? 1 : 0,
                transform: `translateY(${y}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
