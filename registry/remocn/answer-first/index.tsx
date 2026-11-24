"use client";

import { loadFont } from "@remotion/google-fonts/Outfit";
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
  type AnswerFirstElementId,
  answerFirstTimeline,
  DEFAULT_ANSWER,
  DEFAULT_QUESTION,
  split,
} from "./timeline";

const outfit = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface AnswerFirstProps {
  answer?: string;
  question?: string;
  accent?: string;
  /** Text color of the answer; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Outfit by default. */
  fontFamily?: string;
  /** Frame the answer starts shrinking into the corner; the question follows it. */
  moveAt?: number;
  /** Frames between words of the question. */
  stagger?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single words of the answer and the question
   * and the move into the corner, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<AnswerFirstElementId>;
}

const THEMES = {
  dark: { bg: "#2445E5", ink: "#FFFFFF", accent: "#FF8FB1" },
  light: { bg: "#FFFFFF", ink: "#2445E5", accent: "#E0457B" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const Q_TRACK = -0.025;
const PITCH = 1.02;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.7, 0, 0.2, 1);
const midway = (q: number) => q > 5e-4 && q < 1 - 5e-4;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx2d(weight: number, family: string) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("answer-first: no 2d context");
  measureCtx.font = `${weight} ${MEASURE_PX}px "${family}"`;
  return measureCtx;
}

function em(family: string, s: string, track = TRACK) {
  return (
    ctx2d(WGHT, family).measureText(s).width / MEASURE_PX +
    track * Array.from(s).length
  );
}

