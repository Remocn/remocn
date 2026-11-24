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
  DEFAULT_SHOTS,
  type ScriptCutElementId,
  scriptCutTimeline,
  shotsOf,
  splitWords,
} from "./timeline";

const epilogue = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ScriptCutProps {
  shots?: string[];
  /** Frames the last shot holds at the end. */
  hold?: number;
  /** Frames between words as a shot flies up from the script. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Epilogue by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Size of the script and shots, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the script row, single cuts and single shots,
   * by the ids in `./timeline`. Frames on the scene timeline, after `delay`
   * and `speed`.
   */
  timing?: Timing<ScriptCutElementId>;
}

const THEMES = {
  dark: { bg: "#111418", ink: "#FFFFFF", accent: "#5CF2B5" },
  light: { bg: "#F4F6F5", ink: "#111418", accent: "#12A06B" },
} as const;

const WGHT = 500;
const TRACK = -0.03;
const FONT_PX = 200;
const LH = 1.04;
const ROW_LH = 1.4;
const GAP_EM = 1.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

type Metrics = Record<string, number>;

function measureAll(texts: string[], font: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("script-cut: no 2d context");
  ctx.font = font;
  const w: Metrics = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  }
  return w;
}

function useMetrics(texts: string[], fontFamily: string, fontWeight: number) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("script-cut: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      epilogue.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measureAll(
            key.split("\u0001"),
            `${fontWeight} ${FONT_PX}px "${fontFamily}"`,
          ),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily, fontWeight]);
  return state && state.key === key ? state.m : null;
}

function breakBalanced<T>(
  items: T[],
  L: number,
  widthOf: (line: T[]) => number,
): T[][] {
  const n = items.length;
  const lines = Math.max(1, Math.min(L, n));
  if (lines === 1) return [items];
  let best: T[][] = [items];
  let bestW = Number.POSITIVE_INFINITY;
  const walk = (from: number, left: number, acc: T[][]) => {
    if (left === 1) {
      const all = [...acc, items.slice(from)];
      const w = Math.max(...all.map(widthOf));
      if (w < bestW) {
        bestW = w;
        best = all;
      }
      return;
    }
    for (let cut = from + 1; cut <= n - left + 1; cut++) {
      walk(cut, left - 1, [...acc, items.slice(from, cut)]);
    }
  };
  walk(0, lines, []);
  return best;
}

