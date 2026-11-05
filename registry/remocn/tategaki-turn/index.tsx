"use client";

import { loadFont as loadZenKaku } from "@remotion/google-fonts/ZenKakuGothicNew";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const kaku = loadZenKaku("normal", { weights: ["500"], subsets: ["latin"] });

export interface TategakiTurnProps {
  text?: string;
  highlight?: number;
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const VERMILION = "#E03C31";

const THEMES = {
  dark: { bg: "#111111", ink: "#F5F1EA" },
  light: { bg: "#F5F1EA", ink: "#111111" },
} as const;

const TRACK = -0.02;
const PITCH = 1.2;
const STRETCH = 0.22;
const COL = 1.34;

const COL_STAGGER = 5;
const LETTER_STAGGER = 2;
const LETTER_LEN = 11;
const DROP = 0.42;
const SWING_LEN = 36;
const LINE_STAGGER = 12;
const TRAVEL_LEN = 22;
const LINE = 1.16;
const TIER_GAP = 0.9;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_TRAVEL = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface WordMetrics {
  chars: string[];
  lefts: number[];
  advs: number[];
  width: number;
}

interface Metrics {
  words: WordMetrics[];
  space: number;
  cap: number;
  base: number;
  colW: number;
}

function measure(words: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("tategaki-turn: no 2d context");
  ctx.font = `500 100px "${kaku.fontFamily}"`;
  const w = (s: string) => ctx.measureText(s).width / 100;
  const h = ctx.measureText("H");
  const asc = h.fontBoundingBoxAscent / 100;
  const desc = h.fontBoundingBoxDescent / 100;
  let colW = 0;
  const out = words.map((word) => {
    const chars = Array.from(word);
    const lefts = chars.map(
      (_c, k) => w(chars.slice(0, k).join("")) + TRACK * k,
    );
    const advs = chars.map((ch) => {
      const a = w(ch);
      colW = Math.max(colW, a);
      return a;
    });
    return {
      chars,
      lefts,
      advs,
      width: w(word) + TRACK * Math.max(0, chars.length - 1),
    };
  });
  return {
    words: out,
    space: w(" "),
    cap: h.actualBoundingBoxAscent / 100,
    base: (1 - (asc + desc)) / 2 + asc,
    colW,
  };
}

function useMetrics(words: string[]) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("tategaki-turn: measuring"));
  const released = useRef(false);
  const key = JSON.stringify(words);
  useEffect(() => {
    let live = true;
    Promise.all([
      kaku.waitUntilDone(),
      document.fonts.load(`500 100px "${kaku.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(JSON.parse(key) as string[]));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return metrics;
}

export function TategakiTurn({
  text = "Read it both ways.",
  highlight,
  hold = 16,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: TategakiTurnProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const red = accent ?? VERMILION;

  const words = useMemo(() => {
    const ws = text.split(/\s+/).filter(Boolean);
    return ws.length ? ws : [" "];
  }, [text]);
  const m = useMetrics(words);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const n = m.words.length;
  const hiIdx = highlight ?? n - 1;
  const pitch = m.cap * PITCH;
  const colPitch = Math.max(m.colW, m.cap) * COL;
  const portrait = H > W;
  const fitW = W * (portrait ? 0.88 : 0.86);
  const widths = m.words.map((wd) => wd.width);
  const lineW = (ids: number[]) =>
    ids.reduce((acc, j) => acc + widths[j], 0) +
    m.space * Math.max(0, ids.length - 1);
  const greedy = (maxW: number) => {
    const out: number[][] = [];
    let cur: number[] = [];
    for (let j = 0; j < n; j++) {
      if (cur.length && lineW([...cur, j]) > maxW) {
        out.push(cur);
        cur = [j];
      } else cur.push(j);
    }
    if (cur.length) out.push(cur);
    return out;
  };
  const breakInto = (L: number) => {
    let lo = Math.max(...widths);
    let hi = lineW(m.words.map((_wd, j) => j));
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (greedy(mid).length <= L) hi = mid;
      else lo = mid;
    }
    return greedy(hi);
  };
  const finalSize = (ls: number[][]) =>
    Math.min(
      fitW / Math.max(...ls.map(lineW)),
      H * 0.26,
      (H * 0.72) / (m.cap + (ls.length - 1) * LINE),
    );
  const maxLines = Math.min(n, portrait ? 3 : 2);
  let lines = breakInto(1);
  let best = { ls: lines, f: finalSize(lines) };
  for (let L = 1; L <= maxLines; L++) {
    const ls = breakInto(L);
    const f = finalSize(ls);
    if (f > best.f) best = { ls, f };
    if (f >= Math.min(W, H) * (portrait ? 0.17 : 0.12)) {
      best = { ls, f };
      break;
    }
  }
  lines = best.ls;
  const Fh = best.f;

  const lineOf: number[] = [];
  const wordX: number[] = [];
  const wordY: number[] = [];
  lines.forEach((ids, l) => {
    let x = 0;
    for (const j of ids) {
      lineOf[j] = l;
      wordX[j] = x;
      wordY[j] = l * LINE;
      x += widths[j] + m.space;
    }
  });
  const hCenter = (j: number, k: number) =>
    wordX[j] + m.words[j].lefts[k] + m.words[j].advs[k] / 2;

  const pivotV: { x: number; y: number }[] = [];
  let tierY = 0;
  let maxCols = 1;
  let maxLen = 1;
  lines.forEach((ids, l) => {
    const longest = Math.max(...ids.map((j) => m.words[j].chars.length));
    maxLen = Math.max(maxLen, longest);
    maxCols = Math.max(maxCols, ids.length);
    ids.forEach((j, i) => {
      pivotV[j] = { x: (i - (ids.length - 1) / 2) * colPitch, y: tierY };
    });
    if (l < lines.length - 1) tierY += (longest - 1) * pitch + TIER_GAP + m.cap;
    else tierY += (longest - 1) * pitch;
  });
  const stageH = tierY + m.cap;
  const Fv = Math.min(
    (H * 0.84) / stageH,
    fitW / (maxCols * colPitch),
    H * (portrait ? 0.16 : 0.22),
  );

  const lastStart = (n - 1) * COL_STAGGER + (maxLen - 1) * LETTER_STAGGER;
  const turnAt = lastStart + LETTER_LEN + hold;

  const swing = m.words.map((_wd, j) =>
    spring({
      frame: t - turnAt - lineOf[j] * LINE_STAGGER,
      fps,
      durationInFrames: SWING_LEN,
      config: { damping: 15, stiffness: 90, mass: 1 },
    }),
  );
  const travel = m.words.map((_wd, j) => {
    const s0 = turnAt + lineOf[j] * LINE_STAGGER;
    return interpolate(t, [s0 - 2, s0 + TRAVEL_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_TRAVEL,
    });
  });
  const zoomP =
    travel.reduce((acc, v) => acc + v, 0) / Math.max(1, travel.length);

  interface Glyph {
    j: number;
    k: number;
    ch: string;
    x: number;
    y: number;
    adv: number;
  }
  const glyphs: Glyph[] = [];
  m.words.forEach((wd, j) => {
    const ph = { x: hCenter(j, 0), y: wordY[j] };
    const pv = pivotV[j];
    const theta = (Math.PI / 2) * (1 - swing[j]);
    const px = pv.x + (ph.x - pv.x) * travel[j];
    const py = pv.y + (ph.y - pv.y) * travel[j];
    const bend = Math.min(Math.PI / 2, Math.max(0, theta));
    const g = 1 + STRETCH * Math.sin(2 * bend);
    const cos = Math.cos(theta);
    wd.chars.forEach((ch, k) => {
      const rv = k * pitch;
      const rh = hCenter(j, k) - ph.x;
      let d = g * Math.hypot(rh * cos, rv * Math.sin(theta));
      if (cos > 0.001) d = Math.min(d, rh / cos);
      glyphs.push({
        j,
        k,
        ch,
        x: px + d * cos,
        y: py + d * Math.sin(theta),
        adv: wd.advs[k],
      });
    });
  });

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const g of glyphs) {
    minX = Math.min(minX, g.x - g.adv / 2);
    maxX = Math.max(maxX, g.x + g.adv / 2);
    minY = Math.min(minY, g.y - m.cap);
    maxY = Math.max(maxY, g.y);
  }
  const F = Math.min(
    Fv + (Fh - Fv) * zoomP,
    fitW / (maxX - minX),
    (H * 0.84) / (maxY - minY),
  );
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginY = H * (portrait ? 0.07 : 0.09);
  const oxV = W - marginX - maxX * F;
  const oyV = marginY - minY * F;
  const oxH = marginX - minX * F;
  const oyH = H - marginY - maxY * F;
  const ox = oxV + (oxH - oxV) * zoomP;
  const oy = oyV + (oyH - oyV) * zoomP;

  const nodes: React.ReactNode[] = glyphs.map((g) => {
    const startAt = g.j * COL_STAGGER + g.k * LETTER_STAGGER - 3;
    const rise = interpolate(t, [startAt, startAt + LETTER_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const fill: React.CSSProperties = { color: g.j === hiIdx ? red : c.ink };
    return (
      <div
        key={`${g.j}-${g.k}`}
        style={{
          position: "absolute",
          left: ox + (g.x - g.adv / 2) * F,
          top: oy + (g.y - m.base - (1 - rise) * DROP) * F,
          width: g.adv * F,
          height: F * 1.4,
          opacity: rise,
          fontFamily: kaku.fontFamily,
          fontWeight: 500,
          fontSize: F,
          lineHeight: `${F}px`,
          textAlign: "center",
          whiteSpace: "pre",
          ...fill,
        }}
      >
        {g.ch}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
