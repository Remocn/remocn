"use client";

import { loadFont } from "@remotion/google-fonts/Oswald";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_DATE,
  DEFAULT_WORDS,
  type EscalateCardsElementId,
  escalateCardsTimeline,
} from "./timeline";

const oswald = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export interface EscalateCardsProps {
  /** One word per card, smallest first. The last one fills the frame and holds. */
  words?: string[];
  /** Small line that cuts in under the last card. Pass "" to hide. */
  date?: string;
  /** Length of the first card in frames. Every next card is shorter. */
  firstBeat?: number;
  /** Each card lasts this share of the one before: below 1 the cuts accelerate. */
  accel?: number;
  /** Frames after the last cut before the date cuts in. */
  dateDelay?: number;
  /** How far the last card pushes in over its hold (0.045 = 4.5%). */
  push?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Background fill in place of the theme stage and the climax mesh; "transparent" drops it. */
  background?: string;
  /** Typeface for the cards. Load it yourself; Oswald by default. Card widths are fitted to Oswald. */
  fontFamily?: string;
  /** Size of the cards, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single cards and the date, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<EscalateCardsElementId>;
}

// Beat sheet (30fps, speed 1, defaults):
//  0–26    "ONE", small and light (300), alone in the middle of the frame
//  26–42   hard cut: "CODEBASE", bigger and a step heavier (400)
//  42–51   hard cut: "EVERY", bigger again; the cuts keep accelerating
//  51      hard cut to the gradient ground: "LAUNCH" edge to edge, its
//          outer letters cropped by the frame
//  65      the date cuts in under it; slow push, poster hold to 130
/** Frames the default demo needs: the cards plus a long poster hold. */
export const ESCALATE_CARDS_DURATION = 130;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

// The settle is a clamped ramp, exactly 0 or 1 at rest, and moves the
// line on every frame in between.
const midway = (p: number) => p > 0 && p < 1;

const THEMES = {
  /** Dark: the climax cuts to the mesh ground, white type on top. */
  dark: { bg: "#0A0A0B", fg: "#F5F4F0", pale: 55, clip: false },
  /** Light: the stage stays off-white and the mesh fills the letters. */
  light: { bg: "#F5F4F0", fg: "#0A0A0B", pale: 18, clip: true },
} as const;

/** Oswald 500 advance widths (per mille) for ASCII 32–126 (harfbuzz). */
const ADV = [
  243, 233, 315, 511, 488, 950, 587, 149, 319, 295, 411, 433, 213, 314, 217,
  396, 534, 382, 497, 496, 504, 493, 521, 413, 510, 521, 239, 251, 386, 429,
  386, 483, 928, 522, 557, 540, 557, 428, 413, 559, 586, 275, 326, 532, 421,
  683, 545, 563, 527, 564, 561, 494, 430, 566, 516, 712, 499, 487, 425, 336,
  396, 317, 460, 356, 293, 435, 477, 440, 473, 446, 304, 472, 478, 248, 250,
  471, 252, 718, 474, 455, 476, 474, 353, 400, 330, 473, 404, 593, 416, 421,
  370, 338, 251, 351, 465,
];
/** Oswald 500 capital pairs that move the most (per mille, tightening). */
const KERN = new Map(
  [
    "AT43 AV36 AW23 AY42 BT21 BV24 BX20 BY17 FA35 FJ26 KC21 KG21 KO21 KQ17",
    "LT73 LU14 LV71 LW47 LY86 PA47 PJ26 PZ16 RY19 TA43 TJ26 VA36 WA23 YA42",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.81;
/** Cap centre inside a line-height: 1 box, in em (ascent 1.193, descent 0.289). */
const CAP_MID = 0.547;

/**
 * gradients.sh "mesh" palette (bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7,
 * #0e1645]): the climax ground, with the accent in the middle. Blobs
 * drift a few percent over the hold.
 */
function meshGround(drift: number, accent: string, pale: number) {
  // The palest blob is mixed down so white type over it stays legible.
  const blobs: Array<[string, number, number]> = [
    [`color-mix(in oklab, #ecdcf2 ${pale}%, transparent)`, 14, 16],
    ["#8796ee", 86, 24],
    ["#2e45b7", 70, 88],
    ["#0e1645", 22, 82],
    [accent, 50, 54],
  ];
  return [
    ...blobs.map(
      ([color, x, y], i) =>
        `radial-gradient(85% 95% at ${x + drift * (i % 2 ? -4 : 4)}% ${y + drift * (i % 3 ? 3 : -3)}%, ${color} 0%, transparent 68%)`,
    ),
    // A solid layer, not a bare colour, so the stack is also a valid background-image.
    "linear-gradient(#0a0d24, #0a0d24)",
  ].join(", ");
}

/**
 * Width in em at 500, tracking between letters. Lighter cuts are narrower,
 * so this is a safe upper bound for them too.
 */
function textWidth(text: string, track: number) {
  const chars = Array.from(text);
  let w = 0;
  chars.forEach((ch, i) => {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? ADV[code - 32] : 680) / 1000;
    if (i > 0) w += KERN.get(chars[i - 1] + ch) ?? 0;
  });
  return w + track * Math.max(0, chars.length - 1);
}

/**
 * One centred line in a line-height: 1 box; `y` is the cap centre. The left
 * padding cancels the letter-spacing that trails the last glyph.
 */
function Line({
  y,
  fontFamily,
  size,
  tracking,
  weight,
  color,
  scale,
  dy = 0,
  moving = false,
  fill,
  children,
}: {
  y: number;
  fontFamily: string;
  size: number;
  tracking: number;
  weight: number;
  color: string;
  scale: number;
  /** Travel from `y`, as a transform so layout keeps the line still. */
  dy?: number;
  moving?: boolean;
  /** A frame-sized background painted through the glyphs. */
  fill?: { image: string; W: number; H: number };
  children: string;
}) {
  const glide = useGlide();
  const top = y - size * CAP_MID;
  // The transform stays on at rest, at identity where nothing is left to
  // carry: the mark that keeps a resting line's lean rides on it, and a line
  // dropped back to plain layout would snap to the pixel grid on that frame.
  const transform = `translateY(${Math.abs(dy) < 1e-3 ? 0 : dy}px) scale(${scale})`;
  const paint: React.CSSProperties = fill
    ? {
        color: "transparent",
        backgroundImage: fill.image,
        // The box is twice the frame wide; pin the ground to the frame.
        backgroundSize: `${fill.W}px ${fill.H}px`,
        backgroundPosition: `${fill.W / 2}px ${-top}px`,
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      }
    : { color };
  return (
    <div
      style={{
        position: "absolute",
        left: "-50%",
        right: "-50%",
        top,
        height: size,
        textAlign: "center",
        whiteSpace: "nowrap",
        fontFamily,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
        paddingLeft: `${tracking}em`,
        ...paint,
        fontVariantNumeric: "tabular-nums",
        transform: `${transform}${glide(moving)}`,
        transformOrigin: `50% ${CAP_MID * 100}%`,
      }}
    >
      {children}
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

export function EscalateCards(props: EscalateCardsProps) {
  const {
    words = DEFAULT_WORDS,
    date = DEFAULT_DATE,
    push = 0.045,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = oswald.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    escalateCardsTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const n = Math.max(1, words.length);
  const last = n - 1;

  // The climax: the last word set edge to edge, a hair wider than the frame.
  const lastTrack = -0.02;
  const lastSize = Math.min(
    (W * 1.06) / textWidth(words[last] ?? "", lastTrack),
    (H * 0.62) / CAP,
  );

  // The cards before it grow geometrically from small to half of the climax,
  // so the last cut is still the biggest jump. Weight climbs 300 → 500.
  const firstSize = H * 0.07;
  const peak = lastSize * 0.5;
  const cards = words.map((text, i) => {
    const k = last <= 1 ? 1 : i / (last - 1);
    const climax = i === last;
    const track = climax ? lastTrack : 0.06 - 0.07 * k;
    const target = climax ? lastSize : firstSize * (peak / firstSize) ** k;
    const size = climax
      ? target
      : Math.min(target, (W * 0.84) / textWidth(text, track));
    const weight = climax ? 500 : Math.round(3 + 2 * k) * 100;
    const { start, length } = tl.get(`card:${i}`);
    return { text, size, track, weight, start, length, climax };
  });

  // The card on screen: the last one cut to.
  let active = 0;
  cards.forEach((c, i) => {
    if (t >= c.start) active = i;
  });
  const card = cards[active];
  const local = t - card.start;
  const settle = card.climax
    ? interpolate(local, [0, tl.get(`card:${last}`).beat("settle")], [0, 1], {
        ...CLAMP,
        easing: SETTLE,
      })
    : 0;
  const mesh = card.climax ? meshGround(settle, accent, c.pale) : "";
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const onMesh = card.climax && !c.clip && background === undefined;
  const ground = onMesh ? mesh : stage;
  const fg = ink ?? (onMesh ? "#FFFFFF" : c.fg);

  // A hair of drift keeps each card alive without softening the cut; the
  // climax gets a slow settling push instead.
  const zoom = card.climax
    ? 1 + push * settle
    : 1 + 0.025 * Math.min(1, local / card.length);
  const dateEl = tl.elements.find((e) => e.id === "date");
  const showDate = card.climax && dateEl !== undefined && t >= dateEl.start;
  const titleY = card.climax && date !== "" ? H * 0.45 : H * 0.5;
  const dateSize = H * 0.032;

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <Line
          y={titleY}
          fontFamily={fontFamily}
          size={card.size}
          tracking={card.track}
          weight={card.weight}
          color={fg}
          scale={zoom}
          moving={!card.climax || midway(settle)}
          fill={card.climax && c.clip ? { image: mesh, W, H } : undefined}
        >
          {card.text}
        </Line>
        {showDate ? (
          <Line
            // Laid out where the push leaves it; the ride there follows the
            // title's zoom by a transform, since layout rounds a baseline to
            // whole pixels.
            y={titleY + (lastSize * CAP * (1 + push)) / 2 + H * 0.1}
            dy={(lastSize * CAP * push * (settle - 1)) / 2}
            moving={midway(settle)}
            fontFamily={fontFamily}
            size={dateSize}
            tracking={0.36}
            weight={400}
            color={fg}
            scale={1}
          >
            {date}
          </Line>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
