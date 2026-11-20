"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
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
import { useGlide } from "@/lib/remocn/glide";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

// gradients.sh "beam" palette (bg #02030a): #f4f7ff, #8fb4ff, #3d5bff, #1a1660.
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660", "#02030a"] as const;

// Advance widths (1/1000 em), ASCII 32–126, measured with HarfBuzz.
const BRICO_500 = [
  246, 266, 317, 613, 630, 947, 756, 159, 305, 290, 395, 516, 165, 339, 196,
  354, 656, 320, 583, 595, 595, 600, 646, 494, 646, 641, 207, 188, 516, 516,
  516, 413, 952, 671, 666, 671, 691, 599, 578, 706, 709, 275, 358, 666, 508,
  909, 747, 716, 629, 719, 660, 641, 553, 718, 657, 957, 653, 600, 560, 315,
  342, 300, 547, 578, 283, 567, 618, 555, 617, 570, 380, 589, 608, 260, 266,
  561, 257, 913, 608, 604, 618, 617, 411, 535, 380, 599, 547, 827, 534, 591,
  500, 353, 260, 331, 516,
];
const SERIF_ITALIC = [
  170, 275, 374, 629, 424, 591, 525, 235, 346, 346, 449, 531, 219, 426, 219,
  258, 461, 248, 404, 373, 394, 387, 411, 365, 437, 414, 299, 301, 531, 531,
  531, 358, 665, 457, 479, 475, 536, 454, 411, 514, 545, 250, 251, 499, 414,
  665, 542, 540, 469, 541, 525, 424, 461, 537, 458, 653, 545, 478, 427, 326,
  256, 326, 431, 372, 355, 474, 431, 351, 474, 348, 273, 401, 476, 288, 266,
  447, 240, 745, 521, 414, 450, 425, 368, 302, 272, 508, 412, 609, 450, 418,
  385, 320, 252, 320, 531,
];
const TRACK = -0.035;
const SERIF_TRACK = -0.01;

