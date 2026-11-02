"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: serif } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface BassDropProps {
  /** Small, widely tracked line that breathes in during the build. */
  build?: string;
  /**
   * A word that lands on the hit instead of the logo. Short, best in
   * capitals. Leave it out and the remocn logo slams in.
   */
  title?: string;
  /** Line that cuts in under the title once it holds. Defaults to `build`; pass "" to hide. */
  line?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

// Beat sheet (30fps, speed 1):
//  0–66    the build: the small line breathes in, its tracking drifting open
//          faster and faster like a riser; an accent hairline grows under it
//  66–72   hard cut to black: seven frames of silence
//  73      one flash frame of light
//  74–76   the hit: the title cuts in at full size, 1.06 → 1 in two frames
//  76–end  the title holds on a slow push; the line cuts back in under it at
//          96 at the tracking the build ended on; poster hold
const CUT = 66;
const FLASH = 73;
const HIT = 74;
const LINE_AT = 96;
/** Frames the demo needs: the hit plus a long poster hold. */
export const BASS_DROP_DURATION = 150;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const BREATHE = Easing.bezier(0.45, 0, 0.55, 1);
/** Accelerating, like a riser: slow start, fastest right before the cut. */
const RISER = Easing.bezier(0.55, 0, 0.9, 0.6);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * gradients.sh "beam" palette: [#f4f7ff, #8fb4ff, #3d5bff, #1a1660]. It lights
 * the title from above and fills the single flash frame.
 */
const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F4F0",
    muted: "#9A9893",
    title: [BEAM[0], BEAM[0], BEAM[1], BEAM[2]],
    /** Peak strength of the beam rising under the build. */
    glow: 1,
    haze: BEAM[3],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#0A0A0B",
    muted: "#5E5C58",
    title: ["#0A0A0B", "#0A0A0B", BEAM[3], BEAM[2]],
    glow: 0.5,
    /** No navy on the off-white stage: it turns grey. */
    haze: BEAM[1],
  },
} as const;

type Colors = (typeof THEMES)[keyof typeof THEMES];

/**
 * The remocn.dev logo as outlines: the R mark (0.76em, on the baseline) and
 * "emocn" in Manrope 600 at -0.025em, 100 units per em, baseline at y = 0.
 * Glyph contours overlap (m, n, the e's bar), so they fill nonzero.
 */
const LOGO_R =
  "M 0.01 -75.54 C 0.01 -75.02 0.2 -74.42 0.62 -73.66 C 2.78 -69.75 7.61 -66.29 12.28 -65.3 C 12.99 -65.15 13.12 -65.15 29.09 -65.09 C 43.06 -65.04 45.3 -65.02 46.03 -64.92 C 50.88 -64.29 54.46 -62.03 56.26 -58.45 C 58.41 -54.17 58.04 -47.64 55.42 -43.69 C 53.58 -40.93 50.76 -39.21 47.13 -38.64 C 46.88 -38.6 39.73 -38.17 31.25 -37.68 C 14.05 -36.7 15.3 -36.81 13.69 -36.15 C 11.26 -35.16 8.4 -33.15 6.03 -30.78 C 2.75 -27.5 0.74 -23.97 0.14 -20.45 C 0.07 -20.04 0.05 -17.62 0.02 -9.96 L 0 0 5.38 0 L 10.76 0 10.78 -8.41 C 10.81 -17.54 10.8 -17.23 11.22 -18.8 C 12.33 -22.99 15.77 -25.76 20.63 -26.4 C 21.07 -26.45 22.31 -26.47 24.66 -26.45 C 28.37 -26.42 28.73 -26.38 30.13 -25.93 C 32.04 -25.3 33.78 -24 35.11 -22.18 C 35.39 -21.79 39.26 -17.21 43.7 -11.99 C 48.14 -6.78 51.87 -2.39 51.99 -2.23 C 52.12 -2.08 52.36 -1.65 52.54 -1.3 C 52.94 -0.52 53.27 -0.19 53.81 -0.07 C 54.06 -0.02 56.02 0 60.21 -0.02 L 66.24 -0.04 57.07 -11.99 C 52.03 -18.57 47.84 -24.05 47.77 -24.17 C 47.19 -25.12 47.36 -26.45 48.17 -27.32 C 48.56 -27.74 48.89 -27.92 49.85 -28.24 C 54.44 -29.74 58.96 -32.63 62.25 -36.17 C 68.26 -42.64 70.23 -50.91 67.61 -58.77 C 64.87 -67.05 57.7 -73.72 49.61 -75.53 C 47.51 -75.99 49.86 -75.95 23.69 -75.98 L 0.01 -76 0.01 -75.54 Z";

