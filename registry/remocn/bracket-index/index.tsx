"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
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
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;
// The remocn.dev logo: R mark 0.76em tall on the baseline, then "emocn" in
// Manrope 600 at -0.025em. Manrope's baseline sits 0.883em into a 1em line box.
const LOGO_R = 0.76;
const LOGO_GAP = 0.04;
const LOGO_TRACK = -0.025;
const BASELINE = 0.883;

export interface BracketIndexProps {
  /** Text set before the brackets; it steps aside for the product name. */
  prefix?: string;
  /** Words indexed inside the brackets, in order. */
  words?: string[];
  /** Final word the brackets close on. */
  product?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.7, 0, 0.2, 1);
const EASE_SNAP = Easing.bezier(0.22, 1.12, 0.36, 1);

const WEIGHT = 500;
const TRACK = -0.03;
const SERIF_TRACK = -0.01;
const PAD = 0.2;
const GAP = 0.26;

const OPEN_AT = 6;
const OPEN_LEN = 16;
const HOLD = 22;
const SWAP = 16;
const ROLL = 8;
const RESIZE = 8;
const FINAL_SWAP = 20;

// gradients.sh "beam" palette (#f4f7ff #8fb4ff #3d5bff #1a1660), with the
// accent standing in for #3d5bff. Dark runs light→accent, light runs accent→deep.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    rest: "#77767C",
    beam: ["#F4F7FF", "#8FB4FF", ""],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    rest: "#8E8C86",
    beam: ["", "#2B37C9", "#1A1660"],
  },
} as const;

function isLogo(word: string) {
  return word.trim().toLowerCase() === "remocn";
}

