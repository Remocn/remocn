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

export interface KeepBelief {
  text: string;
  keep: string;
}

export interface KeepWordsProps {
  beliefs?: KeepBelief[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_BELIEFS: KeepBelief[] = [
  {
    text: "A launch video should be written, the same way the product was.",
    keep: "written",
  },
  {
    text: "Every frame you install should stay yours, down to the last easing curve.",
    keep: "yours",
  },
  {
    text: "And the film should land on time, in the same release as the code.",
    keep: "on time",
  },
];

const THEMES = {
  dark: { bg: "#0A1230", ink: "#FFFFFF", accent: "#FF4436" },
  light: { bg: "#F7F3EC", ink: "#14161F", accent: "#D92B1E" },
} as const;

const TRACK = -0.02;
const LH = 1.08;
const START = 6;
const STACK_MOVE = 24;
const FINAL_HOLD = 34;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.75, 0.2);
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
  const [handle] = useState(() => delayRender("keep-words: font"));
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

interface Seg {
  text: string;
  dx: number;
  key: number;
}

interface Word {
  segs: Seg[];
  w: number;
}

interface Laid {
  words: { x: number; line: number }[];
  lines: number;
}

function wrapAt(words: Word[], maxEm: number): Laid {
  const space = em(" ");
  const out: { x: number; line: number }[] = [];
  let line = 0;
  let x = 0;
  for (const w of words) {
    if (x > 0 && x + w.w > maxEm) {
      line += 1;
      x = 0;
    }
    out.push({ x, line });
    x += w.w + space;
  }
  return { words: out, lines: line + 1 };
}

function balanced(words: Word[], maxEm: number): Laid {
  const base = wrapAt(words, maxEm);
  let lo = Math.max(...words.map((w) => w.w), 0.1);
  let hi = maxEm;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (wrapAt(words, mid).lines <= base.lines) hi = mid;
    else lo = mid;
  }
  return wrapAt(words, hi);
}

function fitSize(words: Word[], boxW: number, boxH: number, maxF: number) {
  let lo = 8;
  let hi = maxF;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const lay = wrapAt(words, boxW / mid);
    const widest = Math.max(...words.map((w) => w.w)) * mid;
    if (lay.lines * LH * mid <= boxH && widest <= boxW) lo = mid;
    else hi = mid;
  }
  return lo;
}

function splitBelief(b: KeepBelief): Word[] {
  const tokens = b.text.split(/\s+/).filter(Boolean);
  const keepTokens = b.keep.toLowerCase().split(/\s+/).filter(Boolean);
  const core = (s: string) =>
    s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  let at = -1;
  for (let i = 0; i + keepTokens.length <= tokens.length && at < 0; i++) {
    let ok = true;
    for (let j = 0; j < keepTokens.length; j++) {
      if (core(tokens[i + j]).toLowerCase() !== keepTokens[j]) ok = false;
    }
    if (ok) at = i;
  }
  return tokens.map((tk, i) => {
    const k = at >= 0 && i >= at && i < at + keepTokens.length ? i - at : -1;
    if (k < 0) return { segs: [{ text: tk, dx: 0, key: -1 }], w: em(tk) };
    const c = core(tk);
    const start = tk.indexOf(c);
    const lead = tk.slice(0, start);
    const tail = tk.slice(start + c.length);
    const segs: Seg[] = [];
    if (lead) segs.push({ text: lead, dx: 0, key: -1 });
    segs.push({ text: c, dx: em(lead), key: k });
    if (tail) segs.push({ text: tail, dx: em(lead + c), key: -1 });
    return { segs, w: em(tk) };
  });
}

function mottoOf(keep: string) {
  const t = keep.trim();
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
}

