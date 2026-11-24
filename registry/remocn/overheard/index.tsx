"use client";

import { loadFont } from "@remotion/google-fonts/YoungSerif";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LINES,
  linesOf,
  type OverheardElementId,
  type OverheardLine,
  overheardTimeline,
  type Word,
  wordsOf,
} from "./timeline";

const serif = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export type { OverheardLine };

export interface OverheardProps {
  lines?: OverheardLine[];
  highlight?: string;
  /** Frames between words of a quote. */
  stagger?: number;
  /** Frames between one speaker's line and the next. */
  pause?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the quotes. Load it yourself; Young Serif by default. */
  fontFamily?: string;
  /** Size of the exchange, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single words, speaker names and the dimming of
   * each line, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<OverheardElementId>;
}

const THEMES = {
  dark: { bg: "#101828", ink: "#BFE3FF", accent: "#F6C453" },
  light: { bg: "#CFE8FF", ink: "#101828", accent: "#A66E00" },
} as const;

const TRACK = -0.02;
const LH = 1.1;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function place(
  words: Word[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const pos: { x: number; line: number }[] = [];
  const widths: number[] = [0];
  let line = 0;
  let x = 0;
  for (const wd of words) {
    const w = adv(wd.text);
    if (x > 0 && x + space + w > maxEm) {
      line++;
      widths.push(0);
      pos.push({ x: 0, line });
      x = w;
    } else {
      const gap = x === 0 ? 0 : space;
      pos.push({ x: x + gap, line });
      x += gap + w;
    }
    widths[line] = x;
  }
  return { pos, lines: line + 1, widths };
}

function wrap(
  toks: Word[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const greedy = place(toks, adv, space, maxEm);
  const L = greedy.lines;
  if (L <= 1) return greedy;
  const n = toks.length;
  const ws = toks.map((tk) => adv(tk.text));
  const glued = (_k: number) => false;
  const lineW = (i: number, j: number) => {
    let x = 0;
    for (let k = i; k < j; k++) x += (k === i || glued(k) ? 0 : space) + ws[k];
    return x;
  };
  const avg = lineW(0, n) / L;
  const INF = 1e12;
  const dp = Array.from({ length: L + 1 }, () =>
    new Array<number>(n + 1).fill(INF),
  );
  const back = Array.from({ length: L + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  dp[0][0] = 0;
  for (let l = 1; l <= L; l++) {
    for (let j = 1; j <= n; j++) {
      if (j < n && glued(j)) continue;
      for (let i = l - 1; i < j; i++) {
        if (dp[l - 1][i] >= INF) continue;
        const lw = lineW(i, j);
        if (lw > maxEm + 1e-6) continue;
        let cost = (lw - avg) ** 2;
        if (j < n) {
          const end = toks[j - 1].text;
          if (/[.?!…]["”’]?$/.test(end)) cost -= avg * avg * 0.5;
          else if (/[,;:—–]["”’]?$/.test(end)) cost -= avg * avg * 0.15;
        }
        if (dp[l - 1][i] + cost < dp[l][j]) {
          dp[l][j] = dp[l - 1][i] + cost;
          back[l][j] = i;
        }
      }
    }
  }
  if (dp[L][n] >= INF) return greedy;
  const starts: number[] = [];
  let j = n;
  for (let l = L; l > 0; l--) {
    const i = back[l][j];
    starts.unshift(i);
    j = i;
  }
  const pos: { x: number; line: number }[] = [];
  const widths: number[] = [];
  starts.forEach((s, l) => {
    const e = l + 1 < starts.length ? starts[l + 1] : n;
    let x = 0;
    for (let k = s; k < e; k++) {
      const gap = k === s || glued(k) ? 0 : space;
      pos.push({ x: x + gap, line: l });
      x += gap + ws[k];
    }
    widths.push(x);
  });
  return { pos, lines: L, widths };
}

function useWidths(strings: string[], family: string) {
  const key = `${family}\u0002${strings.join("\u0001")}`;
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("overheard: measuring"));
  const released = useRef(false);
  const ref = useRef(strings);
  ref.current = strings;
  useEffect(() => {
    let live = true;
    Promise.all([
      serif.waitUntilDone(),
      document.fonts.load(`400 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        if (ctx) ctx.font = `400 100px "${family}"`;
        for (const s of ref.current) {
          w[s] = ctx ? ctx.measureText(s).width / 100 : s.length * 0.5;
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key ? state.w : null;
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

export function Overheard(props: OverheardProps) {
  const {
    lines = DEFAULT_LINES,
    highlight = "It’s in the repo.",
    accent,
    ink,
    background,
    fontFamily = serif.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const now = useSceneFrame();
  const tAt = (f: number) => Math.max(0, f - delay) * speed;
  const t = tAt(now);
  /** Whether a lift, in px as a function of time, moves on this frame. */
  const stirs = (lift: (t: number) => number) => {
    const here = lift(t);
    return (
      Math.abs(lift(tAt(now + 1)) - here) > 1e-3 ||
      Math.abs(here - lift(tAt(now - 1))) > 1e-3
    );
  };
  const { width: W, height: H, durationInFrames: T } = useSceneConfig();
  // The schedule's compression for long speech counts the clip without
  // `speed`, as before.
  const tl = useTimeline(overheardTimeline, props, T, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = linesOf(lines);
  const n = list.length;
  const voices = list.map((l, i) =>
    wordsOf(l.quote, i === n - 1 ? highlight : ""),
  );
  const strings = Array.from(
    new Set([
      " ",
      ...voices.flatMap((v) => v.map((wd) => wd.text)),
      ...list.map((l) => `— ${l.name}`),
    ]),
  );
  const w = useWidths(strings, fontFamily);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string) => (w[s] ?? 0) + TRACK * Array.from(s).length;
  const space = w[" "] ?? 0.25;

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const marginX = W * (portrait ? 0.09 : 0.085);
  const marginY = H * (portrait ? 0.1 : 0.1);
  const measure = W * (portrait ? 0.82 : 0.6);
  const maxLines = portrait ? 4 : 2;
  const nameRatio = 0.36;
  const nameGap = 0.35;

