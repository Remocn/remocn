"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { Fragment } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const geist = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1). Built to be used five times in one film, so
 * it is fast and gets out of the way:
 * 0–14    the pill opens from its left edge (from the centre when centred).
 * 4–30    headline words rise out of their masks, 2 frames apart; the
 *         highlighted phrase carries a slow gradients.sh "mesh" fill.
 * 14–34   subhead rises and sharpens.
 * 34–end  hold. Last 12 frames: words leave upward through the same masks
 *         (`exit`), so the next shot can hard-cut in.
 */

export interface FeatureHeadlineProps {
  /** Short chip at the start of the pill. Empty string hides it. */
  tag?: string;
  /** Feature name in the pill. Empty string hides the pill. */
  label?: string;
  /** One or two lines. A "\n" forces a break. */
  headline?: string;
  /** Phrase inside `headline` that carries the gradient. */
  highlight?: string;
  subhead?: string;
  align?: "left" | "center";
  /** Leave through the masks over the last 12 frames of the composition. */
  exit?: boolean;
  accent?: string;
  /** Stage fill. "transparent" drops the stage. */
  background?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

/** gradients.sh "mesh": bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7, #0e1645]. */
const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    pillBg: "rgba(255,255,255,0.045)",
    pillLine: "rgba(255,255,255,0.12)",
    tagFg: "#FFFFFF",
    highlight: (accent: string) =>
      `linear-gradient(90deg, ${MESH[0]} 0%, #b9b6f2 30%, ${MESH[1]} 58%, color-mix(in oklab, ${accent} 70%, ${MESH[1]}) 82%, ${MESH[0]} 100%)`,
    ground: [
      `radial-gradient(95% 120% at 108% 118%, color-mix(in oklab, ${MESH[2]} 30%, transparent) 0%, color-mix(in oklab, ${MESH[3]} 30%, transparent) 45%, transparent 75%)`,
      `radial-gradient(40% 55% at 96% 104%, color-mix(in oklab, ${MESH[1]} 12%, transparent) 0%, transparent 80%)`,
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    pillBg: "rgba(255,255,255,0.7)",
    pillLine: "rgba(17,17,19,0.12)",
    tagFg: "#FFFFFF",
    highlight: (accent: string) =>
      `linear-gradient(90deg, ${MESH[2]} 0%, ${accent} 34%, #6d7ff0 62%, #9a86e6 82%, ${MESH[2]} 100%)`,
    ground: [
      `radial-gradient(95% 120% at 108% 118%, color-mix(in oklab, ${MESH[1]} 22%, transparent) 0%, color-mix(in oklab, ${MESH[0]} 30%, transparent) 45%, transparent 75%)`,
      `radial-gradient(40% 55% at 96% 104%, color-mix(in oklab, ${MESH[0]} 40%, transparent) 0%, transparent 80%)`,
    ],
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.6, 0, 0.9, 0.5);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Geist 500 advances (per 1000 em), ASCII 32–126. Used to size, not to place. */
const GEIST_500 = [
  243, 230, 349, 513, 632, 853, 668, 174, 329, 329, 420, 563, 186, 432, 186,
  457, 677, 374, 614, 600, 629, 629, 610, 507, 629, 613, 227, 227, 547, 544,
  547, 517, 901, 678, 681, 704, 701, 610, 596, 692, 705, 281, 592, 652, 584,
  883, 738, 739, 653, 739, 673, 642, 558, 696, 688, 956, 633, 586, 557, 342,
  439, 342, 438, 532, 257, 556, 591, 549, 591, 566, 413, 591, 581, 256, 274,
  565, 283, 852, 581, 562, 592, 591, 394, 535, 414, 587, 548, 806, 559, 540,
  499, 405, 274, 406, 522,
];

function textEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? GEIST_500[c - 32] : 600;
  }
  return w / 1000;
}

interface Word {
  text: string;
  line: number;
  index: number;
  /** Char range inside the highlight, as fractions of the highlight. */
  hl: [number, number] | null;
}

function splitWords(headline: string, highlight: string | undefined) {
  const lower = headline.toLowerCase();
  const hStart = highlight ? lower.indexOf(highlight.toLowerCase()) : -1;
  const hEnd = hStart >= 0 && highlight ? hStart + highlight.length : -1;
  const hLen = Math.max(1, hEnd - hStart);
  const words: Word[] = [];
  const re = /\S+|\n/g;
  let line = 0;
  let index = 0;
  for (let m = re.exec(headline); m; m = re.exec(headline)) {
    if (m[0] === "\n") {
      line += 1;
      continue;
    }
    const a = m.index;
    const b = a + m[0].length;
    const inside = hStart >= 0 && a < hEnd && b > hStart;
    words.push({
      text: m[0],
      line,
      index: index++,
      hl: inside
        ? [
            (Math.max(a, hStart) - hStart) / hLen,
            (Math.min(b, hEnd) - hStart) / hLen,
          ]
        : null,
    });
  }
  return { words, lines: line + 1 };
}

/**
 * One gradient spans the whole highlighted phrase even though each word is
 * its own masked span: every word shows its slice of a gradient sized to the
 * phrase (1.6x wider so it can drift slowly).
 */
