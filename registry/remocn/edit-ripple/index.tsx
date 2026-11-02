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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#111418", ink: "#FFFFFF", accent: "#5CF2B5" },
  light: { bg: "#F4F6F5", ink: "#111418", accent: "#12A06B" },
} as const;

const DEFAULT_PAIRS: EditRipplePair[] = [
  { cause: "Change one word,", effect: "every scene follows." },
  { cause: "Swap the color,", effect: "every shot repaints." },
  { cause: "Change your mind,", effect: "render it again." },
];

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

const ENTER = 18;
const EXIT = 10;
const HANDOFF = 6;
const CAUSE_PER_EM = 0.5;
const LAG = 14;
const EFFECT_PER_EM = 1.1;
const COOL = 18;
const PAIR_MOTION = 56;
const TAIL = 34;

type Metrics = Record<string, number>;

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("edit-ripple: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${epilogue.fontFamily}"`;
  const w: Metrics = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  }
  return w;
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("edit-ripple: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      epilogue.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${epilogue.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureAll(key.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
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

export function EditRipple({
  pairs = DEFAULT_PAIRS,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: EditRippleProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = pairs.length > 0 ? pairs : DEFAULT_PAIRS;
  const causes = list.map((p) => splitWords(p.cause));
  const effects = list.map((p) => splitWords(p.effect));
  const m = useMetrics([
    " ",
    ...list.map((p) => p.cause),
    ...list.map((p) => p.effect),
    ...causes.flat(),
    ...effects.flat(),
  ]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const span = durationInFrames * speed;
  const period =
    n > 1
      ? Math.min(
          96,
          Math.max(PAIR_MOTION + 12, (span - PAIR_MOTION - TAIL) / (n - 1)),
        )
      : 0;
  const startOf = (k: number) => k * period;

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
    fontFamily: epilogue.fontFamily,
    fontWeight: WGHT,
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
            transform: `translateY(${y.toFixed(2)}px)`,
          }}
        >
          {text}
        </div>
      </div>,
    );
  };

  const enter = (d: number) =>
    interpolate(t, [d, d + ENTER], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const exit = (d: number) =>
    interpolate(t, [d, d + EXIT], [0, 1], { ...CLAMP, easing: EASE_IN });
  const cool = (land: number, keep: boolean) =>
    keep
      ? hi
      : interpolateColors(
          Math.min(Math.max(t, land), land + COOL),
          [land, land + COOL],
          [hi, c.ink],
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
    for (let i = 0; i < words.length; i++) {
      const p = words[i];
      const along = ((p.x - marginX) / F + p.row * 2) * perEm;
      const dIn = startOf(k) + lag + along + (first ? 0 : HANDOFF);
      if (t < dIn - 1) continue;
      const pin = enter(dIn);
      const pout = hasNext ? exit(startOf(k + 1) + lag + along) : 0;
      if (pout >= 1) continue;
      word(
        `${prefix}${k}-${i}`,
        p.word,
        p.x,
        p.top,
        (1 - pin - pout) * F * 1.4,
        cool(dIn + ENTER * 0.6, keep),
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
    if (t < startOf(k) - 1) continue;
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
      LAG,
      EFFECT_PER_EM,
      k === n - 1,
      "e",
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
