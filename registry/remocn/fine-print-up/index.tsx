"use client";

import { loadFont } from "@remotion/google-fonts/Gloock";
import type React from "react";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const gloock = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface FinePrintUpProps {
  lines?: string[];
  closing?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_LINES = [
  "Every component you install is a file you own.",
  "Use it in paid client work. It’s MIT.",
  "No account and no watermark. Ever.",
];

const THEMES = {
  dark: {
    bg: "#0A1230",
    ink: "#FFFFFF",
    muted: "rgba(255,255,255,0.58)",
    accent: "#FF4436",
  },
  light: {
    bg: "#F7F3EC",
    ink: "#14161F",
    muted: "rgba(20,22,31,0.6)",
    accent: "#D92B1E",
  },
} as const;

const TRACK = -0.02;
const LH = 1.08;
const FINE_LH = 1.3;
const START = 10;
const TRAVEL = 26;
const TAIL = 76;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return s.length * 0.5;
  measureCtx.font = `400 100px "${gloock.fontFamily}"`;
  return measureCtx.measureText(s).width / 100 + TRACK * Array.from(s).length;
}

function useFontReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fine-print-up: font"));
  useEffect(() => {
    let live = true;
    gloock
      .waitUntilDone()
      .then(() => document.fonts.load(`400 100px "${gloock.fontFamily}"`))
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(true);
        continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
}

interface Laid {
  words: { text: string; x: number; line: number }[];
  lines: number;
}

function wrapAt(words: string[], maxEm: number, indent = 0): Laid {
  const space = em(" ");
  const out: { text: string; x: number; line: number }[] = [];
  let line = 0;
  let x = indent;
  for (const w of words) {
    const ww = em(w);
    if (x > indent && x + ww > maxEm) {
      line += 1;
      x = indent;
    }
    out.push({ text: w, x, line });
    x += ww + space;
  }
  return { words: out, lines: line + 1 };
}

function balanced(words: string[], maxEm: number): Laid {
  const base = wrapAt(words, maxEm);
  let lo = Math.max(...words.map(em), 0.1);
  let hi = maxEm;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (wrapAt(words, mid).lines <= base.lines) hi = mid;
    else lo = mid;
  }
  return wrapAt(words, hi);
}

