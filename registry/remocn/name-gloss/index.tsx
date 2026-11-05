"use client";

import { loadFont } from "@remotion/google-fonts/Geologica";
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

const geologica = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface NameGlossPart {
  word: string;
  gloss: string;
}

export interface NameGlossProps {
  parts?: NameGlossPart[];
  why?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0E3B43", ink: "#FFFFFF", accent: "#4FE3D0" },
  light: { bg: "#E8F6F5", ink: "#0B3138", accent: "#0F8C7E" },
} as const;

const DEFAULT_PARTS: NameGlossPart[] = [
  { word: "Brand", gloss: "Your colours, your type, your logo." },
  { word: "kit", gloss: "Packed into every scene you install." },
];
const DEFAULT_WHY = "So the film looks like yours from the first render.";

const FONT_PX = 200;
const NAME_W = 500;
const BODY_W = 400;
const NAME_TRACK = -0.04;
const BODY_TRACK = -0.015;
const BODY_LH = 1.2;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const NAME_IN = 18;
const NAME_HOLD = 14;
const MOVE = 24;
const WORD_STAGGER = 2;
const WORD_IN = 13;
const WHY_AFTER = 28;
const HOLD = 42;
const DIM = 0.38;

type Metrics = Record<string, number>;
const key = (w: number, s: string) => `${w}\u0002${s}`;

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("name-gloss: no 2d context");
  const out: Metrics = {};
  for (const weight of [NAME_W, BODY_W]) {
    ctx.font = `${weight} ${FONT_PX}px "${geologica.fontFamily}"`;
    for (const s of texts) {
      out[key(weight, s)] = ctx.measureText(s).width / FONT_PX;
    }
  }
  return out;
}

