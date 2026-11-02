"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export interface BounceLogoProps {
  /** Wordmark that bounces. "remocn" (any case) is set as the real logo. */
  brand?: string;
  /** Line under the final lockup. Pass "" to hide. */
  line?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps):
//   0–112   the logo glides at constant speed and bounces off the frame edges,
//           flipping neutral ↔ accent on every hit; two near-miss corners at
//           ~15 and ~64, the second one by a hair
//   112     dead-on bottom-right corner: a beam of light blooms out of the hit
//           corner and stays as the ground
//   116–138 the logo glides to center and grows into the lockup
//   134–148 the line rises in under it
//   148–168 poster hold
// The path is solved backwards from the corner, so the last hit always lands.
const CORNER = 112;
const PERIOD_X = 48.6;
const PERIOD_Y = 47.13;
const RESOLVE_AT = CORNER + 4;
const RESOLVE = 22;
const LINE_AT = CORNER + 22;
export const BOUNCE_LOGO_DURATION = CORNER + 56;

/** Manrope 500 advance widths (per mille) for ASCII 32–126 (non-logo brands). */
const ADV = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const TRACK = -0.03;

/** The real remocn "R" mark (viewBox 124.06 × 134.26). */
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
/** As on remocn.dev: the mark is 0.76em tall and sits 0.04em before "emocn". */
const MARK_H = 0.76;
const MARK_W = (MARK_H * 124.06) / 134.26;
const MARK_GAP = 0.04;
/** "emocn" in Manrope 600 at -0.025em, kerned (em). */
const LOGO_WORD_W = 3.15;
/** Manrope cap height (em), the box of a plain wordmark. */
const CAP = 0.72;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const BLOOM = Easing.bezier(0.12, 0.9, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    line: "rgba(243,242,239,0.78)",
    key: "rgba(255,255,255,0.05)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    line: "rgba(18,18,20,0.72)",
    key: "rgba(255,255,255,0.9)",
    grain: 0.045,
  },
} as const;

/**
 * The corner bloom. Dark: gradients.sh "beam" (#f4f7ff → #8fb4ff → #3d5bff →
 * #1a1660). Light: "pixel-glass" (#3d6bff, #ff4fb8, #7a3cff) fading into the
 * off-white. `r` is the bloom radius in px, `drift` a few px of slow travel.
 */
function bloomGround(
  theme: "dark" | "light",
  r: number,
  drift: number,
  W: number,
  H: number,
) {
  const at = `${W - drift}px ${H + drift * 0.6}px`;
  const rad = Math.max(1, r);
  if (theme === "dark") {
    return [
      `radial-gradient(${rad * 0.42}px ${rad * 0.36}px at ${at}, rgba(244,247,255,0.95) 0%, rgba(143,180,255,0.55) 45%, transparent 100%)`,
      `radial-gradient(${rad}px ${rad * 0.82}px at ${at}, rgba(143,180,255,0.9) 0%, rgba(61,91,255,0.85) 22%, rgba(26,22,96,0.75) 52%, rgba(26,22,96,0.22) 74%, transparent 100%)`,
    ].join(", ");
  }
  return [
    `radial-gradient(${rad * 0.45}px ${rad * 0.38}px at ${at}, rgba(61,107,255,0.9) 0%, rgba(61,107,255,0.4) 50%, transparent 100%)`,
    `radial-gradient(${rad}px ${rad * 0.82}px at ${at}, rgba(255,79,184,0.72) 0%, rgba(255,79,184,0.5) 26%, rgba(122,60,255,0.32) 54%, rgba(122,60,255,0.08) 76%, transparent 100%)`,
  ].join(", ");
}

function wordWidth(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? ADV[code - 32] : 600) / 1000;
    w += TRACK;
  }
  return w - TRACK;
}

/** Triangle wave: unfolded travel → position bouncing inside [0, 1]. */
function fold(v: number) {
  const m = ((v % 2) + 2) % 2;
  return m > 1 ? 2 - m : m;
}

/** Unfolded position at frame f, solved back from the corner hit (1, 1). */
function travel(f: number) {
  return {
    x: 1 - (CORNER - f) / PERIOD_X,
    y: 1 - (CORNER - f) / PERIOD_Y,
  };
}

