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

export interface NoButsExchange {
  objection: string;
  reply: string;
}

export interface NoButsProps {
  exchanges?: NoButsExchange[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_EXCHANGES: NoButsExchange[] = [
  {
    objection: "But I’m not a motion designer.",
    reply: "You don’t need to be.",
  },
  { objection: "But I’m busy.", reply: "It takes one lunch." },
  { objection: "But…", reply: "Go on. We’ll wait." },
];

const THEMES = {
  dark: {
    bg: "#1C1C1E",
    ink: "#FFFFFF",
    muted: "#A9A9AE",
    accent: "#FFE14D",
  },
  light: {
    bg: "#FFFBEA",
    ink: "#17150F",
    muted: "#6E6857",
    accent: "#9A7A00",
  },
} as const;

const TRACK = -0.025;
const LH = 1.08;
const OBJ_WORD = 3;
const REPLY_WORD = 2.5;
const RISE = 13;
const EXIT = 10;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
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
  const [handle] = useState(() => delayRender("no-buts: measuring"));
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
  text: string;
  x: number;
  line: number;
}

function layout(
  words: string[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
  align: "left" | "right",
) {
  const ws = words.map(adv);
  const lines = breakLines(ws, space, maxEm);
  const placed: Placed[] = [];
  let widest = 0;
  lines.forEach((idx, line) => {
    let lw = 0;
    idx.forEach((k, m) => {
      lw += ws[k] + (m > 0 ? space : 0);
    });
    widest = Math.max(widest, lw);
    let x = align === "right" ? -lw : 0;
    idx.forEach((k, m) => {
      if (m > 0) x += space;
      placed.push({ text: words[k], x, line });
      x += ws[k];
    });
  });
  return { placed, lines: lines.length, widest };
}

export function NoButs({
  exchanges = DEFAULT_EXCHANGES,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: NoButsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = exchanges.length > 0 ? exchanges : DEFAULT_EXCHANGES;
  const objWords = list.map((e) => e.objection.trim().split(/\s+/));
  const replyWords = list.map((e) => e.reply.trim().split(/\s+/));
  const specs = Array.from(
    new Set([
      "400| ",
      "500| ",
      ...objWords.flat().map((s) => `400|${s}`),
      ...replyWords.flat().map((s) => `500|${s}`),
    ]),
  );
  const w = useWidths(specs);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const advO = (s: string) =>
    (w[`400|${s}`] ?? 0) + TRACK * Array.from(s).length;
  const advR = (s: string) =>
    (w[`500|${s}`] ?? 0) + TRACK * Array.from(s).length;
  const spaceO = (w["400| "] ?? 0.25) + 0.04;
  const spaceR = (w["500| "] ?? 0.25) + 0.04;

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.09 : 0.1);
  const objMax = W * (portrait ? 0.8 : 0.56);
  const replyMax = W * (portrait ? 0.84 : 0.72);
  const objLinesMax = portrait ? 4 : 3;
  const replyLinesMax = portrait ? 3 : 2;

  let Fo = portrait ? W * 0.09 : H * 0.095;
  let objLays = objWords.map((ws) =>
    layout(ws, advO, spaceO, objMax / Fo, "right"),
  );
  for (let k = 0; k < 60; k++) {
    if (Math.max(...objLays.map((l) => l.lines)) <= objLinesMax) break;
    Fo *= 0.96;
    objLays = objWords.map((ws) =>
      layout(ws, advO, spaceO, objMax / Fo, "right"),
    );
  }

  let Fr = portrait ? W * 0.13 : H * 0.16;
  let replyLays = replyWords.map((ws) =>
    layout(ws, advR, spaceR, replyMax / Fr, "left"),
  );
  for (let k = 0; k < 60; k++) {
    if (Math.max(...replyLays.map((l) => l.lines)) <= replyLinesMax) break;
    Fr *= 0.96;
    replyLays = replyWords.map((ws) =>
      layout(ws, advR, spaceR, replyMax / Fr, "left"),
    );
  }

  const objStart: number[] = [];
  const replyStart: number[] = [];
  const replyDone: number[] = [];
  let clock = 6;
  list.forEach((_, i) => {
    objStart.push(clock);
    const nO = objWords[i].length;
    clock += nO * OBJ_WORD + RISE;
    clock += nO <= 1 ? 22 : 4;
    replyStart.push(clock);
    clock += replyWords[i].length * REPLY_WORD + RISE;
    replyDone.push(clock);
    clock += i < list.length - 1 ? 26 : 0;
  });
  const room = Math.max(1, T - Math.max(30, T * 0.18));
  const k = clock > room ? room / clock : 1;

  const lineO = Fo * LH;
  const lineR = Fr * LH;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: hubot.fontFamily,
      }}
    >
      {list.map((_, i) => {
        const last = i === list.length - 1;
        const leaveAt = last ? 1e9 : (objStart[i + 1] - EXIT - 2) * k;
        const leave = interpolate(t, [leaveAt, leaveAt + EXIT * k], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });
        if (t < objStart[i] * k - 1 || leave >= 1) return null;
        const oLay = objLays[i];
        const rLay = replyLays[i];
        const rTop = H - my - rLay.lines * lineR;
        const replyColor = last ? hi : c.ink;
        return (
          <div
            key={`x${i}`}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1 - leave,
              transform: `translate(${(-leave * W * 0.025).toFixed(2)}px, ${(-leave * H * 0.05).toFixed(2)}px)`,
            }}
          >
            {oLay.placed.map((p, j) => {
              const at = (objStart[i] + j * OBJ_WORD) * k;
              const e = interpolate(t, [at, at + RISE], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <div
                  key={`o${j}`}
                  style={{
                    position: "absolute",
                    left: W - mx + p.x * Fo,
                    top: my + p.line * lineO,
                    fontSize: Fo,
                    lineHeight: `${lineO}px`,
                    fontWeight: 400,
                    letterSpacing: `${TRACK}em`,
                    whiteSpace: "pre",
                    color: c.muted,
                    opacity: e,
                    transform: `translateY(${((1 - e) * Fo * 0.3).toFixed(2)}px)`,
                  }}
                >
                  {p.text}
                </div>
              );
            })}
            {rLay.placed.map((p, j) => {
              const at = (replyStart[i] + j * REPLY_WORD) * k;
              const e = interpolate(t, [at, at + RISE], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <div
                  key={`r${j}`}
                  style={{
                    position: "absolute",
                    left: mx + p.x * Fr,
                    top: rTop + p.line * lineR,
                    fontSize: Fr,
                    lineHeight: `${lineR}px`,
                    fontWeight: 500,
                    letterSpacing: `${TRACK}em`,
                    whiteSpace: "pre",
                    color: replyColor,
                    opacity: e,
                    transform: `translateY(${((1 - e) * Fr * 0.22).toFixed(2)}px)`,
                  }}
                >
                  {p.text}
                </div>
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