export interface BeamSplitProps {
  title?: string;
  inner?: string;
  accent?: string;
  /** Text color of the title; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Color of the italic line inside the gap. */
  innerColor?: string;
  /** Frames the gap stays wide open before it narrows. */
  hold?: number;
  /** Typeface for the title. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  /** Film grain over the scene. */
  grain?: boolean;
  /** Size of the title and beam, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

// Cap height and line-box baseline (lineHeight 1) per face.
const CAP = 0.66;
const BASE = 0.83;
const SERIF_CAP = 0.72;
const SERIF_BASE = 0.84;

const RISE_AT = -6;
const RISE_END = 14;
const BEAM_AT = 10;
const BEAM_END = 30;
const OPEN_AT = 34;
const OPEN_END = 60;
const CLOSE_AT = 92;
const CLOSE_END = 116;

const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const DRAW = Easing.bezier(0.7, 0, 0.2, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);

const STAGES = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF" },
  light: { bg: "#F5F4F0", fg: "#121214" },
};

function widthEm(text: string, table: number[], track: number) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const adv = code >= 32 && code < 127 ? table[code - 32] : 600;
    w += adv / 1000 + track;
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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Line({
  text,
  baseline,
  size,
  color,
  italic = false,
  fontFamily = display,
}: {
  text: string;
  baseline: number;
  size: number;
  color: string;
  italic?: boolean;
  fontFamily?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: baseline - (italic ? SERIF_BASE : BASE) * size,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: italic ? serif : fontFamily,
          fontStyle: italic ? "italic" : "normal",
          fontWeight: italic ? 400 : 500,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: `${italic ? SERIF_TRACK : TRACK}em`,
          paddingLeft: `${-(italic ? SERIF_TRACK : TRACK)}em`,
          whiteSpace: "nowrap",
          color,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Edge({
  y,
  anchor,
  draw,
  width,
  lw,
  accent,
  glowUp,
  glowDown,
  fall,
}: {
  y: number;
  /** While the edge travels: laid out here and carried to `y` by a transform. */
  anchor?: number;
  draw: number;
  width: number;
  lw: number;
  accent: string;
  glowUp: number;
  glowDown: number;
  fall: number;
}) {
  const fade =
    "linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)";
  // Layout rounds a strip's edges to whole pixels, so an edge eased by `top`
  // steps along unevenly; while it travels it sits at `anchor` and the rest of
  // the way is a transform. At rest it keeps its plain layout.
  const base = anchor ?? y;
  const strip: React.CSSProperties = {
    position: "absolute",
    left: 0,
    width,
    WebkitMaskImage: fade,
    maskImage: fade,
    transform: anchor === undefined ? undefined : `translateY(${y - anchor}px)`,
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: width * draw,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {glowUp > 0 ? (
        <div
          style={{
            ...strip,
            top: base - lw / 2 - fall,
            height: fall,
            opacity: glowUp,
            background: `linear-gradient(to top, ${accent}, transparent)`,
          }}
        />
      ) : null}
      {glowDown > 0 ? (
        <div
          style={{
            ...strip,
            top: base + lw / 2,
            height: fall,
            opacity: glowDown,
            background: `linear-gradient(to bottom, ${accent}, transparent)`,
          }}
        />
      ) : null}
      <div
        style={{
          ...strip,
          top: base - lw / 2,
          height: lw,
          background: accent,
        }}
      />
    </div>
  );
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

export function BeamSplit({
  title = "Ship the story",
  inner = "with motion you own",
  accent = "#3B5BFD",
  ink,
  background,
  innerColor = BEAM[0],
  hold = CLOSE_AT - OPEN_END,
  fontFamily = display,
  grain = true,
  scale = 1,
  delay = 0,
  theme = "dark",
  speed = 1,
}: BeamSplitProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = STAGES[theme];
  const fg = ink ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const closeAt = OPEN_END + hold;
  const closeEnd = closeAt + (CLOSE_END - CLOSE_AT);

  const s = Math.min(168 * u, (0.8 * W) / widthEm(title, BRICO_500, TRACK));
  const si = Math.min(
    96 * u,
    (0.7 * W) / widthEm(inner, SERIF_ITALIC, SERIF_TRACK),
  );
  const cut = H / 2;
  const yB = cut + (CAP * s) / 2;
  const lw = Math.max(1.5, 2 * u);
  const fall = 11 * u;

  const rise = OUT(interpolate(t, [RISE_AT, RISE_END], [0, 1], CLAMP));
  const draw = DRAW(interpolate(t, [BEAM_AT, BEAM_END], [0, 1], CLAMP));

  const G1 = 0.34 * H;
  const G2 = 0.15 * H;
  const kRes = 0.56;
  const geometry = (f: number) => {
    const open = MOVE(interpolate(f, [OPEN_AT, OPEN_END], [0, 1], CLAMP));
    const close = MOVE(interpolate(f, [closeAt, closeEnd], [0, 1], CLAMP));
    const gap = open * (G1 + (G2 - G1) * close);
    const k = close > 0 ? 1 + (kRes - 1) * close : 1.05 - 0.05 * open;
    return { gap, k };
  };
  const { gap, k } = geometry(t);
  const half = gap / 2;
  const prev = geometry(t - speed);
  const next = geometry(t + speed);
  const stirs = (a: number, b: number, c: number) =>
    Math.abs(b - a) > 1e-3 || Math.abs(c - b) > 1e-3;
  const rising = midway(rise);
  const halvesMoving = !rising && stirs(prev.gap / 2, half, next.gap / 2);
  // Weighed at the inner line's ends, the furthest its glyphs sit from the
  // scale's origin.
  const reachInner = W * 0.35;
  const innerMoving = stirs(
    prev.k * reachInner,
    k * reachInner,
    next.k * reachInner,
  );

  const moving =
    (t >= BEAM_AT && t < OPEN_END + 8) || (t >= closeAt && t < closeEnd + 8);
  const glowIn = interpolate(t, [BEAM_AT, BEAM_AT + 6], [0, 1], CLAMP);
  const glowRest = Math.max(
    interpolate(t, [OPEN_END - 4, OPEN_END + 10], [1, 0], CLAMP),
    interpolate(
      t,
      [closeAt - 2, closeAt + 6, closeEnd - 2, closeEnd + 12],
      [0, 1, 1, 0],
      CLAMP,
    ),
  );
  const glow = moving ? 0.3 * glowIn * glowRest : 0;
  const split = gap > lw;
  const gapGlow = Math.min(fall, Math.max(0, half - lw));

  // The gap is a slab of beam light: deep indigo at the edges of frame, the
  // palette's bright core drifting a few percent across the shot.
  const sway = interpolate(t, [OPEN_AT, closeEnd + 30], [-1, 1], CLAMP);
  const edgeTone = theme === "light" ? "#14104a" : BEAM[4];
  const band = [
    `radial-gradient(38% 160% at ${50 + 6 * sway}% 50%, color-mix(in oklab, ${BEAM[1]} 55%, transparent) 0%, transparent 70%)`,
    `radial-gradient(70% 220% at ${48 - 4 * sway}% 50%, ${BEAM[2]} 0%, color-mix(in oklab, ${BEAM[2]} 40%, transparent) 45%, transparent 80%)`,
    `linear-gradient(90deg, ${edgeTone} 0%, ${BEAM[3]} 22%, ${BEAM[3]} 78%, ${edgeTone} 100%)`,
  ].join(", ");

  const clip = (top: number, bottom: number) =>
    `inset(${Math.max(0, top)}px 0px ${Math.max(0, H - bottom)}px 0px)`;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            opacity: rise,
            transform: `translateY(${(1 - rise) * 14 * u}px)${glide(rising)}`,
          }}
        >
          <AbsoluteFill
            style={{
              clipPath: clip(0, cut),
              transform: `translateY(${-half}px)${glide(halvesMoving)}`,
            }}
          >
            <Line
              text={title}
              baseline={yB}
              size={s}
              color={fg}
              fontFamily={fontFamily}
            />
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              clipPath: clip(cut, H),
              transform: `translateY(${half}px)${glide(halvesMoving)}`,
            }}
          >
            <Line
              text={title}
              baseline={yB}
              size={s}
              color={fg}
              fontFamily={fontFamily}
            />
          </AbsoluteFill>
        </AbsoluteFill>

        {split ? (
          <AbsoluteFill style={{ clipPath: clip(cut - half, cut + half) }}>
            <AbsoluteFill style={{ background: band }} />
            <AbsoluteFill
              style={{
                transform: `scale(${k})${glide(innerMoving)}`,
                transformOrigin: `50% ${cut}px`,
              }}
            >
              <Line
                text={inner}
                baseline={cut + (SERIF_CAP * si) / 2}
                size={si}
                color={innerColor}
                italic
              />
            </AbsoluteFill>
          </AbsoluteFill>
        ) : null}

        {split ? (
          <>
            <Edge
              y={cut - half}
              anchor={halvesMoving ? cut - G1 / 2 : undefined}
              draw={draw}
              width={W}
              lw={lw}
              accent={accent}
              glowUp={0}
              glowDown={glow * (gapGlow / fall)}
              fall={gapGlow}
            />
            <Edge
              y={cut + half}
              anchor={halvesMoving ? cut + G1 / 2 : undefined}
              draw={draw}
              width={W}
              lw={lw}
              accent={accent}
              glowUp={glow * (gapGlow / fall)}
              glowDown={0}
              fall={gapGlow}
            />
          </>
        ) : (
          <Edge
            y={cut}
            draw={draw}
            width={W}
            lw={lw}
            accent={accent}
            glowUp={glow}
            glowDown={glow}
            fall={fall}
          />
        )}
      </ScaleLayer>

      {grain ? <Grain opacity={theme === "light" ? 0.04 : 0.05} /> : null}
    </AbsoluteFill>
  );
}
