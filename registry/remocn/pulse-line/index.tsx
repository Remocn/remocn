"use client";

import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const inter = loadInterTight("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PulseLineProps {
  text?: string;
  highlight?: string;
  caption?: string;
  beats?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const AURORA = ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    flat: "#9C9BA3",
    muted: "#8E8D94",
    glow: ["#F2FFF8", AURORA[0], AURORA[1]],
    hl: (accent: string) =>
      `linear-gradient(100deg, ${AURORA[0]} 0%, ${AURORA[1]} 38%, ${accent} 78%, ${AURORA[3]} 100%)`,
    ground: (k: number) =>
      `radial-gradient(70% 55% at 50% 108%, rgba(63,181,163,${(0.1 + 0.1 * k).toFixed(3)}) 0%, rgba(81,71,182,${(0.06 + 0.05 * k).toFixed(3)}) 45%, transparent 75%)`,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    flat: "#55545A",
    muted: "#6E6C67",
    glow: ["#0B5E52", "#1E8C7C", AURORA[2]],
    hl: (accent: string) =>
      `linear-gradient(100deg, #12806F 0%, #1E8C7C 30%, ${accent} 72%, #8C3A78 100%)`,
    ground: (k: number) =>
      `radial-gradient(70% 55% at 50% 108%, rgba(63,181,163,${(0.12 + 0.08 * k).toFixed(3)}) 0%, rgba(81,71,182,${(0.05 + 0.04 * k).toFixed(3)}) 45%, transparent 75%)`,
    grain: 0.035,
  },
} as const;

const TRACK = -0.035;
const LINE_GAP = 1.1;
const FONT_PX = 200;

const WAVE = [
  { a: 0.1, c: 1.0, w: 0.5, tent: false },
  { a: -0.09, c: 2.25, w: 0.5, tent: true },
  { a: 0.62, c: 2.9, w: 0.85, tent: true },
  { a: -0.22, c: 3.6, w: 0.6, tent: true },
  { a: 0.16, c: 5.3, w: 0.85, tent: false },
] as const;
const R_AT = 2.9;
const WAVE_LEN = 7.2;
const V = 0.42;
const FLAT_SCALE = 0.05;
const COOL = 11;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function ecg(s: number) {
  let y = 0;
  for (const k of WAVE) {
    y += k.tent
      ? k.a * Math.max(0, 1 - Math.abs(s - k.c) / k.w)
      : k.a * Math.exp(-((s - k.c) ** 2) / (2 * k.w * k.w));
  }
  return y;
}

function mixHex(a: string, b: string, t: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (p: number, sh: number) => (p >> sh) & 255;
  const m = (sh: number) =>
    Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * t);
  return `rgb(${m(16)}, ${m(8)}, ${m(0)})`;
}

function heatColor(stops: readonly string[], ink: string, h: number) {
  const ramp = [ink, stops[2], stops[1], stops[0]];
  const x = Math.max(0, Math.min(1, h)) ** 1.4 * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  return mixHex(ramp[i], ramp[i + 1], x - i);
}

interface Metrics {
  width: (s: string) => number;
  offsets: (s: string) => number[];
  caption: number;
  baseline: number;
}