/** Widths in em: [prefix (serif italic), ...items (Manrope, or the logo)]. */
function useWidths(strings: string[]) {
  const [widths, setWidths] = useState<number[] | null>(null);
  const [handle] = useState(() => delayRender("bracket-index: measuring"));
  const released = useRef(false);
  const key = strings.join("\u0000");

  useEffect(() => {
    let live = true;
    const sans = `${WEIGHT} 100px "${manrope.fontFamily}"`;
    const logo = `600 100px "${manrope.fontFamily}"`;
    const italic = `italic 400 100px "${serif.fontFamily}"`;
    Promise.all([
      manrope.waitUntilDone(),
      serif.waitUntilDone(),
      document.fonts.load(sans),
      document.fonts.load(logo),
      document.fonts.load(italic),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const run = (s: string, font: string, track: number) => {
          if (!ctx) return s.length * 0.55;
          ctx.font = font;
          return ctx.measureText(s).width / 100 + track * [...s].length;
        };
        setWidths(
          key.split("\u0000").map((s, i) => {
            if (i === 0) return run(s, italic, SERIF_TRACK);
            if (isLogo(s)) {
              return (
                (LOGO_R * R_W) / R_H + LOGO_GAP + run("emocn", logo, LOGO_TRACK)
              );
            }
            return run(s, sans, TRACK);
          }),
        );
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);

  return widths;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function BracketIndex({
  prefix = "Motion for",
  words = ["launches", "changelogs", "demos"],
  product = "remocn",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BracketIndexProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const beam = t.beam.map((c) => c || accent);

  const items = useMemo(() => [...words, product], [words, product]);
  const widths = useWidths(useMemo(() => [prefix, ...items], [prefix, items]));

  // Swap i brings items[i] in. Swap 0 is the bracket opening.
  const starts = useMemo(() => {
    const s = [OPEN_AT];
    for (let i = 1; i < items.length; i++) {
      s.push(s[i - 1] + (i === 1 ? OPEN_LEN : SWAP) + HOLD);
    }
    return s;
  }, [items.length]);

  if (!widths)
    return <div style={{ position: "absolute", inset: 0, background: t.bg }} />;

  const prefixW = widths[0];
  const itemW = widths.slice(1);
  const last = items.length - 1;

  const stroke = 0.022;
  const boxOf = (slot: number) => 2 * stroke + 2 * PAD + slot;
  const widest = Math.max(
    ...itemW.map((w, i) => boxOf(w) + (i === last ? 0 : prefixW + GAP)),
  );

  // The brackets always hold the wider of the two words: a longer word
  // gets room before it rolls in, a shorter one is closed on after.
  const rollAt = (i: number) =>
    i > 0 && itemW[i] > itemW[i - 1] ? starts[i] + RESIZE - 2 : starts[i];
  let slot = 0;
  for (let i = 0; i < items.length; i++) {
    if (frame < starts[i]) break;
    if (i === 0) {
      slot =
        itemW[0] *
        interpolate(frame, [starts[0], starts[0] + OPEN_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_SNAP,
        });
      continue;
    }
    const from = itemW[i - 1];
    const resizeAt = itemW[i] > from ? starts[i] : starts[i] + ROLL - 1;
    const p = interpolate(frame, [resizeAt, resizeAt + RESIZE], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    slot = from + (itemW[i] - from) * p;
  }

  const finalP = interpolate(
    frame,
    [starts[last], starts[last] + FINAL_SWAP],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );
  const presence = 1 - finalP;
  // The product name lands bigger than the indexed words: a poster frame.
  const sizeA = Math.min(height * 0.15, (width * 0.84) / widest);
  const sizeB = Math.min(height * 0.27, (width * 0.6) / boxOf(itemW[last]));
  const size = sizeA + (sizeB - sizeA) * finalP;
  const box = boxOf(slot);
  const total = presence * (prefixW + GAP) + box;

  const cx = width / 2;
  const cy = height / 2;
  const em = (v: number) => v * size;
  const groupLeft = cx - em(total) / 2;
  const bracketL = groupLeft + em(presence * (prefixW + GAP));
  const bracketR = bracketL + em(box);
  const slotCenter = (bracketL + bracketR) / 2;

  const intro = interpolate(frame, [0, 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const half = em(0.8) * (0.7 + 0.3 * intro);
  const arm = em(0.2) * intro;
  const sw = Math.max(1.5, sizeA * stroke);
  // Lowercase words sit below cap center; nudge the frame toward x-height.
  const top = cy + em(0.04) - half;
  const bottom = cy + em(0.04) + half;
  const lineTop = cy - em(0.5);

  const bracketPath = (x: number, dir: 1 | -1) => {
    const xi = x + (dir * sw) / 2;
    return `M ${xi + dir * arm} ${top + sw / 2} H ${xi} V ${bottom - sw / 2} H ${xi + dir * arm}`;
  };

  const prefixOpacity =
    interpolate(frame, [0, 10], [0.15, 1], CLAMP) *
    interpolate(presence, [0.45, 1], [0, 1], CLAMP);
  const prefixRise = interpolate(frame, [0, 12], [em(0.14), 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const textStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    fontFamily: manrope.fontFamily,
    fontWeight: WEIGHT,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "nowrap",
    color: t.fg,
    fontKerning: "normal",
  };

  // Words ride one strip through the slit, like an odometer: the outgoing
  // word and the incoming one never share the window.
  const roll = (i: number) =>
    interpolate(frame, [rollAt(i), rollAt(i) + ROLL], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const travel = 1.16;
  // The gradient turns a touch over the shot; never more than that.
  const drift = interpolate(frame, [0, 180], [0, 1], CLAMP);
  const wordLayers = items.map((word, i) => {
    const s = starts[i];
    const enter =
      i === 0
        ? interpolate(frame, [s, s + OPEN_LEN], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          })
        : roll(i);
    const exit = i < last ? roll(i + 1) : 0;
    if (frame < s || exit >= 1) return null;
    const y =
      (i === 0 ? em(0.1) : em(travel)) * (1 - enter) - em(travel) * exit;
    // Dim whichever word is leaving the slit so the stacked frames stay quiet.
    const opacity =
      (i === 0 ? 0.35 + 0.65 * enter : 0.25 + 0.75 * enter) *
      (1 - Math.min(1, exit / 0.6));
    if (isLogo(word)) {
      const lw = em(itemW[i]);
      const rh = em(LOGO_R);
      const base = em(BASELINE);
      return (
        <svg
          key={word + String(i)}
          width={lw}
          height={em(1.14)}
          style={{
            position: "absolute",
            top: 0,
            left: slotCenter,
            overflow: "visible",
            transform: `translate(-50%, ${y}px)`,
            opacity,
          }}
          aria-hidden
        >
          <path
            d={REMOCN_R_PATH}
            fill={`url(#${uid}-logo)`}
            transform={`translate(0 ${base - rh}) scale(${rh / R_H})`}
          />
          <text
            x={(rh * R_W) / R_H + em(LOGO_GAP)}
            y={base}
            fill={`url(#${uid}-logo)`}
            fontFamily={manrope.fontFamily}
            fontWeight={600}
            fontSize={size}
            letterSpacing={`${LOGO_TRACK}em`}
            style={{ fontKerning: "normal" }}
          >
            emocn
          </text>
          <defs>
            <linearGradient
              id={`${uid}-logo`}
              gradientUnits="userSpaceOnUse"
              x1={lw * (0.05 + 0.1 * drift)}
              y1={base - em(0.95)}
              x2={lw * (0.95 - 0.1 * drift)}
              y2={base + em(0.2)}
            >
              <stop offset="0" stopColor={beam[0]} />
              <stop offset="0.5" stopColor={beam[1]} />
              <stop offset="1" stopColor={beam[2]} />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    return (
      <div
        key={word + String(i)}
        style={{
          ...textStyle,
          left: slotCenter,
          transform: `translate(-50%, ${y}px)`,
          opacity,
        }}
      >
        {word}
      </div>
    );
  });

  const innerL = bracketL + sw + em(0.04);
  const innerR = bracketR - sw - em(0.04);

  // Counter: two-digit index that rolls on every swap.
  const counterSize = Math.max(12, sizeA * 0.2);
  const counterRows = items.map((_, i) => {
    const s = starts[i];
    const into =
      i === 0
        ? 1
        : interpolate(frame, [s + 2, s + 12], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
    const out =
      i < last
        ? interpolate(frame, [starts[i + 1], starts[i + 1] + 8], [0, 1], {
            ...CLAMP,
            easing: EASE_IO,
          })
        : 0;
    if ((i > 0 && frame < s + 2) || out >= 1) return null;
    return (
      <div
        key={`c${String(i)}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translateY(${(1 - into) * counterSize * 1.1 - out * counterSize * 1.1}px)`,
          opacity: into * (1 - out),
        }}
      >
        {pad2(i + 1)}
      </div>
    );
  });
  const counterIn = interpolate(
    frame,
    [starts[0] + 8, starts[0] + 18],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );

  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: EASE_OUT(finalP),
          background:
            theme === "dark"
              ? `radial-gradient(64% 62% at ${46 + 8 * drift}% 122%, color-mix(in oklab, ${beam[1]} 46%, transparent) 0%, color-mix(in oklab, ${beam[2]} 34%, transparent) 38%, color-mix(in oklab, #1A1660 26%, transparent) 62%, transparent 86%)`
              : `radial-gradient(64% 62% at ${46 + 8 * drift}% 122%, color-mix(in oklab, #8FB4FF 58%, transparent) 0%, color-mix(in oklab, #8FB4FF 22%, transparent) 50%, transparent 84%)`,
        }}
      />
      <div
        style={{
          ...textStyle,
          fontFamily: serif.fontFamily,
          fontStyle: "italic",
          fontWeight: 400,
          letterSpacing: `${SERIF_TRACK}em`,
          left: bracketL - em(GAP + prefixW),
          top: lineTop,
          transform: `translateY(${prefixRise}px)`,
          opacity: prefixOpacity,
        }}
      >
        {prefix}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: lineTop - em(0.02),
          height: em(1.14),
          overflow: "hidden",
          clipPath: `inset(0 ${width - innerR}px 0 ${innerL}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: em(0.02),
            width,
          }}
        >
          {wordLayers}
        </div>
      </div>

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${uid}-bracket`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={top}
            x2={0}
            y2={bottom}
          >
            <stop offset="0" stopColor={beam[0]} />
            <stop offset="0.55" stopColor={beam[1]} />
            <stop offset="1" stopColor={beam[2]} />
          </linearGradient>
        </defs>
        <g
          fill="none"
          stroke={`url(#${uid}-bracket)`}
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          opacity={interpolate(intro, [0, 1], [0.2, 1])}
        >
          <path d={bracketPath(bracketL, 1)} />
          <path d={bracketPath(bracketR, -1)} />
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: bracketL,
          top: top - counterSize * 1.75,
          height: counterSize * 1.2,
          display: "flex",
          alignItems: "center",
          fontFamily: mono.fontFamily,
          fontWeight: 400,
          fontSize: counterSize,
          lineHeight: 1,
          letterSpacing: "0.02em",
          fontVariantNumeric: "tabular-nums",
          color: t.rest,
          opacity: counterIn,
          transform: `translateY(${(1 - counterIn) * counterSize * 0.5}px)`,
          whiteSpace: "nowrap",
        }}
      >
        <span>[</span>
        <span
          style={{
            position: "relative",
            display: "inline-block",
            width: "1.2em",
            height: counterSize * 1.2,
            overflow: "hidden",
            top: counterSize * 0.1,
          }}
        >
          {counterRows}
        </span>
        <span>]</span>
      </div>
    </AbsoluteFill>
  );
}
