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

export interface KnownTermsPair {
  video: string;
  dev: string;
  joiner?: string;
}

export interface KnownTermsProps {
  pairs?: KnownTermsPair[];
  joiner?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#111418", ink: "#FFFFFF", accent: "#5CF2B5" },
  light: { bg: "#F4F6F5", ink: "#111418", accent: "#12A06B" },
} as const;

const DEFAULT_PAIRS: KnownTermsPair[] = [
  { video: "A scene", dev: "a component." },
  { video: "Timing", dev: "a prop." },
  { video: "An edit", dev: "a commit." },
  { video: "A render", dev: "a build." },
  { video: "Your launch", dev: "a deploy." },
];

const WGHT = 500;
const JOIN_WGHT = 400;
const TRACK = -0.03;
const FONT_PX = 200;
const LH = 1.22;
const INNER = 1.04;
const WRAP_COST = 0.1;
const GAP_EM = 0.34;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const STEP = 14;
const LEAD = 3;
const ARRIVE = 10;
const ALONE = 6;
const SLIDE = 14;
const PUSH_DELAY = 1;
const PUSH = 14;
const JOIN_IN = 8;
const SETTLE = 12;
const LINE_LEN = LEAD + ARRIVE + ALONE + SLIDE;
const HOLD = 33;
const DIM = 0.46;
const JOIN_DIM = 0.4;

type Metrics = Record<string, number>;

