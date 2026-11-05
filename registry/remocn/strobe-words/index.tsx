"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Sora";
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
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

// gradients.sh "radial-glow" palette (bg #020204): #f3f1ff, #9db4ff, #5a46cb, #1d1240.
const GLOW = ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240", "#020204"] as const;

// Sora 500 advances (1/1000 em), ASCII 32–126, measured with HarfBuzz.
const SORA_500 = [
  222, 303, 452, 702, 652, 864, 702, 264, 382, 382, 568, 592, 266, 506, 266,
  365, 750, 423, 623, 620, 652, 630, 668, 585, 647, 668, 266, 266, 592, 590,
  592, 556, 1124, 765, 684, 797, 788, 598, 560, 832, 803, 320, 641, 703, 549,
  937, 858, 865, 649, 865, 710, 682, 602, 785, 719, 1052, 705, 654, 652, 382,
  365, 382, 587, 581, 300, 581, 694, 608, 694, 616, 380, 679, 644, 317, 324,
  595, 296, 973, 644, 678, 694, 694, 414, 543, 429, 634, 572, 873, 574, 555,
  493, 382, 375, 382, 511,
];
const TRACK = -0.045;

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

export interface StrobeWordsProps {
  words?: string[];
  rhythm?: number[];
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CAP = 0.73;
const BASE = 0.84;
const INK = "#0A0A0B";
const PAPER = "#F5F4F0";
const PAPER_INK = "#121214";

type Field = "accent" | "ink" | "paper";
const CYCLE: Field[] = ["accent", "ink", "paper"];

function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const adv = code >= 32 && code < 127 ? SORA_500[code - 32] : 600;
    w += adv / 1000 + TRACK;
  }
  return Math.max(w, 0.5);
}

function defaultRhythm(count: number) {
  let n = count - 1;
  while (n < 13) n += count;
  return Array.from({ length: n }, (_, i) =>
    Math.round(6 - (3 * i) / Math.max(1, n - 1)),
  );
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

function Word({
  text,
  size,
  color,
  stop,
  fill,
}: {
  text: string;
  size: number;
  color: string;
  stop: string;
  fill?: string;
}) {
  const { height: H } = useVideoConfig();
  const baseline = H / 2 + (CAP * size) / 2;
  const tail = text.match(/[.!?]$/) ? text.slice(-1) : "";
  const body = tail ? text.slice(0, -1) : text;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: baseline - BASE * size,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: display,
          fontWeight: 500,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: `${TRACK}em`,
          paddingLeft: `${-TRACK}em`,
          whiteSpace: "nowrap",
          color,
        }}
      >
        {fill ? (
          <span
            style={{
              color: "transparent",
              backgroundImage: fill,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              paddingRight: "0.08em",
              marginRight: "-0.08em",
            }}
          >
            {body}
          </span>
        ) : (
          body
        )}
        {tail ? <span style={{ color: stop }}>{tail}</span> : null}
      </div>
    </div>
  );
}

export function StrobeWords({
  words = ["Plan.", "Write.", "Render.", "Ship."],
  rhythm,
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: StrobeWordsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const list = words.length > 0 ? words : ["Ship."];
  const beats =
    rhythm && rhythm.length > 0 ? rhythm : defaultRhythm(list.length);
  const poster: Field = theme === "light" ? "paper" : "ink";

  const offset = (((CYCLE.indexOf("accent") - (beats.length - 1)) % 3) + 3) % 3;

  let index = beats.length;
  let at = 0;
  for (let i = 0; i < beats.length; i++) {
    if (t < at + beats[i]) {
      index = i;
      break;
    }
    at += beats[i];
  }
  const isPoster = index >= beats.length;
  const field: Field = isPoster ? poster : CYCLE[(index + offset) % 3];
  const text = isPoster
    ? list[list.length - 1]
    : list[
        (((index - beats.length + list.length - 1) % list.length) +
          list.length) %
          list.length
      ];

  // Each strobe beat on the accent field is a radial-glow ground; the disc
  // sits in a slightly different place per beat so the cuts read as light.
  const k = isPoster ? 0 : index;
  const bx = 50 + ((k * 37) % 5) * 5 - 10;
  const glowField = [
    `radial-gradient(52% 64% at ${bx}% 104%, ${GLOW[0]} 0%, color-mix(in oklab, ${GLOW[1]} 85%, transparent) 30%, transparent 72%)`,
    `radial-gradient(90% 90% at ${100 - bx}% 0%, color-mix(in oklab, ${GLOW[3]} 80%, transparent) 0%, transparent 70%)`,
    `linear-gradient(180deg, ${GLOW[3]} 0%, ${GLOW[2]} 62%, #7e6fe0 100%)`,
  ].join(", ");
  const rise = interpolate(t - at, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  // Poster: the glow's ring reads as a horizon arc low in frame, rising a
  // few percent over the hold, under the word rather than around it.
  const posterGlow = [
    `radial-gradient(78% 62% at 50% ${142 - 6 * rise}%, color-mix(in oklab, ${GLOW[3]} 90%, transparent) 60%, color-mix(in oklab, ${GLOW[0]} 80%, transparent) 63%, color-mix(in oklab, ${GLOW[1]} 40%, transparent) 67%, transparent 80%)`,
    `radial-gradient(90% 60% at 50% 120%, color-mix(in oklab, ${GLOW[2]} 45%, transparent) 0%, transparent 70%)`,
    GLOW[4],
  ].join(", ");
  const bg =
    field === "accent"
      ? glowField
      : field === "ink"
        ? isPoster
          ? posterGlow
          : INK
        : PAPER;
  const fg = field === "paper" ? PAPER_INK : "#F7F7F5";
  const stop = field === "accent" ? GLOW[0] : accent;
  const posterFill =
    isPoster && field === "paper"
      ? `linear-gradient(180deg, ${GLOW[2]} 10%, ${GLOW[3]} 92%)`
      : undefined;

  const longest = list.reduce((m, w) => Math.max(m, widthEm(w)), 0.5);
  const strobeSize = Math.min(290 * u, (0.74 * W) / longest);
  const final = list[list.length - 1];
  const posterSize = Math.min(340 * u, (0.8 * W) / widthEm(final));

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Word
        text={text}
        size={isPoster ? posterSize : strobeSize}
        color={fg}
        stop={stop}
        fill={posterFill}
      />
      {isPoster ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0.085 * H,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10 * u,
            color: fg,
          }}
        >
          {logo ?? <RemocnLogo fontSize={28 * u} color={fg} />}
        </div>
      ) : null}
      <Grain opacity={field === "paper" ? 0.04 : 0.05} />
    </AbsoluteFill>
  );
}