function fitSize(words: string[], boxW: number, boxH: number, maxF: number) {
  const widest = Math.max(...words.map(em), 0.1);
  let lo = 8;
  let hi = maxF;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const lay = wrapAt(words, boxW / mid);
    if (lay.lines * LH * mid <= boxH && widest * mid <= boxW) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function FinePrintUp({
  lines = DEFAULT_LINES,
  closing = "That’s all the fine print.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: FinePrintUpProps) {
  const frame = useCurrentFrame();
  const t = frame * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontReady();

  if (!ready || lines.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = lines.length;
  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.07);
  const headTop = H * (portrait ? 0.1 : 0.11);
  const boxW = W * (portrait ? 0.84 : 0.78);
  const boxH = H * (portrait ? 0.42 : 0.56);
  const fs = H * (portrait ? 0.017 : 0.028);
  const fineW = W * (portrait ? 0.62 : 0.34);
  const fineX = W - mx - fineW;
  const fineBottom = H - H * (portrait ? 0.07 : 0.09);

  const words = lines.map((l) => l.split(/\s+/).filter(Boolean));
  const marks = lines.map((_, i) => "*".repeat(i + 1));
  const markW = em("***") + em(" ") * 0.6;
  const fineLays = words.map((ws) => wrapAt(ws, fineW / fs - markW));
  const fineHeights = fineLays.map((l) => l.lines * FINE_LH * fs);
  const fineGap = fs * 0.7;
  const fineTotal =
    fineHeights.reduce((a, b) => a + b, 0) + fineGap * Math.max(0, n - 1);
  const fineTops: number[] = [];
  let acc = fineBottom - fineTotal;
  for (let i = 0; i < n; i++) {
    fineTops.push(acc);
    acc += fineHeights[i] + fineGap;
  }

  const heads = words.map((ws) => {
    const F = fitSize(ws, boxW, boxH, H * (portrait ? 0.1 : 0.15));
    return { F, lay: balanced(ws, boxW / F) };
  });

  const D = durationInFrames * speed;
  const per = Math.max(50, (D - START - TAIL) / n);
  const stepAt = (i: number) => START + i * per;
  const closeAt = stepAt(n - 1) + TRAVEL + 26;

  const intro = interpolate(t, [0, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const nodes: React.ReactNode[] = [];
  const text = (
    key: string,
    s: string,
    x: number,
    y: number,
    size: number,
    renderSize: number,
    lh: number,
    color: string,
    opacity: number,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        fontFamily: gloock.fontFamily,
        fontWeight: 400,
        fontSize: renderSize,
        lineHeight: `${lh * renderSize}px`,
        letterSpacing: `${TRACK}em`,
        whiteSpace: "pre",
        color,
        opacity,
        transformOrigin: "0 0",
        transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(size / renderSize).toFixed(4)})`,
      }}
    >
      {s}
    </div>
  );

  lines.forEach((_, i) => {
    const s0 = stepAt(i);
    const u = t - s0;
    const { F, lay } = heads[i];
    const fl = fineLays[i];
    const pick = interpolate(u, [-2, 6], [0, 1], CLAMP);
    const exit =
      i < n - 1
        ? interpolate(t, [stepAt(i + 1), stepAt(i + 1) + 12], [0, 1], {
            ...CLAMP,
            easing: Easing.bezier(0.55, 0, 1, 0.45),
          })
        : 0;
    if (exit >= 1) return;

    const markOp = interpolate(u, [4, 14], [1, 0], CLAMP) * intro;
    if (markOp > 0) {
      nodes.push(
        text(
          `m${i}`,
          marks[i],
          fineX,
          fineTops[i],
          fs,
          fs,
          FINE_LH,
          interpolateColors(pick, [0, 1], [c.muted, hi]),
          markOp,
        ),
      );
    }

    const count = lay.words.length;
    const stagger = Math.min(1.4, 12 / Math.max(1, count));
    lay.words.forEach((hw, wi) => {
      const fw = fl.words[wi];
      const fx = fineX + (markW + fw.x) * fs;
      const fy = fineTops[i] + fw.line * FINE_LH * fs;
      const hx = mx + hw.x * F;
      const hy = headTop + hw.line * LH * F;
      const move = interpolate(
        u,
        [6 + wi * stagger, 6 + wi * stagger + TRAVEL],
        [0, 1],
        { ...CLAMP, easing: EASE_IO },
      );
      const fyScaled = fy + (FINE_LH - LH) * fs * 0.5;
      const x = fx + (hx - fx) * move;
      const y = fyScaled + (hy - fyScaled) * move - exit * F * 0.18;
      const size = fs + (F - fs) * move;
      const land = interpolate(move, [0.7, 1], [0, 1], CLAMP);
      const flyColor = interpolateColors(pick, [0, 1], [c.muted, hi]);
      const baseColor = interpolateColors(land, [0, 1], [flyColor, c.ink]);
      nodes.push(
        text(
          `w${i}-${wi}`,
          hw.text,
          x,
          y,
          size,
          F,
          LH,
          baseColor,
          intro * (1 - exit),
        ),
      );
    });
  });

  const closeIn = interpolate(t, [closeAt, closeAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  if (closeIn > 0 && closing) {
    const cl = wrapAt(closing.split(/\s+/), fineW / fs);
    const ch = cl.lines * FINE_LH * fs;
    cl.words.forEach((w, wi) => {
      nodes.push(
        text(
          `c${wi}`,
          w.text,
          fineX + w.x * fs,
          fineBottom - ch + w.line * FINE_LH * fs + (1 - closeIn) * fs * 0.6,
          fs,
          fs,
          FINE_LH,
          c.muted,
          closeIn,
        ),
      );
    });
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
