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

export interface WhatSticksProps {
  lines?: string[];
  keep?: number;
  moments?: string[];
  forget?: number[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2A1033", ink: "#FFFFFF", accent: "#7CC4FF", ghost: 0.17 },
  light: { bg: "#F3EEF5", ink: "#2A1033", accent: "#2B7BD6", ghost: 0.2 },
} as const;

const DEFAULT_LINES = [
  "Scenes install with one command.",
  "Every word on screen is a prop.",
  "Transitions land on the beat.",
  "Captions come from the transcript.",
  "You own every file.",
  "It renders on your laptop.",
];

const DEFAULT_MOMENTS = [
  "Tonight, you’ll remember all of it.",
  "Tomorrow, about half.",
  "Next week, just this.",
];

const WGHT = 500;
const TRACK = -0.025;
const LH = 1.2;
const SLUG = 0.5;

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
  if (!ctx) throw new Error("what-sticks: no 2d context");
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
  const [handle] = useState(() => delayRender("what-sticks: measuring"));
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

const lineW = (words: string[], m: Metrics) =>
  m[words.join(" ")] ?? words.reduce((a, w) => a + m[w], 0);

function splitTwo(text: string, m: Metrics): string[] {
  const words = text.split(" ").filter(Boolean);
  if (words.length < 2) return [text];
  let best: string[] = [text];
  let bestW = Number.POSITIVE_INFINITY;
  for (let cut = 1; cut < words.length; cut++) {
    const a = words.slice(0, cut).join(" ");
    const b = words.slice(cut).join(" ");
    const w = Math.max(m[a], m[b]);
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

function prefixes(text: string): string[] {
  const words = text.split(" ").filter(Boolean);
  const out: string[] = [];
  for (let i = 1; i <= words.length; i++) {
    out.push(words.slice(0, i).join(" "));
    out.push(words.slice(i).join(" "));
  }
  return out;
}

const hash = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function WhatSticks({
  lines = DEFAULT_LINES,
  keep,
  moments = DEFAULT_MOMENTS,
  forget,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: WhatSticksProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = lines.length > 0 ? lines : DEFAULT_LINES;
  const steps = moments.length > 0 ? moments : DEFAULT_MOMENTS;
  const n = list.length;
  const kept = Math.min(
    n - 1,
    Math.max(0, keep ?? Math.min(n - 1, Math.floor(n * 0.7))),
  );

  const m = useMetrics([...list.flatMap(prefixes), ...steps]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const availW = W * (portrait ? 0.84 : 0.8);
  let F = 0;
  let blocks: string[][] = [];
  for (const L of [1, 2]) {
    const target = Math.max(
      ...list.map((s) => Math.max(...splitTwo(s, m).map((r) => m[r]))),
    );
    const b = list.map((s) =>
      L === 1 || m[s] <= target ? [s] : splitTwo(s, m),
    );
    const widest = Math.max(
      0.1,
      ...b.flat().map((r) => lineW([r], m)),
      ...steps.map((s) => m[s] * SLUG),
    );
    const rows = b.reduce((a, x) => a + x.length, 0);
    const size = Math.min(
      H * (portrait ? 0.062 : 0.092),
      availW / widest,
      (H * (portrait ? 0.7 : 0.8)) / (rows * LH + SLUG * 1.6 + 0.9),
    );
    if (size > F * 1.12) {
      F = size;
      blocks = b;
    }
  }

  const S = F * SLUG;
  const slugH = S * 1.5;
  const gapAfterSlug = F * 0.75;
  const rowH = F * LH;
  const totalRows = blocks.reduce((a, x) => a + x.length, 0);
  const blockH = slugH + gapAfterSlug + totalRows * rowH;
  const top = (H - blockH) / 2;

  const others = list.map((_, i) => i).filter((i) => i !== kept);
  const order =
    forget && forget.length > 0
      ? [
          ...forget.filter((i) => i !== kept && i >= 0 && i < n),
          ...others.filter((i) => !forget.includes(i)),
        ]
      : [...others].sort((a, b) => hash(a, n) - hash(b, n));

  const stepCount = Math.max(1, steps.length);
  const span = durationInFrames * speed;
  const enterOf = (i: number) => 10 + i * 5;
  const first = enterOf(n - 1) + 18 + 30;
  const gap =
    stepCount > 2
      ? Math.min(90, Math.max(42, (span - first - 100) / (stepCount - 2)))
      : 0;
  const stepAt = (s: number) => first + (s - 1) * gap;

  const forgottenAt = new Map<number, { step: number; rank: number }>();
  if (stepCount > 1) {
    let done = 0;
    for (let s = 1; s < stepCount; s++) {
      const target = Math.round(((n - 1) * s) / (stepCount - 1));
      for (let r = 0; done < target; r++, done++) {
        forgottenAt.set(order[done], { step: s, rank: r });
      }
    }
  }

  const slugIndex = (() => {
    let k = 0;
    for (let s = 1; s < stepCount; s++) if (t >= stepAt(s)) k = s;
    return k;
  })();

  const nodes: React.ReactNode[] = [];

  for (let s = 0; s < stepCount; s++) {
    const tin = s === 0 ? 0 : stepAt(s);
    const tout = s + 1 < stepCount ? stepAt(s + 1) : Number.POSITIVE_INFINITY;
    if (t < tin - 1 || t > tout + 14) continue;
    if (Math.abs(s - slugIndex) > 1) continue;
    const enter = s === 0 ? tin : tin + 6;
    const pin = interpolate(t, [enter, enter + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const pout = Number.isFinite(tout)
      ? interpolate(t, [tout, tout + 5], [0, 1], {
          ...CLAMP,
          easing: EASE_IN_OUT,
        })
      : 0;
    const last = s === stepCount - 1;
    nodes.push(
      <div
        key={`slug-${s}`}
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top,
          height: slugH,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontFamily: rubik.fontFamily,
            fontWeight: 400,
            fontSize: S,
            lineHeight: `${slugH}px`,
            letterSpacing: "-0.005em",
            whiteSpace: "pre",
            color: last
              ? interpolateColors(
                  Math.min(Math.max(t, tin + 6), tin + 20),
                  [tin + 6, tin + 20],
                  [c.ink, hi],
                )
              : c.ink,
            opacity: (0.72 + (last ? 0.28 : 0)) * (1 - pout) * pin,
            transform: `translateY(${((1 - pin) * slugH * 0.6).toFixed(2)}px)`,
          }}
        >
          {steps[s]}
        </div>
      </div>,
    );
  }

  let row = 0;
  const finalStep = stepCount - 1;
  const glowAt = stepAt(Math.max(1, finalStep)) + 22;
  for (let i = 0; i < n; i++) {
    const rows = blocks[i];
    const y0 = top + slugH + gapAfterSlug + row * rowH;
    row += rows.length;
    const d = enterOf(i);
    if (t < d - 1) continue;
    const pin = interpolate(t, [d, d + 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const f = forgottenAt.get(i);
    let alpha = 1;
    if (f) {
      const fs = stepAt(f.step) + 10 + f.rank * 5;
      alpha = interpolate(t, [fs, fs + 20], [1, c.ghost], {
        ...CLAMP,
        easing: EASE_IN_OUT,
      });
    }
    const isKept = i === kept && stepCount > 1;
    const glow = isKept
      ? interpolate(t, [glowAt, glowAt + 18], [0, 1], {
          ...CLAMP,
          easing: EASE_IN_OUT,
        })
      : 0;
    const color = isKept ? interpolateColors(glow, [0, 1], [c.ink, hi]) : c.ink;
    nodes.push(
      <div
        key={`line-${i}`}
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: y0 - F * 0.12,
          height: rows.length * rowH + F * 0.24,
          overflow: "hidden",
          opacity: alpha,
          transform: `scale(${1 + glow * 0.05})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            paddingTop: F * 0.12,
            transform: `translateY(${((1 - pin) * rowH * 0.9).toFixed(2)}px)`,
          }}
        >
          {rows.map((r) => (
            <div
              key={r}
              style={{
                width: "100%",
                height: rowH,
                textAlign: "center",
                fontFamily: rubik.fontFamily,
                fontWeight: WGHT,
                fontSize: F,
                lineHeight: `${rowH}px`,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                color,
              }}
            >
              {r}
            </div>
          ))}
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
