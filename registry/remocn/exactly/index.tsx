"use client";

import { loadFont } from "@remotion/google-fonts/HubotSans";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const hubot = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ExactlyRound {
  objection: string;
  reply: string;
}

export interface ExactlyProps {
  rounds?: ExactlyRound[];
  accent?: string;
  /** Text color of the answered objection; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Hubot Sans by default. */
  fontFamily?: string;
  /** Frames between words as an objection builds. */
  stagger?: number;
  /** Frames an answered round holds before the next one starts. */
  hold?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_ROUNDS: ExactlyRound[] = [
  { objection: "There’s nothing to click.", reply: "Good." },
  { objection: "It’s just code.", reply: "Exactly." },
];

const THEMES = {
  dark: {
    bg: "#1C1C1E",
    ink: "#FFFFFF",
    muted: "#9E9EA3",
    accent: "#FFE14D",
  },
  light: {
    bg: "#FFFBEA",
    ink: "#17150F",
    muted: "#7A7363",
    accent: "#9A7A00",
  },
} as const;

const TRACK = -0.03;
const LH = 1.06;
const WORD = 3;
const RISE = 13;
const DROP = 14;
const REFLOW = 20;
const EXIT = 12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.85, 0.35);

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;
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

function useWidths(specs: string[], fontFamily: string) {
  const key = `${fontFamily}\u0002${specs.join("\u0001")}`;
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("exactly: measuring"));
  const released = useRef(false);
  const ref = useRef(specs);
  ref.current = specs;
  useEffect(() => {
    let live = true;
    Promise.all([
      hubot.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`),
      document.fonts.load(`500 100px "${fontFamily}"`),
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
          if (ctx) ctx.font = `${weight} 100px "${fontFamily}"`;
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
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.w : null;
}

interface Placed {
  x: number;
  y: number;
}

function centred(ws: number[], space: number, maxEm: number) {
  const lines = breakLines(ws, space, maxEm);
  const placed: Placed[] = new Array(ws.length);
  let widest = 0;
  const lineWidths: number[] = [];
  lines.forEach((idx, line) => {
    let lw = 0;
    idx.forEach((k, m) => {
      lw += ws[k] + (m > 0 ? space : 0);
    });
    lineWidths.push(lw);
    widest = Math.max(widest, lw);
    let x = -lw / 2;
    idx.forEach((k, m) => {
      if (m > 0) x += space;
      placed[k] = { x, y: line };
      x += ws[k];
    });
  });
  return { placed, lines: lines.length, widest, lineWidths };
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

export function Exactly({
  rounds = DEFAULT_ROUNDS,
  accent,
  ink,
  background,
  fontFamily = hubot.fontFamily,
  stagger = WORD,
  hold = 30,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: ExactlyProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames: T } = useSceneConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = rounds.length > 0 ? rounds : DEFAULT_ROUNDS;
  const objs = list.map((r) => r.objection.trim().split(/\s+/));
  const replies = list.map((r) => r.reply.trim());
  const specs = Array.from(
    new Set([
      "500| ",
      "500|“",
      "500|”",
      ...objs.flat().map((s) => `500|${s}`),
      ...replies.map((s) => `500|${s}`),
    ]),
  );
  const w = useWidths(specs, fontFamily);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string) =>
    (w[`500|${s}`] ?? 0) + TRACK * Array.from(s).length;
  const space = (w["500| "] ?? 0.25) + 0.04;
  const openW = adv("“");
  const closeW = adv("”");

  const portrait = H > W * 1.1;
  const maxW = W * 0.84;
  const maxLines = portrait ? 5 : 2;
  const maxH = H * (portrait ? 0.46 : 0.5);

  const build = (F: number) =>
    list.map((_, i) => {
      const ows = objs[i].map(adv);
      const rw = adv(replies[i]);
      const full = maxW / F;
      const inline = full - rw - space;
      const own = inline < Math.max(...ows) * 1.15;
      const a = centred(ows, space, own ? full - openW - closeW : inline);
      const shift = own ? 0 : (rw + space) / 2;
      const b = a.placed.map((p) => ({
        x: p.y === 0 ? p.x + shift : p.x,
        y: own ? p.y + 1 : p.y,
      }));
      const replyX = own ? -rw / 2 : -(a.lineWidths[0] + rw + space) / 2;
      const bLines = own ? a.lines + 1 : a.lines;
      const bWidest = own
        ? Math.max(a.widest, rw)
        : Math.max(a.widest, a.lineWidths[0] + rw + space);
      return { a, b, own, replyX, bLines, bWidest };
    });

  let F = portrait ? W * 0.13 : H * 0.15;
  let lays = build(F);
  for (let k = 0; k < 80; k++) {
    const ok = lays.every(
      (l) =>
        l.bLines <= maxLines &&
        (l.a.widest + openW + closeW) * F <= maxW + 0.5 &&
        l.bWidest * F <= maxW + 0.5 &&
        l.bLines * LH * F <= maxH,
    );
    if (ok) break;
    F *= 0.97;
    lays = build(F);
  }
  const lineH = LH * F;

  const startAt: number[] = [];
  const dropAt: number[] = [];
  let clock = 4;
  list.forEach((_, i) => {
    startAt.push(clock);
    clock += objs[i].length * stagger + RISE + 16;
    dropAt.push(clock);
    clock += 6 + REFLOW;
    clock += i < list.length - 1 ? hold : 0;
  });
  const room = Math.max(1, T - Math.max(30, T * 0.2));
  const k = clock > room ? room / clock : 1;

  const textStyle = (size: number) => ({
    position: "absolute" as const,
    fontSize: size,
    lineHeight: `${lineH}px`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily,
        fontWeight: 500,
      }}
    >
      <ScaleLayer scale={scale}>
        {list.map((_, i) => {
          const last = i === list.length - 1;
          const leaveAt = last ? 1e9 : startAt[i + 1] * k - 4;
          const leave = interpolate(t, [leaveAt, leaveAt + EXIT], [0, 1], {
            ...CLAMP,
            easing: EASE_IN,
          });
          if (t < startAt[i] * k - 1 || leave >= 1) return null;
          const { a, b, own, replyX, bLines } = lays[i];
          const ayTop = H / 2 - (a.lines * lineH) / 2;
          const byTop = H / 2 - (bLines * lineH) / 2;
          const cx = W / 2;
          const d0 = dropAt[i] * k;
          const drop = interpolate(t, [d0, d0 + DROP * k], [0, 1], {
            ...CLAMP,
            easing: EASE_IN,
          });
          const r0 = (dropAt[i] + 6) * k;
          const flow = interpolate(t, [r0, r0 + REFLOW * k], [0, 1], {
            ...CLAMP,
            easing: EASE_IO,
          });
          const words = objs[i];
          const n = words.length;
          const lagOf = (j: number) =>
            Math.min(
              1,
              Math.max(0, flow * 1.15 - ((n - 1 - j) / Math.max(1, n)) * 0.15),
            );
          const posOf = (j: number) => {
            const l = lagOf(j);
            const pa = a.placed[j];
            const pb = b[j];
            return {
              x: cx + (pa.x + (pb.x - pa.x) * l) * F,
              y:
                ayTop +
                pa.y * lineH +
                (byTop + pb.y * lineH - (ayTop + pa.y * lineH)) * l,
            };
          };
          const inAt = (j: number) =>
            interpolate(
              t,
              [
                (startAt[i] + j * stagger) * k,
                (startAt[i] + j * stagger + RISE) * k,
              ],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
          const first = posOf(0);
          const lastPos = posOf(n - 1);
          const replyIn = interpolate(flow, [0.35, 0.9], [0, 1], CLAMP);
          const reply = own
            ? {
                x: cx + replyX * F,
                y: byTop - (1 - replyIn) * F * 0.2,
              }
            : {
                x: first.x - (space + adv(replies[i])) * F,
                y: first.y,
              };
          const leaving = midway(leave);
          const quote = (x: number, y: number, appear: number) => ({
            ...textStyle(F),
            left: x,
            top: y,
            color: c.muted,
            opacity: appear * Math.max(0, 1 - drop * 1.6),
            transform: `translateY(${(1 - appear) * F * 0.18 + drop * F * 0.45}px)${glide(!leaving && (midway(appear) || midway(drop)))}`,
          });
          return (
            <div
              key={`r${i}`}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 1 - leave,
                transform: `translateY(${-leave * H * 0.06}px)${glide(leaving)}`,
              }}
            >
              <div style={quote(first.x - openW * F, first.y, inAt(0))}>“</div>
              <div
                style={quote(
                  lastPos.x + adv(words[n - 1]) * F,
                  lastPos.y,
                  inAt(n - 1),
                )}
              >
                ”
              </div>
              <div
                style={{
                  ...textStyle(F),
                  left: reply.x,
                  top: reply.y,
                  color: hi,
                  opacity: replyIn,
                }}
              >
                {replies[i]}
              </div>
              {words.map((word, j) => {
                const e = inAt(j);
                const p = posOf(j);
                return (
                  <div
                    key={`w${j}`}
                    style={{
                      ...textStyle(F),
                      left: p.x,
                      top: p.y,
                      color: interpolateColors(flow, [0, 1], [c.muted, fg]),
                      opacity: e,
                      transform: `translateY(${(1 - e) * F * 0.18}px)${glide(!leaving && midway(e))}`,
                    }}
                  >
                    {word}
                  </div>
                );
              })}
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
