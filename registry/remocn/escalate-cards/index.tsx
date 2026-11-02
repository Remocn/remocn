"use client";

import { loadFont } from "@remotion/google-fonts/Oswald";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
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
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Beat sheet (30fps, speed 1, defaults):
//  0–26    "ONE", small and light (300), alone in the middle of the frame
//  26–42   hard cut: "CODEBASE", bigger and a step heavier (400)
//  42–51   hard cut: "EVERY", bigger again; the cuts keep accelerating
//  51      hard cut to the gradient ground: "LAUNCH" edge to edge, its
//          outer letters cropped by the frame
//  65      the date cuts in under it; slow push, poster hold to 130
const DATE_DELAY = 14;
/** Frames the default demo needs: the cards plus a long poster hold. */
export const ESCALATE_CARDS_DURATION = 130;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

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
  size,
  tracking,
  weight,
  color,
  scale,
  fill,
  children,
}: {
  y: number;
  size: number;
  tracking: number;
  weight: number;
  color: string;
  scale: number;
  /** A frame-sized background painted through the glyphs. */
  fill?: { image: string; W: number; H: number };
  children: string;
}) {
  const top = y - size * CAP_MID;
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
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: `50% ${CAP_MID * 100}%`,
      }}
    >
      {children}
    </div>
  );
}

export function EscalateCards({
  words = ["ONE", "CODEBASE", "EVERY", "LAUNCH"],
  date = "OCTOBER 30",
  firstBeat = 26,
  accel = 0.6,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: EscalateCardsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
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
    const length = climax
      ? Number.POSITIVE_INFINITY
      : Math.max(4, Math.round(firstBeat * accel ** i));
    return { text, size, track, weight, length, climax };
  });

  let start = 0;
  let active = last;
  let local = 0;
  for (let i = 0; i < cards.length; i++) {
    if (t < start + cards[i].length) {
      active = i;
      local = t - start;
      break;
    }
    start += cards[i].length;
  }
  const card = cards[active];
  const settle = card.climax
    ? interpolate(local, [0, 80], [0, 1], { ...CLAMP, easing: SETTLE })
    : 0;
  const mesh = card.climax ? meshGround(settle, accent, c.pale) : "";
  const ground = card.climax && !c.clip ? mesh : c.bg;
  const ink = card.climax && !c.clip ? "#FFFFFF" : c.fg;

  // A hair of drift keeps each card alive without softening the cut; the
  // climax gets a slow settling push instead.
  const scale = card.climax
    ? 1 + 0.045 * settle
    : 1 + 0.025 * Math.min(1, local / card.length);
  const showDate = card.climax && date !== "" && local >= DATE_DELAY;
  const titleY = card.climax && date !== "" ? H * 0.45 : H * 0.5;
  const dateSize = H * 0.032;

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <Line
        y={titleY}
        size={card.size}
        tracking={card.track}
        weight={card.weight}
        color={ink}
        scale={scale}
        fill={card.climax && c.clip ? { image: mesh, W, H } : undefined}
      >
        {card.text}
      </Line>
      {showDate ? (
        <Line
          y={titleY + (lastSize * CAP * scale) / 2 + H * 0.1}
          size={dateSize}
          tracking={0.36}
          weight={400}
          color={ink}
          scale={1}
        >
          {date}
        </Line>
      ) : null}
    </AbsoluteFill>
  );
}
