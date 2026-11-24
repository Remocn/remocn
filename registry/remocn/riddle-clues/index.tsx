"use client";

import { loadFont } from "@remotion/google-fonts/FunnelDisplay";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  DEFAULT_CLOSER,
  DEFAULT_CLUES,
  type RiddleCluesElementId,
  riddleCluesTimeline,
  splitWords,
} from "./timeline";

const funnel = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface RiddleClue {
  line: string;
  turn: string;
}

export interface RiddleCluesProps {
  clues?: RiddleClue[];
  closer?: RiddleClue;
  label?: string;
  accent?: string;
  /** Text color of the clues; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Funnel Display by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between words as a line rises in. */
  stagger?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single labels, words, shifts and exits, by the
   * ids in `./timeline`. Frames on the scene timeline, after `delay` and
   * `speed`.
   */
  timing?: Timing<RiddleCluesElementId>;
}

const THEMES = {
  dark: {
    bg: "#0B0B0F",
    ink: "#FFFFFF",
    dim: "rgba(255,255,255,0.42)",
    accent: "#B79CFF",
  },
  light: {
    bg: "#FAFAFA",
    ink: "#121216",
    dim: "rgba(18,18,22,0.45)",
    accent: "#6B4FD8",
  },
} as const;

const WGHT = 400;
const TRACK = -0.012;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.25, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.8, 0.2);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string, font: string) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("riddle-clues: no 2d context");
  measureCtx.font = font;
  return (
    measureCtx.measureText(s).width / MEASURE_PX + TRACK * Array.from(s).length
  );
}

function useFontsReady(fontFamily: string, fontWeight: number) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("riddle-clues: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      funnel.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, fontFamily, fontWeight]);
  return ready;
}

interface Word {
  text: string;
  x: number;
}

interface Part {
  words: Word[];
  w: number;
}

interface Item {
  line: Part[];
  turn: Part[];
  inline: boolean;
}

function toPart(words: string[], font: string): Part {
  const space = em(" ", font);
  let x = 0;
  const out = words.map((text) => {
    const at = x;
    x += em(text, font) + space;
    return { text, x: at };
  });
  return { words: out, w: em(words.join(" "), font) };
}

function greedy(words: string[], maxEm: number, font: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    const next = [...cur, w];
    if (cur.length > 0 && em(next.join(" "), font) > maxEm) {
      rows.push(cur);
      cur = [w];
    } else {
      cur = next;
    }
  }
  if (cur.length) rows.push(cur);
  return rows;
}

function wrap(s: string, maxEm: number, font: string): Part[] {
  const words = splitWords(s);
  let rows = greedy(words, maxEm, font);
  let m = maxEm;
  for (let guard = 0; guard < 30 && rows.length > 1; guard++) {
    m *= 0.96;
    const next = greedy(words, m, font);
    if (next.length > rows.length) break;
    rows = next;
  }
  return rows.map((r) => toPart(r, font));
}

