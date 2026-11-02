"use client";

import { loadFont } from "@remotion/google-fonts/Outfit";
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

const outfit = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface AnswerFirstProps {
  answer?: string;
  question?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const A_LEN = 14;
const A_STAGGER = 3;
const MOVE_AT = 34;
const MOVE_LEN = 26;
const Q_AT = 46;
const Q_STAGGER = 4;
const Q_LEN = 14;
const MIN_HOLD = 26;

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx2d(weight: number) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("answer-first: no 2d context");
  measureCtx.font = `${weight} ${MEASURE_PX}px "${outfit.fontFamily}"`;
  return measureCtx;
}

function em(s: string, track = TRACK) {
  return (
    ctx2d(WGHT).measureText(s).width / MEASURE_PX + track * Array.from(s).length
  );
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("answer-first: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      outfit.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${outfit.fontFamily}"`),
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

function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function toRow(words: string[], track: number): Row {
  const space = em(" ", track);
  let x = 0;
  const out = words.map((text) => {
    const at = x;
    x += em(text, track) + space;
    return { text, x: at };
  });
  return { words: out, w: em(words.join(" "), track) };
}

function balanced(words: string[], n: number): string[][] {
  if (n <= 1) return [words];
  let best: string[][] = [words];
  let bestW = Number.POSITIVE_INFINITY;
  const walk = (start: number, left: number, acc: string[][]) => {
    if (left === 1) {
      const rows = [...acc, words.slice(start)];
      const w = Math.max(...rows.map((r) => em(r.join(" "))));
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
    const cand = balanced(aWords, n);
    const w = Math.max(...cand.map((r) => em(r.join(" "))));
    const f = Math.min(
      (W * (portrait ? 0.86 : 0.84)) / w,
      (H * (portrait ? 0.5 : 0.62)) / boxH(n),
    );
    if (f > F1 * 1.12) {
      F1 = f;
      rows = cand;
    }
  }
  const answerRows = rows.map((r) => toRow(r, TRACK));
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
      if (cur.length > 0 && em(next.join(" "), Q_TRACK) * FQ > qMeasure) {
        out.push(cur);
        cur = [w];
      } else {
        cur = next;
      }
    }
    if (cur.length) out.push(cur);
    const even = out.length > 1 ? balanced(qWords, out.length) : out;
    qRows = even.map((r) => toRow(r, Q_TRACK));
    const widest = Math.max(...qRows.map((r) => r.w)) * FQ;
    if (qRows.length <= (portrait ? 4 : 3) && widest <= qMeasure) break;
    FQ *= 0.9;
  }

  const c = ctx2d(WGHT);
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

export function AnswerFirst({
  answer = "A pull request.",
  question = "Who made this video?",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: AnswerFirstProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();

  const layout = useMemo(
    () => (ready ? buildLayout(answer, question, W, H) : null),
    [ready, answer, question, W, H],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const qCount = layout.question.reduce((n, r) => n + r.words.length, 0);
  const motionEnd = Q_AT + (qCount - 1) * Q_STAGGER + Q_LEN;
  const room = durationInFrames * speed - MIN_HOLD;
  const k = Math.max(0.55, Math.min(1, room / motionEnd));
  const t = (frame * speed) / k;

  const { F1, F2, FQ, baseline, cap, answerW, portrait } = layout;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.07 : 0.1);
  const nA = layout.answer.length;

  const p = interpolate(t, [MOVE_AT, MOVE_AT + MOVE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_MOVE,
  });
  const creep = interpolate(t, [A_LEN, MOVE_AT], [0, 0.02], CLAMP);
  const sEnd = F2 / F1;
  const s = Math.exp(Math.log(sEnd) * p) * (1 + creep * (1 - p));

  const visTop = baseline - cap;
  const visBottom = (nA - 1) * PITCH + baseline;
  const bx0 = W / 2 - (answerW * F1 * s) / 2;
  const by0 = H / 2 - ((visTop + visBottom) / 2) * F1 * s;
  const bx1 = W - mx - answerW * F2;
  const by1 = H - my - visBottom * F2;
  const bx = bx0 + (bx1 - bx0) * p;
  const by = by0 + (by1 - by0) * p;
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
          const q = interpolate(
            t,
            [i * A_STAGGER, i * A_STAGGER + A_LEN],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          return (
            <div
              key={`aw-${i}`}
              style={{
                position: "absolute",
                left: (w.x + 0.2) * R,
                top: -clipTop,
                height: R,
                fontFamily: outfit.fontFamily,
                fontWeight: WGHT,
                fontSize: R,
                lineHeight: `${R}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color: c.ink,
                transform: `translateY(${((1 - q) * travel).toFixed(2)}px)`,
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
        const at = Q_AT + i * Q_STAGGER;
        const q = interpolate(t, [at, at + Q_LEN], [0, 1], {
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
              fontFamily: outfit.fontFamily,
              fontWeight: WGHT,
              fontSize: FQ,
              lineHeight: `${FQ}px`,
              letterSpacing: `${Q_TRACK}em`,
              whiteSpace: "pre",
              color: hi,
              transform: `translateY(${((1 - q) * 1.15 * FQ).toFixed(2)}px)`,
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
      {questionNodes}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${bx.toFixed(2)}px, ${by.toFixed(2)}px) scale(${s.toFixed(5)})`,
        }}
      >
        {answerNodes}
      </div>
    </AbsoluteFill>
  );
}