const wKey = (weight: number, s: string) => `${weight}\u0002${s}`;

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("known-terms: no 2d context");
  const w: Metrics = {};
  for (const weight of [WGHT, JOIN_WGHT]) {
    ctx.font = `${weight} ${FONT_PX}px "${epilogue.fontFamily}"`;
    for (const s of texts) {
      w[wKey(weight, s)] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
  }
  return w;
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("known-terms: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      epilogue.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${epilogue.fontFamily}"`),
      document.fonts.load(`${JOIN_WGHT} 100px "${epilogue.fontFamily}"`),
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

function breakBalanced(
  words: string[],
  L: number,
  widthOf: (line: string[]) => number,
): string[][] {
  const n = words.length;
  const lines = Math.max(1, Math.min(L, n));
  if (lines === 1) return [words];
  let best: string[][] = [words];
  let bestW = Number.POSITIVE_INFINITY;
  const walk = (from: number, left: number, acc: string[][]) => {
    if (left === 1) {
      const all = [...acc, words.slice(from)];
      const w = Math.max(...all.map(widthOf));
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

interface Wrap {
  lines: string[][];
  w: number;
}

interface Layout {
  score: number;
  F: number;
  vs: Wrap[];
  ds: Wrap[];
  maxL: number;
  rowsEm: number[];
  blockW: number;
}

export function KnownTerms({
  pairs = DEFAULT_PAIRS,
  joiner = "is",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: KnownTermsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = pairs.length > 0 ? pairs : DEFAULT_PAIRS;
  const joins = list.map((p) => p.joiner ?? joiner);
  const m = useMetrics([
    " ",
    ...list.flatMap((p) => [...splitWords(p.video), ...splitWords(p.dev)]),
    ...joins,
  ]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const span = durationInFrames * speed;
  const period =
    n > 1 ? Math.min(40, Math.max(24, (span - LINE_LEN - HOLD) / (n - 1))) : 0;
  const starts = list.map((_, k) => k * period);

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const measureW = W - marginX * 2;
  const space = m[wKey(WGHT, " ")];
  const lineW = (line: string[]) =>
    line.reduce((a, w, i) => a + m[wKey(WGHT, w)] + (i > 0 ? space : 0), 0);
  const options = (text: string): Wrap[] => {
    const words = splitWords(text);
    return [1, 2, 3]
      .filter((L) => L <= Math.max(1, words.length))
      .map((L) => {
        const lines = breakBalanced(words, L, lineW);
        return { lines, w: Math.max(0.1, ...lines.map(lineW)) };
      });
  };
  const vOpts = list.map((p) => options(p.video));
  const dOpts = list.map((p) => options(p.dev));
  const joinW = joins.map((j) => m[wKey(JOIN_WGHT, j)]);
  const maxJ = Math.max(0, ...joinW);
  const fit = (opts: Wrap[], lim: number) =>
    opts.find((o) => o.w <= lim + 1e-6) ?? opts[opts.length - 1];
  const limits = (all: Wrap[][]) =>
    [...new Set(all.flat().map((o) => Math.round(o.w * 1000) / 1000))].sort(
      (a, b) => b - a,
    );
  const cap = H * (portrait ? 0.075 : 0.13);
  const availH = H * (portrait ? 0.62 : 0.8);
  let best: Layout | null = null;
  for (const limL of limits(vOpts)) {
    for (const limR of limits(dOpts)) {
      const vs = vOpts.map((o) => fit(o, limL));
      const ds = dOpts.map((o) => fit(o, limR));
      const maxL = Math.max(...vs.map((v) => v.w));
      const maxR = Math.max(...ds.map((d) => d.w));
      const rowsEm = vs.map(
        (v, k) =>
          (Math.max(v.lines.length, ds[k].lines.length) - 1) * INNER + LH,
      );
      const blockW = maxL + GAP_EM * 2 + maxJ + maxR;
      const size = Math.min(
        cap,
        measureW / blockW,
        availH / rowsEm.reduce((a, r) => a + r, 0),
      );
      const extra = [...vs, ...ds].reduce((a, o) => a + o.lines.length - 1, 0);
      const score = size / (1 + WRAP_COST * extra);
      if (!best || score > best.score) {
        best = { score, F: size, vs, ds, maxL, rowsEm, blockW };
      }
    }
  }
  if (!best) return null;
  const { F, vs, ds, maxL, rowsEm, blockW } = best;

  const blockLeft = (W - blockW * F) / 2;
  const gutterL = blockLeft + maxL * F;
  const joinMid = gutterL + (GAP_EM + maxJ / 2) * F;
  const devX = gutterL + (GAP_EM * 2 + maxJ) * F;
  const pitch = INNER * F;

  const ease = (from: number, dur: number, curve = EASE_OUT) =>
    interpolate(t, [from, from + dur], [0, 1], { ...CLAMP, easing: curve });

  let visible = rowsEm[0] * F;
  for (let k = 1; k < n; k++) {
    visible += ease(starts[k], STEP, EASE_MOVE) * rowsEm[k] * F;
  }
  const rowTops: number[] = [];
  let acc = H / 2 - visible / 2;
  for (let k = 0; k < n; k++) {
    rowTops.push(acc);
    acc += rowsEm[k] * F;
  }

  const textStyle = (weight: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    height: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre",
    fontFamily: epilogue.fontFamily,
    fontWeight: weight,
    fontSize: F,
    letterSpacing: `${TRACK}em`,
  });

  const nodes: React.ReactNode[] = [];

  for (let k = 0; k < n; k++) {
    const s = starts[k] + (k > 0 ? LEAD : 0);
    if (t < s - 1) continue;
    const last = k === n - 1;
    const top = rowTops[k] + ((LH - 1) * F) / 2;
    const arrive = ease(s, ARRIVE);
    const slideAt = s + ARRIVE + ALONE;
    const slide = ease(slideAt, SLIDE, EASE_MOVE);
    const push = ease(slideAt + PUSH_DELAY, PUSH);
    const joinIn = ease(slideAt + SLIDE * 0.72, JOIN_IN);
    const settled = ease(slideAt + SLIDE, SETTLE);
    const next = k + 1 < n ? ease(starts[k + 1], STEP + 6, EASE_MOVE) : 0;
    const lead = last ? 1 : 1 - (1 - DIM) * next;

    const v = vs[k];
    const vw = v.w * F;
    const vh = (v.lines.length - 1) * pitch + F;
    const vx0 = (W - vw) / 2;
    const vx1 = gutterL - vw;
    const vx = vx0 + (vx1 - vx0) * slide;

    const termColor = last
      ? interpolateColors(settled, [0, 1], [c.ink, hi])
      : c.ink;

    nodes.push(
      <div
        key={`v${k}`}
        style={{
          position: "absolute",
          left: vx - F * 0.06,
          top: top - F * 0.16,
          width: vw + F * 0.2,
          height: vh + F * 0.36,
          overflow: "hidden",
          opacity: lead,
        }}
      >
        {v.lines.map((line, i) => (
          <div
            key={line.join(" ")}
            style={{
              ...textStyle(WGHT),
              left: F * 0.06 + vw - lineW(line) * F,
              top: F * 0.26 + i * pitch,
              color: termColor,
              transform: `translateY(${((1 - arrive) * (vh + F * 0.3)).toFixed(2)}px)`,
            }}
          >
            {line.join(" ")}
          </div>
        ))}
      </div>,
    );

    if (t < slideAt + PUSH_DELAY - 1) continue;

    const dx0 = W + F * 0.4;
    const pushed = dx0 + (devX - dx0) * push;
    const contact = vx + vw + (GAP_EM * 2 + maxJ) * F * 0.7;
    const dx = Math.max(pushed, contact);
    ds[k].lines.forEach((line, i) => {
      nodes.push(
        <div
          key={`d${k}-${line.join(" ")}`}
          style={{
            ...textStyle(WGHT),
            top: top + F * 0.1 + i * pitch,
            color: termColor,
            opacity: lead,
            transform: `translateX(${dx.toFixed(2)}px)`,
          }}
        >
          {line.join(" ")}
        </div>,
      );
    });

    if (joinIn <= 0) continue;
    const jw = joinW[k] * F;
    nodes.push(
      <div
        key={`j${k}`}
        style={{
          ...textStyle(JOIN_WGHT),
          top: top + F * 0.1,
          color: c.ink,
          opacity: joinIn * JOIN_DIM * (0.6 + 0.4 * lead),
          transform: `translate(${(joinMid - jw / 2).toFixed(2)}px, ${((1 - joinIn) * F * 0.35).toFixed(2)}px)`,
        }}
      >
        {joins[k]}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
