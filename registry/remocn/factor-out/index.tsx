"use client";

import { loadFont } from "@remotion/google-fonts/Rubik";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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

const rubik = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface FactorOutProps {
  heads?: string[];
  tail?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2A1033", ink: "#FFFFFF", accent: "#7CC4FF" },
  light: { bg: "#F3EEF5", ink: "#2A1033", accent: "#2B7BD6" },
} as const;

const DEFAULT_HEADS = ["Write the scenes", "Pick the colors", "Fix the typos"];
const DEFAULT_TAIL = "in your editor.";

const WGHT = 500;
const TRACK = -0.03;
const LH = 1.16;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Metrics = Record<string, number>;

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("factor-out: no 2d context");
  ctx.font = `${WGHT} 100px "${rubik.fontFamily}"`;
  const w: Metrics = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / 100 + TRACK * Array.from(s).length;
  }
  return w;
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("factor-out: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      rubik.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${rubik.fontFamily}"`),
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

export function FactorOut({
  heads = DEFAULT_HEADS,
  tail = DEFAULT_TAIL,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: FactorOutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = heads.length > 0 ? heads : DEFAULT_HEADS;
  const n = list.length;
  const m = useMetrics([" ", tail, ...list]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const mX = W * (portrait ? 0.08 : 0.075);
  const availW = W - mX * 2;
  const maxHead = Math.max(...list.map((h) => m[h]));
  const sp = m[" "];
  const tailW = Math.max(0.1, m[tail]);
  const rowsUnits = n * LH;
  let F = Math.min(
    H * (portrait ? 0.058 : 0.1),
    (availW * 0.98) / (maxHead + sp + tailW),
    (H * 0.8) / (rowsUnits + 0.4 + 1.6 * LH),
  );
  let G = Math.min(2.3, (availW * 0.98) / (tailW * F));
  const fitH = (H * 0.82 - F * (rowsUnits + 0.4)) / (F * LH);
  if (G > fitH) G = Math.max(1, fitH);
  if (G < 1) {
    F = F * G;
    G = 1;
  }
  const rowH = F * LH;
  const gapBelow = F * 0.42;
  const finalH = n * rowH + gapBelow + G * F * LH;
  const colX = mX + (maxHead + sp) * F;

  const span = durationInFrames * speed;
  const k = Math.min(1.5, Math.max(0.85, (span - 50) / 140));
  const enterAt = (i: number) => (6 + i * 8) * k;
  const spotAt = (i: number) => (44 + i * 4) * k;
  const alignAt = 62 * k;
  const MERGE = 15 * k;
  const mergeAt = (i: number) => (86 + i * 18) * k;
  const liftAt = mergeAt(n - 2) + MERGE + 8 * k;
  const LIFT = 26 * k;

  const lineStyle: React.CSSProperties = {
    fontFamily: rubik.fontFamily,
    fontWeight: WGHT,
    fontSize: F,
    lineHeight: `${rowH}px`,
    height: rowH,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre",
  };

  const nodes: React.ReactNode[] = [];

  const align = interpolate(t, [alignAt, alignAt + 22 * k], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const lift = interpolate(t, [liftAt, liftAt + LIFT], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const top = (H - finalH) / 2 + (1 - lift) * ((finalH - n * rowH) / 2);
  const rowY = (i: number) => top + i * rowH;
  const finalY = top + n * rowH + gapBelow;

  for (let i = 0; i < n; i++) {
    const d = enterAt(i);
    if (t < d - 1) continue;
    const pin = interpolate(t, [d, d + 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const y = rowY(i);
    const rise = (1 - pin) * rowH * 0.85;
    nodes.push(
      <div
        key={`h-${i}`}
        style={{
          position: "absolute",
          left: mX - F * 0.1,
          top: y - F * 0.1,
          height: rowH + F * 0.2,
          paddingLeft: F * 0.1,
          paddingRight: F * 0.2,
          paddingTop: F * 0.1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...lineStyle,
            color: c.ink,
            transform: `translateY(${rise.toFixed(2)}px)`,
          }}
        >
          {list[i]}
        </div>
      </div>,
    );

    const x0 = mX + (m[list[i]] + sp) * F;
    const xA = x0 + (colX - x0) * align;
    const last = i === n - 1;
    const mp = last
      ? 0
      : interpolate(t, [mergeAt(i), mergeAt(i) + MERGE], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
    if (mp >= 1) continue;
    const landAt = i > 0 ? mergeAt(i - 1) + MERGE * 0.35 : -1000;
    const bump =
      Math.sin(
        Math.PI *
          interpolate(t, [landAt, landAt + 10 * k], [0, 1], { ...CLAMP }),
      ) * 0.045;
    const xL = xA + (mX - xA) * lift;
    const yL = y + (finalY - y) * lift;
    const scale = 1 + bump + (last ? (G - 1) * lift : 0);
    const tint = interpolate(t, [spotAt(i), spotAt(i) + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    nodes.push(
      <div
        key={`t-${i}`}
        style={{
          position: "absolute",
          left: (last ? xL : xA) - F * 0.1,
          top: (last ? yL : y) - F * 0.1,
          height: rowH + F * 0.2,
          paddingLeft: F * 0.1,
          paddingRight: F * 0.2,
          paddingTop: F * 0.1,
          overflow: pin >= 1 ? "visible" : "hidden",
          zIndex: last ? 2 : 1,
          transform: `scale(${scale.toFixed(4)})`,
          transformOrigin: `${F * 0.1}px ${F * 0.1}px`,
        }}
      >
        <div
          style={{
            ...lineStyle,
            color: interpolateColors(tint, [0, 1], [c.ink, hi]),
            opacity: interpolate(mp, [0.05, 0.85], [1, 0], CLAMP),
            transform: `translateY(${(rise + mp * rowH * 0.55).toFixed(2)}px)`,
          }}
        >
          {tail}
        </div>
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
