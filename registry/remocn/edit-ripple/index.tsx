"use client";

import { loadFont } from "@remotion/google-fonts/Epilogue";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_PAIRS,
  type EditRippleElementId,
  editRippleTimeline,
  pairsOf,
} from "./timeline";

const epilogue = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface EditRipplePair {
  cause: string;
  effect: string;
}

export interface EditRippleProps {
  pairs?: EditRipplePair[];
  accent?: string;
  /** Text color words cool to; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Epilogue by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames the effect line trails the cause line. */
  lag?: number;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single pairs, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<EditRippleElementId>;
}

const THEMES = {
  dark: { bg: "#111418", ink: "#FFFFFF", accent: "#5CF2B5" },
  light: { bg: "#F4F6F5", ink: "#111418", accent: "#12A06B" },
} as const;

const WGHT = 500;
const TRACK = -0.03;
const FONT_PX = 200;
const LH = 1.08;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const CAUSE_PER_EM = 0.5;
const EFFECT_PER_EM = 1.1;

type Metrics = Record<string, number>;

function measureAll(texts: string[], family: string, weight: number): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("edit-ripple: no 2d context");
  ctx.font = `${weight} ${FONT_PX}px "${family}"`;
  const w: Metrics = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  }
  return w;
}

function useMetrics(texts: string[], family: string, weight: number) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("edit-ripple: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      epilogue.waitUntilDone(),
      document.fonts.load(`${weight} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureAll(key.split("\u0001"), family, weight) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, family, weight]);
  return state && state.key === key ? state.m : null;
}

const splitWords = (s: string) => s.split(" ").filter(Boolean);

interface Placed {
  word: string;
  x: number;
  row: number;
  top: number;
}

function place(words: string[], m: Metrics, F: number, x0: number): Placed[] {
  const out: Placed[] = [];
  let x = x0;
  for (const word of words) {
    out.push({ word, x, row: 0, top: 0 });
    x += (m[word] + m[" "]) * F;
  }
  return out;
}

function lineW(words: string[], m: Metrics) {
  return words.reduce((acc, w, i) => acc + m[w] + (i > 0 ? m[" "] : 0), 0);
}

function breakLines(words: string[], m: Metrics, L: number): string[][] {
  const n = words.length;
  const lines = Math.max(1, Math.min(L, n));
  if (lines === 1) return [words];
  let best: string[][] = [words];
  let bestW = Number.POSITIVE_INFINITY;
  const walk = (from: number, left: number, acc: string[][]) => {
    if (left === 1) {
      const all = [...acc, words.slice(from)];
      const w = Math.max(...all.map((l) => lineW(l, m)));
      if (w < bestW) {
        bestW = w;
        best = all;
      }
      return;
    }
    for (let cut = from + 1; cut <= n - left + 1; cut++) {
      walk(cut, left - 1, [...acc, words.slice(from, cut)]);
    }
  };
  walk(0, lines, []);
  return best;
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

export function EditRipple(props: EditRippleProps) {
  const {
    pairs = DEFAULT_PAIRS,
    accent,
    ink,
    background,
    fontFamily = epilogue.fontFamily,
    fontWeight = WGHT,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    editRippleTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = pairsOf(pairs);
  const causes = list.map((p) => splitWords(p.cause));
  const effects = list.map((p) => splitWords(p.effect));
  const m = useMetrics(
    [
      " ",
      ...list.map((p) => p.cause),
      ...list.map((p) => p.effect),
      ...causes.flat(),
      ...effects.flat(),
    ],
    fontFamily,
    fontWeight,
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const pairEls = list.map((_, k) => tl.get(`pair:${k}`));

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const measureW = W - marginX * 2;
  let F = 0;
  let causeLines: string[][][] = [];
  let effectLines: string[][][] = [];
  for (const L of portrait ? [1, 2, 3] : [1, 2]) {
    const cl = causes.map((w) => breakLines(w, m, L));
    const el = effects.map((w) => breakLines(w, m, L));
    const widest = Math.max(
      0.1,
      ...[...cl, ...el].flat().map((l) => lineW(l, m)),
    );
    const rows =
      Math.max(...cl.map((l) => l.length)) +
      Math.max(...el.map((l) => l.length));
    const size = Math.min(
      H * (portrait ? 0.13 : 0.185),
      (measureW * 0.94) / widest,
      (H * 0.74) / (rows * LH + 0.5),
    );
    if (size > F * 1.12) {
      F = size;
      causeLines = cl;
      effectLines = el;
    }
  }
  const causeTop = (j: number, count: number) =>
    H * 0.5 - F * 1.25 - (count - 1 - j) * LH * F;
  const effectTop = (j: number) => H * 0.5 + F * 0.25 + j * LH * F;

  const lineStyle: React.CSSProperties = {
    position: "relative",
    top: F * 0.1,
    height: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight,
    fontSize: F,
    letterSpacing: `${TRACK}em`,
  };

  const nodes: React.ReactNode[] = [];

  const word = (
    key: string,
    text: string,
    x: number,
    top: number,
    y: number,
    color: string,
    moving: boolean,
  ) => {
    nodes.push(
      <div
        key={key}
        style={{
          position: "absolute",
          left: x - F * 0.05,
          top: top - F * 0.1,
          height: F * 1.3,
          paddingLeft: F * 0.05,
          paddingRight: F * 0.1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...lineStyle,
            color,
            transform: `translateY(${y.toFixed(2)}px)${glide(moving)}`,
          }}
        >
          {text}
        </div>
      </div>,
    );
  };

  const enter = (d: number, len: number, tt = t) =>
    interpolate(tt, [d, d + len], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const exit = (d: number, len: number, tt = t) =>
    interpolate(tt, [d, d + len], [0, 1], { ...CLAMP, easing: EASE_IN });
  const cool = (land: number, len: number, keep: boolean) =>
    keep
      ? hi
      : interpolateColors(
          Math.min(Math.max(t, land), land + len),
          [land, land + len],
          [hi, fg],
        );

  const drawLine = (
    k: number,
    words: Placed[],
    lag: number,
    perEm: number,
    keep: boolean,
    prefix: string,
  ) => {
    const first = k === 0;
    const hasNext = k + 1 < n;
    const e = pairEls[k];
    const enterLen = e.beat("enter");
    const exitLen = e.beat("exit");
    for (let i = 0; i < words.length; i++) {
      const p = words[i];
      const along = ((p.x - marginX) / F + p.row * 2) * perEm;
      const dIn = e.start + lag + along + (first ? 0 : e.beat("handoff"));
      if (t < dIn - 1) continue;
      const dOut = hasNext ? pairEls[k + 1].start + lag + along : 0;
      const yAt = (tt: number) =>
        (1 -
          enter(dIn, enterLen, tt) -
          (hasNext ? exit(dOut, exitLen, tt) : 0)) *
        F *
        1.4;
      const pout = hasNext ? exit(dOut, exitLen) : 0;
      if (pout >= 1) continue;
      const y = yAt(t);
      word(
        `${prefix}${k}-${i}`,
        p.word,
        p.x,
        p.top,
        y,
        cool(dIn + enterLen * 0.6, e.beat("cool"), keep),
        Math.abs(yAt(t + 1) - y) > 1e-3 || Math.abs(y - yAt(t - 1)) > 1e-3,
      );
    }
  };

  const layout = (
    lines: string[][],
    xOf: (line: string[]) => number,
    topOf: (j: number) => number,
  ) =>
    lines.flatMap((line, j) =>
      place(line, m, F, xOf(line)).map((p) => ({
        ...p,
        row: j,
        top: topOf(j),
      })),
    );

  for (let k = 0; k < n; k++) {
    if (t < pairEls[k].start - 1) continue;
    const cl = causeLines[k];
    drawLine(
      k,
      layout(
        cl,
        () => marginX,
        (j) => causeTop(j, cl.length),
      ),
      0,
      CAUSE_PER_EM,
      false,
      "c",
    );
    drawLine(
      k,
      layout(
        effectLines[k],
        (line) => W - marginX - lineW(line, m) * F,
        effectTop,
      ),
      pairEls[k].beat("lag"),
      EFFECT_PER_EM,
      k === n - 1,
      "e",
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