const LOGO_EMOCN = [
  // e
  "M105.2 1.5L105.2 1.5Q97.1 1.5 91 -2Q85 -5.6 81.6 -11.9Q78.2 -18.2 78.2 -26.6L78.2 -26.6Q78.2 -35.4 81.5 -41.9Q84.9 -48.4 90.8 -52Q96.8 -55.5 104.7 -55.5L104.7 -55.5Q112.9 -55.5 118.7 -51.7Q124.5 -47.9 127.4 -40.8Q130.3 -33.8 129.7 -24.1L129.7 -24.1L119.2 -24.1L119.2 -27.9Q119.1 -37.3 115.6 -41.8Q112.2 -46.3 105.1 -46.3L105.1 -46.3Q97.2 -46.3 93.3 -41.3Q89.3 -36.4 89.3 -27L89.3 -27Q89.3 -18.1 93.3 -13.2Q97.2 -8.3 104.7 -8.3L104.7 -8.3Q109.6 -8.3 113.1 -10.6Q116.7 -12.8 118.7 -16.9L118.7 -16.9L128.9 -13.7Q125.8 -6.5 119.4 -2.5Q113 1.5 105.2 1.5ZM124.5 -24.1L85.9 -24.1L85.9 -32.2L124.5 -32.2L124.5 -24.1Z",
  // m
  "M212 0L201.6 0L201.6 -33.6Q201.6 -39.5 198.6 -42.8Q195.6 -46.1 190.7 -46.1L190.7 -46.1Q187.7 -46.1 185.2 -44.7Q182.8 -43.3 181.2 -40.6Q179.7 -37.9 179.7 -33.8L179.7 -33.8L174.7 -36.3Q174.6 -42 177.1 -46.3Q179.6 -50.6 183.9 -53Q188.3 -55.4 193.7 -55.4L193.7 -55.4Q202.4 -55.4 207.3 -50.1Q212.1 -44.9 212.1 -36.1L212.1 -36.1L212 0ZM147.3 0L136.8 0L136.8 -54L146.1 -54L146.1 -38.4L147.3 -38.4L147.3 0ZM179.7 0L169.2 0L169.3 -33.5Q169.3 -39.4 166.3 -42.7Q163.3 -46.1 158.3 -46.1L158.3 -46.1Q153.3 -46.1 150.3 -42.7Q147.3 -39.3 147.3 -33.8L147.3 -33.8L142.3 -37Q142.3 -42.3 144.8 -46.4Q147.4 -50.6 151.8 -53Q156.1 -55.4 161.6 -55.4L161.6 -55.4Q167.3 -55.4 171.4 -52.9Q175.4 -50.5 177.6 -46.2Q179.7 -41.8 179.7 -36.1L179.7 -36.1L179.7 0Z",
  // o
  "M245.3 1.5L245.3 1.5Q237.2 1.5 231.3 -2.1Q225.3 -5.8 222.1 -12.2Q218.9 -18.7 218.9 -27.1L218.9 -27.1Q218.9 -35.5 222.2 -41.9Q225.5 -48.4 231.4 -51.9Q237.4 -55.5 245.3 -55.5L245.3 -55.5Q253.4 -55.5 259.4 -51.9Q265.3 -48.2 268.6 -41.8Q271.8 -35.4 271.8 -27.1L271.8 -27.1Q271.8 -18.6 268.6 -12.2Q265.3 -5.8 259.3 -2.1Q253.4 1.5 245.3 1.5ZM245.3 -8.3L245.3 -8.3Q253.1 -8.3 256.9 -13.6Q260.8 -18.8 260.8 -27.1L260.8 -27.1Q260.8 -35.5 256.9 -40.6Q253 -45.7 245.3 -45.7L245.3 -45.7Q240.1 -45.7 236.7 -43.3Q233.3 -40.9 231.6 -36.7Q230 -32.6 230 -27.1L230 -27.1Q230 -18.6 233.9 -13.5Q237.8 -8.3 245.3 -8.3Z",
  // c
  "M303.4 1.5L303.4 1.5Q295.1 1.5 289.3 -2.2Q283.5 -5.9 280.5 -12.4Q277.4 -18.8 277.3 -27L277.3 -27Q277.4 -35.4 280.5 -41.8Q283.7 -48.2 289.5 -51.9Q295.4 -55.5 303.6 -55.5L303.6 -55.5Q312.4 -55.5 318.7 -51.1Q325 -46.7 327 -39.1L327 -39.1L316.6 -36.1Q315 -40.6 311.5 -43.1Q308 -45.7 303.4 -45.7L303.4 -45.7Q298.3 -45.7 295 -43.2Q291.7 -40.8 290.1 -36.6Q288.5 -32.4 288.4 -27L288.4 -27Q288.5 -18.7 292.3 -13.5Q296 -8.3 303.4 -8.3L303.4 -8.3Q308.5 -8.3 311.6 -10.7Q314.8 -13 316.4 -17.4L316.4 -17.4L327 -14.9Q324.3 -7 318.3 -2.7Q312.1 1.5 303.4 1.5Z",
  // n
  "M383.2 0L372.6 0L372.6 -26.6Q372.6 -29.7 372.1 -33Q371.6 -36.4 370.1 -39.2Q368.6 -42.1 365.9 -43.8Q363.3 -45.6 358.9 -45.6L358.9 -45.6Q356.1 -45.6 353.6 -44.6Q351.1 -43.7 349.3 -41.7Q347.4 -39.6 346.3 -36.3Q345.3 -32.9 345.3 -28.1L345.3 -28.1L338.8 -30.6Q338.8 -37.9 341.5 -43.5Q344.3 -49.2 349.4 -52.3Q354.6 -55.5 361.8 -55.5L361.8 -55.5Q367.4 -55.5 371.3 -53.7Q375.1 -51.9 377.4 -48.9Q379.8 -46 381.1 -42.6Q382.3 -39.1 382.8 -35.8Q383.2 -32.5 383.2 -30L383.2 -30L383.2 0ZM345.3 0L334.6 0L334.6 -54L344 -54L344 -38.4L345.3 -38.4L345.3 0Z",
];
/** Ink box of the outlined logo, in its own units; the R is `rW` wide. */
const LOGO = { x: 0, y: -76, w: 383.2, h: 77.5, rW: 70.23 } as const;

