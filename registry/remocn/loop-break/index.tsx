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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_FIX,
  DEFAULT_LOOP,
  ENTER,
  type LoopBreakElementId,
  loopBreakPlan,
  loopBreakTimeline,
  loopRows,
  REWIND,
  REWIND_WORD,
  WORD_STAGGER,
} from "./timeline";

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
  /**
   * Moves, trims or stretches each row's rise and rewind on each pass, the
   * fix and the final dim, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<LoopBreakElementId>;
}

const THEMES = {
  dark: { bg: "#2E3440", ink: "#FFFFFF", accent: "#FFB020" },
  light: { bg: "#F1F2F4", ink: "#2E3440", accent: "#B86E00" },
} as const;

const WGHT = 500;
const TRACK = -0.03;
const PROBE = 200;
const LEAD = 1.14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.4);

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

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

export function LoopBreak(props: LoopBreakProps) {
  const {
    loop = DEFAULT_LOOP,
    fix = DEFAULT_FIX,
    highlight = "Done.",
    stagger = WORD_STAGGER,
    accent,
    ink,
    background,
    fontFamily = dmSans.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const t = frame * speed;
  const tl = useTimeline(
    loopBreakTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const rows = loopRows(loop);
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

  const takes: Take[] = loopBreakPlan(props).takes.map((tk) => {
    const rise = tl.get(tk.id);
    const sink = tk.rewind ? tl.get(tk.rewind) : null;
    return {
      row: tk.row,
      fix: tk.fix,
      at: rise.start,
      tempo: rise.beat("tempo"),
      back: sink ? sink.start : Number.POSITIVE_INFINITY,
      backTempo: sink ? sink.beat("tempo") : tk.backTempo,
    };
  });
  const dimEl = tl.get("dim");
  const dim = interpolate(t, [dimEl.start, dimEl.end], [0, 1], {
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
    for (const tk of takes) {
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
        offset !== offsetAt(t + speed) || offset !== offsetAt(t - speed);
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
