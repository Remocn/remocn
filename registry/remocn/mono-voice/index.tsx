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
import { useGlide } from "@/lib/remocn/glide";

const inter = loadVariableFont("normal", { subsets: ["latin"] });

export interface MonoVoiceProps {
  text?: string;
  highlight?: string;
  /** Frame the mono letters start finding their voice. */
  voiceAt?: number;
  /** Frames between lines rising in. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the text; a variable font with a wght axis. Inter Tight by default. */
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
    bg: "#1C1C1E",
    ink: "#E9E9E6",
    flat: "#6E6E72",
    accent: "#6D5BFF",
  },
  light: {
    bg: "#E9E9E6",
    ink: "#0B0B0C",
    flat: "#9A9A98",
    accent: "#6D5BFF",
  },
} as const;

const CELL = 0.62;
const MONO_WGHT = 260;
const VOICE_WGHT = 440;
const HI_WGHT = 500;
const TRACK = -0.025;
const SMALL = 0.22;

const RISE_AT = 0;
const RISE_LEN = 16;
const RISE_GAP = 4;
const VOICE_AT = 28;
const VOICE_SPAN = 40;
const VOICE_MAX_GAP = 2.2;

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
  baseline: number;
  capTop: number;
}

function measure(lines: string[], family: string): Metrics {
  const size = 200;
  const ctx = document.createElement("canvas").getContext("2d");
  const out: LineMetrics[] = [];
  let baseline = 0.8;
  let capTop = 0.72;
  if (!ctx) {
    for (const l of lines) {
      const chars = Array.from(l);
      out.push({
        chars,
        x: chars.map((_, i) => i * 0.5),
        width: chars.length * 0.5,
      });
    }
    return { lines: out, baseline, capTop };
  }
  ctx.font = `${VOICE_WGHT} ${size}px "${family}"`;
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
  return { lines: out, baseline, capTop };
}

