"use client";

import { loadFont } from "@remotion/google-fonts/InterTight";
import { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const face = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface CaretLetterProps {
  /** The word. The caret types every letter but one, then becomes that one. */
  word?: string;
  /** Index of the letter the caret turns into. Pick a plain stem: l, I, i without its dot, 1. */
  stemIndex?: number;
  /** Small grey line under the word. */
  subline?: string;
  /** Colour of the caret, and of the letter it becomes. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  light: { bg: "#FAFAF9", fg: "#0E0E0D", muted: "#8C8C88" },
  dark: { bg: "#0A0A0A", fg: "#F2F2F0", muted: "#7C7C79" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_TYPE = Easing.bezier(0.4, 0, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Beats, in frames at 30fps (before `speed`).
const CARET_IN = 0;
const TYPE = 46;
const TYPE_LEN = 46;
const LETTER_LEN = 16;
const SLIDE = 110;
const SLIDE_LEN = 26;
const OPEN = 118;
const OPEN_LEN = 24;
const MORPH = 134;
const MORPH_LEN = 16;
const SUB = 150;

/** Caret proportions in em. */
const CARET_W = 0.02;
const CARET_UP = 0.98;
const CARET_DOWN = 0.22;
const LINE_HEIGHT = 1.2;

interface Ink {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Layout {
  /** Letter origins in the finished word. */
  full: number[];
  /** Letter origins in the typed word (stem letter missing). */
  typed: number[];
  fullW: number;
  typedW: number;
  baseline: number;
  rowH: number;
  stem: Ink;
}

function measureInk(char: string, font: string, fontSize: number): Ink | null {
  const k = 4;
  const size = fontSize * k;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size * 2);
  canvas.height = Math.ceil(size * 2);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const ox = Math.round(size * 0.5);
  const by = Math.round(size * 1.3);
  ctx.font = font.replace("{size}", `${size}px`);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(char, ox, by);
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  let left = width;
  let right = 0;
  let top = height;
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 127) {
        if (x < left) left = x;
        if (x + 1 > right) right = x + 1;
        if (y < top) top = y;
        if (y + 1 > bottom) bottom = y + 1;
      }
    }
  }
  if (right <= left) return null;
  return {
    left: (left - ox) / k,
    right: (right - ox) / k,
    top: (top - by) / k,
    bottom: (bottom - by) / k,
  };
}

function sameLayout(a: Layout | null, b: Layout) {
  return (
    a !== null &&
    a.full.join() === b.full.join() &&
    a.typed.join() === b.typed.join() &&
    a.baseline === b.baseline &&
    a.stem.left === b.stem.left
  );
}

