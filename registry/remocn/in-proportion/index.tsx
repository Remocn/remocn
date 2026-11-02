"use client";

import { loadFont } from "@remotion/google-fonts/HubotSans";
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

const hubot = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface InProportionPair {
  worry: string;
  answer: string;
}

export interface InProportionProps {
  pairs?: InProportionPair[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_PAIRS: InProportionPair[] = [
  { worry: "It’ll look homemade.", answer: "It’ll look like your app." },
  {
    worry: "I’ll get lost in keyframes.",
    answer: "You’ll write a component.",
  },
];

const THEMES = {
  dark: { bg: "#1C1C1E", ink: "#FFFFFF", accent: "#FFE14D" },
  light: { bg: "#FFFBEA", ink: "#17150F", accent: "#9A7A00" },
} as const;

const TRACK = -0.03;
const LH = 1.02;
const WORD = 3;
const RISE = 13;
const SHRINK = 24;
const EXIT = 12;
const NOTE_DIM = 0.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.85, 0.35);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function breakLines(ws: number[], space: number, maxEm: number) {
  const n = ws.length;
  if (n === 0) return [] as number[][];
  let count = 1;
  let x = 0;
  for (let i = 0; i < n; i++) {
    if (x > 0 && x + space + ws[i] > maxEm) {
      count++;
      x = ws[i];
    } else {
      x += (x > 0 ? space : 0) + ws[i];
    }
  }
  if (count === 1) return [ws.map((_, i) => i)];
  const lineW = (i: number, j: number) => {
    let s = 0;
    for (let k = i; k < j; k++) s += ws[k] + (k > i ? space : 0);
    return s;
  };
  const avg = lineW(0, n) / count;
  const INF = 1e12;
  const dp = Array.from({ length: count + 1 }, () =>
    new Array<number>(n + 1).fill(INF),
  );
  const back = Array.from({ length: count + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  dp[0][0] = 0;
  for (let l = 1; l <= count; l++) {
    for (let j = 1; j <= n; j++) {
      for (let i = l - 1; i < j; i++) {
        if (dp[l - 1][i] >= INF) continue;
        const lw = lineW(i, j);
        if (lw > maxEm + 1e-6 && j - i > 1) continue;
        const cost = (lw - avg) ** 2;
        if (dp[l - 1][i] + cost < dp[l][j]) {
          dp[l][j] = dp[l - 1][i] + cost;
          back[l][j] = i;
        }
      }
    }
  }
  if (dp[count][n] >= INF) return [ws.map((_, i) => i)];
  const starts: number[] = [];
  let j = n;
  for (let l = count; l > 0; l--) {
    const i = back[l][j];
    starts.unshift(i);
    j = i;
  }
  return starts.map((s, l) => {
    const e = l + 1 < starts.length ? starts[l + 1] : n;
    return Array.from({ length: e - s }, (_, k) => s + k);
  });
}

function useWidths(specs: string[]) {
  const key = specs.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("in-proportion: measuring"));
  const released = useRef(false);
  const ref = useRef(specs);
  ref.current = specs;
  useEffect(() => {
    let live = true;
    Promise.all([
      hubot.waitUntilDone(),
      document.fonts.load(`400 100px "${hubot.fontFamily}"`),
      document.fonts.load(`500 100px "${hubot.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        for (const spec of ref.current) {
          const cut = spec.indexOf("|");
          const weight = spec.slice(0, cut);
          const text = spec.slice(cut + 1);
          if (ctx) ctx.font = `${weight} 100px "${hubot.fontFamily}"`;
          w[spec] = ctx ? ctx.measureText(text).width / 100 : text.length * 0.5;
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
  }, [key, handle]);
  return state && state.key === key ? state.w : null;
}

interface Placed {
  x: number;
  line: number;
}

function layout(ws: number[], space: number, maxEm: number) {
  const lines = breakLines(ws, space, maxEm);
  const placed: Placed[] = [];
  let widest = 0;
  lines.forEach((idx, line) => {
    let x = 0;
    idx.forEach((k, m) => {
      if (m > 0) x += space;
      placed.push({ x, line });
      x += ws[k];
    });
    widest = Math.max(widest, x);
  });
  return { placed, lines: lines.length, widest };
}

export function InProportion({
  pairs = DEFAULT_PAIRS,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: InProportionProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = pairs.length > 0 ? pairs : DEFAULT_PAIRS;
  const worries = list.map((p) => p.worry.trim().split(/\s+/));
  const answers = list.map((p) => p.answer.trim().split(/\s+/));
  const specs = Array.from(
    new Set([
      "400| ",
      "500| ",
      ...worries.flat().map((s) => `500|${s}`),
      ...answers.flat().map((s) => `500|${s}`),
    ]),
  );
  const w = useWidths(specs);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string) =>
    (w[`500|${s}`] ?? 0) + TRACK * Array.from(s).length;
  const space = (w["500| "] ?? 0.25) + 0.04;

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const mx = W * (portrait ? 0.08 : 0.06);
  const my = H * (portrait ? 0.07 : 0.085);
  const regionW = W - mx * 2;

  const worryWs = worries.map((ws) => ws.map(adv));
  const answerWs = answers.map((ws) => ws.map(adv));

  const Fs0 = Math.max(15, unit * (portrait ? 0.045 : 0.044));
  const noteGap = Fs0 * 0.7;
  const maxLines = portrait ? 5 : 3;
  const bigLays: { lay: ReturnType<typeof layout>; F: number; y0: number }[] =
    [];
  let noteBottom = my;
  worryWs.forEach((ws, i) => {
    const top = i > 0 ? noteBottom + Fs0 * 1.2 : my;
    const regionH = H - my - top;
    let F = H * (portrait ? 0.2 : 0.3);
    let lay = layout(ws, space, regionW / F);
    for (let k = 0; k < 80; k++) {
      const fits =
        lay.widest * F <= regionW + 0.5 &&
        lay.lines * LH * F <= regionH &&
        lay.lines <= maxLines;
      if (fits) break;
      F *= 0.97;
      lay = layout(ws, space, regionW / F);
    }
    const blockH = lay.lines * LH * F;
    bigLays.push({ lay, F, y0: top + (regionH - blockH) / 2 });
    noteBottom += (i > 0 ? noteGap : 0) + lay.lines * LH * Fs0;
  });
  const noteMax = W * (portrait ? 0.6 : 0.36);
  const noteWidest = Math.max(...bigLays.map((b) => b.lay.widest));
  const Fs = Math.min(Fs0, noteMax / noteWidest);
  const noteLeft = W - mx - noteWidest * Fs;
  const noteTops: number[] = [];
  let nt = my;
  bigLays.forEach((b) => {
    noteTops.push(nt);
    nt += b.lay.lines * LH * Fs + noteGap;
  });

  const answerMax = W * (portrait ? 0.84 : 0.8);
  const answerLinesMax = portrait ? 3 : 2;
  let Fa = portrait ? W * 0.13 : H * 0.17;
  let answerLays = answerWs.map((ws) => layout(ws, space, answerMax / Fa));
  for (let k = 0; k < 60; k++) {
    const most = Math.max(...answerLays.map((l) => l.lines));
    const widest = Math.max(...answerLays.map((l) => l.widest));
    if (most <= answerLinesMax && widest * Fa <= answerMax + 0.5) break;
    Fa *= 0.96;
    answerLays = answerWs.map((ws) => layout(ws, space, answerMax / Fa));
  }

  const worryStart: number[] = [];
  const shrinkAt: number[] = [];
  const answerStart: number[] = [];
  let clock = 4;
  list.forEach((_, i) => {
    worryStart.push(clock);
    clock += worries[i].length * WORD + RISE + 16;
    shrinkAt.push(clock);
    answerStart.push(clock + 10);
    clock += 10 + answers[i].length * WORD + RISE;
    clock += i < list.length - 1 ? 24 : 0;
  });
  const room = Math.max(1, T - Math.max(30, T * 0.18));
  const k = clock > room ? room / clock : 1;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: hubot.fontFamily,
        fontWeight: 500,
      }}
    >
      {list.map((_, i) => {
        if (t < worryStart[i] * k - 1) return null;
        const big = bigLays[i];
        return worries[i].map((word, j) => {
          const at = (worryStart[i] + j * WORD) * k;
          const e = interpolate(t, [at, at + RISE], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const s0 = shrinkAt[i] * k;
          const p = interpolate(t, [s0, s0 + SHRINK * k], [0, 1], {
            ...CLAMP,
            easing: EASE_IO,
          });
          const bp = big.lay.placed[j];
          const bx = mx + bp.x * big.F;
          const by = big.y0 + bp.line * LH * big.F;
          const sx = noteLeft + bp.x * Fs;
          const sy = noteTops[i] + bp.line * LH * Fs;
          const size = big.F + (Fs - big.F) * p;
          const x = bx + (sx - bx) * p;
          const y = by + (sy - by) * p;
          return (
            <div
              key={`w${i}-${j}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                fontSize: size,
                lineHeight: `${size * LH}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color: c.ink,
                opacity: e * (1 - (1 - NOTE_DIM) * p),
                transform: `translateY(${((1 - e) * size * 0.18).toFixed(2)}px)`,
              }}
            >
              {word}
            </div>
          );
        });
      })}
      {list.map((_, i) => {
        const last = i === list.length - 1;
        const leaveAt = last ? 1e9 : worryStart[i + 1] * k - 2;
        const leave = interpolate(t, [leaveAt, leaveAt + EXIT], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });
        if (t < answerStart[i] * k - 1 || leave >= 1) return null;
        const lay = answerLays[i];
        const top = H - my - lay.lines * LH * Fa;
        return answers[i].map((word, j) => {
          const at = (answerStart[i] + j * WORD) * k;
          const e = interpolate(t, [at, at + RISE], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          const p = lay.placed[j];
          return (
            <div
              key={`a${i}-${j}`}
              style={{
                position: "absolute",
                left: mx + p.x * Fa,
                top: top + p.line * LH * Fa,
                fontSize: Fa,
                lineHeight: `${Fa * LH}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color: hi,
                opacity: e * (1 - leave),
                transform: `translateY(${((1 - e) * Fa * 0.22 + leave * H * 0.04).toFixed(2)}px)`,
              }}
            >
              {word}
            </div>
          );
        });
      })}
    </AbsoluteFill>
  );
}
