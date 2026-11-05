"use client";

import { loadFont } from "@remotion/google-fonts/RedHatDisplay";
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

const redHat = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface LayoverProps {
  from?: string;
  word?: string;
  stops?: string[];
  to?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#B84A26", ink: "#FFF1E0", accent: "#8FD3FF" },
  light: { bg: "#FFF1E0", ink: "#B84A26", accent: "#1B4F72" },
} as const;

const WGHT = 500;
const TRACK = -0.03;
const FONT_PX = 200;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_LEG = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const A_IN = 0;
const WORD_STAGGER = 3;
const LIFT = 26;
const LEG = 22;
const BOARD = 11;
const HOLD = 20;
const SETTLE = 10;

interface Metrics {
  w: Record<string, number>;
  asc: number;
  desc: number;
}

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("layover: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${redHat.fontFamily}"`;
  const w: Record<string, number> = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  }
  const fm = ctx.measureText("Hxg");
  return {
    w,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("layover: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      redHat.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${redHat.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureAll(key.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

export function Layover({
  from = "Write it",
  word = "here.",
  stops = ["w", "every"],
  to = "Plays",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: LayoverProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const finalWord = [...stops].reverse().join("") + word;
  const fromWords = from.split(" ").filter(Boolean);
  const lineA = `${from} ${word}`;
  const lineB = `${to} ${finalWord}`;
  const m = useMetrics([
    lineA,
    lineB,
    word,
    finalWord,
    ...stops,
    ...fromWords.map((_, i) => fromWords.slice(0, i).join(" ")),
    ...fromWords.map((_, i) => `${fromWords.slice(0, i + 1).join(" ")} `),
  ]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginY = H * (portrait ? 0.1 : 0.11);
  const measureW = W - marginX * 2;
  const widest = Math.max(m.w[lineA], m.w[lineB], 0.1);
  const F = Math.min(H * (portrait ? 0.075 : 0.19), measureW / widest);

  const boxTop = (base: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * F;
  const capH = F * 0.7;
  const baseA = marginY + capH;
  const baseB = H - marginY;

  const leftA = marginX;
  const rx0 = leftA + m.w[lineA] * F;
  const rx3 = W - marginX;
  const leftB = rx3 - m.w[lineB] * F;

  const n = stops.length;
  const legStart = (k: number) => LIFT + k * (LEG + HOLD);
  const arriveAt = (k: number) => legStart(k) + LEG;
  const landAt = arriveAt(n);
  const fracs = Array.from({ length: n + 2 }, (_, k) => k / (n + 1));

  let progress = 0;
  for (let k = 0; k <= n; k++) {
    const p = interpolate(t, [legStart(k), arriveAt(k)], [0, 1], {
      ...CLAMP,
      easing: EASE_LEG,
    });
    progress = p > 0 ? fracs[k] + p * (fracs[k + 1] - fracs[k]) : progress;
  }
  const rx = rx0 + (rx3 - rx0) * progress;
  const base = baseA + (baseB - baseA) * progress;
  const lift =
    interpolate(t, [LIFT - 6, LIFT + 4], [0, 1], CLAMP) *
    (1 - interpolate(t, [landAt - 8, landAt], [0, 1], CLAMP));
  const touch =
    t > landAt
      ? Math.sin(Math.min(1, (t - landAt) / SETTLE) * Math.PI) *
        F *
        0.025 *
        (1 - Math.min(1, (t - landAt) / SETTLE))
      : 0;

  const textStyle = (size: number): React.CSSProperties => ({
    position: "absolute",
    height: size,
    lineHeight: `${size}px`,
    whiteSpace: "pre",
    fontFamily: redHat.fontFamily,
    fontWeight: WGHT,
    fontSize: size,
    letterSpacing: `${TRACK}em`,
  });

  const rise = (start: number) =>
    interpolate(t, [start, start + 16], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const nodes: React.ReactNode[] = [];

  const wordsA = [...fromWords, word];
  wordsA.forEach((wd, i) => {
    const x =
      i === 0
        ? 0
        : i < fromWords.length
          ? m.w[`${fromWords.slice(0, i).join(" ")} `] * F
          : m.w[`${fromWords.join(" ")} `] * F;
    const p = rise(A_IN + i * WORD_STAGGER);
    nodes.push(
      <div
        key={`a${i}`}
        style={{
          position: "absolute",
          left: leftA + x,
          top: boxTop(baseA) - F * 0.1,
          height: F * 1.3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...textStyle(F),
            position: "relative",
            top: F * 0.1,
            color: c.ink,
            transform: `translateY(${((1 - p) * F * 1.4).toFixed(2)}px)`,
          }}
        >
          {wd}
        </div>
      </div>,
    );
  });

  const toIn = rise(legStart(n) - 4);
  nodes.push(
    <div
      key="to"
      style={{
        position: "absolute",
        left: leftB,
        top: boxTop(baseB) - F * 0.1,
        height: F * 1.3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...textStyle(F),
          position: "relative",
          top: F * 0.1,
          color: c.ink,
          transform: `translateY(${((1 - toIn) * F * 1.4).toFixed(2)}px)`,
        }}
      >
        {to}
      </div>
    </div>,
  );

  if (t >= LIFT - 6) {
    let xRight = rx - m.w[word] * F;
    const parts: { s: string; x: number; p: number }[] = [
      { s: word, x: xRight, p: 1 },
    ];
    stops.forEach((s, k) => {
      xRight -= m.w[s] * F;
      const p = interpolate(
        t,
        [arriveAt(k) + 2, arriveAt(k) + 2 + BOARD],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      parts.push({ s, x: xRight, p });
    });
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part.p <= 0) continue;
      nodes.push(
        <div
          key={`w${i}`}
          style={{
            ...textStyle(F),
            left: part.x,
            top: boxTop(base) - lift * F * 0.04 + touch,
            color: hi,
            opacity: part.p,
            transform: `translateY(${(-(1 - part.p) * F * 0.55).toFixed(2)}px)`,
          }}
        >
          {part.s}
        </div>,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
