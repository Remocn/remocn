"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadInstrumentSans } from "@remotion/google-fonts/InstrumentSans";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const sans = loadInstrumentSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", { weights: ["500"], subsets: ["latin"] });

export interface DiffSwapProps {
  before?: string;
  after?: string;
  highlight?: string;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; Instrument Sans by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frame the removed line folds away and the added one grows. */
  foldAt?: number;
  /** Size of the diff, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    dim: "#77767D",
    sign: "#B9B8BE",
    minusBand: `linear-gradient(90deg, color-mix(in oklab, ${FLUTED[2]} 22%, transparent) 0%, color-mix(in oklab, ${FLUTED[2]} 7%, transparent) 55%, transparent 100%)`,
    minusEdge: `color-mix(in oklab, ${FLUTED[2]} 70%, transparent)`,
    plusBand: (a: string) =>
      `linear-gradient(90deg, color-mix(in oklab, ${a} 30%, transparent) 0%, color-mix(in oklab, ${a} 9%, transparent) 55%, transparent 100%)`,
    ground: [
      `radial-gradient(70% 70% at 104% 108%, color-mix(in oklab, ${FLUTED[0]} 62%, transparent) 0%, transparent 70%)`,
      `radial-gradient(40% 40% at -4% -6%, color-mix(in oklab, ${FLUTED[2]} 12%, transparent) 0%, transparent 75%)`,
    ].join(", "),
    hl: (a: string) =>
      `linear-gradient(95deg, ${FLUTED[3]} 0%, #ffb183 22%, ${FLUTED[1]} 62%, color-mix(in oklab, ${a} 60%, ${FLUTED[1]}) 100%)`,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    dim: "#9A9893",
    sign: "#55534F",
    minusBand: `linear-gradient(90deg, color-mix(in oklab, ${FLUTED[2]} 18%, transparent) 0%, color-mix(in oklab, ${FLUTED[2]} 6%, transparent) 55%, transparent 100%)`,
    minusEdge: `color-mix(in oklab, ${FLUTED[2]} 75%, transparent)`,
    plusBand: (a: string) =>
      `linear-gradient(90deg, color-mix(in oklab, ${a} 18%, transparent) 0%, color-mix(in oklab, ${a} 6%, transparent) 55%, transparent 100%)`,
    ground: [
      `radial-gradient(70% 70% at 104% 108%, color-mix(in oklab, ${FLUTED[1]} 16%, transparent) 0%, transparent 70%)`,
      `radial-gradient(40% 40% at -4% -6%, color-mix(in oklab, ${FLUTED[3]} 60%, transparent) 0%, transparent 75%)`,
    ].join(", "),
    hl: (a: string) =>
      `linear-gradient(95deg, #d9531c 0%, ${FLUTED[2]} 26%, ${a} 64%, ${FLUTED[0]} 100%)`,
  },
} as const;

const TRACK = -0.03;
const LINE = 1.1;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.7, 0, 0.2, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Measure = (s: string) => number;

function useMeasure(family: string, weight: number): Measure {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("diff-swap: measuring"));
  const released = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    let live = true;
    const font = `${weight} 100px "${family}"`;
    Promise.all([sans.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) ctx.font = font;
        ctxRef.current = ctx;
        setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, family, weight]);

  const ctx = ready ? ctxRef.current : null;
  return (s: string) =>
    (ctx ? ctx.measureText(s).width / 100 : s.length * 0.55) +
    TRACK * Math.max(0, s.length - 1);
}

function wrapTwo(text: string, measure: Measure, maxEm: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const one = words.join(" ");
  if (measure(one) <= maxEm || words.length < 2) {
    return { lines: [one], widest: measure(one) };
  }
  let best = { lines: [one], widest: Number.POSITIVE_INFINITY };
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(" ");
    const b = words.slice(k).join(" ");
    const w = Math.max(measure(a), measure(b));
    if (w < best.widest) best = { lines: [a, b], widest: w };
  }
  return best;
}

function splitHighlight(line: string, phrase: string) {
  if (!phrase) return [line, "", ""] as const;
  const i = line.toLowerCase().indexOf(phrase.toLowerCase());
  if (i < 0) return [line, "", ""] as const;
  return [
    line.slice(0, i),
    line.slice(i, i + phrase.length),
    line.slice(i + phrase.length),
  ] as const;
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

export function DiffSwap({
  before = "Keyframe every frame by hand.",
  after = "Install the scene. Edit the props.",
  highlight = "Edit the props.",
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = sans.fontFamily,
  fontWeight = 500,
  foldAt = 72,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: DiffSwapProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const t = THEMES[theme];
  const fg = ink ?? t.fg;
  const measure = useMeasure(fontFamily, fontWeight);

  const portrait = height > width * 1.1;
  const s = portrait ? width / 1080 : Math.min(width / 1280, height / 720);
  const padX = width * (portrait ? 0.07 : 0.085);
  const gutterEm = 0.95;

  const cap = (portrait ? 118 : 92) * s;
  const avail = width - padX * 2;
  const fitRows = (fs: number) => {
    const maxEm = avail / fs - gutterEm;
    return {
      b: wrapTwo(before, measure, maxEm),
      a: wrapTwo(after, measure, maxEm),
      maxEm,
    };
  };
  let fs = cap;
  let rows = fitRows(fs);
  for (let i = 0; i < 24; i++) {
    const tooWide = rows.b.widest > rows.maxEm || rows.a.widest > rows.maxEm;
    const tall =
      (rows.b.lines.length + rows.a.lines.length) * LINE * fs + fs * 0.6 >
      height * (portrait ? 0.56 : 0.72);
    if (!tooWide && !tall) break;
    fs *= 0.94;
    rows = fitRows(fs);
  }
  const rowPadY = fs * 0.2;
  const rowH = (n: number) => n * LINE * fs + rowPadY * 2;
  const hB = rowH(rows.b.lines.length);
  const hA = rowH(rows.a.lines.length);
  const gap = fs * 0.12;
  const bandWOf = (f: number) => width - padX * 2 + f * 0.3;

  const scaleEnd = Math.min(
    portrait ? 1.5 : 1.42,
    avail / fs / Math.max(rows.a.widest, 0.01),
    (height * (portrait ? 0.5 : 0.62)) / (rows.a.lines.length * LINE * fs),
  );

  const enterAt = (f: number, i: number) => EASE_OUT(clamp01((f - i * 3) / 18));
  const enter = (i: number) => enterAt(frame, i);
  const mark = EASE_OUT(clamp01((frame - 30) / 14));
  const openAt = (f: number) => EASE_IO(clamp01((f - 42) / 18));
  const open = openAt(frame);
  const addInAt = (f: number, i: number) =>
    EASE_OUT(clamp01((f - 53 - i * 3) / 18));
  const addIn = (i: number) => addInAt(frame, i);
  const plusBand = EASE_OUT(clamp01((frame - 46) / 14));
  const foldAtFrame = (f: number) => EASE_IO(clamp01((f - foldAt) / 20));
  const fold = foldAtFrame(frame);
  const clear = EASE_OUT(clamp01((frame - (foldAt + 6)) / 16));
  const growAt = (f: number) => EASE_IO(clamp01((f - (foldAt + 4)) / 22));
  const grow = growAt(frame);
  const hlT = EASE_OUT(clamp01((frame - (foldAt + 12)) / 18));
  const drift = interpolate(
    frame,
    [0, durationInFrames * speed],
    [0, 1],
    CLAMP,
  );

  const stack = (op: number, fo: number, gr: number) => {
    const b = hB * (1 - fo);
    const g = gap * op * (1 - fo);
    const a = hA * op;
    const z = 1 + (scaleEnd - 1) * gr;
    const tp = height / 2 - (b + g + a * z) / 2;
    return { curB: b, curA: a, zoom: z, top: tp, topA: tp + b + g };
  };
  const { curB, curA, zoom, top, topA } = stack(open, fold, grow);
  // Layout rounds a box and a baseline to whole pixels, so rows eased by
  // `top` clicked along. Each row is laid out where it rests longest (the
  // removed line before the diff opens, the added one once it has grown)
  // and travels by transform.
  const topB0 = stack(0, 0, 0).top;
  const topA1 = stack(1, 1, 1).topA;
  const pose = (f: number) => {
    const g = stack(openAt(f), foldAtFrame(f), growAt(f));
    return {
      ...g,
      foldY: foldAtFrame(f) * hB * 0.55,
      eB: rows.b.lines.map((_, i) => enterAt(f, i) * fs),
      eA: rows.a.lines.map((_, i) => addInAt(f, i) * fs),
    };
  };
  const now = pose(frame);
  const near = [pose(frame - speed), pose(frame + speed)];
  const moved = (pick: (q: typeof now) => number[]) =>
    near.some((q) => {
      const a = pick(q);
      const b = pick(now);
      return a.some((v, i) => Math.abs(v - b[i]) > 1e-3);
    });
  const movingB = moved((q) => [q.top, q.foldY, ...q.eB]);
  const movingA = moved((q) => [q.topA, q.zoom * bandWOf(fs), ...q.eA]);
  const travel = (dy: number) =>
    Math.abs(dy) < 1e-3 ? "" : `translateY(${dy}px)`;

  const transparent = background === "transparent";
  const gutter = gutterEm * fs;
  const left = padX;
  const bandW = bandWOf(fs);

  const lineStyle: React.CSSProperties = {
    fontFamily,
    fontWeight,
    fontSize: fs,
    lineHeight: LINE,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre",
  };
  const signStyle = (o: number, x: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: rowPadY,
    width: gutter * 0.7,
    textAlign: "center",
    fontFamily: mono.fontFamily,
    fontWeight: 500,
    fontSize: fs * 0.72,
    lineHeight: `${LINE * fs}px`,
    color: t.sign,
    opacity: o,
    transform: `translateX(${x}px)`,
  });

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? t.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: t.ground,
            transform: `translate(${(-drift * 1.5).toFixed(3)}%, ${(-drift * 1).toFixed(3)}%) scale(1.04)`,
          }}
        />
      ) : null}

      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: left - fs * 0.15,
            top: topB0,
            width: bandW,
            height: curB,
            overflow: "hidden",
            borderRadius: fs * 0.12,
            transform:
              `${travel(top - topB0)}${glide(movingB)}`.trim() || undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: t.minusBand,
              clipPath: `inset(0 ${((1 - mark) * 100).toFixed(2)}% 0 0)`,
              opacity: 1 - clear,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: Math.max(2, fs * 0.04),
              background: t.minusEdge,
              opacity: mark * (1 - clear),
            }}
          />
          <div style={signStyle(mark * (1 - fold), (1 - mark) * -fs * 0.3)}>
            −
          </div>
          <div
            style={{
              position: "absolute",
              left: gutter + fs * 0.15,
              top: rowPadY,
              transform: travel(-fold * hB * 0.55) || undefined,
              opacity: clamp01(1 - fold * 1.5),
            }}
          >
            {rows.b.lines.map((ln, i) => {
              const e = enter(i);
              return (
                <div
                  key={`b${i}`}
                  style={{
                    overflow: "hidden",
                    paddingBottom: fs * 0.12,
                    marginBottom: -fs * 0.12,
                  }}
                >
                  <div
                    style={{
                      ...lineStyle,
                      color: `color-mix(in oklab, ${fg} ${((1 - mark) * 100).toFixed(1)}%, ${t.dim})`,
                      transform: `translateY(${((1 - e) * 105).toFixed(2)}%)`,
                    }}
                  >
                    {ln}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: left - fs * 0.15,
            top: topA1,
            width: bandW,
            height: curA,
            overflow: "hidden",
            borderRadius: fs * 0.12,
            // The mark stays on at rest: the row rests under a zoom, off the
            // pixel grid, and its text keeps the lean there.
            transform: `${travel(topA - topA1)} translateX(${(grow * (fs * 0.15 - (gutter + fs * 0.15) * zoom)).toFixed(2)}px) scale(${zoom.toFixed(4)})${glide(movingA)}`,
            transformOrigin: "left top",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: t.plusBand(accent),
              clipPath: `inset(0 ${((1 - plusBand) * 100).toFixed(2)}% 0 0)`,
              opacity: 1 - clear,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: Math.max(2, fs * 0.04),
              background: accent,
              opacity: plusBand * (1 - clear),
            }}
          />
          <div
            style={signStyle(
              plusBand * (1 - clear),
              (1 - plusBand) * -fs * 0.3,
            )}
          >
            +
          </div>
          <div
            style={{
              position: "absolute",
              left: gutter + fs * 0.15,
              top: rowPadY,
            }}
          >
            {rows.a.lines.map((ln, i) => {
              const e = addIn(i);
              const [pre, hl, post] = splitHighlight(ln, highlight);
              return (
                <div
                  key={`a${i}`}
                  style={{
                    overflow: "hidden",
                    paddingBottom: fs * 0.12,
                    marginBottom: -fs * 0.12,
                  }}
                >
                  <div
                    style={{
                      ...lineStyle,
                      color: fg,
                      opacity: clamp01(e * 1.8),
                      transform: `translateY(${((1 - e) * 105).toFixed(2)}%)`,
                    }}
                  >
                    {pre}
                    {hl ? (
                      <span style={{ position: "relative" }}>
                        <span style={{ opacity: 1 - hlT }}>{hl}</span>
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            opacity: hlT,
                            backgroundImage: t.hl(accent),
                            backgroundSize: "160% 100%",
                            backgroundPosition: `${(drift * 50).toFixed(2)}% 0%`,
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                            paddingRight: "0.05em",
                          }}
                        >
                          {hl}
                        </span>
                      </span>
                    ) : null}
                    {post}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