/** The whole logo in one fill (a colour or a `url(#gradient)`). */
function LogoPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d={LOGO_R} />
      {LOGO_EMOCN.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
    </g>
  );
}

/** Instrument Serif advance widths (per mille) for ASCII 32–126 (harfbuzz). */
const ADV = [
  170, 237, 371, 635, 417, 590, 579, 233, 340, 340, 444, 531, 217, 430, 213,
  258, 460, 249, 404, 371, 393, 382, 404, 364, 433, 402, 213, 217, 531, 531,
  531, 317, 660, 457, 478, 480, 530, 453, 408, 521, 546, 249, 249, 496, 413,
  665, 540, 540, 466, 540, 513, 407, 461, 536, 457, 651, 546, 477, 427, 325,
  258, 325, 433, 376, 354, 399, 443, 339, 457, 355, 288, 402, 470, 223, 215,
  451, 220, 704, 470, 408, 444, 442, 318, 308, 259, 454, 393, 597, 385, 401,
  353, 318, 252, 318, 531,
];
/** The Instrument Serif capital pairs that move the most (per mille, tightening). */
const KERN = new Map(
  [
    "AC34 AG34 AO34 AQ34 AT42 AU36 AV68 AW68 AX80 AY68 BX40 BY28 DX50 DY24",
    "FA38 GX38 KC46 KG46 KO46 KQ46 KV40 KY40 LT54 LV48 LW48 LY64 OX50 OY24",
    "PA40 PX42 RA50 RC24 RG24 RO24 RX56 RY28 TA42 VA68 WA62 XA80 XC64 XO64",
    "YA68 YC32 YO32",
  ]
    .join(" ")
    .split(" ")
    .map((p) => [p.slice(0, 2), -Number(p.slice(2)) / 1000] as const),
);
const CAP = 0.72;
/** Cap centre inside a line-height: 1 box, in em (ascent 0.99, descent 0.31). */
const CAP_MID = 0.48;
const TITLE_TRACK = -0.02;
const TRACK_FROM = 0.32;
const TRACK_TO = 0.72;

