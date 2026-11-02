"use client";

import { loadFont } from "@remotion/google-fonts/YoungSerif";
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

const serif = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface OverheardLine {
  quote: string;
  name: string;
}

export interface OverheardProps {
  lines?: OverheardLine[];
  highlight?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_LINES: OverheardLine[] = [
  { quote: "Who made our launch video?", name: "Mia Okafor, CEO" },
  { quote: "I did. It’s in the repo.", name: "Leo Marsh, engineer" },
];

const THEMES = {
  dark: { bg: "#101828", ink: "#BFE3FF", accent: "#F6C453" },
  light: { bg: "#CFE8FF", ink: "#101828", accent: "#A66E00" },
} as const;

const TRACK = -0.02;
const LH = 1.1;
const WORD = 4;
const PAUSE = 10;
const BETWEEN = 26;
const RISE = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Word {
  text: string;
  hot: boolean;
}

function stripQuotes(s: string) {
  return s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
}

function wordsOf(quote: string, highlight: string): Word[] {
  const body = stripQuotes(quote);
  const at = highlight ? body.indexOf(highlight) : -1;
  const parts = body.split(" ").filter(Boolean);
  let cursor = 0;
  return parts.map((part, i) => {
    const s = body.indexOf(part, cursor);
    const e = s + part.length;
    cursor = e;
    let text = part;
    if (i === 0) text = `“${text}`;
    if (i === parts.length - 1) text = `${text}”`;
    return { text, hot: at >= 0 && s < at + highlight.length && e > at };
  });
}

function place(
  words: Word[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const pos: { x: number; line: number }[] = [];
  const widths: number[] = [0];
  let line = 0;
  let x = 0;
  for (const wd of words) {
    const w = adv(wd.text);
    if (x > 0 && x + space + w > maxEm) {
      line++;
      widths.push(0);
      pos.push({ x: 0, line });
      x = w;
    } else {
      const gap = x === 0 ? 0 : space;
      pos.push({ x: x + gap, line });
      x += gap + w;
    }
    widths[line] = x;
  }
  return { pos, lines: line + 1, widths };
}

function wrap(
  toks: Word[],
  adv: (s: string) => number,
  space: number,
  maxEm: number,
) {
  const greedy = place(toks, adv, space, maxEm);
  const L = greedy.lines;
  if (L <= 1) return greedy;
  const n = toks.length;
  const ws = toks.map((tk) => adv(tk.text));
  const glued = (_k: number) => false;
  const lineW = (i: number, j: number) => {
    let x = 0;
    for (let k = i; k < j; k++) x += (k === i || glued(k) ? 0 : space) + ws[k];
    return x;
  };
  const avg = lineW(0, n) / L;
  const INF = 1e12;
  const dp = Array.from({ length: L + 1 }, () =>
    new Array<number>(n + 1).fill(INF),
  );
  const back = Array.from({ length: L + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  dp[0][0] = 0;
  for (let l = 1; l <= L; l++) {
    for (let j = 1; j <= n; j++) {
      if (j < n && glued(j)) continue;
      for (let i = l - 1; i < j; i++) {
        if (dp[l - 1][i] >= INF) continue;
        const lw = lineW(i, j);
        if (lw > maxEm + 1e-6) continue;
        let cost = (lw - avg) ** 2;
        if (j < n) {
          const end = toks[j - 1].text;
          if (/[.?!…]["”’]?$/.test(end)) cost -= avg * avg * 0.5;
          else if (/[,;:—–]["”’]?$/.test(end)) cost -= avg * avg * 0.15;
        }
        if (dp[l - 1][i] + cost < dp[l][j]) {
          dp[l][j] = dp[l - 1][i] + cost;
          back[l][j] = i;
        }
      }
    }
  }
  if (dp[L][n] >= INF) return greedy;
  const starts: number[] = [];
  let j = n;
  for (let l = L; l > 0; l--) {
    const i = back[l][j];
    starts.unshift(i);
    j = i;
  }
  const pos: { x: number; line: number }[] = [];
  const widths: number[] = [];
  starts.forEach((s, l) => {
    const e = l + 1 < starts.length ? starts[l + 1] : n;
    let x = 0;
    for (let k = s; k < e; k++) {
      const gap = k === s || glued(k) ? 0 : space;
      pos.push({ x: x + gap, line: l });
      x += gap + ws[k];
    }
    widths.push(x);
  });
  return { pos, lines: L, widths };
}

function useWidths(strings: string[]) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("overheard: measuring"));
  const released = useRef(false);
  const ref = useRef(strings);
  ref.current = strings;
  useEffect(() => {
    let live = true;
    Promise.all([
      serif.waitUntilDone(),
      document.fonts.load(`400 100px "${serif.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        if (ctx) ctx.font = `400 100px "${serif.fontFamily}"`;
        for (const s of ref.current) {
          w[s] = ctx ? ctx.measureText(s).width / 100 : s.length * 0.5;
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

export function Overheard({
  lines = DEFAULT_LINES,
  highlight = "It’s in the repo.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: OverheardProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = lines.length > 0 ? lines : DEFAULT_LINES;
  const n = list.length;
  const voices = list.map((l, i) =>
    wordsOf(l.quote, i === n - 1 ? highlight : ""),
  );
  const strings = Array.from(
    new Set([
      " ",
      ...voices.flatMap((v) => v.map((wd) => wd.text)),
      ...list.map((l) => `— ${l.name}`),
    ]),
  );
  const w = useWidths(strings);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (s: string) => (w[s] ?? 0) + TRACK * Array.from(s).length;
  const space = w[" "] ?? 0.25;

  const portrait = H > W * 1.1;
  const unit = Math.min(W, H);
  const marginX = W * (portrait ? 0.09 : 0.085);
  const marginY = H * (portrait ? 0.1 : 0.1);
  const measure = W * (portrait ? 0.82 : 0.6);
  const maxLines = portrait ? 4 : 2;
  const nameRatio = 0.36;
  const nameGap = 0.35;

  const blockH = (lineCount: number, F: number) =>
    lineCount * LH * F + F * (nameGap + nameRatio * 1.3);
  let F = portrait ? W * 0.12 : H * 0.13;
  let lays = voices.map((v) => wrap(v, adv, space, measure / F));
  for (let k = 0; k < 60; k++) {
    const most = Math.max(...lays.map((l) => l.lines));
    const total = lays.reduce((s, l) => s + blockH(l.lines, F), 0);
    const room = H - marginY * 2 - F * 0.4 * (n - 1);
    if (most <= maxLines && total <= room) break;
    F *= 0.96;
    lays = voices.map((v) => wrap(v, adv, space, measure / F));
  }
  const L = Math.max(16, Math.max(unit * 0.03, F * nameRatio));

  const natural: number[][] = [];
  const nameAt: number[] = [];
  const starts: number[] = [];
  let clock = 6;
  voices.forEach((v, i) => {
    starts.push(clock);
    const times: number[] = [];
    v.forEach((wd) => {
      times.push(clock);
      clock += WORD;
      if (/[.?!,…]”?$/.test(wd.text)) clock += PAUSE;
    });
    natural.push(times);
    nameAt.push(clock + 2);
    clock += i < n - 1 ? BETWEEN : 0;
  });
  const speechEnd = clock + RISE;
  const room = Math.max(1, T - Math.max(30, T * 0.2));
  const k = speechEnd > room ? room / speechEnd : 1;

  const heights = lays.map((l) => blockH(l.lines, F));
  const free = H - marginY * 2 - heights.reduce((s, h) => s + h, 0);
  const tops: number[] = [];
  let y = marginY;
  heights.forEach((h, i) => {
    tops.push(y);
    y += h + (n > 1 ? free / (n - 1) : 0);
    if (i === 0 && n === 1) tops[0] = (H - h) / 2;
  });

  const lineH = LH * F;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: serif.fontFamily,
        fontWeight: 400,
      }}
    >
      {voices.map((v, i) => {
        const right = i % 2 === 1;
        const lay = lays[i];
        const next = i < n - 1 ? starts[i + 1] * k : 1e6;
        const back = interpolate(t, [next, next + 16], [0, 1], {
          ...CLAMP,
          easing: EASE_IO,
        });
        const dim = 1 - back * 0.55;
        const nIn = interpolate(
          t,
          [nameAt[i] * k, nameAt[i] * k + 16],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        );
        const nameText = `— ${list[i].name}`;
        const nameW = adv(nameText) * L;
        const nameTop = tops[i] + lay.lines * lineH + F * nameGap;
        return (
          <div
            key={`v${i}`}
            style={{ position: "absolute", inset: 0, opacity: dim }}
          >
            {v.map((wd, j) => {
              const p = lay.pos[j];
              const lw = lay.widths[p.line];
              const x = right
                ? W - marginX - (lw - p.x) * F
                : marginX + p.x * F;
              const at = natural[i][j] * k;
              const e = interpolate(t, [at, at + RISE], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <div
                  key={`w${j}`}
                  style={{
                    position: "absolute",
                    left: x,
                    top: tops[i] + p.line * lineH,
                    height: lineH,
                    lineHeight: `${lineH}px`,
                    fontSize: F,
                    whiteSpace: "pre",
                    letterSpacing: `${TRACK}em`,
                    color: wd.hot ? hi : c.ink,
                    opacity: e,
                    transform: `translateY(${((1 - e) * F * 0.28).toFixed(2)}px)`,
                  }}
                >
                  {wd.text}
                </div>
              );
            })}
            <div
              style={{
                position: "absolute",
                left: right ? W - marginX - nameW : marginX,
                top: nameTop,
                fontSize: L,
                lineHeight: `${L * 1.3}px`,
                whiteSpace: "pre",
                letterSpacing: `${TRACK}em`,
                color: c.ink,
                opacity: nIn * 0.7,
                transform: `translateY(${((1 - nIn) * L * 0.6).toFixed(2)}px)`,
              }}
            >
              {nameText}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
