"use client";

import { loadVariableFont } from "@remotion/google-fonts/InterTight";
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

const inter = loadVariableFont("normal", { subsets: ["latin"] });

export interface EnhanceCountProps {
  text?: string;
  highlight?: string;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy; a variable font keeps the weight sweep smooth. Inter Tight by default. */
  fontFamily?: string;
  /** Weight the glyphs settle on. */
  fontWeight?: number;
  /** Weight the glyphs start from, before they sharpen. */
  draftWeight?: number;
  /** Frames the sharpening sweeps across the whole text. */
  span?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#1C1C1E",
    ink: "#E9E9E6",
    accent: "#6D5BFF",
  },
  light: {
    bg: "#E9E9E6",
    ink: "#0B0B0C",
    accent: "#6D5BFF",
  },
} as const;

const DRAFT_WGHT = 100;
const DONE_WGHT = 440;
const TRACK = -0.025;

const ENTER_LEN = 14;
const ENHANCE_AT = 38;
const ENHANCE_SPAN = 34;
const ENHANCE_MAX_GAP = 2.4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface LineMetrics {
  chars: string[];
  x: number[];
  width: number;
}

interface Metrics {
  lines: LineMetrics[];
  capTop: number;
  baseline: number;
}

function measure(lines: string[], font: string): Metrics {
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext("2d");
  const size = 200;
  const out: LineMetrics[] = [];
  let capTop = 0.72;
  let baseline = 0.8;
  if (!ctx) {
    for (const l of lines) {
      const chars = Array.from(l);
      out.push({
        chars,
        x: chars.map((_, i) => i * 0.55),
        width: chars.length * 0.55,
      });
    }
    return { lines: out, capTop, baseline };
  }
  ctx.font = font;
  ctx.letterSpacing = `${TRACK * size}px`;
  for (const l of lines) {
    const chars = Array.from(l);
    const x: number[] = [];
    let acc = "";
    for (const ch of chars) {
      x.push(ctx.measureText(acc).width / size);
      acc += ch;
    }
    out.push({ chars, x, width: ctx.measureText(acc).width / size });
  }
  const fm = ctx.measureText("H");
  const asc = fm.fontBoundingBoxAscent / size;
  const desc = fm.fontBoundingBoxDescent / size;
  baseline = (1 - (asc + desc)) / 2 + asc;
  capTop = fm.actualBoundingBoxAscent / size;
  return { lines: out, capTop, baseline };
}

function useMetrics(
  lines: string[],
  fontFamily: string,
  fontWeight: number,
  draftWeight: number,
) {
  const font = `${fontWeight} 200px "${fontFamily}"`;
  const key = `${font}\u0002${draftWeight}\u0002${lines.join("\n")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("enhance-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      inter.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
      document.fonts.load(`${draftWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(key.split("\u0002")[2].split("\n"), font) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, font, fontFamily, fontWeight, draftWeight]);
  return state && state.key === key ? state.m : null;
}

const mix = (a: string, b: string, u: number) =>
  `color-mix(in oklab, ${a} ${((1 - u) * 100).toFixed(1)}%, ${b})`;

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

export function EnhanceCount({
  text = "Draft it fast.\nFinish it sharp.",
  highlight = "sharp.",
  accent,
  ink,
  background,
  fontFamily = inter.fontFamily,
  fontWeight = DONE_WGHT,
  draftWeight = DRAFT_WGHT,
  span = ENHANCE_SPAN,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: EnhanceCountProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const lines = useMemo(() => {
    const l = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return l.length ? l : ["Finish it sharp."];
  }, [text]);
  const m = useMetrics(lines, fontFamily, fontWeight, draftWeight);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const widest = Math.max(0.1, ...m.lines.map((l) => l.width));
  const LH = 1.1;
  const F = Math.min(
    (W * (portrait ? 0.78 : 0.56)) / widest,
    (H * (portrait ? 0.07 : 0.12)) / m.capTop,
  );
  const lineH = F * LH;
  const blockH = lineH * m.lines.length;
  const top0 = (H - blockH) / 2;

  const hiWords = new Set(
    highlight
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase()),
  );
  const nGlyphs = m.lines.reduce((a, l) => a + l.chars.length, 0);
  const gap = Math.min(ENHANCE_MAX_GAP, span / Math.max(1, nGlyphs));
  const enter = interpolate(t, [0, ENTER_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  let gi = 0;
  const glyphs = m.lines.flatMap((line, li) => {
    const left0 = (W - line.width * F) / 2;
    const baseY = top0 + li * lineH + (lineH + m.capTop * F) / 2;
    const words: boolean[] = [];
    let wordStart = 0;
    for (let i = 0; i <= line.chars.length; i++) {
      if (i === line.chars.length || line.chars[i] === " ") {
        const w = line.chars.slice(wordStart, i).join("").toLowerCase();
        for (let k = wordStart; k < i; k++) words[k] = hiWords.has(w);
        words[i] = false;
        wordStart = i + 1;
      }
    }
    return line.chars.map((ch, i) => {
      const idx = gi++;
      const u = spring({
        frame: t - ENHANCE_AT - idx * gap,
        fps,
        config: { damping: 18, stiffness: 140, mass: 0.8 },
      });
      const uc = Math.min(1, Math.max(0, u));
      const next = i + 1 < line.chars.length ? line.x[i + 1] : line.width;
      const slot = (next - line.x[i]) * F;
      const wght = draftWeight + (fontWeight - draftWeight) * u;
      const blur = (1 - uc) * F * 0.045;
      const hi = words[i] && ch !== " ";
      const color = hi ? mix(fg, spot, uc) : fg;
      return (
        <div
          key={`${li}-${i}`}
          style={{
            position: "absolute",
            left: left0 + line.x[i] * F,
            width: slot,
            top: baseY - m.baseline * F,
            height: F,
            lineHeight: `${F}px`,
            textAlign: "center",
            whiteSpace: "pre",
            fontFamily,
            fontSize: F,
            fontVariationSettings: `"wght" ${wght.toFixed(1)}`,
            color,
            opacity: enter * (0.5 + 0.5 * uc),
            filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
          }}
        >
          {ch}
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
