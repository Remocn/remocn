"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const geist = loadGeist("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface MonoSettleProps {
  lines?: string[];
  highlight?: string;
  /** Frame the mono letters start settling into the sans. */
  settleAt?: number;
  /** Frames the settle wave takes to cross a line. */
  sweep?: number;
  accent?: string;
  /** Text color of the settled sans; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface the letters settle into. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    pink: "#F472B6",
    bg: "#14151A",
    ink: "#FBF0DF",
    mono: "rgba(251,240,223,0.72)",
  },
  light: {
    pink: "#C2185B",
    bg: "#FBF0DF",
    ink: "#14151A",
    mono: "rgba(20,21,26,0.7)",
  },
} as const;

const TRACK = -0.035;
const LEADING = 1.04;

const RISE_GAP = 0.9;
const RISE_LEN = 16;
const LINE_LAG = 4;
const WAVE_AT = 36;
const WAVE_SPAN = 26;
const MORPH_LEN = 14;
const HL_AT = 72;
const HL_LEN = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface LineMetrics {
  xm: number[];
  xp: number[];
  wm: number;
  wp: number;
}

interface Metrics {
  lines: LineMetrics[];
  capP: number;
  baseP: number;
  baseM: number;
}

const baseOf = (asc: number, desc: number) => (1 - (asc + desc)) / 2 + asc;

function measure(lines: string[], family: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("mono-settle: no 2d context");
  const run = (s: string, font: string, track: number) => {
    ctx.font = font;
    const chars = Array.from(s);
    const xs: number[] = [];
    let prefix = "";
    for (let i = 0; i < chars.length; i++) {
      xs.push(prefix ? ctx.measureText(prefix).width / 100 + track * i : 0);
      prefix += chars[i];
    }
    const total = ctx.measureText(s).width / 100 + track * (chars.length - 1);
    return { xs, total };
  };
  const monoFont = `400 100px "${geistMono.fontFamily}"`;
  const propFont = `500 100px "${family}"`;
  const out = lines.map((s) => {
    const mm = run(s, monoFont, 0);
    const pp = run(s, propFont, TRACK);
    return { xm: mm.xs, xp: pp.xs, wm: mm.total, wp: pp.total };
  });
  ctx.font = propFont;
  const hp = ctx.measureText("H");
  ctx.font = monoFont;
  const hm = ctx.measureText("H");
  return {
    lines: out,
    capP: hp.actualBoundingBoxAscent / 100,
    baseP: baseOf(
      hp.fontBoundingBoxAscent / 100,
      hp.fontBoundingBoxDescent / 100,
    ),
    baseM: baseOf(
      hm.fontBoundingBoxAscent / 100,
      hm.fontBoundingBoxDescent / 100,
    ),
  };
}

function useMetrics(lines: string[], family: string) {
  const key = lines.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("mono-settle: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      geistMono.waitUntilDone(),
      document.fonts.load(`500 100px "${family}"`),
      document.fonts.load(`400 100px "${geistMono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key: key + family,
          m: measure(key.split("\u0001"), family),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key + family ? state.m : null;
}

function highlightMask(lines: string[], needle: string) {
  const masks = lines.map((l) => Array.from(l).map(() => false));
  const n = needle.trim();
  if (!n) return masks;
  lines.forEach((l, li) => {
    const at = l.indexOf(n);
    if (at < 0) return;
    const start = Array.from(l.slice(0, at)).length;
    const len = Array.from(n).length;
    for (let i = start; i < start + len; i++) masks[li][i] = true;
  });
  return masks;
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

export function MonoSettle({
  lines = ["From your editor", "to the edit."],
  highlight = "the edit.",
  settleAt = WAVE_AT,
  sweep = WAVE_SPAN,
  accent,
  ink,
  background,
  fontFamily = geist.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: MonoSettleProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.pink;
  const fg = ink ?? c.ink;
  const list = useMemo(
    () =>
      (lines.length > 0 ? lines : ["From your editor"]).map((l) => l || " "),
    [lines],
  );
  const m = useMetrics(list, fontFamily);
  const hlMask = useMemo(
    () => highlightMask(list, highlight),
    [list, highlight],
  );

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);
  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.085);
  const measureW = W - 2 * margin;
  const maxMono = Math.max(...m.lines.map((l) => l.wm));

  const prog = m.lines.map((l, li) =>
    l.xm.map((x) => {
      const at =
        settleAt + (x / Math.max(0.001, maxMono)) * sweep + li * LINE_LAG;
      return interpolate(t, [at, at + MORPH_LEN], [0, 1], CLAMP);
    }),
  );
  const xs = m.lines.map((l, li) => {
    const out: number[] = [];
    let run = 0;
    for (let i = 0; i < l.xm.length; i++) {
      out.push(run);
      const am = (i + 1 < l.xm.length ? l.xm[i + 1] : l.wm) - l.xm[i];
      const ap = (i + 1 < l.xp.length ? l.xp[i + 1] : l.wp) - l.xp[i];
      run += am + (ap - am) * EASE_IO(prog[li][i]);
    }
    out.push(run);
    return out;
  });
  const widest = Math.max(...xs.map((x) => x[x.length - 1]));
  const capF = H * (portrait ? 0.12 : 0.24) * (list.length > 2 ? 0.75 : 1);
  const F = Math.min(capF, measureW / widest);
  const lineH = F * LEADING;
  const lastBase = H - margin;
  const firstBase = lastBase - lineH * (list.length - 1);

  const hlP = interpolate(t, [HL_AT, HL_AT + HL_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const glyphs = list.flatMap((line, li) => {
    const chars = Array.from(line);
    const baseY = firstBase + li * lineH;
    return chars.map((ch, i) => {
      if (ch === " ") return null;
      const e = EASE_IO(prog[li][i]);
      const x = margin + xs[li][i] * F;
      const r = interpolate(
        t,
        [li * LINE_LAG + i * RISE_GAP, li * LINE_LAG + i * RISE_GAP + RISE_LEN],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const lift = (1 - r) * F * 1.1;
      const sansColor = hlMask[li][i]
        ? `color-mix(in oklab, ${spot} ${(hlP * 100).toFixed(1)}%, ${fg})`
        : fg;
      const top = baseY - F * 1.05;
      const h = F * 1.3;
      const cut = (1 - e) * h;
      return (
        <div
          key={`${li}-${i}`}
          style={{
            position: "absolute",
            left: x,
            top,
            width: F,
            height: h,
            overflow: "hidden",
          }}
        >
          {e < 0.999 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: F * 1.05 - m.baseM * F + lift,
                height: F,
                lineHeight: `${F}px`,
                fontFamily: geistMono.fontFamily,
                fontWeight: 400,
                fontSize: F,
                whiteSpace: "pre",
                color: c.mono,
                clipPath: `inset(${Math.max(0, h - cut - (F * 1.05 - m.baseM * F)).toFixed(2)}px 0 0 0)`,
              }}
            >
              {ch}
            </div>
          ) : null}
          {e > 0.001 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: F * 1.05 - m.baseP * F + lift,
                height: F,
                lineHeight: `${F}px`,
                fontFamily,
                fontWeight: 500,
                fontSize: F,
                whiteSpace: "pre",
                color: sansColor,
                clipPath:
                  e >= 0.999
                    ? undefined
                    : `inset(0 0 ${Math.max(0, F - (h - cut - (F * 1.05 - m.baseP * F))).toFixed(2)}px 0)`,
              }}
            >
              {ch}
            </div>
          ) : null}
        </div>
      );
    });
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{glyphs}</ScaleLayer>
    </AbsoluteFill>
  );
}
