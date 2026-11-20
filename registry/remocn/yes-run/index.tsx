"use client";

import { loadFont } from "@remotion/google-fonts/Unbounded";
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

const unbounded = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface YesRunProps {
  questions?: string[];
  answer?: string;
  accent?: string;
  /** Text color of the questions; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Unbounded by default. */
  fontFamily?: string;
  /** Frames the first question stays; each next one is quicker. */
  dwell?: number;
  /** Frames the last answer holds before the end. */
  hold?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_QUESTIONS = [
  "Vertical?",
  "Captions?",
  "Your fonts?",
  "Dark mode?",
  "Transitions?",
  "Renders in CI?",
  "In your repo?",
  "Free?",
];

const FONT_PX = 200;
const WGHT = 500;
const TRACK = -0.03;
const GAP = 0.3;
const PAD_X = 0.26;
const LINE = 1.16;
const ROW_GAP = 0.06;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_PUSH = Easing.bezier(0.5, 0, 0.1, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const FIRST_DWELL = 32;
const RATIO = 0.8;
const MIN_DWELL = 10;
const LAST_PUSH = 11;
const LAST_MIN = 44;

interface Split {
  head: string;
  tail: string;
  hw: number;
  tw: number;
}

interface Metrics {
  q: number[];
  splits: Split[][];
  a: number;
  asc: number;
  desc: number;
  cap: number;
}

function measure(
  questions: string[],
  answer: string,
  fontFamily: string,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("yes-run: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${fontFamily}"`;
  const em = (s: string) =>
    ctx.measureText(s).width / FONT_PX +
    TRACK * Math.max(0, Array.from(s).length - 1);
  const fm = ctx.measureText("Hgy");
  return {
    q: questions.map(em),
    splits: questions.map((q) => {
      const words = q.split(" ");
      const out: Split[] = [];
      for (let i = 1; i < words.length; i++) {
        const head = words.slice(0, i).join(" ");
        const tail = words.slice(i).join(" ");
        out.push({ head, tail, hw: em(head), tw: em(tail) });
      }
      return out;
    }),
    a: em(answer),
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    cap: ctx.measureText("H").actualBoundingBoxAscent / FONT_PX,
  };
}

function useMetrics(questions: string[], answer: string, fontFamily: string) {
  const key = `${fontFamily}\u0003${answer}\u0001${questions.join("\u0002")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("yes-run: measuring"));
  const released = useRef(false);
  const input = useRef({ questions, answer });
  input.current = { questions, answer };
  useEffect(() => {
    let live = true;
    Promise.all([
      unbounded.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(input.current.questions, input.current.answer, fontFamily),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.m : null;
}

interface Row {
  text: string;
  w: number;
  yes: boolean;
}

interface Exchange {
  start: number;
  push: number;
  yesAt: number;
  yesLen: number;
  size: number;
  rows: Row[];
  h: number;
}

function chooseRows(
  q: string,
  qw: number,
  splits: Split[],
  bw: number,
  measureW: number,
  fMax: number,
  inlineBias: number,
): { rows: Row[]; size: number } {
  const fitOf = (rows: Row[]) =>
    Math.min(
      fMax,
      measureW /
        Math.max(
          ...rows.map((r) => r.w + (r.yes ? (r.w > 0 ? GAP : 0) + bw : 0)),
        ),
    );
  const inline: Row[] = [{ text: q, w: qw, yes: true }];
  const options: Row[][] = [
    inline,
    [
      { text: q, w: qw, yes: false },
      { text: "", w: 0, yes: true },
    ],
  ];
  for (const s of splits) {
    options.push([
      { text: s.head, w: s.hw, yes: false },
      { text: s.tail, w: s.tw, yes: true },
    ]);
  }
  const inlineFit = fitOf(inline);
  let best = inline;
  let bestFit = inlineFit;
  for (const o of options) {
    const f = fitOf(o);
    if (f > bestFit) {
      best = o;
      bestFit = f;
    }
  }
  if (inlineFit >= bestFit * inlineBias)
    return { rows: inline, size: inlineFit };
  return { rows: best, size: bestFit };
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

export function YesRun({
  questions = DEFAULT_QUESTIONS,
  answer = "Yes.",
  accent,
  ink,
  background,
  fontFamily = unbounded.fontFamily,
  dwell: firstDwell = FIRST_DWELL,
  hold = LAST_MIN,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: YesRunProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const dark = theme === "dark";
  const field = dark ? (accent ?? "#FF5A1F") : "#FFFFFF";
  const stage =
    background === "transparent" ? "transparent" : (background ?? field);
  const fg = ink ?? "#000000";
  const block = dark ? fg : (accent ?? "#E8480F");
  const blockInk = dark ? field : "#FFFFFF";

  const qs = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
  const m = useMetrics(qs, answer, fontFamily);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = qs.length;
  const total = Math.max(0, durationInFrames - delay) * speed;
  const natural = Array.from({ length: n - 1 }, (_, k) =>
    Math.max(MIN_DWELL, firstDwell * RATIO ** k),
  );
  const sum = natural.reduce((s, d) => s + d, 0);
  const fit = sum > 0 ? Math.min(1, (total - hold) / sum) : 1;
  const dwells = natural.map((d) => Math.max(7, Math.round(d * fit)));

  const portrait = H > W * 1.1;
  const fMax = Math.min(
    H * (portrait ? 0.1 : 0.22),
    W * (portrait ? 0.16 : 0.13),
  );
  const measureW = W * (portrait ? 0.84 : 0.86);
  const bwEm = m.a + PAD_X * 2;

  const exchanges: Exchange[] = [];
  let at = 0;
  for (let k = 0; k < n; k++) {
    const last = k === n - 1;
    const dwell = last ? total - at : dwells[k];
    const push = last
      ? LAST_PUSH
      : Math.max(4, Math.min(9, Math.round(dwell * 0.4)));
    const yesAt = last
      ? push + 5
      : push + Math.round((dwell - push) * (k === 0 ? 0.3 : 0.18));
    const yesLen = last
      ? 8
      : Math.max(3, Math.min(6, Math.round(dwell * 0.22)));
    const { rows, size } = chooseRows(
      qs[k],
      m.q[k],
      m.splits[k],
      bwEm,
      measureW,
      fMax,
      portrait ? 0.82 : 0.6,
    );
    const h = (rows.length * LINE + (rows.length - 1) * ROW_GAP) * size;
    exchanges.push({ start: at, push, yesAt, yesLen, size, rows, h });
    at += dwell;
  }

  let cur = 0;
  for (let k = 0; k < n; k++) if (t >= exchanges[k].start) cur = k;
  const e = exchanges[cur];
  const prev = cur > 0 ? exchanges[cur - 1] : null;
  const p = interpolate(t, [e.start - 2, e.start + e.push], [0, 1], {
    ...CLAMP,
    easing: EASE_PUSH,
  });

  const cy = H / 2;
  const gapV = Math.max(e.size, prev?.size ?? 0) * 0.5;
  const dist = prev ? (prev.h + e.h) / 2 + gapV : e.h + gapV;
  const winH = prev ? prev.h + (e.h - prev.h) * p : e.h;

  // Layout rounds a baseline and a box edge to whole pixels, so an exchange
  // pushed by `top` and an answer block slid by `left` stepped in uneven
  // pixels. Each is laid out where it rests and the travel is a transform.
  const pushing = p > 0 && p < 1;
  const renderExchange = (x: Exchange, dy: number, reveal: number) => {
    const F = x.size;
    const blockW = bwEm * F;
    const lineBox = LINE * F;
    const baseOff = (lineBox - (m.asc + m.desc) * F) / 2 + m.asc * F;
    const blockTop = -(m.cap + 0.24) * F;
    const blockH = (m.cap + 0.24 + 0.3) * F;
    const text = (
      s: string,
      left: number,
      baseline: number,
      color: string,
      key: string,
    ) => (
      <div
        key={key}
        style={{
          position: "absolute",
          left,
          top: baseline - baseOff,
          height: lineBox,
          lineHeight: `${lineBox}px`,
          fontFamily,
          fontWeight: WGHT,
          fontSize: F,
          letterSpacing: `${TRACK}em`,
          whiteSpace: "pre",
          color,
        }}
      >
        {s}
      </div>
    );

    const top = cy - x.h / 2;
    const out: React.ReactNode[] = [];
    x.rows.forEach((row, i) => {
      const base = top + i * (LINE + ROW_GAP) * F + baseOff;
      const qW = row.w * F;
      if (!row.yes) {
        out.push(text(row.text, W / 2 - qW / 2, base, fg, `r${i}`));
        return;
      }
      const alone = row.w === 0;
      const lineW = alone ? blockW : qW + (GAP * F + blockW) * reveal;
      const left = W / 2 - lineW / 2;
      if (!alone) out.push(text(row.text, left, base, fg, `r${i}`));
      if (reveal <= 0) return;
      const bLeft = alone ? left : left + qW + GAP * F;
      const side = (1 - reveal) * 50;
      const clip = alone
        ? `inset(0 ${side.toFixed(2)}% 0 ${side.toFixed(2)}%)`
        : `inset(0 ${((1 - reveal) * 100).toFixed(2)}% 0 0)`;
      const nudge = alone ? 0 : (1 - reveal) * F * 0.12;
      const restW = alone ? blockW : qW + (GAP * F + blockW) * 1;
      const restLeft = W / 2 - restW / 2;
      const bRest = alone ? restLeft : restLeft + qW + GAP * F;
      const shift = bLeft - nudge - bRest;
      out.push(
        <div
          key={`b${i}`}
          style={{
            position: "absolute",
            left: bRest,
            top: base + blockTop,
            transform:
              Math.abs(shift) < 1e-3 ? undefined : `translateX(${shift}px)`,
            width: blockW,
            height: blockH,
            clipPath: clip,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: block,
              borderRadius: F * 0.08,
            }}
          />
          {text(answer, PAD_X * F, -blockTop, blockInk, "a")}
        </div>,
      );
    });
    return (
      <div
        key={x.start}
        style={{
          position: "absolute",
          inset: 0,
          // Kept at rest too: an exchange handed back to plain layout when
          // the push ends would jump to the nearest whole pixel.
          transform: `translateY(${Math.abs(dy) < 1e-3 ? 0 : dy}px)${glide(pushing)}`,
        }}
      >
        {out}
      </div>
    );
  };

  const reveal = interpolate(
    t,
    [e.start + e.yesAt, e.start + e.yesAt + e.yesLen],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );

  const nodes: React.ReactNode[] = [];
  if (prev && p < 1) nodes.push(renderExchange(prev, -dist * p, 1));
  nodes.push(renderExchange(e, dist * (1 - p), reveal));

  const padTop = Math.max(e.size, prev?.size ?? 0) * 0.08;
  const padBottom = Math.max(e.size, prev?.size ?? 0) * 0.14;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(${(cy - winH / 2 - padTop).toFixed(1)}px 0 ${(H - cy - winH / 2 - padBottom).toFixed(1)}px 0)`,
          }}
        >
          {nodes}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