  const blockH = (lineCount: number, F: number) =>
    lineCount * LH * F + F * (nameGap + nameRatio * 1.3);
  let F = portrait ? W * 0.12 : H * 0.13;
  let lays = voices.map((v) => wrap(v, adv, space, measure / F));
  for (let k = 0; k < 60; k++) {
    const most = Math.max(...lays.map((l) => l.lines));
    const total = lays.reduce((s, l) => s + blockH(l.lines, F), 0);
    const room = H - marginY * 2 - F * 0.4 * (n - 1);
    if (most <= maxLines && total <= room) break;
    F *= 0.96;
    lays = voices.map((v) => wrap(v, adv, space, measure / F));
  }
  const L = Math.max(16, Math.max(unit * 0.03, F * nameRatio));

  const heights = lays.map((l) => blockH(l.lines, F));
  const free = H - marginY * 2 - heights.reduce((s, h) => s + h, 0);
  const tops: number[] = [];
  let y = marginY;
  heights.forEach((h, i) => {
    tops.push(y);
    y += h + (n > 1 ? free / (n - 1) : 0);
    if (i === 0 && n === 1) tops[0] = (H - h) / 2;
  });

  const lineH = LH * F;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily,
        fontWeight: 400,
      }}
    >
      <ScaleLayer scale={scale}>
        {voices.map((v, i) => {
          const right = i % 2 === 1;
          const lay = lays[i];
          const dimEl = i < n - 1 ? tl.get(`dim:${i}`) : null;
          const back = dimEl
            ? interpolate(t, [dimEl.start, dimEl.end], [0, 1], {
                ...CLAMP,
                easing: EASE_IO,
              })
            : 0;
          const dim = 1 - back * 0.55;
          const nameEl = tl.get(`name:${i}`);
          const nameIn = (t: number) =>
            interpolate(t, [nameEl.start, nameEl.end], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
          const nIn = nameIn(t);
          const nameText = `— ${list[i].name}`;
          const nameW = adv(nameText) * L;
          const nameTop = tops[i] + lay.lines * lineH + F * nameGap;
          return (
            <div
              key={`v${i}`}
              style={{ position: "absolute", inset: 0, opacity: dim }}
            >
              {v.map((wd, j) => {
                const p = lay.pos[j];
                const lw = lay.widths[p.line];
                const x = right
                  ? W - marginX - (lw - p.x) * F
                  : marginX + p.x * F;
                const wordEl = tl.get(`word:${i}:${j}`);
                const rise = (t: number) =>
                  interpolate(t, [wordEl.start, wordEl.end], [0, 1], {
                    ...CLAMP,
                    easing: EASE_OUT,
                  });
                const e = rise(t);
                return (
                  <div
                    key={`w${j}`}
                    style={{
                      position: "absolute",
                      left: x,
                      top: tops[i] + p.line * lineH,
                      height: lineH,
                      lineHeight: `${lineH}px`,
                      fontSize: F,
                      whiteSpace: "pre",
                      letterSpacing: `${TRACK}em`,
                      color: wd.hot ? hi : fg,
                      opacity: e,
                      transform: `translateY(${((1 - e) * F * 0.28).toFixed(2)}px)${glide(stirs((t) => (1 - rise(t)) * F * 0.28))}`,
                    }}
                  >
                    {wd.text}
                  </div>
                );
              })}
              <div
                style={{
                  position: "absolute",
                  left: right ? W - marginX - nameW : marginX,
                  top: nameTop,
                  fontSize: L,
                  lineHeight: `${L * 1.3}px`,
                  whiteSpace: "pre",
                  letterSpacing: `${TRACK}em`,
                  color: fg,
                  opacity: nIn * 0.7,
                  transform: `translateY(${((1 - nIn) * L * 0.6).toFixed(2)}px)${glide(stirs((t) => (1 - nameIn(t)) * L * 0.6))}`,
                }}
              >
                {nameText}
              </div>
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
