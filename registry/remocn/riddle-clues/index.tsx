"use client";

import { loadFont } from "@remotion/google-fonts/FunnelDisplay";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_CLUES: RiddleClue[] = [
  { line: "It has scenes,", turn: "but no camera." },
  { line: "It has a timeline,", turn: "but no editor." },
  { line: "It has a release date,", turn: "but no name yet." },
];

const DEFAULT_CLOSER: RiddleClue = {
  line: "Give up?",
  turn: "Answer on the 14th.",
};

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

const STEP = 56;
const IN_LEN = 13;
const STAGGER = 3;
const TURN_AT = 20;
const SHIFT_LEN = 14;
const OUT_AT = 50;
const OUT_LEN = 9;
const MIN_HOLD = 30;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("riddle-clues: no 2d context");
  measureCtx.font = `${WGHT} ${MEASURE_PX}px "${funnel.fontFamily}"`;
  return (
    measureCtx.measureText(s).width / MEASURE_PX + TRACK * Array.from(s).length
  );
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("riddle-clues: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      funnel.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${funnel.fontFamily}"`),
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
  }, [handle]);
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

function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function toPart(words: string[]): Part {
  const space = em(" ");
  let x = 0;
  const out = words.map((text) => {
    const at = x;
    x += em(text) + space;
    return { text, x: at };
  });
  return { words: out, w: em(words.join(" ")) };
}

function greedy(words: string[], maxEm: number): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    const next = [...cur, w];
    if (cur.length > 0 && em(next.join(" ")) > maxEm) {
      rows.push(cur);
      cur = [w];
    } else {
      cur = next;
    }
  }
  if (cur.length) rows.push(cur);
  return rows;
}

function wrap(s: string, maxEm: number): Part[] {
  const words = split(s);
  let rows = greedy(words, maxEm);
  let m = maxEm;
  for (let guard = 0; guard < 30 && rows.length > 1; guard++) {
    m *= 0.96;
    const next = greedy(words, m);
    if (next.length > rows.length) break;
    rows = next;
  }
  return rows.map(toPart);
}

function buildLayout(items: RiddleClue[], W: number, H: number) {
  const portrait = H > W * 1.1;
  const maxW = W * (portrait ? 0.8 : 0.58);
  const F = Math.min(W, H) * (portrait ? 0.052 : 0.05);
  const gap = em(" ");
  const out: Item[] = items.map((it) => {
    const line = wrap(it.line, maxW / F);
    const turn = wrap(it.turn, maxW / F);
    const inline =
      line.length === 1 &&
      turn.length === 1 &&
      (line[0].w + gap + turn[0].w) * F <= maxW;
    return { line, turn, inline };
  });
  return { items: out, F, gap, portrait };
}

export function RiddleClues({
  clues = DEFAULT_CLUES,
  closer = DEFAULT_CLOSER,
  label = "Clue",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: RiddleCluesProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();

  const all = useMemo(() => [...clues, closer], [clues, closer]);
  const layout = useMemo(
    () => (ready ? buildLayout(all, W, H) : null),
    [ready, all, W, H],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const { F, gap } = layout;
  const n = layout.items.length;
  const lastTurnWords = layout.items[n - 1].turn.reduce(
    (acc, r) => acc + r.words.length,
    0,
  );
  const motionEnd =
    (n - 1) * STEP + TURN_AT + 4 + (lastTurnWords - 1) * STAGGER + IN_LEN;
  const room = durationInFrames * speed - MIN_HOLD;
  const k = Math.max(0.6, Math.min(1, room / motionEnd));
  const t = (frame * speed) / k;

  const rowH = F * 1.34;
  const pitch = F * 1.36;
  const cy = H / 2;
  const LF = F * 0.38;

  const nodes = layout.items.map((item, i) => {
    const s = i * STEP;
    const local = t - s;
    const isLast = i === n - 1;
    if (local < -2) return null;
    if (!isLast && local > OUT_AT + OUT_LEN + 2) return null;

    const shift = interpolate(local, [TURN_AT, TURN_AT + SHIFT_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });
    const out = isLast
      ? 0
      : interpolate(local, [OUT_AT, OUT_AT + OUT_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });

    const placed: {
      part: Part;
      x: number;
      y: number;
      turn: boolean;
      first: number;
    }[] = [];
    let topY: number;
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
      const lineTop = lineTop0 + (lineTop1 - lineTop0) * shift;
      let first = 0;
      item.line.forEach((part, li) => {
        placed.push({
          part,
          x: W / 2 - (part.w * F) / 2,
          y: lineTop + li * pitch,
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
      topY = lineTop;
    }

    const rise = (at: number) =>
      interpolate(local, [at, at + IN_LEN], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });

    const row = (
      part: Part,
      x: number,
      y: number,
      color: string,
      at: number,
      first: number,
      key: string,
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
        }}
      >
        {part.words.map((w, wi) => {
          const q = rise(at + (first + wi) * STAGGER);
          const dy = (1 - q) * rowH - out * rowH;
          return (
            <div
              key={`${key}-${wi}`}
              style={{
                position: "absolute",
                left: w.x * F + F * 0.2,
                top: 0,
                height: rowH,
                fontFamily: funnel.fontFamily,
                fontWeight: WGHT,
                fontSize: F,
                lineHeight: `${rowH}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color,
                transform: `translateY(${dy.toFixed(2)}px)`,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </div>
    );

    const labelY = topY - rowH / 2 - LF * 1.9;
    const labelQ = rise(0);
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
            }}
          >
            <div
              style={{
                fontFamily: funnel.fontFamily,
                fontWeight: WGHT,
                fontSize: LF,
                lineHeight: `${LF * 1.6}px`,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: c.dim,
                transform: `translateY(${((1 - labelQ) * LF * 1.6 - out * LF * 1.6).toFixed(2)}px)`,
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
            p.turn ? hi : c.ink,
            p.turn ? TURN_AT + 4 : 0,
            p.first,
            `r-${i}-${pi}`,
          ),
        )}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