interface Token {
  word: string;
  shot: number;
  index: number;
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

export function ScriptCut(props: ScriptCutProps) {
  const {
    shots = DEFAULT_SHOTS,
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
    scriptCutTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = shotsOf(shots);
  const shotWords = list.map(splitWords);
  const m = useMetrics([" ", ...shotWords.flat()], fontFamily, fontWeight);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginY = H * (portrait ? 0.08 : 0.1);
  const measureW = W - marginX * 2;

  const tokens: Token[] = [];
  shotWords.forEach((ws, s) => {
    for (const word of ws) tokens.push({ word, shot: s, index: tokens.length });
  });

  const rowLineW = (line: Token[], gap: number) =>
    line.reduce((acc, tk, i) => {
      if (i === 0) return acc + m[tk.word];
      const sep = line[i - 1].shot !== tk.shot ? gap : m[" "];
      return acc + sep + m[tk.word];
    }, 0);

  const rowMin = H * (portrait ? 0.018 : 0.03);
  const rowCap = H * (portrait ? 0.024 : 0.042);
  let rowF = 0;
  let rowLines: Token[][] = [tokens];
  for (const L of [1, 2, 3, 4]) {
    const lines = breakBalanced(tokens, L, (l) => rowLineW(l, GAP_EM));
    const widest = Math.max(0.1, ...lines.map((l) => rowLineW(l, GAP_EM)));
    const size = Math.min(rowCap, measureW / widest);
    rowF = size;
    rowLines = lines;
    if (size >= rowMin) break;
  }
  const rowBottom = H - marginY;
  const rowTop = rowBottom - rowLines.length * ROW_LH * rowF;

  const cutP = (b: number) =>
    interpolate(t, [tl.get(`cut:${b}`).start, tl.get(`cut:${b}`).end], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });

  interface RowPos {
    x: number;
    y: number;
  }
  // The row as laid out with each cut opened to `cut(b)`: where every word
  // sits and where each cut bar stands.
  const layRow = (cut: (b: number) => number) => {
    const rowPos: RowPos[] = [];
    const bars: { x: number; y: number; b: number }[] = [];
    rowLines.forEach((line, j) => {
      let x = marginX;
      const y = rowTop + j * ROW_LH * rowF + (ROW_LH - 1) * 0.5 * rowF;
      line.forEach((tk, i) => {
        if (i > 0) {
          const prev = line[i - 1];
          if (prev.shot !== tk.shot) {
            const p = cut(prev.shot);
            const gap = m[" "] + (GAP_EM - m[" "]) * p;
            bars.push({ x: x + (gap * rowF) / 2, y, b: prev.shot });
            x += gap * rowF;
          } else {
            x += m[" "] * rowF;
          }
        }
        rowPos[tk.index] = { x, y };
        x += m[tk.word] * rowF;
      });
      const lastTk = line[line.length - 1];
      const nextTk = tokens[lastTk.index + 1];
      if (nextTk && nextTk.shot !== lastTk.shot) {
        bars.push({
          x: x + (GAP_EM * rowF * cut(lastTk.shot)) / 2,
          y,
          b: lastTk.shot,
        });
      }
    });
    return { rowPos, bars };
  };
  const { rowPos, bars } = layRow(cutP);
  // Layout rounds a box edge to whole pixels, so a bar carried sideways by
  // `left` as its cut opens steps unevenly; it stands where the open cut puts
  // it and travels there by a transform.
  const barsOpen = layRow(() => 1).bars;

  const areaTop = marginY;
  const areaBottom = rowTop - H * (portrait ? 0.06 : 0.08);
  const areaH = Math.max(1, areaBottom - areaTop);
  const heroLineW = (line: string[]) =>
    line.reduce((acc, w, i) => acc + m[w] + (i > 0 ? m[" "] : 0), 0);

  const heroLayouts = shotWords.map((ws) => {
    let F = 0;
    let lines: string[][] = [ws];
    for (const L of [1, 2, 3, 4]) {
      const cand = breakBalanced(ws, L, heroLineW);
      const widest = Math.max(0.1, ...cand.map(heroLineW));
      const size = Math.min(
        H * (portrait ? 0.12 : 0.2),
        (measureW * 0.98) / widest,
        areaH / (cand.length * LH),
      );
      if (size > F * 1.1) {
        F = size;
        lines = cand;
      }
    }
    const blockH = lines.length * LH * F;
    const top = areaTop + (areaH - blockH) / 2;
    const pos: { x: number; y: number }[] = [];
    lines.forEach((line, j) => {
      let x = marginX;
      for (const w of line) {
        pos.push({ x, y: top + j * LH * F });
        x += (m[w] + m[" "]) * F;
      }
    });
    return { F, pos };
  });

  const rowStyle: React.CSSProperties = {
    position: "absolute",
    height: rowF,
    lineHeight: `${rowF}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight,
    fontSize: rowF,
    letterSpacing: `${TRACK}em`,
  };

  const nodes: React.ReactNode[] = [];

  bars.forEach((bar, i) => {
    const p = cutP(bar.b);
    if (p <= 0) return;
    const h = rowF * 1.15;
    const dx = bar.x - barsOpen[i].x;
    nodes.push(
      <div
        key={`bar${bar.b}-${bar.y.toFixed(0)}`}
        style={{
          position: "absolute",
          left: barsOpen[i].x - rowF * 0.05,
          top: bar.y - (h - rowF) / 2,
          width: rowF * 0.1,
          height: h,
          overflow: "hidden",
          transform: Math.abs(dx) < 1e-3 ? undefined : `translateX(${dx}px)`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: hi,
            borderRadius: rowF * 0.05,
            transform: `translateY(${(-(1 - p) * h * 1.05).toFixed(2)}px)`,
          }}
        />
      </div>,
    );
  });

  const row = tl.get("row");
  for (const tk of tokens) {
    const pos = rowPos[tk.index];
    const inP = interpolate(
      t,
      [
        row.start + tk.index * row.beat("step"),
        row.start + tk.index * row.beat("step") + row.beat("word"),
      ],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const shot = tl.get(`shot:${tk.shot}`);
    const live = shot.start;
    const lit = interpolate(
      t,
      [live + shot.beat("lit"), live + shot.beat("litEnd")],
      [0, 1],
      CLAMP,
    );
    const spent = interpolate(
      t,
      [live + shot.beat("spent"), live + shot.beat("spentEnd")],
      [0, 1],
      CLAMP,
    );
    const color =
      lit < 1
        ? interpolateColors(lit, [0, 1], [fg, hi])
        : interpolateColors(spent, [0, 1], [hi, fg]);
    const opacity = inP * (0.88 - 0.56 * spent);
    nodes.push(
      <div
        key={`r${tk.index}`}
        style={{
          ...rowStyle,
          left: pos.x,
          top: pos.y,
          color,
          opacity,
          transform: `translateY(${((1 - inP) * rowF * 0.6).toFixed(2)}px)${glide(midway(inP))}`,
        }}
      >
        {tk.word}
      </div>,
    );
  }

  shotWords.forEach((ws, k) => {
    const shot = tl.get(`shot:${k}`);
    const start = shot.start;
    if (t < start) return;
    const { F, pos } = heroLayouts[k];
    const nextAt =
      k + 1 < n ? tl.get(`shot:${k + 1}`).start : Number.POSITIVE_INFINITY;
    const first = tokens.findIndex((tk) => tk.shot === k);
    ws.forEach((w, i) => {
      const from = rowPos[first + i];
      const to = pos[i];
      const d = start + shot.beat("handoff") + i * shot.beat("stagger");
      const s0 = rowF / F;
      const at = (tt: number) => {
        const p = interpolate(tt, [d, d + shot.beat("fly")], [0, 1], {
          ...CLAMP,
          easing: EASE_MOVE,
        });
        const out = Number.isFinite(nextAt)
          ? interpolate(
              tt,
              [
                nextAt + i * shot.beat("exitStep"),
                nextAt + i * shot.beat("exitStep") + shot.beat("exit"),
              ],
              [0, 1],
              { ...CLAMP, easing: EASE_IN },
            )
          : 0;
        return {
          p,
          out,
          s: s0 + (1 - s0) * p,
          x: from.x + (to.x - from.x) * p,
          y: from.y + (to.y - from.y) * p - out * F * 0.5,
        };
      };
      const { p, out, s, x, y } = at(t);
      if (out >= 1) return;
      // The flight is a long in-out ease, so its tail still crosses pixels
      // after the progress looks settled: compare the drawn values with the
      // neighbouring frames instead.
      const step = (o: { s: number; y: number }, q: { s: number; y: number }) =>
        Math.abs(o.y - q.y) > 1e-3 || Math.abs(o.s - q.s) * F > 1e-3;
      const moving =
        step(at(t + speed), { s, y }) || step({ s, y }, at(t - speed));
      const color = interpolateColors(p, [0, 0.7], [hi, fg]);
      nodes.push(
        <div
          key={`h${k}-${i}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: F,
            lineHeight: `${F}px`,
            whiteSpace: "pre",
            fontFamily,
            fontWeight,
            fontSize: F,
            letterSpacing: `${TRACK}em`,
            color,
            opacity: 1 - out,
            transformOrigin: "0 0",
            transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})${glide(moving)}`,
          }}
        >
          {w}
        </div>,
      );
    });
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