function useFontsReady(fontFamily: string) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("answer-first: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      outfit.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${fontFamily}"`),
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
  }, [handle, fontFamily]);
  return ready;
}

interface Row {
  words: { text: string; x: number }[];
  w: number;
}

interface Layout {
  answer: Row[];
  answerW: number;
  question: Row[];
  F1: number;
  F2: number;
  FQ: number;
  baseline: number;
  cap: number;
  portrait: boolean;
}

function toRow(family: string, words: string[], track: number): Row {
  const space = em(family, " ", track);
  let x = 0;
  const out = words.map((text) => {
    const at = x;
    x += em(family, text, track) + space;
    return { text, x: at };
  });
  return { words: out, w: em(family, words.join(" "), track) };
}

function balanced(family: string, words: string[], n: number): string[][] {
  if (n <= 1) return [words];
  let best: string[][] = [words];
  let bestW = Number.POSITIVE_INFINITY;
  const walk = (start: number, left: number, acc: string[][]) => {
    if (left === 1) {
      const rows = [...acc, words.slice(start)];
      const w = Math.max(...rows.map((r) => em(family, r.join(" "))));
      if (w < bestW) {
        bestW = w;
        best = rows;
      }
      return;
    }
    for (let i = start + 1; i <= words.length - left + 1; i++) {
      walk(i, left - 1, [...acc, words.slice(start, i)]);
    }
  };
  walk(0, n, []);
  return best;
}

function boxH(n: number) {
  return (n - 1) * PITCH + 1;
}

function buildLayout(
  family: string,
  answer: string,
  question: string,
  W: number,
  H: number,
): Layout {
  const portrait = H > W * 1.1;
  const aWords = split(answer);
  let rows: string[][] = [aWords];
  let F1 = 0;
  const maxN = Math.min(aWords.length, portrait ? 4 : 2);
  for (let n = 1; n <= maxN; n++) {
    const cand = balanced(family, aWords, n);
    const w = Math.max(...cand.map((r) => em(family, r.join(" "))));
    const f = Math.min(
      (W * (portrait ? 0.86 : 0.84)) / w,
      (H * (portrait ? 0.5 : 0.62)) / boxH(n),
    );
    if (f > F1 * 1.12) {
      F1 = f;
      rows = cand;
    }
  }
  const answerRows = rows.map((r) => toRow(family, r, TRACK));
  const answerW = Math.max(...answerRows.map((r) => r.w));
  const F2 = Math.min(
    F1 * (portrait ? 0.8 : 0.74),
    (W * (portrait ? 0.86 : 0.7)) / answerW,
    (H * (portrait ? 0.38 : 0.5)) / boxH(answerRows.length),
  );

  const qWords = split(question);
  const qMeasure = W * (portrait ? 0.86 : 0.62);
  let FQ = Math.min(F2 * (portrait ? 0.6 : 0.56), H * 0.11);
  let qRows: Row[] = [];
  for (let guard = 0; guard < 12; guard++) {
    const out: string[][] = [];
    let cur: string[] = [];
    for (const w of qWords) {
      const next = [...cur, w];
      if (
        cur.length > 0 &&
        em(family, next.join(" "), Q_TRACK) * FQ > qMeasure
      ) {
        out.push(cur);
        cur = [w];
      } else {
        cur = next;
      }
    }
    if (cur.length) out.push(cur);
    const even = out.length > 1 ? balanced(family, qWords, out.length) : out;
    qRows = even.map((r) => toRow(family, r, Q_TRACK));
    const widest = Math.max(...qRows.map((r) => r.w)) * FQ;
    if (qRows.length <= (portrait ? 4 : 3) && widest <= qMeasure) break;
    FQ *= 0.9;
  }

  const c = ctx2d(WGHT, family);
  const fm = c.measureText("Hxg");
  const asc = fm.fontBoundingBoxAscent / MEASURE_PX;
  const desc = fm.fontBoundingBoxDescent / MEASURE_PX;
  const cap = c.measureText("H").actualBoundingBoxAscent / MEASURE_PX;
  const baseline = (1 - asc - desc) / 2 + asc;

  return {
    answer: answerRows,
    answerW,
    question: qRows,
    F1,
    F2,
    FQ,
    baseline,
    cap,
    portrait,
  };
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

export function AnswerFirst(props: AnswerFirstProps) {
  const {
    answer = DEFAULT_ANSWER,
    question = DEFAULT_QUESTION,
    accent,
    ink,
    background,
    fontFamily = outfit.fontFamily,
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
    answerFirstTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady(fontFamily);

  const layout = useMemo(
    () => (ready ? buildLayout(fontFamily, answer, question, W, H) : null),
    [ready, fontFamily, answer, question, W, H],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const t = frame * speed;
  const move = tl.get("move");

  const { F1, F2, FQ, baseline, cap, answerW, portrait } = layout;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.07 : 0.1);
  const nA = layout.answer.length;

  const visTop = baseline - cap;
  const visBottom = (nA - 1) * PITCH + baseline;
  const sEnd = F2 / F1;
  const bx1 = W - mx - answerW * F2;
  const by1 = H - my - visBottom * F2;
  const geometry = (tt: number) => {
    const p = interpolate(tt, [move.start, move.end], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });
    const creep = interpolate(
      tt,
      [move.start + move.beat("creep"), move.start],
      [0, 0.02],
      CLAMP,
    );
    const s = Math.exp(Math.log(sEnd) * p) * (1 + creep * (1 - p));
    const bx0 = W / 2 - (answerW * F1 * s) / 2;
    const by0 = H / 2 - ((visTop + visBottom) / 2) * F1 * s;
    return {
      p,
      s,
      bx: bx0 + (bx1 - bx0) * p,
      by: by0 + (by1 - by0) * p,
    };
  };
  const { p, s, bx, by } = geometry(t);
  // The creep and the move chain into each other, so motion is read off the
  // neighbouring frames: a scale step weighed by the block's width, and the
  // vertical travel.
  // One composition frame either side, on the scene timeline.
  const blockMoving = [t - speed, t + speed].some((tt) => {
    const o = geometry(tt);
    return (
      Math.abs(o.s - s) * answerW * F1 > 1e-3 || Math.abs(o.by - by) > 1e-3
    );
  });
  const align = p;

  const R = F1;
  const travel = 1.15 * R;
  const clipTop = (baseline - 1.0) * R;
  const clipH = 1.3 * R;

  let wordIndex = 0;
  const answerNodes = layout.answer.map((row, li) => {
    const offset = ((answerW - row.w) / 2) * (1 + align);
    return (
      <div
        key={`a-${li}`}
        style={{
          position: "absolute",
          left: (offset - 0.2) * R,
          top: li * PITCH * R + clipTop,
          width: (row.w + 0.5) * R,
          height: clipH,
          overflow: "hidden",
        }}
      >
        {row.words.map((w) => {
          const i = wordIndex++;
          const word = tl.get(`answer:${i}`);
          const q = interpolate(t, [word.start, word.end], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={`aw-${i}`}
              style={{
                position: "absolute",
                left: (w.x + 0.2) * R,
                top: -clipTop,
                height: R,
                fontFamily,
                fontWeight: WGHT,
                fontSize: R,
                lineHeight: `${R}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color: fg,
                transform: `translateY(${((1 - q) * travel).toFixed(2)}px)${glide(midway(q) && !blockMoving)}`,
              }}
            >
              {w.text}
            </div>
          );
        })}
      </div>
    );
  });

  const qTop = my - visTop * FQ;
  const qClipTop = (baseline - 1.0) * FQ;
  let qIndex = 0;
  const questionNodes = layout.question.map((row, li) => (
    <div
      key={`q-${li}`}
      style={{
        position: "absolute",
        left: mx - 0.2 * FQ,
        top: qTop + li * PITCH * FQ + qClipTop,
        width: (row.w + 0.5) * FQ,
        height: 1.3 * FQ,
        overflow: "hidden",
      }}
    >
      {row.words.map((w) => {
        const i = qIndex++;
        const word = tl.get(`question:${i}`);
        const q = interpolate(t, [word.start, word.end], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <div
            key={`qw-${i}`}
            style={{
              position: "absolute",
              left: (w.x + 0.2) * FQ,
              top: -qClipTop,
              height: FQ,
              fontFamily,
              fontWeight: WGHT,
              fontSize: FQ,
              lineHeight: `${FQ}px`,
              letterSpacing: `${Q_TRACK}em`,
              whiteSpace: "pre",
              color: hi,
              transform: `translateY(${((1 - q) * 1.15 * FQ).toFixed(2)}px)${glide(midway(q))}`,
            }}
          >
            {w.text}
          </div>
        );
      })}
    </div>
  ));

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {questionNodes}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            // The tilt pivots on the block's top-left corner, which is on screen.
            transform: `translate(${bx.toFixed(2)}px, ${by.toFixed(2)}px)${glide(blockMoving)} scale(${s.toFixed(5)})`,
          }}
        >
          {answerNodes}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
