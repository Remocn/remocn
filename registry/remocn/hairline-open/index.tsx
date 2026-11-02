"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export interface HairlineOpenProps {
  from?: React.ReactNode;
  to?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DRAW_AT = 8;
const DRAW_END = 26;
const OPEN_AT = 36;
const OPEN_END = 62;

const DRAW = Easing.bezier(0.7, 0, 0.2, 1);
const SHEAR = Easing.bezier(0.22, 1, 0.36, 1);
const OPEN = Easing.bezier(0.7, 0, 0.3, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const STAGES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    light: "rgba(255,255,255,0.055)",
    edge: "rgba(143,180,255,0.55)",
    filament: (accent: string) =>
      `linear-gradient(90deg, transparent 0%, ${accent} 35%, #8fb4ff 88%, #f4f7ff 100%)`,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    light: "rgba(255,255,255,0.9)",
    edge: "rgba(143,180,255,0.7)",
    filament: (accent: string) =>
      `linear-gradient(90deg, transparent 0%, ${accent} 35%, #1a1660 100%)`,
  },
};

// Instrument Serif 400 advances (1/1000 em, ASCII 32–126), roman and italic, from HarfBuzz.
const SERIF_ADV = [
  170, 237, 371, 635, 417, 590, 579, 233, 340, 340, 444, 531, 217, 430, 213,
  258, 460, 249, 404, 371, 393, 382, 404, 364, 433, 402, 213, 217, 531, 531,
  531, 317, 660, 457, 478, 480, 530, 453, 408, 521, 546, 249, 249, 496, 413,
  665, 540, 540, 466, 540, 513, 407, 461, 536, 457, 651, 546, 477, 427, 325,
  258, 325, 433, 376, 354, 399, 443, 339, 457, 355, 288, 402, 470, 223, 215,
  451, 220, 704, 470, 408, 444, 442, 318, 308, 259, 454, 393, 597, 385, 401,
  353, 318, 252, 318, 531,
];
const SERIF_IT_ADV = [
  170, 275, 374, 629, 424, 591, 525, 235, 346, 346, 449, 531, 219, 426, 219,
  258, 461, 248, 404, 373, 394, 387, 411, 365, 437, 414, 299, 301, 531, 531,
  531, 358, 665, 457, 479, 475, 536, 454, 411, 514, 545, 250, 251, 499, 414,
  665, 542, 540, 469, 541, 525, 424, 461, 537, 458, 653, 545, 478, 427, 326,
  256, 326, 431, 372, 355, 474, 431, 351, 474, 348, 273, 401, 476, 288, 266,
  447, 240, 745, 521, 414, 450, 425, 368, 302, 272, 508, 412, 609, 450, 418,
  385, 320, 252, 320, 531,
];
const TRACK = -0.008;

function widthEm(text: string, italic: boolean) {
  const table = italic ? SERIF_IT_ADV : SERIF_ADV;
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c < 127 ? table[c - 32] : 420) / 1000 + TRACK;
  }
  return Math.max(w, 0.5);
}

// "beam" palette from gradients.sh (#f4f7ff, #8fb4ff, accent, #1a1660) laid out as a horizontal
// band of light centred on the hairline, so the slit reads as light pouring out. Drifts gently.
function beamGround(accent: string, k: number) {
  const x = 44 + 12 * k;
  const mix = (p: number) => `color-mix(in oklab, ${accent} ${p}%, #1a1660)`;
  const o = 2 * k;
  return [
    `radial-gradient(70% 30% at ${x}% 50%, rgba(143,180,255,0.24) 0%, rgba(143,180,255,0) 100%)`,
    `linear-gradient(180deg, #02030a 0%, #070726 ${10 - o}%, #1a1660 ${22 - o}%, ${mix(45)} ${33 - o}%, ${mix(80)} ${42 - o / 2}%, ${accent} 50%, ${mix(80)} ${58 + o / 2}%, ${mix(45)} ${67 + o}%, #1a1660 ${78 + o}%, #070726 ${90 + o}%, #02030a 100%)`,
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
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Title({
  content,
  color,
  max,
  italic = false,
}: {
  content: React.ReactNode;
  color: string;
  max: number;
  italic?: boolean;
}) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  if (typeof content !== "string")
    return <AbsoluteFill>{content}</AbsoluteFill>;
  const size = Math.min(max * u, (0.8 * W) / widthEm(content, italic));
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: serif,
          fontStyle: italic ? "italic" : "normal",
          fontWeight: 400,
          fontSize: size,
          letterSpacing: `${TRACK}em`,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color,
          paddingBottom: 0.04 * size,
          paddingRight: italic ? 0.04 * size : 0,
        }}
      >
        {content}
      </div>
    </AbsoluteFill>
  );
}

export function HairlineOpen({
  from = "Write the story",
  to = "Ship the film",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: HairlineOpenProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = STAGES[theme];
  const line = Math.max(1.5, 2.5 * u);

  const draw = DRAW(interpolate(t, [DRAW_AT, DRAW_END], [0, 1], CLAMP));
  const head = draw * W;
  const shear =
    6 * u * SHEAR(interpolate(t, [DRAW_END - 4, OPEN_AT + 2], [0, 1], CLAMP));
  const open = OPEN(interpolate(t, [OPEN_AT, OPEN_END], [0, 1], CLAMP));
  const gap = open * H * 1.24;
  const slide = 0.06 * W * open;
  const settle = SETTLE(
    interpolate(t, [OPEN_AT, OPEN_END + 16], [0, 1], CLAMP),
  );
  const bScale = 1.07 - 0.07 * settle;
  const panelsGone = gap / 2 >= H / 2 + 40 * u;
  const lineOn = draw > 0 && gap < line;

  const half = (top: boolean) => {
    const dir = top ? -1 : 1;
    const shift = top ? -(shear + slide) : shear + slide;
    const pad = 0.1 * W;
    return (
      <AbsoluteFill
        style={{
          transform: `translate(${shift}px, ${(dir * gap) / 2}px)`,
          filter:
            open > 0
              ? `drop-shadow(0 ${dir * 10 * u}px ${24 * u}px rgba(0,0,0,${0.28 * Math.min(1, open * 4)}))`
              : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -pad,
            width: W + 2 * pad,
            top: top ? 0 : H / 2,
            height: H / 2,
            overflow: "hidden",
            background: stage.bg,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: pad,
              top: top ? 0 : -H / 2,
              width: W,
              height: H,
            }}
          >
            <AbsoluteFill
              style={{
                background: `radial-gradient(ellipse 80% 90% at 24% 0%, ${stage.light}, transparent 70%)`,
              }}
            />
            <Title content={from} color={stage.fg} max={176} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: Math.max(1, u),
              [top ? "bottom" : "top"]: 0,
              background: stage.edge,
              opacity: Math.min(1, open * 6),
            }}
          />
        </div>
      </AbsoluteFill>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#02030a", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: beamGround(
            accent,
            interpolate(t, [OPEN_AT, OPEN_END + 40], [0, 1], CLAMP),
          ),
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${bScale})`,
          opacity: interpolate(gap, [0.05 * H, 0.32 * H], [0, 1], CLAMP),
        }}
      >
        <Title content={to} color="#F7F7F5" max={196} italic />
      </AbsoluteFill>
      {panelsGone ? null : (
        <>
          {half(true)}
          {half(false)}
        </>
      )}
      {lineOn ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: H / 2 - line / 2,
            width: head,
            height: line,
            background: stage.filament(accent),
          }}
        />
      ) : null}
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
