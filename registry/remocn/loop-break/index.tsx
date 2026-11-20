"use client";

import { loadFont } from "@remotion/google-fonts/DMSans";
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

const dmSans = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface LoopBreakProps {
  loop?: string[];
  fix?: string;
  highlight?: string;
  passes?: number;
  /** Frames between words as a line rises in. */
  stagger?: number;
  /** Frames a pass holds before it rewinds. */
  hold?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; DM Sans by default. */
  fontFamily?: string;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2E3440", ink: "#FFFFFF", accent: "#FFB020" },
  light: { bg: "#F1F2F4", ink: "#2E3440", accent: "#B86E00" },
} as const;

const WGHT = 500;
const TRACK = -0.03;
const PROBE = 200;
const BASE = 215;
const LEAD = 1.14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.4);

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const START = 6;
const ENTER = 14;
const WORD_STAGGER = 3;
const ROW_GAP = 15;
const HOLD = 16;
const REWIND = 7;
const REWIND_WORD = 1.5;
const REWIND_ROW = 4;
const TEMPO = 0.6;
const MIN_TEMPO = 0.4;
const BREAK_PAUSE = 12;
const FIX_TEMPO = 1.25;
const DIM_AFTER = 6;

interface Word {
  text: string;
  start: number;
  x: number;
  w: number;
}

interface Metrics {
  rows: Word[][];
  fix: Word[];
  widest: number;
}

interface Placed extends Word {
  row: number;
  px: number;
}

function layoutWords(s: string, em: (x: string) => number) {
  const out: Word[] = [];
  const re = /\S+/g;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    out.push({
      text: m[0],
      start: m.index,
      x: em(s.slice(0, m.index)),
      w: em(m[0]),
    });
  }
  return out;
}

function measure(loop: string[], fix: string, family: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("loop-break: no 2d context");
  ctx.font = `${WGHT} ${PROBE}px "${family}"`;
  const em = (x: string) =>
    ctx.measureText(x).width / PROBE + TRACK * Array.from(x).length;
  return {
    rows: loop.map((s) => layoutWords(s, em)),
    fix: layoutWords(fix, em),
    widest: Math.max(
      ...loop.map(em),
      ...(fix.match(/[^.!?…]+[.!?…]*/g) ?? []).map((x) => em(x.trim())),
      0.1,
    ),
  };
}