/** Width of a line in em, tracking between letters. */
function lineWidth(text: string, track: number) {
  const chars = Array.from(text);
  let w = 0;
  chars.forEach((ch, i) => {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? ADV[code - 32] : 500) / 1000;
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
  color,
  fill,
  scale = 1,
  children,
}: {
  y: number;
  size: number;
  tracking: number;
  color: string;
  /** A background painted through the glyphs instead of a flat colour. */
  fill?: string;
  scale?: number;
  children: string;
}) {
  const paint: React.CSSProperties = fill
    ? {
        backgroundImage: fill,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : { color };
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: y - size * CAP_MID,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: `50% ${CAP_MID * 100}%`,
        whiteSpace: "nowrap",
        fontFamily: serif,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: `${tracking}em`,
        paddingLeft: `${tracking}em`,
        fontVariantNumeric: "tabular-nums",
        ...paint,
      }}
    >
      {children}
    </div>
  );
}

/** The build: the small line breathes in while its tracking drifts open. */
function Build({
  t,
  W,
  H,
  text,
  size,
  accent,
  c,
}: {
  t: number;
  W: number;
  H: number;
  text: string;
  size: number;
  accent: string;
  c: Colors;
}) {
  const breath = interpolate(t, [-8, 40], [0, 1], {
    ...CLAMP,
    easing: BREATHE,
  });
  const rise = interpolate(t, [0, CUT], [0, 1], { ...CLAMP, easing: RISER });
  const lineIn = interpolate(t, [10, CUT], [0, 1], {
    ...CLAMP,
    easing: RISER,
  });
  const ruleW = W * 0.34 * lineIn;
  const ruleH = Math.max(1.5, H * 0.0028);
  // The beam rises from under the frame with the riser, so the cut to black
  // takes something away.
  const glow = rise * c.glow;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: glow,
          background: `radial-gradient(34% 30% at 50% ${112 - 8 * rise}%, color-mix(in oklab, ${BEAM[1]} 70%, transparent) 0%, transparent 70%), radial-gradient(80% 70% at 50% ${122 - 10 * rise}%, color-mix(in oklab, ${BEAM[2]} 75%, transparent) 0%, color-mix(in oklab, ${c.haze} 55%, transparent) 45%, transparent 78%)`,
        }}
      />
      <Line
        y={H * 0.5}
        size={size}
        tracking={TRACK_FROM + (TRACK_TO - TRACK_FROM) * rise}
        color={c.fg}
        scale={1 + rise * 0.05}
      >
        {text}
      </Line>
      <div
        style={{
          position: "absolute",
          left: (W - ruleW) / 2,
          top: H * 0.5 + size * 1.25,
          width: ruleW,
          height: ruleH,
          background: accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.bg,
          opacity: 1 - breath,
        }}
      />
    </>
  );
}

/**
 * The hit as the remocn logo, painted with the same light as a word title:
 * the gradient spans the em box the word would sit in, so the R and "emocn"
 * catch it exactly where capitals would.
 */