function hitsBefore(f: number) {
  const a = travel(0);
  const b = travel(Math.min(f, CORNER - 0.001));
  return Math.floor(b.x) - Math.floor(a.x) + Math.floor(b.y) - Math.floor(a.y);
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

/**
 * The wordmark at font size 100, drawn from its top-left: the real logo (R mark
 * on the baseline + "emocn" in Manrope 600) or a plain word in Manrope 500.
 */
function Wordmark({
  brand,
  logo,
  color,
}: {
  brand: string;
  logo: boolean;
  color: string;
}) {
  if (logo) {
    return (
      <>
        <path
          d={REMOCN_R_PATH}
          fill={color}
          transform={`scale(${(100 * MARK_H) / 134.26})`}
        />
        <text
          x={100 * (MARK_W + MARK_GAP)}
          y={100 * MARK_H}
          fill={color}
          fontFamily={manrope.fontFamily}
          fontWeight={600}
          fontSize={100}
          style={{ letterSpacing: "-0.025em" }}
        >
          emocn
        </text>
      </>
    );
  }
  return (
    <text
      x={0}
      y={100 * CAP}
      fill={color}
      fontFamily={manrope.fontFamily}
      fontWeight={500}
      fontSize={100}
      style={{ letterSpacing: `${TRACK}em` }}
    >
      {brand}
    </text>
  );
}

export function BounceLogo({
  brand = "remocn",
  line = "Hit the corner.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BounceLogoProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  // Logo box in em: top of the R (or caps) to the baseline.
  const logo = brand.trim().toLowerCase() === "remocn";
  const boxW = logo ? MARK_W + MARK_GAP + LOGO_WORD_W : wordWidth(brand);
  const boxH = logo ? MARK_H : CAP;
  const fs = (H * 0.068) / boxH;
  const lw = boxW * fs;
  const lh = boxH * fs;

  const at = (f: number) => {
    const p = travel(Math.min(f, CORNER));
    return { x: fold(p.x) * (W - lw), y: fold(p.y) * (H - lh) };
  };

  const hits = hitsBefore(t);
  const bounceColor = hits % 2 === 1 ? accent : c.fg;

  const bloom = interpolate(t, [CORNER, CORNER + 26], [0, 1], {
    ...CLAMP,
    easing: BLOOM,
  });
  // The hit itself: a short burst of extra light that settles into the bloom.
  const burst = interpolate(t, [CORNER, CORNER + 1, CORNER + 12], [0, 1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = Math.max(0, t - CORNER) * 0.35 * (H / 720);
  const resolve = interpolate(t, [RESOLVE_AT, RESOLVE_AT + RESOLVE], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const lineIn = interpolate(t, [LINE_AT, LINE_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const finalScale = Math.min(2.3, (W * 0.52) / lw);
  const scale = 1 + (finalScale - 1) * resolve;
  const lineSize = H * 0.062;
  const lineGap = lineSize * 0.95;
  const blockH = lh * finalScale + (line ? lineGap + lineSize * 0.75 : 0);
  const endX = (W - lw * finalScale) / 2;
  const endY = (H - blockH) / 2;

  const now = at(t);
  const x = now.x + (endX - now.x) * resolve;
  const y = now.y + (endY - now.y) * resolve;

  const settled = t >= CORNER;
  const color = settled ? c.fg : bounceColor;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 40% 35%, ${c.key}, transparent 70%)`,
        }}
      />
      {bloom > 0 ? (
        <AbsoluteFill
          style={{
            background: bloomGround(
              theme,
              H * (0.15 + 1.25 * bloom + 0.25 * burst),
              drift,
              W,
              H,
            ),
          }}
        />
      ) : null}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <g transform={`translate(${x} ${y}) scale(${(fs * scale) / 100})`}>
          <Wordmark brand={brand} logo={logo} color={color} />
        </g>
        {line ? (
          <text
            x={W / 2}
            y={endY + lh * finalScale + lineGap + lineSize * 0.75}
            textAnchor="middle"
            fill={c.line}
            opacity={lineIn}
            fontFamily={serif.fontFamily}
            fontStyle="italic"
            fontWeight={400}
            fontSize={lineSize}
            transform={`translate(0 ${(1 - lineIn) * lineSize * 0.5})`}
            style={{ letterSpacing: "-0.01em" }}
          >
            {line}
          </text>
        ) : null}
      </svg>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