function useMetrics(loop: string[], fix: string, family: string) {
  const key = `${loop.join("\u0002")}\u0001${fix}\u0001${family}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("loop-break: measuring"));
  const released = useRef(false);
  const src = useRef({ loop, fix });
  src.current = { loop, fix };
  useEffect(() => {
    let live = true;
    Promise.all([
      dmSans.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(src.current.loop, src.current.fix, family),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key ? state.m : null;
}

interface Take {
  row: number;
  fix: boolean;
  at: number;
  tempo: number;
  back: number;
  backTempo: number;
}

function wrapFix(words: Word[], measure: number) {
  const out: Placed[] = [];
  let row = 0;
  let rowStart = 0;
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (
      i > 0 &&
      (/[.!?…]$/.test(prev.text) || w.x + w.w - rowStart > measure + 0.01)
    ) {
      row += 1;
      rowStart = w.x;
    }
    out.push({ ...w, row, px: w.x - rowStart });
  });
  return out;
}

function schedule(
  rowCount: number,
  words: number[],
  passes: number,
  stagger: number,
  hold: number,
) {
  const takes: Take[] = [];
  let cursor = START;
  let fixAt = 0;
  for (let p = 0; p < passes; p++) {
    const s = Math.max(MIN_TEMPO, TEMPO ** p);
    const final = p === passes - 1;
    const pass: Take[] = [];
    for (let r = p === 0 ? 0 : 1; r < rowCount; r++) {
      const fix = final && r === rowCount - 1;
      if (fix) {
        cursor += BREAK_PAUSE;
        fixAt = cursor;
      }
      const take: Take = {
        row: r,
        fix,
        at: cursor,
        tempo: fix ? FIX_TEMPO : s,
        back: Number.POSITIVE_INFINITY,
        backTempo: s,
      };
      pass.push(take);
      takes.push(take);
      if (r < rowCount - 1) cursor += ROW_GAP * s;
    }
    const last = pass[pass.length - 1];
    if (final) {
      cursor =
        last.at +
        (ENTER + stagger * Math.max(0, words[rowCount] - 1)) * last.tempo;
      break;
    }
    cursor =
      last.at +
      (ENTER + stagger * Math.max(0, words[last.row] - 1)) * s +
      hold * s;
    const back = [...pass].reverse().filter((tk) => tk.row > 0);
    back.forEach((tk, i) => {
      tk.back = cursor + i * REWIND_ROW * s;
    });
    const lastBack = back[back.length - 1];
    cursor =
      lastBack.back +
      (REWIND + REWIND_WORD * Math.max(0, words[lastBack.row] - 1)) * s +
      2;
  }
  return { takes, fixAt, end: cursor };
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

export function LoopBreak({
  loop = ["Render the cut.", "Spot a typo.", "Start over."],
  fix = "Change one word. Done.",
  highlight = "Done.",
  passes = 3,
  stagger = WORD_STAGGER,
  hold = HOLD,
  accent,
  ink,
  background,
  fontFamily = dmSans.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: LoopBreakProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay);
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const k = Math.min(1, durationInFrames / BASE);
  const t = (frame * speed) / k;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const rows = loop.length >= 2 ? loop : [...loop, "Start over."];
  const m = useMetrics(rows, fix, fontFamily);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const R = m.rows.length;
  const measureW = W * (portrait ? 0.84 : 0.58);
  const F = Math.min(measureW / m.widest, portrait ? W * 0.13 : H * 0.15);
  const fixRows = wrapFix(m.fix, measureW / F);
  const total = R - 1 + (fixRows[fixRows.length - 1]?.row ?? 0) + 1;
  const pitch = F * LEAD;
  const left = W * 0.08;
  const blockTop = (H - total * pitch) / 2;

  const words = [...m.rows.map((r) => r.length), m.fix.length];
  const plan = schedule(
    R,
    words,
    Math.max(2, Math.round(passes)),
    stagger,
    hold,
  );
  const settled = plan.end + DIM_AFTER;
  const dim = interpolate(t, [settled, settled + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const hiStart = highlight ? fix.lastIndexOf(highlight) : -1;
  const hiEnd = hiStart >= 0 ? hiStart + highlight.length : -1;

  const rowBox = (key: string, row: number, glyphs: React.ReactNode[]) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: blockTop + row * pitch,
        height: pitch,
        overflow: "hidden",
      }}
    >
      {glyphs}
    </div>
  );

  const nodes: React.ReactNode[] = [];
  for (let r = 0; r < R; r++) {
    let take: Take | null = null;
    for (const tk of plan.takes) {
      if (tk.row === r && tk.at <= t) take = tk;
    }
    if (!take) continue;
    const cur = take;
    const list: Placed[] = cur.fix
      ? fixRows
      : m.rows[r].map((w) => ({ ...w, row: 0, px: w.x }));
    const n = list.length;
    const byRow = new Map<number, React.ReactNode[]>();
    list.forEach((w, i) => {
      const inAt = cur.at + i * stagger * cur.tempo;
      const riseAt = (tt: number) =>
        interpolate(tt, [inAt, inAt + ENTER * cur.tempo], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
      const outAt = cur.back + (n - 1 - i) * REWIND_WORD * cur.backTempo;
      const sinkAt = (tt: number) =>
        Number.isFinite(cur.back)
          ? interpolate(tt, [outAt, outAt + REWIND * cur.backTempo], [0, 1], {
              ...CLAMP,
              easing: EASE_IN,
            })
          : 0;
      const rise = riseAt(t);
      const shown = rise - sinkAt(t);
      if (shown <= 0) return;
      // The travel is printed to 0.01px, and the ease's tail keeps stepping
      // that by a hundredth after its progress reads as done; the tilt stays
      // on while the printed offset still changes from frame to frame.
      const offsetAt = (tt: number) =>
        ((1 - (riseAt(tt) - sinkAt(tt))) * pitch).toFixed(2);
      const offset = offsetAt(t);
      const moving =
        offset !== offsetAt(t + speed / k) ||
        offset !== offsetAt(t - speed / k);
      const lit =
        cur.fix &&
        hiStart >= 0 &&
        w.start < hiEnd &&
        w.start + w.text.length > hiStart;
      const fade = cur.fix ? 0 : dim * 0.55;
      const color = lit
        ? `color-mix(in oklab, ${hi} ${(rise * 100).toFixed(1)}%, ${fg})`
        : fg;
      const bucket = byRow.get(w.row) ?? [];
      bucket.push(
        <div
          key={`${cur.fix ? "f" : "l"}${i}`}
          style={{
            position: "absolute",
            left: left + w.px * F,
            top: 0,
            height: pitch,
            lineHeight: `${pitch}px`,
            whiteSpace: "pre",
            fontFamily,
            fontWeight: WGHT,
            fontSize: F,
            letterSpacing: `${TRACK}em`,
            fontKerning: "normal",
            color,
            opacity: 1 - fade,
            transform: `translateY(${offset}px)${glide(moving)}`,
          }}
        >
          {w.text}
        </div>,
      );
      byRow.set(w.row, bucket);
    });
    for (const [row, glyphs] of byRow) {
      nodes.push(rowBox(`r${r}-${row}`, r + row, glyphs));
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
