"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export type BlinkLayout =
  | "giant"
  | "center"
  | "dot"
  | "corner"
  | "top-left"
  | "low-right"
  | "crop-right"
  | "crop-left"
  | "crop-bottom";

export type BlinkGround = "base" | "invert" | "accent";

export interface BlinkWord {
  text: string;
  /** Where and how big the word sits. Defaults cycle through a fixed rhythm. */
  layout?: BlinkLayout;
  /** Background for this cut. */
  ground?: BlinkGround;
  /** How many beats (of `framesPerWord`) this word stays on screen. */
  beats?: number;
}

export interface BlinkCutProps {
  /** One- or two-syllable words, one per cut. Strings or per-word overrides. */
  words?: Array<string | BlinkWord>;
  /** Length of one beat. 5–7 reads at speed without strobing. */
  framesPerWord?: number;
  /** Wordmark on the closing lockup. */
  brand?: string;
  /** One line under the wordmark. Pass "" to hide. */
  line?: string;
  /** Replaces the default mark in the lockup. */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_WORDS: BlinkWord[] = [
  { text: "Cut", layout: "giant", ground: "base" },
  { text: "Fast", layout: "crop-right", ground: "base" },
  { text: "small", layout: "corner", ground: "base" },
  { text: "Loud", layout: "crop-bottom", ground: "invert" },
  { text: "Bold", layout: "top-left", ground: "base" },
  { text: "Sharp", layout: "center", ground: "accent" },
  { text: "Clean", layout: "low-right", ground: "base" },
  { text: "Snap", layout: "crop-left", ground: "invert" },
  { text: "Beat", layout: "giant", ground: "base" },
  { text: "quiet", layout: "dot", ground: "base" },
  { text: "Type", layout: "crop-bottom", ground: "accent" },
  { text: "Move", layout: "top-left", ground: "invert" },
  { text: "Hold", layout: "center", ground: "base" },
  { text: "Ship", layout: "giant", ground: "invert" },
  { text: "Now", layout: "crop-right", ground: "accent" },
];

const LAYOUT_CYCLE: BlinkLayout[] = [
  "giant",
  "crop-right",
  "corner",
  "crop-bottom",
  "top-left",
  "center",
  "low-right",
  "crop-left",
  "dot",
];
const GROUND_CYCLE: BlinkGround[] = [
  "base",
  "base",
  "invert",
  "base",
  "accent",
  "base",
  "invert",
];

const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F5F4F0", muted: "#8A8984" },
  light: { bg: "#F5F4F0", fg: "#0A0A0B", muted: "#6E6C67" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Bricolage Grotesque 500 advance per character at display tracking, in em. */
const ADVANCE = 0.54;

/** gradients.sh "beam": the closest palette to the remocn accent family. */
const BEAM = {
  bg: "#02030a",
  colors: ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"],
} as const;

/** A beam mesh ground. `seed` moves the blobs per cut, `t` drifts them a little. */
function beamGround(seed: number, t: number, accent: string) {
  const [, c1, , c3] = BEAM.colors;
  // The accent prop takes the palette's own blue slot (#3d5bff by default).
  const c2 = accent;
  const sx = ((seed * 37) % 23) - 11;
  const d = t * 4;
  return [
    `radial-gradient(70% 85% at ${78 - sx * 0.6 - d}% ${84 - d}%, color-mix(in oklab, ${c1} 70%, transparent) 0%, transparent 66%)`,
    `radial-gradient(95% 110% at ${18 + sx * 0.4}% ${88 + d}%, ${c2} 0%, transparent 70%)`,
    `radial-gradient(85% 95% at ${86 + d}% ${16 + sx * 0.3}%, ${c3} 0%, transparent 72%)`,
    `linear-gradient(160deg, ${c3} 0%, ${c2} 100%)`,
  ].join(", ");
}

/** The same palette as a clip fill for type on the light stage. */
function beamInk(seed: number, t: number, accent: string) {
  const [, c1, , c3] = BEAM.colors;
  const c2 = accent;
  const a = 104 + ((seed * 29) % 30) + t * 6;
  return `linear-gradient(${a}deg, ${c3} 0%, ${c2} 46%, color-mix(in oklab, ${c1} 70%, ${c2}) 100%)`;
}

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

interface Spec {
  size: number;
  weight: number;
  tracking: string;
  style: React.CSSProperties;
}

function layoutSpec(
  layout: BlinkLayout,
  text: string,
  W: number,
  H: number,
): Spec {
  const fit = (target: number, maxWidth: number) =>
    Math.min(target, maxWidth / Math.max(1, text.length * ADVANCE));
  const pad = H * 0.075;
  switch (layout) {
    case "giant":
      return {
        size: fit(H * 0.56, W * 0.86),
        weight: 500,
        tracking: "-0.04em",
        style: { left: 0, right: 0, top: "50%", textAlign: "center" },
      };
    case "center":
      return {
        size: fit(H * 0.17, W * 0.7),
        weight: 500,
        tracking: "-0.03em",
        style: { left: 0, right: 0, top: "50%", textAlign: "center" },
      };
    case "dot":
      return {
        size: H * 0.036,
        weight: 400,
        tracking: "-0.01em",
        style: { left: 0, right: 0, top: "50%", textAlign: "center" },
      };
    case "corner":
      return {
        size: H * 0.042,
        weight: 400,
        tracking: "-0.01em",
        style: { left: pad * 1.2, bottom: pad },
      };
    case "top-left":
      return {
        size: fit(H * 0.26, W * 0.6),
        weight: 500,
        tracking: "-0.035em",
        style: { left: pad * 1.1, top: pad * 0.7 },
      };
    case "low-right":
      return {
        size: fit(H * 0.13, W * 0.5),
        weight: 500,
        tracking: "-0.03em",
        style: { right: pad * 1.2, bottom: pad * 0.9, textAlign: "right" },
      };
    case "crop-right":
      return {
        size: H * 0.98,
        weight: 500,
        tracking: "-0.04em",
        style: { left: W * 0.36, top: "54%" },
      };
    case "crop-left":
      return {
        size: H * 0.98,
        weight: 500,
        tracking: "-0.04em",
        style: { right: W * 0.38, top: "46%", textAlign: "right" },
      };
    case "crop-bottom":
      return {
        size: fit(H * 1.05, W * 0.94),
        weight: 500,
        tracking: "-0.04em",
        style: { left: 0, right: 0, top: H * 0.3, textAlign: "center" },
      };
  }
}

const CENTERED: BlinkLayout[] = [
  "giant",
  "center",
  "dot",
  "crop-right",
  "crop-left",
];

export function BlinkCut({
  words = DEFAULT_WORDS,
  framesPerWord = 6,
  brand = "remocn",
  line = "Launch films, built in Remotion.",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BlinkCutProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const beat = Math.max(1, Math.round(framesPerWord));

  const cuts = words.map((w, i) => {
    const word = typeof w === "string" ? { text: w } : w;
    return {
      text: word.text,
      layout: word.layout ?? LAYOUT_CYCLE[i % LAYOUT_CYCLE.length],
      ground: word.ground ?? GROUND_CYCLE[i % GROUND_CYCLE.length],
      length: beat * Math.max(1, Math.round(word.beats ?? 1)),
    };
  });

  let start = 0;
  let active = -1;
  let local = 0;
  let activeLength = beat;
  for (let i = 0; i < cuts.length; i++) {
    if (frame >= start && frame < start + cuts[i].length) {
      active = i;
      local = frame - start;
      activeLength = cuts[i].length;
    }
    start += cuts[i].length;
  }
  const lockupStart = start;
  let background: string = c.bg;
  let content: React.ReactNode = null;

  const dark = theme === "dark";

  if (active === -1) {
    const t = Math.max(0, frame - lockupStart);
    const lineIn = interpolate(t, [6, 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    // The beam glow rises a touch under the lockup and keeps drifting.
    const rise =
      6 -
      interpolate(t, [0, 24], [0, 6], {
        ...CLAMP,
        easing: EASE_OUT,
      }) -
      t * 0.04;
    const [c0, c1, , c3] = BEAM.colors;
    const c2 = accent;
    const ground = dark
      ? [
          `radial-gradient(64% 44% at 50% ${104 + rise}%, color-mix(in oklab, ${c0} 50%, transparent) 0%, color-mix(in oklab, ${c1} 55%, transparent) 22%, color-mix(in oklab, ${c2} 50%, transparent) 50%, transparent 78%)`,
          `radial-gradient(120% 70% at 50% ${118 + rise}%, color-mix(in oklab, ${c3} 95%, transparent) 0%, transparent 72%)`,
          `linear-gradient(180deg, ${c.bg} 0%, ${BEAM.bg} 100%)`,
        ].join(", ")
      : [
          `radial-gradient(64% 46% at 50% ${100 + rise}%, color-mix(in oklab, ${c2} 70%, transparent) 0%, color-mix(in oklab, ${c1} 55%, transparent) 30%, color-mix(in oklab, ${c0} 40%, transparent) 56%, transparent 80%)`,
          `linear-gradient(${c.bg}, ${c.bg})`,
        ].join(", ");
    const isRemocn = !logo && brand.toLowerCase() === "remocn";
    background = ground;
    content = (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: H * 0.045,
          }}
        >
          {isRemocn ? (
            <RemocnLogo fontSize={H * 0.17} color={c.fg} />
          ) : (
            <div
              style={{ display: "flex", alignItems: "center", gap: H * 0.022 }}
            >
              {logo}
              <div
                style={{
                  fontFamily: display,
                  fontWeight: 500,
                  fontSize: H * 0.135,
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                  color: c.fg,
                }}
              >
                {brand}
              </div>
            </div>
          )}
          {line ? (
            <div
              style={{
                fontFamily: display,
                fontWeight: 400,
                fontSize: H * 0.036,
                letterSpacing: "-0.01em",
                color: c.muted,
                opacity: lineIn,
                transform: `translateY(${(1 - lineIn) * H * 0.012}px)`,
              }}
            >
              {line}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  } else {
    const cut = cuts[active];
    const isAccent = cut.ground === "accent";
    const p = local / activeLength;
    background =
      isAccent && dark
        ? beamGround(active, p, accent)
        : cut.ground === "invert"
          ? c.fg
          : c.bg;
    const ink: React.CSSProperties =
      isAccent && !dark
        ? {
            backgroundImage: beamInk(active, p, accent),
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }
        : {
            color:
              cut.ground === "invert" ? c.bg : isAccent ? BEAM.colors[0] : c.fg,
          };
    const spec = layoutSpec(cut.layout, cut.text, W, H);
    // A hair of drift keeps each cut alive without softening the hard edit.
    const drift = interpolate(local, [0, activeLength], [0, 1], CLAMP);
    const scale = 1 + drift * (CENTERED.includes(cut.layout) ? 0.025 : 0.015);
    const vertical =
      spec.style.top !== undefined && spec.style.bottom === undefined
        ? typeof spec.style.top === "string"
          ? "translateY(-50%)"
          : ""
        : "";
    const origin =
      cut.layout === "corner" || cut.layout === "top-left"
        ? "left center"
        : cut.layout === "low-right"
          ? "right center"
          : "center center";
    content = (
      <div
        style={{
          position: "absolute",
          ...spec.style,
          fontFamily: display,
          fontWeight: spec.weight,
          fontSize: spec.size,
          letterSpacing: spec.tracking,
          lineHeight: 0.9,
          ...ink,
          whiteSpace: "nowrap",
          transform: `${vertical} scale(${scale})`,
          transformOrigin: origin,
        }}
      >
        {cut.text}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      {content}
    </AbsoluteFill>
  );
}
