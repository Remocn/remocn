"use client";

import { loadFont } from "@remotion/google-fonts/Lexend";
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

const lexend = loadFont("normal", {
  weights: ["300"],
  subsets: ["latin"],
});

export interface FeatherSettleProps {
  text?: string;
  highlight?: string;
  stagger?: number;
  fall?: number;
  sway?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#3A2F25", ink: "#EFE6D8", accent: "#9DBF9E" },
  light: { bg: "#EFE6D8", ink: "#3A2F25", accent: "#5E8B60" },
} as const;

const FIRST = 4;
const CYCLES = 1.55;
const TILT = 7;

const DRIFT = Easing.bezier(0.3, 0.05, 0.25, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  words: number[];
  space: number;
  baseline: number;
}

function measure(words: string[]): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) {
    return {
      words: words.map((w) => w.length * 0.55),
      space: 0.26,
      baseline: 0.8,
    };
  }
  ctx.font = `300 100px "${lexend.fontFamily}"`;
  const fm = ctx.measureText("H");
  const asc = fm.fontBoundingBoxAscent / 100;
  const desc = fm.fontBoundingBoxDescent / 100;
  return {
    words: words.map((w) => ctx.measureText(w).width / 100),
    space: ctx.measureText(" ").width / 100,
    baseline: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(words: string[]) {
  const key = words.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("feather-settle: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      lexend.waitUntilDone(),
      document.fonts.load(`300 100px "${lexend.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(key.split("\u0001")) });
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

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function FeatherSettle({
  text = "Your launch, landing softly.",
  highlight = "softly",
  stagger = 13,
  fall = 68,
  sway = 1,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: FeatherSettleProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const m = useMetrics(words);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = portrait ? W * 0.08 : W * 0.1;
  const room = W - margin * 2;
  const lineEm =
    m.words.reduce((a, w) => a + w, 0) +
    m.space * Math.max(0, words.length - 1);
  const F = Math.min(
    room / Math.max(0.5, lineEm),
    H * (portrait ? 0.06 : 0.12),
  );
  const lineW = lineEm * F;
  const baseY = H * (portrait ? 0.78 : 0.82);
  const x0 = (W - lineW) / 2;
  const hl = highlight
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  let x = x0;
  const placed = words.map((w, i) => {
    const left = x;
    x += m.words[i] * F + m.space * F;
    return { w, left, width: m.words[i] * F };
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {placed.map((p, i) => {
        const start = FIRST + i * stagger;
        const k = interpolate(t, [start, start + fall], [0, 1], CLAMP);
        const drop = DRIFT(k);
        const height = H * (portrait ? 0.5 : 0.6) * (0.9 + hash(i) * 0.2);
        const y = -height * (1 - drop);
        const amp = F * 0.85 * sway * (1 - k) ** 1.6;
        const phase = hash(i + 7) * Math.PI * 2;
        const dir = i % 2 === 0 ? 1 : -1;
        const angle = Math.PI * 2 * CYCLES * k + phase;
        const dx = dir * amp * Math.sin(angle);
        const tilt = dir * TILT * sway * (1 - k) ** 1.6 * Math.cos(angle);
        const seen = interpolate(k, [0, 0.22], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const lit =
          hl.length > 0 && p.w.toLowerCase().replace(/[^a-z0-9]/g, "") === hl;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: baseY - m.baseline * F,
              width: p.width,
              height: F,
              lineHeight: `${F}px`,
              fontFamily: lexend.fontFamily,
              fontWeight: 300,
              fontSize: F,
              letterSpacing: "-0.01em",
              whiteSpace: "pre",
              color: lit ? spot : c.ink,
              opacity: seen,
              transformOrigin: "50% 0%",
              transform: `translate(${dx.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${tilt.toFixed(3)}deg)`,
            }}
          >
            {p.w}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
