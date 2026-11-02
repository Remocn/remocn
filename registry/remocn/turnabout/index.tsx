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

const dmSans = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface TurnaboutProps {
  before?: string;
  after?: string;
  highlight?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2E3440", ink: "#FFFFFF", accent: "#FFB020" },
  light: { bg: "#F1F2F4", ink: "#2E3440", accent: "#B86E00" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const PROBE = 200;
const BASE = 150;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const IN = 4;
const STAGGER = 3;
const ENTER = 16;
const TURN = 52;
const LIFT = 13;
const TRAVEL = 30;
const LIT = 8;

interface Tok {
  text: string;
  key: string;
  start: number;
  end: number;
  x: number;
  w: number;
}

interface Line {
  toks: Tok[];
  width: number;
}

interface Metrics {
  a: Line;
  b: Line;
  cap: number;
}

function tokenize(s: string) {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /[^\s.,!?…;:]+|[.,!?…;:]+/g;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

function layoutLine(s: string, em: (x: string) => number): Line {
  const toks = tokenize(s).map((tk) => ({
    ...tk,
    key: tk.text.toLowerCase(),
    x: em(s.slice(0, tk.start)),
    w: em(tk.text),
  }));
  return { toks, width: em(s) };
}

function measure(before: string, after: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("turnabout: no 2d context");
  ctx.font = `${WGHT} ${PROBE}px "${dmSans.fontFamily}"`;
  const em = (x: string) =>
    ctx.measureText(x).width / PROBE + TRACK * Array.from(x).length;
  const cap = ctx.measureText("H").actualBoundingBoxAscent / PROBE;
  return { a: layoutLine(before, em), b: layoutLine(after, em), cap };
}

function useMetrics(before: string, after: string) {
  const key = `${before}\u0001${after}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("turnabout: measuring"));
  const released = useRef(false);
  const src = useRef({ before, after });
  src.current = { before, after };
  useEffect(() => {
    let live = true;
    Promise.all([
      dmSans.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${dmSans.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(src.current.before, src.current.after) });
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

function related(a: string, b: string) {
  if (a === b) return 2;
  const short = a.length < b.length ? a : b;
  const long = a.length < b.length ? b : a;
  if (short.length >= 3 && long.startsWith(short)) return 1;
  return 0;
}

function pairTokens(a: Tok[], b: Tok[]) {
  const pairOfB = new Array<number>(b.length).fill(-1);
  const used = new Set<number>();
  for (const level of [2, 1]) {
    b.forEach((tb, j) => {
      if (pairOfB[j] >= 0) return;
      const i = a.findIndex(
        (ta, k) => !used.has(k) && related(ta.key, tb.key) === level,
      );
      if (i >= 0) {
        pairOfB[j] = i;
        used.add(i);
      }
    });
  }
  return pairOfB;
}

interface Mover {
  i: number;
  j: number;
  a0: number;
  a1: number;
  b0: number;
  b1: number;
  lane: number;
}

function clashes(p: Mover, q: Mover, gap: number) {
  const leftA = p.a1 + gap <= q.a0;
  const rightA = q.a1 + gap <= p.a0;
  const leftB = p.b1 + gap <= q.b0;
  const rightB = q.b1 + gap <= p.b0;
  return !((leftA && leftB) || (rightA && rightB));
}

function assignLanes(movers: Mover[], still: number, gap: number) {
  const order = [...movers].sort(
    (p, q) => Math.abs(p.b0 - p.a0) - Math.abs(q.b0 - q.a0),
  );
  const placed: Mover[] = [];
  for (const mv of order) {
    const dx = mv.b0 - mv.a0;
    const dir = dx >= 0 ? -1 : 1;
    const lanes =
      Math.abs(dx) < still
        ? [0, dir, dir * 2, dir * 3]
        : [dir, dir * 2, dir * 3, dir * 4];
    for (const lane of lanes) {
      if (!placed.some((o) => o.lane === lane && clashes(mv, o, gap))) {
        mv.lane = lane;
        break;
      }
      mv.lane = lane;
    }
    placed.push(mv);
  }
}

export function Turnabout({
  before = "You work for the video.",
  after = "The video works for you.",
  highlight = "you.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: TurnaboutProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const k = Math.min(1, durationInFrames / BASE);
  const t = (frame * speed) / k;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const m = useMetrics(before, after);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const widest = Math.max(m.a.width, m.b.width, 0.1);
  const F = Math.min(
    (W * (portrait ? 0.92 : 0.88)) / widest,
    H * 0.16,
    W * 0.12,
  );
  const leftA = (W - m.a.width * F) / 2;
  const leftB = (W - m.b.width * F) / 2;
  const base = H * 0.5 + (m.cap * F) / 2;
  const top = base - F * 0.93;
  const laneGap = F * 1.02;

  const pairOfB = pairTokens(m.a.toks, m.b.toks);
  const pairedA = new Set(pairOfB.filter((i) => i >= 0));
  const movers: Mover[] = [];
  pairOfB.forEach((i, j) => {
    if (i < 0) return;
    const ta = m.a.toks[i];
    const tb = m.b.toks[j];
    movers.push({
      i,
      j,
      a0: leftA + ta.x * F,
      a1: leftA + (ta.x + ta.w) * F,
      b0: leftB + tb.x * F,
      b1: leftB + (tb.x + tb.w) * F,
      lane: 0,
    });
  });
  assignLanes(movers, F * 0.3, F * 0.12);

  const hiStart = highlight ? after.lastIndexOf(highlight) : -1;
  const hiEnd = hiStart >= 0 ? hiStart + highlight.length : -1;
  const isHi = (tk: Tok) =>
    hiStart >= 0 && tk.start < hiEnd && tk.end > hiStart;

  const t1 = TURN + LIFT * 0.6;
  const t2 = t1 + TRAVEL;
  const dropAt = t2 - LIFT * 0.4;
  const landed = dropAt + LIFT;
  const lift =
    interpolate(t, [TURN, TURN + LIFT], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    }) -
    interpolate(t, [dropAt, landed], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    });
  const travel = interpolate(t, [t1, t2], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const lit = interpolate(t, [landed - 2, landed + LIT], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const swapped = t >= t1 + TRAVEL * 0.5;
  const suffixIn = interpolate(t, [dropAt, landed], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const word = (
    key: string,
    text: string,
    x: number,
    dy: number,
    opacity: number,
    color: string,
    suffix?: { text: string; opacity: number },
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top,
        height: F * 1.2,
        lineHeight: `${F * 1.2}px`,
        whiteSpace: "pre",
        fontFamily: dmSans.fontFamily,
        fontWeight: WGHT,
        fontSize: F,
        letterSpacing: `${TRACK}em`,
        fontKerning: "normal",
        color,
        opacity,
        transform: `translate(${x.toFixed(2)}px, ${dy.toFixed(2)}px)`,
      }}
    >
      {text}
      {suffix ? (
        <span style={{ opacity: suffix.opacity }}>{suffix.text}</span>
      ) : null}
    </div>
  );

  const nodes: React.ReactNode[] = [];

  m.a.toks.forEach((ta, i) => {
    const enter = interpolate(
      t,
      [IN + i * STAGGER, IN + i * STAGGER + ENTER],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    if (pairedA.has(i)) return;
    const out = interpolate(t, [TURN, TURN + LIFT], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    if (enter * (1 - out) <= 0) return;
    nodes.push(
      word(
        `a${i}`,
        ta.text,
        leftA + ta.x * F,
        F * 0.28 * (1 - enter) + F * 0.4 * out,
        enter * (1 - out),
        c.ink,
      ),
    );
  });

  for (const mv of movers) {
    const ta = m.a.toks[mv.i];
    const tb = m.b.toks[mv.j];
    const enter = interpolate(
      t,
      [IN + mv.i * STAGGER, IN + mv.i * STAGGER + ENTER],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const x = mv.a0 + (mv.b0 - mv.a0) * travel;
    const dy = F * 0.28 * (1 - enter) + mv.lane * laneGap * lift;
    const color =
      isHi(tb) && lit > 0
        ? `color-mix(in oklab, ${hi} ${(lit * 100).toFixed(1)}%, ${c.ink})`
        : c.ink;
    if (ta.text === tb.text) {
      nodes.push(word(`m${mv.j}`, tb.text, x, dy, enter, color));
    } else if (tb.text.startsWith(ta.text)) {
      nodes.push(
        word(`m${mv.j}`, ta.text, x, dy, enter, color, {
          text: tb.text.slice(ta.text.length),
          opacity: suffixIn,
        }),
      );
    } else if (ta.text.startsWith(tb.text)) {
      nodes.push(
        word(`m${mv.j}`, tb.text, x, dy, enter, color, {
          text: ta.text.slice(tb.text.length),
          opacity: 1 - suffixIn,
        }),
      );
    } else {
      nodes.push(
        word(`m${mv.j}`, swapped ? tb.text : ta.text, x, dy, enter, color),
      );
    }
  }

  m.b.toks.forEach((tb, j) => {
    if (pairOfB[j] >= 0) return;
    const inn = interpolate(t, [dropAt, landed + 4], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (inn <= 0) return;
    const color = isHi(tb)
      ? `color-mix(in oklab, ${hi} ${(lit * 100).toFixed(1)}%, ${c.ink})`
      : c.ink;
    nodes.push(
      word(`b${j}`, tb.text, leftB + tb.x * F, F * 0.3 * (1 - inn), inn, color),
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