function wrap(text: string, maxChars: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (cur && next.length > maxChars) {
        out.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

function useMetrics(lines: string[], family: string) {
  const key = lines.join("\n");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("mono-voice: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      inter.waitUntilDone(),
      document.fonts.load(`${VOICE_WGHT} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key: key + family, m: measure(key.split("\n"), family) });
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

export function MonoVoice({
  text = "Same script.\nA whole new\ndelivery.",
  highlight = "delivery.",
  voiceAt = VOICE_AT,
  stagger = RISE_GAP,
  accent,
  ink,
  background,
  fontFamily = inter.fontFamily,
  scale: zoom = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: MonoVoiceProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const portrait = H > W * 1.1;
  const measureW = W * (portrait ? 0.84 : 0.8);

  const lines = useMemo(() => {
    const paras = text
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    const longest = Math.max(1, ...paras.map((p) => p.length));
    const maxChars = portrait ? 14 : 24;
    return longest > maxChars ? wrap(text, maxChars) : paras;
  }, [text, portrait]);
  const m = useMetrics(lines, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const LH = 1.08;
  const hiWords = new Set(
    highlight
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase()),
  );
  const lineHi = m.lines.map((l) =>
    l.chars
      .join("")
      .toLowerCase()
      .split(" ")
      .some((w) => hiWords.has(w)),
  );
  const contrast = lineHi.some(Boolean) && !lineHi.every(Boolean);
  const scale = lineHi.map((h) => (contrast && !h ? SMALL : 1));
  const big = m.lines.filter((_, i) => scale[i] === 1);
  const maxH = H * (portrait ? 0.5 : contrast ? 0.56 : 0.62);
  const longestChars = Math.max(1, ...big.map((l) => l.chars.length));
  const F0 = Math.min(
    measureW / (CELL * longestChars),
    maxH / (big.length * LH),
    H * (portrait ? 0.08 : contrast ? 0.34 : 0.17),
  );
  const voicedW = Math.max(0.1, ...big.map((l) => l.width));
  const F1 = Math.max(
    F0,
    Math.min(F0 * 1.45, measureW / voicedW, maxH / (big.length * LH)),
  );
  const left = portrait ? W * 0.08 : contrast ? W * 0.07 : W * 0.1;
  const nGlyphs = m.lines.reduce((a, l) => a + l.chars.length, 0);
  const gap = Math.min(VOICE_MAX_GAP, VOICE_SPAN / Math.max(1, nGlyphs));
  const voiceOf = (tt: number, idx: number) =>
    spring({
      frame: tt - voiceAt - idx * gap,
      fps,
      config: { damping: 14, stiffness: 160, mass: 0.7 },
    });

  // Every glyph's top edge at a given time, so a frame can be compared with
  // its neighbours.
  const topsAt = (tt: number) => {
    const refitT = interpolate(
      tt,
      [voiceAt + VOICE_SPAN * 0.45, voiceAt + VOICE_SPAN + 16],
      [0, 1],
      { ...CLAMP, easing: Easing.bezier(0.45, 0, 0.2, 1) },
    );
    const Ft = F0 + (F1 - F0) * refitT;
    const heights = scale.map((k) => Ft * k * LH);
    const total = heights.reduce((a, b) => a + b, 0);
    const bigH = heights.reduce((a, h, i) => (scale[i] === 1 ? a + h : a), 0);
    let cs = contrast ? H * 0.1 : (H - total) / 2;
    let cb = H - H * 0.08 - bigH;
    const tops = heights.map((h, i) => {
      if (contrast && scale[i] === 1) {
        const v = cb;
        cb += h;
        return v;
      }
      const v = cs;
      cs += h;
      return v;
    });
    let idx = 0;
    return {
      F: Ft,
      glyphs: m.lines.map((line, li) => {
        const rise = interpolate(
          tt,
          [RISE_AT + li * stagger, RISE_AT + li * stagger + RISE_LEN],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        const Fl = Ft * scale[li];
        const baseY =
          tops[li] + (heights[li] + m.capTop * Fl) / 2 + (1 - rise) * Fl * 0.4;
        return line.chars.map(() => {
          const uc = Math.min(1, Math.max(0, voiceOf(tt, idx++)));
          return baseY - m.baseline * Fl + Math.sin(Math.PI * uc) * -0.05 * Fl;
        });
      }),
    };
  };
  const now = topsAt(t);
  const F = now.F;
  const prev = topsAt(Math.max(0, t - speed));
  const next = topsAt(t + speed);
  const before = prev.glyphs;
  const after = next.glyphs;
  // The refit scales every glyph and slides it along its line, by layout as
  // well as by transform, until its very last frame.
  const refitting = prev.F !== F || next.F !== F;
  // Where a glyph finally settles: risen, voiced and refitted. The layout
  // holds that place for the glyph's whole life.
  const rest = topsAt(1e5);
  const settled = rest.glyphs;

  let gi = 0;
  const nodes = m.lines.flatMap((line, li) => {
    const rise = interpolate(
      t,
      [RISE_AT + li * stagger, RISE_AT + li * stagger + RISE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const Fl = F * scale[li];
    const hiMask: boolean[] = [];
    let ws = 0;
    for (let i = 0; i <= line.chars.length; i++) {
      if (i === line.chars.length || line.chars[i] === " ") {
        const w = line.chars.slice(ws, i).join("").toLowerCase();
        for (let k = ws; k < i; k++) hiMask[k] = hiWords.has(w);
        hiMask[i] = false;
        ws = i + 1;
      }
    }
    let x = left;
    // A glyph's place on the line follows its own voicing and that of every
    // glyph before it, so it moves while any of those still stirs.
    let stirs = false;
    return line.chars.map((ch, i) => {
      const idx = gi++;
      const u = voiceOf(t, idx);
      stirs =
        stirs ||
        Math.abs(voiceOf(t + speed, idx) - u) * Fl > 1e-3 ||
        Math.abs(u - voiceOf(t - speed, idx)) * Fl > 1e-3;
      const uc = Math.min(1, Math.max(0, u));
      const next = i + 1 < line.chars.length ? line.x[i + 1] : line.width;
      const adv = next - line.x[i];
      const slot = (CELL + (adv - CELL) * uc) * Fl;
      const at = x;
      x += slot;
      const hi = hiMask[i] && ch !== " ";
      const wght = MONO_WGHT + ((hi ? HI_WGHT : VOICE_WGHT) - MONO_WGHT) * u;
      const squeeze = Math.min(1, (CELL * 0.9) / Math.max(0.01, adv));
      const sx = squeeze + (1 - squeeze) * uc;
      const color = hi ? mix(c.flat, spot, uc) : mix(c.flat, fg, uc);
      // Layout rounds a baseline to whole pixels, so a glyph eased by `top`,
      // or by a font size that moves the baseline inside its box, clicks
      // pixel by pixel. The glyph is laid out where and as large as it
      // finally settles and gets everywhere else by transform, scaled about
      // its baseline; handing it back to layout at an earlier rest would
      // snap it to the nearest pixel.
      const top = now.glyphs[li][i];
      const moving =
        refitting ||
        stirs ||
        Math.abs(after[li][i] - top) > 1e-3 ||
        Math.abs(top - before[li][i]) > 1e-3;
      const Fs = rest.F * scale[li];
      const home = settled[li][i];
      // The box is as wide as the slot will look after the scale; a glyph
      // wider than its box would spill to the right instead of centring.
      const boxW = (slot * Fs) / Fl;
      const dy = top + m.baseline * Fl - (home + m.baseline * Fs);
      const squash = sx < 0.999 ? ` scaleX(${sx.toFixed(4)})` : "";
      const k = Fl / Fs;
      const transform = `translateY(${Math.abs(dy) > 1e-3 ? dy : 0}px)${Math.abs(k - 1) < 1e-9 ? "" : ` scale(${k})`}${squash}${glide(moving)}`;
      return (
        <div
          key={`${li}-${i}`}
          style={{
            position: "absolute",
            left: at + (slot - boxW) / 2,
            width: boxW,
            top: home,
            height: Fs,
            lineHeight: `${Fs}px`,
            textAlign: "center",
            whiteSpace: "pre",
            fontFamily,
            fontSize: Fs,
            fontVariationSettings: `"wght" ${wght.toFixed(1)}`,
            color,
            opacity: rise,
            transform,
            transformOrigin: `50% ${m.baseline * Fs}px`,
          }}
        >
          {ch}
        </div>
      );
    });
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={zoom}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