function useMetrics(texts: string[]) {
  const id = texts.join("\u0001");
  const [state, setState] = useState<{ id: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("name-gloss: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geologica.waitUntilDone(),
      document.fonts.load(`${NAME_W} 100px "${geologica.fontFamily}"`),
      document.fonts.load(`${BODY_W} 100px "${geologica.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ id, m: measureAll(id.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [id, handle]);
  return state && state.id === id ? state.m : null;
}

const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

function balanced(
  words: string[],
  width: (w: string) => number,
  space: number,
  limit: number,
) {
  const greedy = (lim: number) => {
    const lines: string[][] = [];
    let cur: string[] = [];
    let acc = 0;
    for (const w of words) {
      const ww = width(w);
      if (cur.length > 0 && acc + space + ww > lim) {
        lines.push(cur);
        cur = [w];
        acc = ww;
      } else {
        acc = cur.length > 0 ? acc + space + ww : ww;
        cur.push(w);
      }
    }
    if (cur.length > 0) lines.push(cur);
    return lines;
  };
  const count = greedy(limit).length;
  let lo = 0;
  let hi = limit;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(mid).length <= count) hi = mid;
    else lo = mid;
  }
  return greedy(hi);
}

interface Placed {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colW: number;
  gloss: string[][];
  glossTop: number;
}

export function NameGloss({
  parts = DEFAULT_PARTS,
  why = DEFAULT_WHY,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: NameGlossProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = parts.length > 0 ? parts : DEFAULT_PARTS;
  const m = useMetrics([
    " ",
    ...list.map((p) => p.word),
    ...list.flatMap((p) => splitWords(p.gloss)),
    ...splitWords(why),
  ]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const margin = W * (portrait ? 0.08 : 0.07);
  const avail = W - margin * 2;
  const gutter = W * (portrait ? 0.045 : 0.07);

  const nW = (s: string) =>
    m[key(NAME_W, s)] + NAME_TRACK * Array.from(s).length;
  const bW = (s: string) =>
    m[key(BODY_W, s)] + BODY_TRACK * Array.from(s).length;
  const wordEm = list.map((p) => nW(p.word));
  const nSpace = nW(" ");
  const bSpace = bW(" ");

  const span = durationInFrames * speed;
  const glossStart = NAME_IN + NAME_HOLD + MOVE - 6;
  const fixed = glossStart + WHY_AFTER + 24 + HOLD;
  const glossGap =
    n > 1 ? Math.min(44, Math.max(18, (span - fixed) / (n - 1))) : 0;
  const glossAt = (i: number) => glossStart + i * glossGap;
  const whyAt = glossAt(n - 1) + WHY_AFTER;
  const moveAt = NAME_IN + NAME_HOLD;

  const ease = (from: number, dur: number, curve = EASE_OUT) =>
    interpolate(t, [from, from + dur], [0, 1], { ...CLAMP, easing: curve });

  let G = H * (portrait ? 0.05 : 0.085);
  let F = 0;
  let whyF = 0;
  let whyLines: string[][] = [];
  let placed: Placed[] = [];
  let whyTop = 0;

  for (let attempt = 0; attempt < 40; attempt++) {
    const whyWords = splitWords(why);
    const whyEm = whyWords.reduce(
      (a, w, k) => a + bW(w) + (k > 0 ? bSpace : 0),
      0,
    );
    whyF = G * 1.08;
    if (whyEm * whyF > avail && avail / whyEm >= Math.max(G * 0.78, H * 0.05)) {
      whyF = avail / whyEm;
    }
    whyLines = balanced(whyWords, bW, bSpace, avail / whyF);
    if (portrait) {
      F = Math.min(H * 0.13, avail / Math.max(...wordEm));
      let y = H * 0.1;
      const stackH = n * F * 0.98;
      let y0 = H * 0.42 - stackH / 2;
      placed = list.map((p) => {
        const gloss = balanced(splitWords(p.gloss), bW, bSpace, avail / G);
        const item: Placed = {
          x0: margin,
          y0,
          x1: margin,
          y1: y,
          colW: avail,
          gloss,
          glossTop: y + F * 1.08,
        };
        y += F * 1.08 + gloss.length * BODY_LH * G + F * 0.42;
        y0 += F * 0.98;
        return item;
      });
      whyTop = Math.max(y + G, H * 0.86 - whyLines.length * BODY_LH * whyF);
      const bottom = whyTop + whyLines.length * BODY_LH * whyF;
      if (bottom <= H * 0.93 || attempt === 39) break;
    } else {
      const sumEm = wordEm.reduce((a, b) => a + b, 0);
      const room = avail - gutter * (n - 1);
      F = Math.min(H * 0.3, room / sumEm);
      const need = wordEm.map((e) => e * F);
      const cols = need.map(() => 0);
      let free = room;
      let open = need.map((_, i) => i);
      for (let pass = 0; pass < n; pass++) {
        const share = free / Math.max(1, open.length);
        const fixedNow = open.filter((i) => need[i] > share);
        if (fixedNow.length === 0) {
          for (const i of open) cols[i] = share;
          break;
        }
        for (const i of fixedNow) {
          cols[i] = need[i];
          free -= need[i];
        }
        open = open.filter((i) => !fixedNow.includes(i));
      }
      const top = H * 0.1;
      const lineW = wordEm.reduce((a, e, i) => a + e + (i > 0 ? nSpace : 0), 0);
      let xNat = (W - lineW * F) / 2;
      let xCol = margin;
      const glossTop = top + F * 1.02;
      placed = list.map((p, i) => {
        const gloss = balanced(
          splitWords(p.gloss),
          bW,
          bSpace,
          (cols[i] - gutter * 0.3) / G,
        );
        const item: Placed = {
          x0: xNat,
          y0: (H - F) / 2,
          x1: xCol,
          y1: top,
          colW: cols[i],
          gloss,
          glossTop,
        };
        xNat += (wordEm[i] + nSpace) * F;
        xCol += cols[i] + gutter;
        return item;
      });
      const glossBottom = Math.max(
        ...placed.map((pl) => pl.glossTop + pl.gloss.length * BODY_LH * G),
      );
      whyTop = H * 0.88 - whyLines.length * BODY_LH * whyF;
      const tall = placed.some((pl) => pl.gloss.length > 4);
      if ((!tall && glossBottom + G * 1.2 <= whyTop) || attempt === 39) break;
    }
    G *= 0.95;
  }

  const move = ease(moveAt, MOVE, EASE_MOVE);
  const nodes: React.ReactNode[] = [];

  placed.forEach((pl, i) => {
    const p = list[i];
    const inE = ease(i * 3, NAME_IN);
    const x = pl.x0 + (pl.x1 - pl.x0) * move;
    const y = pl.y0 + (pl.y1 - pl.y0) * move;
    const active = ease(glossAt(i) - 4, 10);
    const done = ease(whyAt - 6, 14);
    const waiting = ease(moveAt + MOVE - 8, 10);
    const lit = Math.max(active, done);
    const opacity = 1 - (1 - DIM) * waiting * (1 - lit);
    nodes.push(
      <div
        key={`word-${p.word}-${i}`}
        style={{
          position: "absolute",
          left: x - F * 0.05,
          top: y - F * 0.12,
          height: F * 1.3,
          paddingLeft: F * 0.05,
          paddingRight: F * 0.12,
          overflow: "hidden",
          fontFamily: geologica.fontFamily,
          fontWeight: NAME_W,
          fontSize: F,
          letterSpacing: `${NAME_TRACK}em`,
          lineHeight: `${F * 1.3}px`,
          color: c.ink,
          opacity,
          whiteSpace: "pre",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: `translateY(${((1 - inE) * F * 1.2).toFixed(2)}px)`,
          }}
        >
          {p.word}
        </span>
      </div>,
    );

    const at = glossAt(i);
    if (t < at - 1) return;
    let wi = 0;
    nodes.push(
      <div
        key={`gloss-${i}`}
        style={{
          position: "absolute",
          left: pl.x1 + F * 0.03,
          top: pl.glossTop,
          width: pl.colW + gutter * 0.5,
          fontFamily: geologica.fontFamily,
          fontWeight: BODY_W,
          fontSize: G,
          letterSpacing: `${BODY_TRACK}em`,
          lineHeight: `${BODY_LH * G}px`,
          color: c.ink,
          whiteSpace: "pre",
        }}
      >
        {pl.gloss.map((line) => (
          <div key={line.join(" ")}>
            {line.map((w, k) => {
              const e = ease(at + wi++ * WORD_STAGGER, WORD_IN);
              return (
                <span
                  key={`${w}-${k}`}
                  style={{
                    display: "inline-block",
                    opacity: e * 0.86,
                    transform: `translateY(${((1 - e) * G * 0.7).toFixed(2)}px)`,
                  }}
                >
                  {k > 0 ? ` ${w}` : w}
                </span>
              );
            })}
          </div>
        ))}
      </div>,
    );
  });

  if (why && t >= whyAt - 1) {
    let wi = 0;
    nodes.push(
      <div
        key="why"
        style={{
          position: "absolute",
          left: margin + F * 0.03,
          top: whyTop,
          width: avail + whyF,
          fontFamily: geologica.fontFamily,
          fontWeight: NAME_W,
          fontSize: whyF,
          letterSpacing: `${BODY_TRACK}em`,
          lineHeight: `${BODY_LH * whyF}px`,
          color: hi,
          whiteSpace: "pre",
        }}
      >
        {whyLines.map((line) => (
          <div key={line.join(" ")}>
            {line.map((w, k) => {
              const e = ease(whyAt + wi++ * WORD_STAGGER, WORD_IN);
              return (
                <span
                  key={`${w}-${k}`}
                  style={{
                    display: "inline-block",
                    opacity: e,
                    transform: `translateY(${((1 - e) * whyF * 0.7).toFixed(2)}px)`,
                  }}
                >
                  {k > 0 ? ` ${w}` : w}
                </span>
              );
            })}
          </div>
        ))}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