export function CaretLetter({
  word = "launch",
  stemIndex = 0,
  subline = "Animated components for your next release.",
  accent = "#3B5BFD",
  theme = "light",
  speed = 1,
}: CaretLetterProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];

  const letters = Array.from(word);
  const stem = Math.max(0, Math.min(letters.length - 1, stemIndex));
  const typedLetters = letters.filter((_, i) => i !== stem);
  const fontSize = Math.round(width * 0.15);
  const subSize = Math.round(width * 0.0165);
  const textStyle = {
    fontFamily: face.fontFamily,
    fontSize,
    fontWeight: 300,
    letterSpacing: "-0.035em",
    lineHeight: LINE_HEIGHT,
    whiteSpace: "pre",
  } as const;

  const fullRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("caret-letter: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    face
      .waitUntilDone()
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!live) return;
        const fullRow = fullRef.current;
        const typedRow = typedRef.current;
        const base = baseRef.current;
        if (fullRow && typedRow && base) {
          const origins = (row: HTMLDivElement) => {
            const r = row.getBoundingClientRect();
            const scale = r.width / row.offsetWidth || 1;
            const spans = Array.from(row.querySelectorAll("[data-l]"));
            return {
              xs: spans.map(
                (el) => (el.getBoundingClientRect().left - r.left) / scale,
              ),
              w: row.offsetWidth,
            };
          };
          const f = origins(fullRow);
          const ty = origins(typedRow);
          const family = face.fontFamily.includes('"')
            ? face.fontFamily
            : `"${face.fontFamily}"`;
          const ink = measureInk(
            letters[stem] ?? "l",
            `300 {size} ${family}`,
            fontSize,
          ) ?? {
            left: fontSize * 0.06,
            right: fontSize * 0.12,
            top: -fontSize * 0.74,
            bottom: 0,
          };
          const next: Layout = {
            full: f.xs,
            typed: ty.xs,
            fullW: f.w,
            typedW: ty.w,
            baseline: base.offsetTop,
            rowH: fullRow.offsetHeight,
            stem: ink,
          };
          setLayout((prev) => (sameLayout(prev, next) ? prev : next));
        }
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [word, stem, fontSize, handle]);

  const L = layout;
  const gap = fontSize * 0.05;
  const typedEnd = (L?.typedW ?? 0) + gap * 0.4;

  // Typing: the caret sweeps right, letters grow in its wake.
  const typeX = (f: number) =>
    interpolate(f, [TYPE, TYPE + TYPE_LEN], [0, typedEnd], {
      ...clamp,
      easing: EASE_TYPE,
    });
  // Right edge of each typed letter, for the moment the caret clears it.
  const typedRight = (j: number) =>
    j + 1 < typedLetters.length ? (L?.typed[j + 1] ?? 0) : (L?.typedW ?? 0);
  const letterIn = typedLetters.map((_, j) => {
    const left = L?.typed[j] ?? 0;
    const edge = typedRight(j) - (typedRight(j) - left) * 0.1;
    for (let f = TYPE; f <= TYPE + TYPE_LEN; f++)
      if (typeX(f) >= edge) return f - 2;
    return TYPE + TYPE_LEN;
  });

  // Slide home: the caret runs back into the word, the letters part for it.
  const slide = interpolate(frame, [SLIDE, SLIDE + SLIDE_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const open = interpolate(frame, [OPEN, OPEN + OPEN_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const morph = interpolate(frame, [MORPH, MORPH + MORPH_LEN], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });

  const ink = L?.stem ?? { left: 0, right: 0, top: 0, bottom: 0 };
  const stemOrigin = L?.full[stem] ?? 0;
  const stemCx = stemOrigin + (ink.left + ink.right) / 2;
  // Before the stem slot opens, the typed letters to its right sit where the
  // stem will go; the caret aims for the slot as it opens.
  const caretHome =
    stem < typedLetters.length
      ? interpolate(open, [0, 1], [L?.typed[stem] ?? 0, stemCx])
      : stemCx;
  const caretX =
    frame < SLIDE
      ? typeX(frame)
      : interpolate(slide, [0, 1], [typedEnd, caretHome]);

  // Centre the visible block, like centred text growing as it is typed.
  const typingCentre = typeX(frame) / 2;
  const fullCentre = (L?.fullW ?? 0) / 2;
  const centre = interpolate(slide, [0, 1], [typingCentre, fullCentre]);

  // Caret blink: soft on/off while idle, solid while it moves.
  const blinkAt = (f: number, from: number, to: number) => {
    if (f < from || f > to) return 1;
    const u = (f - from) % 24;
    if (u < 13) return 1;
    if (u < 16) return 1 - (u - 13) / 3;
    if (u < 21) return 0;
    return (u - 21) / 3;
  };
  const caretIn = interpolate(frame, [CARET_IN, CARET_IN + 10], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const blink =
    frame < TYPE
      ? blinkAt(frame, 8, TYPE - 4)
      : blinkAt(frame, TYPE + TYPE_LEN + 2, SLIDE - 2);

  // Caret geometry, morphing into the stem of the letter.
  const baseline = L?.baseline ?? 0;
  const caretW = interpolate(
    morph,
    [0, 1],
    [fontSize * CARET_W, ink.right - ink.left],
  );
  const caretTop = interpolate(
    morph,
    [0, 1],
    [baseline - fontSize * CARET_UP, baseline + ink.top],
  );
  const caretBottom = interpolate(
    morph,
    [0, 1],
    [baseline + fontSize * CARET_DOWN, baseline + ink.bottom],
  );

  const subP = interpolate(frame, [SUB, SUB + 30], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });

  const rowH = L?.rowH ?? fontSize * LINE_HEIGHT;
  const left = width / 2 - centre;
  const top = height / 2 - rowH / 2 - height * 0.035;

  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      {/* measuring rows: never shown */}
      <div style={{ position: "absolute", visibility: "hidden", top: 0 }}>
        <div ref={fullRef} style={{ ...textStyle, display: "inline-block" }}>
          {letters.map((ch, i) => (
            <span key={i} data-l="">
              {ch}
            </span>
          ))}
          <span
            ref={baseRef}
            style={{ display: "inline-block", width: 0, height: 0 }}
          />
        </div>
        <br />
        <div ref={typedRef} style={{ ...textStyle, display: "inline-block" }}>
          {typedLetters.map((ch, i) => (
            <span key={i} data-l="">
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top,
          width: 0,
          height: rowH,
          opacity: L ? 1 : 0,
        }}
      >
        {typedLetters.map((ch, j) => {
          const p = interpolate(
            frame,
            [letterIn[j] ?? TYPE, (letterIn[j] ?? TYPE) + LETTER_LEN],
            [0, 1],
            { ...clamp, easing: EASE_OUT },
          );
          const fullIndex = j < stem ? j : j + 1;
          const x = interpolate(
            open,
            [0, 1],
            [L?.typed[j] ?? 0, L?.full[fullIndex] ?? 0],
          );
          return (
            <span
              key={j}
              style={{
                ...textStyle,
                position: "absolute",
                left: x,
                top: 0,
                color: t.fg,
                opacity: p,
                filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
                transformOrigin: `0px ${baseline}px`,
                transform: `scale(${0.6 + 0.4 * p})`,
              }}
            >
              {ch}
            </span>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: caretX - caretW / 2,
            top: caretTop,
            width: caretW,
            height: caretBottom - caretTop,
            background: accent,
            borderRadius: interpolate(morph, [0, 1], [caretW / 2, 0]),
            opacity: caretIn * blink,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: (L?.fullW ?? 0) / 2,
            top: rowH + fontSize * 0.02,
            transform: `translate(-50%, ${(1 - subP) * 12}px)`,
            whiteSpace: "nowrap",
            fontFamily: face.fontFamily,
            fontWeight: 400,
            fontSize: subSize,
            letterSpacing: "-0.005em",
            lineHeight: 1.4,
            color: t.muted,
            opacity: subP,
            filter: `blur(${(1 - subP) * 8}px)`,
          }}
        >
          {subline}
        </div>
      </div>
    </AbsoluteFill>
  );
}