function LogoHit({
  W,
  H,
  y,
  scale,
  sweep,
  c,
  caption,
  small,
  showCaption,
}: {
  W: number;
  H: number;
  /** Visual centre of the logo. */
  y: number;
  scale: number;
  sweep: number;
  c: Colors;
  caption: string;
  small: number;
  showCaption: boolean;
}) {
  const id = `bd${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // logo units -> px
  const k = Math.min((W * 0.74) / LOGO.w, (H * 0.36) / -LOGO.y);
  const w = LOGO.w * k;
  const h = LOGO.h * k;
  const [c0, c1, c2, c3] = c.title;
  // the em box a capital of this height would live in (cap 0.72 at 12–84%)
  const capH = -LOGO.y;
  const top = LOGO.y - (0.12 / 0.72) * capH;
  const bottom = LOGO.y + (0.88 / 0.72) * capH;
  return (
    <>
      <svg
        width={w}
        height={h}
        viewBox={`${LOGO.x} ${LOGO.y} ${LOGO.w} ${LOGO.h}`}
        style={{
          position: "absolute",
          left: (W - w) / 2,
          top: y - h / 2,
          overflow: "visible",
          transform: `scale(${scale})`,
          transformOrigin: "50% 50%",
        }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={id}
            gradientUnits="userSpaceOnUse"
            x1={0}
            x2={0}
            y1={top}
            y2={bottom}
          >
            <stop offset="0%" stopColor={c0} />
            <stop offset={`${12 + sweep}%`} stopColor={c1} />
            <stop offset={`${52 + sweep}%`} stopColor={c2} />
            <stop offset={`${86 + sweep}%`} stopColor={c3} />
          </linearGradient>
        </defs>
        <LogoPaths fill={`url(#${id})`} />
      </svg>
      {caption && showCaption ? (
        <Line
          y={y + h / 2 + H * 0.1}
          size={small}
          tracking={TRACK_TO}
          color={c.muted}
        >
          {caption}
        </Line>
      ) : null}
    </>
  );
}

/** The hit: full size at once, a two-frame punch, then a slow push. */
function Hit({
  t,
  W,
  H,
  title,
  caption,
  small,
  c,
}: {
  t: number;
  W: number;
  H: number;
  title?: string;
  caption: string;
  small: number;
  c: Colors;
}) {
  const local = t - HIT;
  const punch = interpolate(local, [0, 2], [1.06, 1], CLAMP);
  const hold = interpolate(local, [2, BASS_DROP_DURATION - HIT], [0, 1], {
    ...CLAMP,
    easing: SETTLE,
  });
  const scale = punch * (1 + hold * 0.035);
  // The light drifts down the letters a little as the shot holds.
  const [c0, c1, c2, c3] = c.title;
  const sweep = 4 * hold;
  const fill = `linear-gradient(180deg, ${c0} 0%, ${c1} ${12 + sweep}%, ${c2} ${52 + sweep}%, ${c3} ${86 + sweep}%)`;
  // The title sits a touch high from the first frame so the line can cut in
  // under it later without the title moving.
  const titleY = caption ? H * 0.46 : H * 0.5;
  if (!title) {
    return (
      <LogoHit
        W={W}
        H={H}
        y={titleY}
        scale={scale}
        sweep={sweep}
        c={c}
        caption={caption}
        small={small}
        showCaption={t >= LINE_AT}
      />
    );
  }
  const size = Math.min(
    (W * 0.86) / lineWidth(title, TITLE_TRACK),
    (H * 0.46) / CAP,
  );
  return (
    <>
      <Line
        y={titleY}
        size={size}
        tracking={TITLE_TRACK}
        color={c.fg}
        fill={fill}
        scale={scale}
      >
        {title}
      </Line>
      {caption && t >= LINE_AT ? (
        <Line
          y={titleY + (size * CAP) / 2 + H * 0.1}
          size={small}
          tracking={TRACK_TO}
          color={c.muted}
        >
          {caption}
        </Line>
      ) : null}
    </>
  );
}

export function BassDrop({
  build = "THIS FALL",
  title,
  line,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BassDropProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const caption = line ?? build;
  const small = H * 0.036;

  const phase = t < CUT ? "build" : t < HIT ? "silence" : "hit";
  const flash = phase === "silence" && t >= FLASH;
  const ground = flash
    ? `radial-gradient(90% 120% at 50% 110%, ${BEAM[0]} 0%, ${BEAM[1]} 28%, ${BEAM[2]} 55%, ${BEAM[3]} 100%)`
    : c.bg;

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      {phase === "build" ? (
        <Build
          t={t}
          W={W}
          H={H}
          text={build}
          size={small}
          accent={accent}
          c={c}
        />
      ) : null}
      {phase === "hit" ? (
        <Hit
          t={t}
          W={W}
          H={H}
          title={title}
          caption={caption}
          small={small}
          c={c}
        />
      ) : null}
    </AbsoluteFill>
  );
}
