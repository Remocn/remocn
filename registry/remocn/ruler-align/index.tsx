"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const face = loadFont("normal", { weights: ["300"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface RulerAlignProps {
  /** The line the ruler straightens. Letters without descenders sit best on the edge. */
  text?: string;
  /** The ruler's straight edge. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  dark: {
    bg: "#0A0A0A",
    fg: "#F2F2F0",
    rulerFill: "rgba(255,255,255,0.045)",
    rulerLine: "rgba(255,255,255,0.16)",
    tick: "rgba(255,255,255,0.34)",
    num: "rgba(255,255,255,0.42)",
  },
  light: {
    bg: "#FAFAF9",
    fg: "#0E0E0D",
    rulerFill: "rgba(0,0,0,0.03)",
    rulerLine: "rgba(0,0,0,0.14)",
    tick: "rgba(0,0,0,0.36)",
    num: "rgba(0,0,0,0.45)",
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_FALL = Easing.bezier(0.5, 0, 0.9, 0.6);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Beats, in frames at 30fps (before `speed`).
const IN = 0;
const IN_STAGGER = 2;
const RULER_IN = 14;
const RULER_IN_LEN = 30;
const LEVEL = 44;
const LEVEL_LEN = 14;
const RISE = 56;
const RISE_LEN = 24;
const DROP = 82;
const DROP_STAGGER = 3;
const FALL = 10;
const TAP_1 = 112;
const TAP_2 = 130;
const TAP_LEN = 10;
const SLIDE_LEN = 16;

const LINE_HEIGHT = 1.2;
/** Gap between the baseline and the ruler while it waits underneath, in em. */
const PARK = 0.62;
const RULER_H = 0.46;

interface Layout {
  xs: number[];
  ws: number[];
  w: number;
  baseline: number;
}

/** Deterministic 0..1 noise. */
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function sameLayout(a: Layout | null, b: Layout) {
  return (
    a !== null &&
    a.xs.join() === b.xs.join() &&
    a.w === b.w &&
    a.baseline === b.baseline
  );
}

/** A quick dip and recovery of the ruler, in em (positive is down). */
function tapDip(f: number, at: number) {
  const d = f - at;
  if (d < 0 || d > TAP_LEN) return 0;
  if (d < 3) return 0.05 * EASE_OUT(d / 3);
  return 0.05 * (1 - EASE_IN_OUT((d - 3) / (TAP_LEN - 3)));
}

/** The hop a letter makes when the ruler is tapped, in em (positive is up). */
function hop(f: number, at: number) {
  const d = f - at - 2;
  if (d < 0 || d > 10) return 0;
  return 0.07 * Math.sin((Math.PI * d) / 10);
}

