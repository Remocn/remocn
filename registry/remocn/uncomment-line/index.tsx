"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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
import { useGlide } from "@/lib/remocn/glide";

const geist = loadGeist("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface UncommentLineProps {
  lines?: string[];
  marker?: string;
  highlight?: number;
  /** Frames between one line uncommenting and the next. */
  stagger?: number;
  /** Opacity of a line while it is still commented out. */
  dim?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines (the marker stays mono). Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the lines, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { pink: "#F472B6", bg: "#14151A", ink: "#FBF0DF" },
  light: { pink: "#C2185B", bg: "#FBF0DF", ink: "#14151A" },
} as const;

const TRACK = -0.035;
const LEADING = 1.06;
const MARK_SCALE = 0.62;
const DIM = 0.28;

const RISE_LEN = 16;
const RISE_GAP = 4;
const OPEN_AT = 34;
const OPEN_GAP = 13;
const OPEN_LEN = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  lines: number[];
  marker: number;
  cap: number;
  base: number;
  baseM: number;
}

const baseOf = (asc: number, desc: number) => (1 - (asc + desc)) / 2 + asc;

function measure(lines: string[], marker: string, fontFamily: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("uncomment-line: no 2d context");
  ctx.font = `500 100px "${fontFamily}"`;
  const widths = lines.map(
    (s) =>
      ctx.measureText(s).width / 100 +
      TRACK * Math.max(0, Array.from(s).length - 1),
  );
  const hm = ctx.measureText("H");
  ctx.font = `400 100px "${geistMono.fontFamily}"`;
  const mm = ctx.measureText(marker);
  return {
    lines: widths,
    marker: mm.width / 100,
    cap: hm.actualBoundingBoxAscent / 100,
    base: baseOf(
      hm.fontBoundingBoxAscent / 100,
      hm.fontBoundingBoxDescent / 100,
    ),
    baseM: baseOf(
      mm.fontBoundingBoxAscent / 100,
      mm.fontBoundingBoxDescent / 100,
    ),
  };
}

function useMetrics(lines: string[], marker: string, fontFamily: string) {
  const key = [marker, ...lines].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("uncomment-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [mk, ...ls] = key.split("\u0001");
    Promise.all([
      geist.waitUntilDone(),
      geistMono.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${geistMono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(ls, mk, fontFamily) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, fontFamily, handle]);
  return state && state.key === key ? state.m : null;
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

export function UncommentLine({
  lines = ["Fork the scenes.", "Change anything.", "Own the cut."],
  marker = "// ",
  highlight = -1,
  stagger = OPEN_GAP,
  dim = DIM,
  accent,
  ink,
  background,
  fontFamily = geist.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: UncommentLineProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.pink;
  const fg = ink ?? c.ink;
  const list = lines.length > 0 ? lines : [" "];
  const m = useMetrics(list, marker, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);
  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const hl = highlight < 0 ? list.length + highlight : highlight;
  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.085);
  const measureW = W - 2 * margin;
  const markEm = m.marker * MARK_SCALE;
  const widest = Math.max(...m.lines) + markEm;
  const F = Math.min(
    (H * (portrait ? 0.4 : 0.7)) / (list.length * LEADING),
    measureW / widest,
  );
  const lineH = F * LEADING;
  const blockH = lineH * (list.length - 1) + m.cap * F;
  const firstBase = (H - blockH) / 2 + m.cap * F;
  const M = F * MARK_SCALE;

  const nodes = list.map((line, i) => {
    const baseY = firstBase + i * lineH;
    const r = interpolate(t, [i * RISE_GAP, i * RISE_GAP + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const at = OPEN_AT + i * stagger;
    const o = interpolate(t, [at, at + OPEN_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const lit = interpolate(t, [at + 2, at + OPEN_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const textLeft = margin + markEm * F * (1 - o);
    const h = F * 1.3;
    const top = baseY - F * 1.05;
    // The rise is a transform, not `top`: layout rounds a baseline to whole
    // pixels, so a line eased by `top` clicks up pixel by pixel. It stays at
    // zero once risen: the mark rides on it, and text that lost its transform
    // at rest would snap to the pixel grid.
    const drop = (1 - r) * h;
    const rise = `translateY(${drop > 1e-3 ? drop : 0}px)${glide(drop > 1e-3)}`;
    const color = i === hl ? spot : fg;
    const markOpacity = 1 - interpolate(o, [0, 0.6], [0, 1], CLAMP);
    return (
      <div key={`l${i}`}>
        {markOpacity > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: margin - F * 0.05,
              top,
              width: markEm * F + F * 0.1,
              height: h,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: F * 0.05 - o * markEm * F * 0.6,
                top: F * 1.05 - m.baseM * M,
                transform: rise,
                height: M,
                lineHeight: `${M}px`,
                fontFamily: geistMono.fontFamily,
                fontWeight: 400,
                fontSize: M,
                whiteSpace: "pre",
                color: spot,
                opacity: markOpacity,
              }}
            >
              {marker}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: textLeft - F * 0.05,
            top,
            width: m.lines[i] * F + F * 0.2,
            height: h,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: F * 0.05,
              top: F * 1.05 - m.base * F,
              transform: rise,
              height: F,
              lineHeight: `${F}px`,
              fontFamily,
              fontWeight: 500,
              fontSize: F,
              letterSpacing: `${TRACK}em`,
              whiteSpace: "pre",
              color,
              opacity: dim + (1 - dim) * lit,
            }}
          >
            {line}
          </div>
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