function useMetrics(caption: string) {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("pulse-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      inter.waitUntilDone(),
      document.fonts.load(`500 100px "${inter.fontFamily}"`),
      document.fonts.load(`400 100px "${inter.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("pulse-line: no 2d context");
        ctx.font = `500 ${FONT_PX}px "${inter.fontFamily}"`;
        const fm = ctx.measureText("Hg");
        const asc = fm.fontBoundingBoxAscent / FONT_PX;
        const desc = fm.fontBoundingBoxDescent / FONT_PX;
        const raw = (s: string) => ctx.measureText(s).width / FONT_PX;
        const width = (s: string) =>
          raw(s) + TRACK * Math.max(0, Array.from(s).length - 1);
        const offsets = (s: string) => {
          const chars = Array.from(s);
          return chars.map(
            (_, i) => raw(chars.slice(0, i).join("")) + TRACK * i,
          );
        };
        ctx.font = `400 ${FONT_PX}px "${inter.fontFamily}"`;
        const cap = caption ? ctx.measureText(caption).width / FONT_PX : 0;
        setM({
          width,
          offsets,
          caption: cap,
          baseline: (1 - (asc + desc)) / 2 + asc,
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [caption, handle]);
  return m;
}

function breakLines(words: string[], n: number, width: (s: string) => number) {
  if (n <= 1 || words.length <= 1) return [words.join(" ")];
  let best: string[] = [words.join(" ")];
  let bestW = Number.POSITIVE_INFINITY;
  const rec = (start: number, left: number, acc: string[]) => {
    if (left === 1) {
      const lines = [...acc, words.slice(start).join(" ")];
      const w = Math.max(...lines.map(width));
      if (w < bestW) {
        bestW = w;
        best = lines;
      }
      return;
    }
    for (let k = start + 1; k <= words.length - left + 1; k++)
      rec(k, left - 1, [...acc, words.slice(start, k).join(" ")]);
  };
  rec(0, Math.min(n, words.length), []);
  return best;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `pl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={11}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function PulseLine({
  text = "Every frame has a pulse.",
  highlight = "a pulse.",
  caption = "Motion components for Remotion. Copy one in, own every frame.",
  beats = 2,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: PulseLineProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const m = useMetrics(caption);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const maxW = W * 0.86;
  const capH = caption ? 0.16 : 0;
  let lines: string[] = [text];
  let F = 0;
  for (let n = 1; n <= 3; n++) {
    const ls = breakLines(words, n, m.width);
    const wEm = Math.max(...ls.map(m.width));
    const hEm = (ls.length - 1) * LINE_GAP + 1.1;
    const f = Math.min(
      maxW / wEm,
      (H * (0.7 - capH)) / hEm,
      H * (n === 1 ? 0.24 : 0.19),
    );
    if (n === 1 || f > F * 1.15) {
      lines = ls;
      F = f;
    }
    if (n === 1 && f >= H * 0.17) break;
  }

  const hlStart = highlight ? text.indexOf(highlight) : -1;
  const hlEnd = hlStart >= 0 ? hlStart + highlight.length : -1;
  type G = {
    ch: string;
    line: number;
    x: number;
    adv: number;
    strip: number;
    hl: boolean;
  };
  const glyphs: G[] = [];
  let cursor = 0;
  const lineW = lines.map(m.width);
  const blockW = Math.max(...lineW);
  for (let li = 0; li < lines.length; li++) {
    const s = lines[li];
    const offs = m.offsets(s);
    const lw = lineW[li];
    const chars = Array.from(s);
    const at = text.indexOf(s, cursor);
    const pad = (blockW - lw) / 2;
    chars.forEach((ch, i) => {
      const next = i + 1 < chars.length ? offs[i + 1] : lw + TRACK;
      const adv = next - offs[i];
      const gi = at + i;
      glyphs.push({
        ch,
        line: li,
        x: offs[i],
        adv,
        strip: pad + offs[i] + adv / 2,
        hl: gi >= hlStart && gi < hlEnd,
      });
    });
    cursor = at + s.length;
  }
  const stripLen = blockW;
  const hlBox = new Map<number, { x0: number; x1: number }>();
  for (const g of glyphs) {
    if (!g.hl || g.ch === " ") continue;
    const b = hlBox.get(g.line) ?? { x0: g.x, x1: g.x + g.adv };
    b.x0 = Math.min(b.x0, g.x);
    b.x1 = Math.max(b.x1, g.x + g.adv);
    hlBox.set(g.line, b);
  }

  const nBeats = Math.max(1, Math.min(4, Math.round(beats)));
  const run = (stripLen + WAVE_LEN + 1) / V;
  const period = Math.max(34, run + 4);
  const beatAt = (b: number) => 6 + b * period;
  const front = (b: number) => -1 + (t - beatAt(b)) * V;
  const endT = beatAt(nBeats - 1) + run;

  const blockH = (lines.length - 1) * LINE_GAP * F + F;
  const capGap = Math.max(F * 0.42, H * 0.06);
  const capSize = Math.min(
    Math.max(F * 0.17, H * 0.035),
    H * 0.044,
    (W * 0.86) / Math.max(0.1, m.caption),
  );
  const totalH = blockH + (caption ? capGap + capSize : 0);
  const top0 = (H - totalH) / 2;
  const capAt = beatAt(nBeats - 1) + run * 0.45;

  let breathe = 0;
  for (let b = 0; b < nBeats; b++) {
    const tr = beatAt(b) + (stripLen / 2 + R_AT + 1) / V;
    const d = t - tr;
    if (d > -4) breathe = Math.max(breathe, Math.exp(-((d + 0) ** 2) / 120));
  }

  const nodes: React.ReactNode[] = [];
  glyphs.forEach((g, i) => {
    if (g.ch === " ") return;
    const lw = lineW[g.line];
    const left = (W - lw * F) / 2 + g.x * F;
    const baseY = top0 + g.line * LINE_GAP * F + m.baseline * F;

    let y = 0;
    let heat = 0;
    let alive = 0;
    let hlOn = 0;
    for (let b = 0; b < nBeats; b++) {
      const s = front(b) - g.strip;
      if (s < -0.5) continue;
      y += ecg(s);
      const since = (s - R_AT) / V;
      if (since > -1.5) {
        heat = Math.max(
          heat,
          since < 0 ? 1 + since / 1.5 : Math.exp(-since / COOL),
        );
      }
      if (b === 0)
        alive = interpolate(s, [R_AT - 0.35, R_AT + 0.25], [0, 1], CLAMP);
      if (b === nBeats - 1 && g.hl)
        hlOn = interpolate(since, [0, 12], [0, 1], CLAMP);
    }
    const spike = Math.max(0, y) / WAVE[2].a;
    const sy = FLAT_SCALE + (1 - FLAT_SCALE) * alive + spike * 0.22 * alive;
    const sx = 1 - spike * 0.06;
    const dy = -y * F * (lines.length > 1 ? 0.8 : 1);
    const ink = alive > 0.02 ? c.ink : c.flat;
    const restInk = mixHex(c.flat, c.ink, alive);
    const col =
      heat > 0.001
        ? heatColor(c.glow, ink === c.ink ? c.ink : restInk, heat)
        : restInk;

    const style: React.CSSProperties = {
      position: "absolute",
      left,
      top: baseY - m.baseline * F,
      fontFamily: inter.fontFamily,
      fontWeight: 500,
      fontSize: F,
      lineHeight: `${F}px`,
      whiteSpace: "pre",
      transformOrigin: `${((g.adv / 2) * F).toFixed(2)}px ${(m.baseline * F).toFixed(2)}px`,
      transform: `translateY(${dy.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
    };
    nodes.push(
      <div key={`g${i}`} style={{ ...style, color: col }}>
        {g.ch}
      </div>,
    );
    if (g.hl && hlOn > 0) {
      const box = hlBox.get(g.line);
      const bw = box ? (box.x1 - box.x0) * F : g.adv * F;
      const bx = box ? (g.x - box.x0) * F : 0;
      nodes.push(
        <div
          key={`h${i}`}
          style={{
            ...style,
            color: "transparent",
            backgroundImage: c.hl(accent),
            backgroundSize: `${bw.toFixed(2)}px 100%`,
            backgroundPosition: `${(-bx).toFixed(2)}px 0`,
            backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            opacity: hlOn * (1 - Math.min(1, heat * 0.6)),
          }}
        >
          {g.ch}
        </div>,
      );
    }
  });

  const capP = interpolate(t, [capAt, capAt + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settled = interpolate(t, [endT, endT + 30], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.ground(Math.max(breathe, settled * 0.35)),
        }}
      />
      {nodes}
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: top0 + blockH + capGap,
            textAlign: "center",
            fontFamily: inter.fontFamily,
            fontWeight: 400,
            fontSize: capSize,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            color: c.muted,
            opacity: capP,
            transform: `translateY(${((1 - capP) * capSize * 0.7).toFixed(2)}px)`,
          }}
        >
          {caption}
        </div>
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
