"use client";

import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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

const plex = loadPlexMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PressStatProps {
  before?: string;
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  accent?: string;
  /** Color of the caption words; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; IBM Plex Mono by default. */
  fontFamily?: string;
  /** Frame at which the number presses in and starts counting. */
  pressAt?: number;
  /** Frames the count takes to reach `value`. */
  countLength?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const GREEN = { dark: "#00C805", light: "#00873C" } as const;

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF" },
  light: { bg: "#FFFFFF", ink: "#000000" },
} as const;

const RISE_LEN = 14;
const RISE_GAP = 4;
const PRESS_AT = 30;
const COUNT_LEN = 42;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const INFLATE = { damping: 16, stiffness: 70, mass: 1 };

interface Metrics {
  adv: number;
  cap: number;
  base: number;
}

function measure(fontFamily: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("press-stat: no 2d context");
  ctx.font = `500 100px "${fontFamily}"`;
  const m = ctx.measureText("0000000000");
  const asc = m.fontBoundingBoxAscent / 100;
  const desc = m.fontBoundingBoxDescent / 100;
  return {
    adv: m.width / 1000,
    cap: m.actualBoundingBoxAscent / 100,
    base: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(fontFamily: string) {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("press-stat: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      plex.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setM(measure(fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, fontFamily]);
  return m;
}

const fmt = (n: number) => Math.max(0, Math.floor(n)).toLocaleString("en-US");

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

export function PressStat({
  before = "Edit time down",
  value = 73,
  from = 0,
  prefix = "",
  suffix = "%",
  accent,
  ink,
  background,
  fontFamily = plex.fontFamily,
  pressAt = PRESS_AT,
  countLength = COUNT_LEN,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: PressStatProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const green = accent ?? GREEN[theme];
  const fg = ink ?? c.ink;
  const m = useMetrics(fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.07 : 0.075);
  const M = W - 2 * margin;

  const target = Math.max(0, Math.floor(value));
  const start = Math.min(target, Math.max(0, Math.floor(from)));
  const pCount = interpolate(t, [pressAt, pressAt + countLength], [0, 1], {
    ...CLAMP,
    easing: EASE_COUNT,
  });
  const shown = Math.round(start + (target - start) * pCount);
  const numText = `${prefix}${fmt(shown)}${suffix}`;
  const finalText = `${prefix}${fmt(target)}${suffix}`;
  const startText = `${prefix}${fmt(start)}${suffix}`;
  const len = (s: string) => Array.from(s).length;

  const words = before.split(" ").filter(Boolean);
  const wordsEm = len(before) * m.adv;
  const gapEm = m.adv;

  const Fw = Math.min(
    H * (portrait ? 0.045 : 0.085),
    (M * 0.82) /
      (wordsEm + (words.length ? gapEm : 0) + len(startText) * m.adv),
  );
  const Fh = Math.min(
    (H * (portrait ? 0.3 : 0.62)) / m.cap,
    (M * 0.58) / (len(finalText) * m.adv),
  );

  const g = spring({ frame: t - pressAt, fps, config: INFLATE });
  const gc = Math.min(1, Math.max(0, g));
  const Fn = Fw + (Fh - Fw) * g;

  const numW = len(numText) * m.adv * Fn;
  const line0 =
    (wordsEm + (words.length ? gapEm : 0) + len(startText) * m.adv) * Fw;
  const left0 = (W - line0) / 2;
  const numRight0 = left0 + line0;
  const numRight = numRight0 + (W - margin - numRight0) * gc;
  const numLeft = numRight - numW;

  const wordsLeft = left0 + (margin - left0) * gc;
  const room = numLeft - gapEm * Fw - wordsLeft;
  const Fwords = words.length
    ? Math.max(Fw * 0.3, Math.min(Fw, room / Math.max(0.01, wordsEm)))
    : Fw;

  const base0 = (H + m.cap * Fw) / 2;
  const base1 = (H + m.cap * Fh) / 2;
  const baseY = base0 + (base1 - base0) * gc;

  const rise = (i: number) =>
    interpolate(t, [i * RISE_GAP, i * RISE_GAP + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const masked = (
    key: string,
    x: number,
    F: number,
    r: number,
    text: string,
    color: string,
    weight: number,
  ) => {
    const h = F * 1.25;
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: x - F * 0.05,
          top: baseY - m.cap * F - F * 0.2,
          width: len(text) * m.adv * F + F * 0.1,
          height: h,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: F * 0.05,
            top: F * 0.2 + m.cap * F - m.base * F + (1 - r) * h,
            height: F,
            lineHeight: `${F}px`,
            fontFamily,
            fontWeight: weight,
            fontSize: F,
            whiteSpace: "pre",
            color,
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  const nodes: React.ReactNode[] = [];
  let x = wordsLeft;
  words.forEach((w, i) => {
    nodes.push(masked(`w${i}`, x, Fwords, rise(i), w, fg, 400));
    x += (len(w) + 1) * m.adv * Fwords;
  });
  nodes.push(masked("n", numLeft, Fn, rise(words.length), numText, green, 500));

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