export function RulerAlign({
  text = "Made to measure.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RulerAlignProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];
  const clipId = `ruler-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const em = Math.round(width * 0.088);
  const textStyle = {
    fontFamily: face.fontFamily,
    fontSize: em,
    fontWeight: 300,
    letterSpacing: "-0.035em",
    lineHeight: LINE_HEIGHT,
    whiteSpace: "pre",
  } as const;

  const chars = Array.from(text);
  const rowRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("ruler-align: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    Promise.all([face.waitUntilDone(), mono.waitUntilDone()])
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!live) return;
        const row = rowRef.current;
        const base = baseRef.current;
        if (row && base) {
          const r = row.getBoundingClientRect();
          const scale = r.width / row.offsetWidth || 1;
          const spans = Array.from(row.querySelectorAll("[data-l]"));
          const next: Layout = {
            xs: spans.map(
              (el) => (el.getBoundingClientRect().left - r.left) / scale,
            ),
            ws: spans.map((el) => el.getBoundingClientRect().width / scale),
            w: row.offsetWidth,
            baseline: base.offsetTop,
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
  }, [text, em, handle]);

  const L = layout;
  const textW = L?.w ?? 0;
  const left = width / 2 - textW / 2;
  const baseY = height / 2 + em * 0.2;
  const rowTop = baseY - (L?.baseline ?? em);

  // The messy line: uneven gaps, letters off the baseline, a little tilt.
  // Neighbours alternate above and below so the line reads as jumbled.
  let cum = 0;
  const raw = chars.map((ch, i) => {
    const seed = i + 1;
    if (ch !== " ") cum += (hash(seed * 3.7) * 0.17 - 0.035) * em;
    const sign = i % 2 === 0 ? -1 : 1;
    return {
      off: cum,
      dy: sign * (0.07 + hash(seed * 7.3) * 0.13) * em,
      rot: (hash(seed * 5.9) - 0.5) * 14,
    };
  });
  const mean = raw.reduce((a, r) => a + r.off, 0) / Math.max(1, raw.length);
  const mess = raw.map((r) => ({ ...r, off: r.off - mean }));

  // Ruler motion.
  const rulerW = textW + em * 1.4;
  const rulerX0 = width / 2 - rulerW / 2;
  const inP = interpolate(frame, [RULER_IN, RULER_IN + RULER_IN_LEN], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const level = interpolate(frame, [LEVEL, LEVEL + LEVEL_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const rise = interpolate(frame, [RISE, RISE + RISE_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const dip = (tapDip(frame, TAP_1) + tapDip(frame, TAP_2)) * em;
  /** Height of the ruler's top edge above the baseline (negative is below). */
  const edge = -em * PARK * (1 - rise);
  const rulerX = interpolate(inP, [0, 1], [-rulerW - em, rulerX0]);
  const rulerTilt = interpolate(inP, [0, 1], [-5, -2.2]) * (1 - level);
  const rulerTop = baseY - edge + dip;

  // High letters drop onto the edge once it reaches the baseline, left to right.
  const highOrder: number[] = [];
  mess.forEach((m, i) => {
    if (chars[i] !== " " && m.dy < 0) highOrder.push(i);
  });

  // Kerning: each tap moves the letters halfway home.
  const slideP = (i: number, at: number) =>
    interpolate(
      frame,
      [at + 2 + (i % 4), at + 2 + (i % 4) + SLIDE_LEN],
      [0, 1],
      { ...clamp, easing: EASE_IN_OUT },
    );

  const glyphs = chars.map((ch, i) => {
    if (ch === " ") return null;
    const m = mess[i];
    const w = L?.ws[i] ?? 0;
    const home = left + (L?.xs[i] ?? 0);

    const fade = interpolate(
      frame,
      [IN + i * IN_STAGGER, IN + i * IN_STAGGER + 18],
      [0, 1],
      { ...clamp, easing: EASE_OUT },
    );

    // Vertical: below the baseline is positive.
    let y = m.dy;
    let rot = m.rot;
    let sx = 1;
    let sy = 1;
    if (m.dy > 0) {
      // Low letter: the rising edge pushes it up and flattens it.
      const lift = Math.max(0, -edge);
      y = Math.min(m.dy, lift);
      rot = m.rot * (y / m.dy);
    } else {
      const k = highOrder.indexOf(i);
      const start = DROP + k * DROP_STAGGER;
      const p = interpolate(frame, [start, start + FALL], [0, 1], {
        ...clamp,
        easing: EASE_FALL,
      });
      y = m.dy * (1 - p);
      rot = m.rot * (1 - p);
      const d = frame - (start + FALL);
      if (d >= 0 && d < 7) {
        const b = Math.sin((Math.PI * d) / 7) * (1 - d / 9);
        sx = 1 + 0.025 * b;
        sy = 1 - 0.05 * b;
      }
    }
    y += dip - (hop(frame, TAP_1) + hop(frame, TAP_2)) * em;

    const k1 = slideP(i, TAP_1);
    const k2 = slideP(i, TAP_2);
    const x = home + m.off * (1 - 0.55 * k1 - 0.45 * k2);

    return (
      <span
        key={i}
        style={{
          ...textStyle,
          position: "absolute",
          left: x,
          top: rowTop,
          color: t.fg,
          opacity: fade,
          filter: fade < 1 ? `blur(${(1 - fade) * 8}px)` : undefined,
          transformOrigin: `${w / 2}px ${L?.baseline ?? em}px`,
          transform: `translateY(${y + (1 - fade) * em * 0.12}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
        }}
      >
        {ch}
      </span>
    );
  });

  // Ruler ticks: a long one every 10 units, mid every 5.
  const unit = em * 0.06;
  const ticks: { x: number; h: number; n: number | null }[] = [];
  const count = Math.floor((rulerW - em * 0.2) / unit);
  for (let k = 0; k <= count; k++) {
    const long = k % 10 === 0;
    const mid = k % 5 === 0;
    ticks.push({
      x: em * 0.1 + k * unit,
      h: long ? 0.2 : mid ? 0.13 : 0.075,
      n: long ? k / 10 : null,
    });
  }

  const hair = Math.max(1.5, width / 720);

  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      {/* measuring row: never shown */}
      <div style={{ position: "absolute", visibility: "hidden", top: 0 }}>
        <div ref={rowRef} style={{ ...textStyle, display: "inline-block" }}>
          {chars.map((ch, i) => (
            <span key={i} data-l="">
              {ch}
            </span>
          ))}
          <span
            ref={baseRef}
            style={{ display: "inline-block", width: 0, height: 0 }}
          />
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: L ? 1 : 0 }}>
        <div
          style={{
            position: "absolute",
            left: rulerX,
            top: rulerTop,
            width: rulerW,
            height: em * RULER_H,
            transformOrigin: "50% 0%",
            transform: `rotate(${rulerTilt}deg)`,
            opacity: inP,
          }}
        >
          <svg
            width={rulerW}
            height={em * RULER_H}
            style={{ display: "block", overflow: "visible" }}
            aria-hidden
          >
            <defs>
              <clipPath id={clipId}>
                <rect
                  x={0}
                  y={0}
                  width={rulerW}
                  height={em * RULER_H}
                  rx={em * 0.04}
                />
              </clipPath>
            </defs>
            <rect
              x={0.5}
              y={0.5}
              width={rulerW - 1}
              height={em * RULER_H - 1}
              rx={em * 0.04}
              fill={t.rulerFill}
              stroke={t.rulerLine}
              strokeWidth={1}
            />
            <g clipPath={`url(#${clipId})`}>
              {ticks.map((tk) => (
                <line
                  key={tk.x}
                  x1={tk.x}
                  x2={tk.x}
                  y1={0}
                  y2={tk.h * em}
                  stroke={t.tick}
                  strokeWidth={1}
                />
              ))}
              {ticks.map((tk) =>
                tk.n === null ? null : (
                  <text
                    key={`n${tk.x}`}
                    x={tk.x + em * 0.035}
                    y={em * 0.33}
                    fill={t.num}
                    fontFamily={mono.fontFamily}
                    fontSize={em * 0.095}
                  >
                    {tk.n}
                  </text>
                ),
              )}
            </g>
            {/* the straight edge */}
            <rect x={0} y={0} width={rulerW} height={hair} fill={accent} />
          </svg>
        </div>

        {glyphs}
      </div>
    </AbsoluteFill>
  );
}