function buildLayout(items: RiddleClue[], W: number, H: number, font: string) {
  const portrait = H > W * 1.1;
  const maxW = W * (portrait ? 0.8 : 0.58);
  const F = Math.min(W, H) * (portrait ? 0.052 : 0.05);
  const gap = em(" ", font);
  const out: Item[] = items.map((it) => {
    const line = wrap(it.line, maxW / F, font);
    const turn = wrap(it.turn, maxW / F, font);
    const inline =
      line.length === 1 &&
      turn.length === 1 &&
      (line[0].w + gap + turn[0].w) * F <= maxW;
    return { line, turn, inline };
  });
  return { items: out, F, gap, portrait };
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

export function RiddleClues(props: RiddleCluesProps) {
  const {
    clues = DEFAULT_CLUES,
    closer = DEFAULT_CLOSER,
    label = "Clue",
    accent,
    ink,
    background,
    fontFamily = funnel.fontFamily,
    fontWeight = WGHT,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    riddleCluesTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady(fontFamily, fontWeight);
  const font = `${fontWeight} ${MEASURE_PX}px "${fontFamily}"`;

  const all = useMemo(() => [...clues, closer], [clues, closer]);
  const layout = useMemo(
    () => (ready ? buildLayout(all, W, H, font) : null),
    [ready, all, W, H, font],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const { F, gap } = layout;
  const n = layout.items.length;
  const t = frame * speed;

  const rowH = F * 1.34;
  const pitch = F * 1.36;
  const cy = H / 2;
  const LF = F * 0.38;

  const nodes = layout.items.map((item, i) => {
    const isLast = i === n - 1;
    const shiftEl = tl.get(`shift:${i}`);
    const outEl = isLast ? null : tl.get(`out:${i}`);
    const firstEl = isLast
      ? (tl.elements.find((e) => e.id.startsWith(`line:${i}:`)) ?? shiftEl)
      : tl.get(`label:${i}`);
    // Before its first element and after its exit the item is out of sight.
    if (t < firstEl.start - 2) return null;
    if (outEl && t > outEl.end + 2) return null;

    const shiftAt = (l: number) =>
      interpolate(l, [shiftEl.start, shiftEl.end], [0, 1], {
        ...CLAMP,
        easing: EASE_MOVE,
      });
    const outAt = (l: number) =>
      outEl
        ? interpolate(l, [outEl.start, outEl.end], [0, 1], {
            ...CLAMP,
            easing: EASE_IN,
          })
        : 0;
    const shift = shiftAt(t);
    // A frame on either side, to tell a value still easing from one at rest.
    const dt = speed;
    const moves = (at: (l: number) => number) =>
      Math.abs(at(t + dt) - at(t)) > 1e-3 ||
      Math.abs(at(t) - at(t - dt)) > 1e-3;

    const placed: {
      part: Part;
      x: number;
      y: number;
      turn: boolean;
      first: number;
    }[] = [];
    let topY: number;
    // The block recentres as the turn arrives. Layout rounds a box and a
    // baseline to whole pixels, so the rows sit where the turn leaves them
    // and the climb there is a transform.
    let lift = (_l: number) => 0;
    if (item.inline) {
      const lineW = item.line[0].w * F;
      const turnW = item.turn[0].w * F;
      const totalW = lineW + gap * F + turnW;
      const x0 = W / 2 - lineW / 2;
      const x1 = W / 2 - totalW / 2;
      placed.push({
        part: item.line[0],
        x: x0 + (x1 - x0) * shift,
        y: cy,
        turn: false,
        first: 0,
      });
      placed.push({
        part: item.turn[0],
        x: x0 + (x1 - x0) * shift + lineW + gap * F,
        y: cy,
        turn: true,
        first: 0,
      });
      topY = cy;
    } else {
      const nl = item.line.length;
      const nt = item.turn.length;
      const lineTop0 = cy - ((nl - 1) * pitch) / 2;
      const lineTop1 = cy - ((nl + nt - 1) * pitch) / 2;
      lift = (l: number) => (lineTop0 - lineTop1) * (1 - shiftAt(l));
      let first = 0;
      item.line.forEach((part, li) => {
        placed.push({
          part,
          x: W / 2 - (part.w * F) / 2,
          y: lineTop1 + li * pitch,
          turn: false,
          first,
        });
        first += part.words.length;
      });
      first = 0;
      item.turn.forEach((part, ti) => {
        placed.push({
          part,
          x: W / 2 - (part.w * F) / 2,
          y: lineTop1 + (nl + ti) * pitch,
          turn: true,
          first,
        });
        first += part.words.length;
      });
      topY = lineTop1;
    }
    const dyLift = lift(t);
    const lifting = moves(lift);
    const liftTransform =
      Math.abs(dyLift) > 1e-3 ? `translateY(${dyLift}px)` : undefined;

    const riseAt = (l: number, id: RiddleCluesElementId) => {
      const e = tl.get(id);
      return interpolate(l, [e.start, e.end], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
    };

    const row = (
      part: Part,
      x: number,
      y: number,
      color: string,
      kind: "line" | "turn",
      first: number,
      key: string,
      climbs: boolean,
    ) => (
      <div
        key={key}
        style={{
          position: "absolute",
          left: x - F * 0.2,
          top: y - rowH / 2,
          width: part.w * F + F * 0.5,
          height: rowH,
          overflow: "hidden",
          transform: climbs ? liftTransform : undefined,
        }}
      >
        {part.words.map((w, wi) => {
          const wordAt = (l: number) =>
            (1 - riseAt(l, `${kind}:${i}:${first + wi}`)) * rowH -
            outAt(l) * rowH;
          const dy = wordAt(t);
          return (
            <div
              key={`${key}-${wi}`}
              style={{
                position: "absolute",
                left: w.x * F + F * 0.2,
                top: 0,
                height: rowH,
                fontFamily,
                fontWeight,
                fontSize: F,
                lineHeight: `${rowH}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color,
                transform: `translateY(${dy.toFixed(2)}px)${glide((climbs && lifting) || moves(wordAt))}`,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </div>
    );

    const labelY = topY - rowH / 2 - LF * 1.9;
    const labelAt = (l: number) =>
      isLast
        ? 0
        : (1 - riseAt(l, `label:${i}`)) * LF * 1.6 - outAt(l) * LF * 1.6;
    const labelText = isLast ? "" : `${label} ${i + 1} of ${n - 1}`;

    return (
      <div key={`item-${i}`} style={{ position: "absolute", inset: 0 }}>
        {labelText ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: labelY,
              height: LF * 1.6,
              overflow: "hidden",
              textAlign: "center",
              transform: liftTransform,
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight,
                fontSize: LF,
                lineHeight: `${LF * 1.6}px`,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: c.dim,
                transform: `translateY(${labelAt(t).toFixed(2)}px)${glide(lifting || moves(labelAt))}`,
              }}
            >
              {labelText}
            </div>
          </div>
        ) : null}
        {placed.map((p, pi) =>
          row(
            p.part,
            p.x,
            p.y,
            p.turn ? hi : fg,
            p.turn ? "turn" : "line",
            p.first,
            `r-${i}-${pi}`,
            !p.turn,
          ),
        )}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