function highlightFill(
  [a, b]: [number, number],
  drift: number,
  image: string,
): React.CSSProperties {
  const f = Math.max(0.02, b - a);
  const K = 1.6 / f;
  const o = drift * 0.35;
  const P = (a / f + o * K) / (K - 1);
  return {
    backgroundImage: image,
    backgroundSize: `${K * 100}% 100%`,
    backgroundPosition: `${P * 100}% 0%`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

export function FeatureHeadline({
  tag = "New",
  label = "Captions",
  headline = "Captions that move with every word.",
  highlight = "every word",
  subhead = "31 transcript-driven caption styles, ready to drop into any video.",
  align = "left",
  exit = true,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: FeatureHeadlineProps) {
  const raw = useCurrentFrame();
  const frame = raw * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const p = PALETTES[theme];
  const centre = align === "center";

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.55
    : Math.min(width / 1280, height / 720);
  const padX = width * (portrait ? 0.08 : 0.09);
  const maxW = Math.min(width - padX * 2, (portrait ? 2000 : 1040) * s);

  // headline size: two lines at most at full size, then shrink to a floor
  const { words, lines: hardLines } = splitWords(headline, highlight);
  const flat = headline.replace(/\n/g, " ");
  const baseFs = (portrait ? 104 : 94) * s;
  const est = (textEm(flat) - 0.035 * flat.length) * 1.06;
  const linesAtBase = Math.max(hardLines, Math.ceil((est * baseFs) / maxW));
  const fs =
    linesAtBase <= 2
      ? baseFs
      : Math.max(baseFs * 0.72, (maxW * 2) / Math.max(est, 1));

  // ---- timing ----------------------------------------------------------------
  const pillT = interpolate(frame, [0, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const wordT = (i: number) =>
    interpolate(frame, [4 + i * 2, 20 + i * 2], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const subStart = 12 + Math.min(words.length, 8) * 1.5;
  const subT = interpolate(frame, [subStart, subStart + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const EXIT = 12;
  const exitStart = durationInFrames - EXIT;
  const exitT = (delay: number) =>
    exit
      ? interpolate(raw, [exitStart + delay, exitStart + delay + 9], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        })
      : 0;
  const drift = interpolate(raw, [0, durationInFrames], [0, 1], CLAMP);

  const transparent = background === "transparent";
  const showPill = label.length > 0;
  const pillFs = 19 * s;
  const pillExit = exitT(0);
  const clip = (1 - pillT) * 100;
  const pillClip = centre
    ? `inset(0 ${clip / 2}% 0 ${clip / 2}% round 999px)`
    : `inset(0 ${clip}% 0 0 round 999px)`;
  const subExit = exitT(1);

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: p.ground.join(", "),
            transform: `translate(${(-drift * 2).toFixed(3)}%, ${(drift * 1.5).toFixed(3)}%) scale(1.06)`,
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: `0 ${padX}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: centre ? "center" : "flex-start",
          textAlign: centre ? "center" : "left",
        }}
      >
        {showPill ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: pillFs * 0.6,
              height: pillFs * 2.15,
              padding: `0 ${pillFs * 0.95}px 0 ${tag ? pillFs * 0.3 : pillFs * 0.95}px`,
              borderRadius: 999,
              background: p.pillBg,
              boxShadow: `inset 0 0 0 1px ${p.pillLine}`,
              clipPath: pillClip,
              opacity: 1 - pillExit,
              transform: `translateY(${-pillExit * 14 * s}px)`,
              marginBottom: fs * 0.42,
            }}
          >
            {tag ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: pillFs * 1.55,
                  padding: `0 ${pillFs * 0.6}px`,
                  borderRadius: 999,
                  background: accent,
                  color: p.tagFg,
                  fontFamily: mono.fontFamily,
                  fontWeight: 500,
                  fontSize: pillFs * 0.72,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  transform: `translateX(${(1 - pillT) * -10 * s}px)`,
                }}
              >
                {tag}
              </span>
            ) : null}
            <span
              style={{
                fontFamily: geist.fontFamily,
                fontWeight: 500,
                fontSize: pillFs,
                letterSpacing: "-0.01em",
                color: p.fg,
                whiteSpace: "nowrap",
                opacity: interpolate(pillT, [0.3, 1], [0, 1], CLAMP),
                transform: `translateX(${(1 - pillT) * -14 * s}px)`,
              }}
            >
              {label}
            </span>
          </div>
        ) : null}

        <div
          style={{
            maxWidth: maxW,
            fontFamily: geist.fontFamily,
            fontWeight: 500,
            fontSize: fs,
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: p.fg,
          }}
        >
          {Array.from({ length: hardLines }, (_, line) => (
            <div key={line} style={{ textWrap: "balance" }}>
              {words
                .filter((w) => w.line === line)
                .map((w, k) => {
                  const t = wordT(w.index);
                  const out = exitT(w.index * 0.6);
                  const y = (1 - t) * 108 - out * 108;
                  const hlStyle: React.CSSProperties = w.hl
                    ? highlightFill(w.hl, drift, p.highlight(accent))
                    : {};
                  return (
                    <Fragment key={w.index}>
                      {k > 0 ? " " : null}
                      <span
                        style={{
                          display: "inline-block",
                          overflow: "hidden",
                          verticalAlign: "top",
                          paddingBottom: "0.14em",
                          marginBottom: "-0.14em",
                          paddingRight: "0.04em",
                          marginRight: "-0.04em",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            transform: `translateY(${y}%)`,
                            ...hlStyle,
                          }}
                        >
                          {w.text}
                        </span>
                      </span>
                    </Fragment>
                  );
                })}
            </div>
          ))}
        </div>

        {subhead ? (
          <div
            style={{
              marginTop: fs * 0.36,
              maxWidth: Math.min(maxW * 0.82, 760 * s * (portrait ? 1.3 : 1)),
              fontFamily: geist.fontFamily,
              fontWeight: 400,
              fontSize: (portrait ? 30 : 26) * s,
              lineHeight: 1.4,
              letterSpacing: "-0.008em",
              color: p.muted,
              textWrap: "balance",
              opacity: subT * (1 - subExit),
              transform: `translateY(${(1 - subT) * 14 * s - subExit * 12 * s}px)`,
              filter: `blur(${(1 - subT) * 6 * s}px)`,
            }}
          >
            {subhead}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