export function KeepWords({
  beliefs = DEFAULT_BELIEFS,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: KeepWordsProps) {
  const frame = useCurrentFrame();
  const t = frame * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontReady();

  if (!ready || beliefs.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const n = beliefs.length;
  const D = durationInFrames * speed;
  const seg = Math.max(
    48,
    (D - START - STACK_MOVE - FINAL_HOLD - 30) / Math.max(1, n),
  );
  const lastTravel =
    START + (n - 1) * seg + seg * 0.66 + Math.min(24, seg * 0.3);
  const stackAt = lastTravel + 14;

  const mx = W * (portrait ? 0.08 : 0.07);
  const boxTop = H * (portrait ? 0.1 : 0.1);
  const boxW = W * (portrait ? 0.84 : 0.8);
  const boxH = H * (portrait ? 0.46 : 0.56);

  const mottoItems = beliefs.map((b) => mottoOf(b.keep));
  const space = em(" ");
  const mottoWidthEm =
    mottoItems.reduce((s, m) => s + em(`${m}.`), 0) + space * (n - 1);
  const Fm = Math.min(
    H * (portrait ? 0.05 : 0.085),
    (W - mx * 2) / mottoWidthEm,
  );
  const mottoTop = H * (portrait ? 0.66 : 0.76);

  const stackWidest = Math.max(...mottoItems.map((m) => em(`${m}.`)));
  const Ff = Math.min(
    (H * (portrait ? 0.62 : 0.8)) / (n * LH),
    (W - mx * 2) / stackWidest,
    H * 0.3,
  );
  const stackTop = portrait ? H * 0.5 - (n * LH * Ff) / 2 : boxTop;

  const mottoSlots: { x: number; y: number }[][] = [];
  const stackSlots: { x: number; y: number }[][] = [];
  let mxEm = 0;
  mottoItems.forEach((m, i) => {
    const parts = m.split(/\s+/);
    const rowSlots: { x: number; y: number }[] = [];
    const colSlots: { x: number; y: number }[] = [];
    let local = 0;
    for (const p of parts) {
      rowSlots.push({ x: mx + (mxEm + local) * Fm, y: mottoTop });
      colSlots.push({ x: mx + local * Ff, y: stackTop + i * LH * Ff });
      local += em(p) + space;
    }
    rowSlots.push({ x: mx + (mxEm + em(m)) * Fm, y: mottoTop });
    colSlots.push({ x: mx + em(m) * Ff, y: stackTop + i * LH * Ff });
    mottoSlots.push(rowSlots);
    stackSlots.push(colSlots);
    mxEm += em(`${m}.`) + space;
  });

  const stackOf = (i: number) =>
    interpolate(t, [stackAt + i * 4, stackAt + i * 4 + STACK_MOVE], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });

  const nodes: React.ReactNode[] = [];

  const glyph = (
    key: string,
    text: string,
    x: number,
    y: number,
    size: number,
    renderSize: number,
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
        lineHeight: `${LH * renderSize}px`,
        letterSpacing: `${TRACK}em`,
        whiteSpace: "pre",
        color,
        opacity,
        transformOrigin: "0 0",
        transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(size / renderSize).toFixed(4)})`,
      }}
    >
      {text}
    </div>
  );

  beliefs.forEach((b, bi) => {
    const stackP = stackOf(bi);
    const s0 = START + bi * seg;
    const u = t - s0;
    const words = splitBelief(b);
    const F = fitSize(words, boxW, boxH, H * (portrait ? 0.1 : 0.17));
    const lay = balanced(words, boxW / F);
    const markAt = seg * 0.42;
    const fallAt = seg * 0.6;
    const travelAt = seg * 0.66;
    const travelLen = Math.min(24, seg * 0.3);
    const mark = interpolate(u, [markAt, markAt + 8], [0, 1], CLAMP);
    const keyColor = interpolateColors(mark, [0, 1], [c.ink, hi]);

    if (u > -1) {
      const stagger = Math.min(2, 22 / Math.max(1, words.length));
      let order = 0;
      words.forEach((w, wi) => {
        const pos = lay.words[wi];
        const wx = mx + pos.x * F;
        const wy = boxTop + pos.line * LH * F;
        const enter = interpolate(
          u,
          [order * stagger, order * stagger + 16],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        );
        order += 1;
        w.segs.forEach((sg, si) => {
          const id = `b${bi}w${wi}s${si}`;
          if (sg.key < 0) {
            const fall = interpolate(
              u,
              [fallAt + (wi % 4), fallAt + (wi % 4) + 12],
              [0, 1],
              { ...CLAMP, easing: EASE_IN },
            );
            const op = enter * (1 - fall);
            if (op <= 0.001) return;
            nodes.push(
              glyph(
                id,
                sg.text,
                wx + sg.dx * F,
                wy + (1 - enter) * F * 0.32 + fall * F * 0.22,
                F,
                F,
                c.ink,
                op,
              ),
            );
            return;
          }
          const travel = interpolate(
            u,
            [travelAt + sg.key * 2, travelAt + sg.key * 2 + travelLen],
            [0, 1],
            { ...CLAMP, easing: EASE_IO },
          );
          const row = mottoSlots[bi][sg.key];
          const col = stackSlots[bi][sg.key];
          const fx = wx + sg.dx * F;
          const fy = wy + (1 - enter) * F * 0.32;
          const rx = row.x + (col.x - row.x) * stackP;
          const ry = row.y + (col.y - row.y) * stackP;
          const rs = Fm + (Ff - Fm) * stackP;
          const x = fx + (rx - fx) * travel;
          const y = fy + (ry - fy) * travel;
          const size = F + (rs - F) * travel;
          const render = Math.max(F, Ff);
          const landed = interpolate(travel, [0.85, 1], [0, 1], CLAMP);
          const color = interpolateColors(landed, [0, 1], [keyColor, c.ink]);
          const finalText =
            sg.key === 0 ? mottoItems[bi].split(/\s+/)[0] : sg.text;
          const swap = finalText !== sg.text ? landed : 0;
          if (swap < 1) {
            nodes.push(
              glyph(id, sg.text, x, y, size, render, color, enter * (1 - swap)),
            );
          }
          if (swap > 0) {
            nodes.push(
              glyph(`${id}f`, finalText, x, y, size, render, color, swap),
            );
          }
        });
      });
    }

    const dotAt = travelAt + (mottoSlots[bi].length - 2) * 2 + travelLen;
    const dot = interpolate(u, [dotAt - 4, dotAt + 6], [0, 1], CLAMP);
    if (dot > 0) {
      const row = mottoSlots[bi][mottoSlots[bi].length - 1];
      const col = stackSlots[bi][stackSlots[bi].length - 1];
      const rs = Fm + (Ff - Fm) * stackP;
      nodes.push(
        glyph(
          `b${bi}dot`,
          ".",
          row.x + (col.x - row.x) * stackP,
          row.y + (col.y - row.y) * stackP,
          rs,
          Ff,
          hi,
          dot,
        ),
      );
    }
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
