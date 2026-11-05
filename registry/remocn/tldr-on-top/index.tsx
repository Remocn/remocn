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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const rubik = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface TldrOnTopProps {
  text?: string;
  label?: string;
  lines?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2A1033", ink: "#FFFFFF", accent: "#7CC4FF" },
  light: { bg: "#F3EEF5", ink: "#2A1033", accent: "#2B7BD6" },
} as const;

const DEFAULT_TEXT =
  "Last spring we had a launch on Thursday and no video. The timeline editor crashed twice, every export took forty minutes, and each copy change meant opening the project, finding the layer and rendering the whole thing again. So we tried something else: we wrote the video the way we write the product. Every scene became a React component, with props for its words and its colors. The brand moved into one config file, so a new color reached every shot at once. A typo turned into a one-line commit. Transitions became functions you could read, review and reuse. The film now lives in the same repo as the code, gets reviewed in pull requests like everything else, and renders on the laptop it was written on. You install a scene with one command, change its words, and every file is yours to keep. That’s the whole story, more or less, and it took us a lot longer to tell than it will take you to try.";

const DEFAULT_LINES = [
  "Every scene is a component.",
  "Your brand is one file.",
  "It renders on your laptop.",
];

const WGHT = 500;
const TRACK = -0.03;
const LH = 1.08;
const WALL_LH = 1.42;
const LABEL = 0.4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Metrics = Record<string, number>;

function measureAll(texts: string[], wall: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("tldr-on-top: no 2d context");
  ctx.font = `${WGHT} 100px "${rubik.fontFamily}"`;
  const w: Metrics = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / 100 + TRACK * Array.from(s).length;
  }
  ctx.font = `400 100px "${rubik.fontFamily}"`;
  w["\u0002wall"] = ctx.measureText(wall).width / 100;
  return w;
}

function useMetrics(texts: string[], wall: string) {
  const key = `${texts.join("\u0001")}\u0003${wall}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("tldr-on-top: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      rubik.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${rubik.fontFamily}"`),
      document.fonts.load(`400 100px "${rubik.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [head, body] = key.split("\u0003");
        setState({ key, m: measureAll(head.split("\u0001"), body) });
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

export function TldrOnTop({
  text = DEFAULT_TEXT,
  label = "TL;DR",
  lines = DEFAULT_LINES,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: TldrOnTopProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = lines.length > 0 ? lines : DEFAULT_LINES;
  const m = useMetrics([label, ...list.flatMap(prefixes)], text);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const mX = W * (portrait ? 0.08 : 0.065);
  const mY = H * (portrait ? 0.07 : 0.09);
  const colW = W - mX * 2;

  let F = 0;
  let blocks: string[][] = [];
  for (const L of [1, 2]) {
    const b = list.map((s) => (L === 1 ? [s] : splitTwo(s, m)));
    const widest = Math.max(0.1, ...b.flat().map((r) => m[r]));
    const rows = b.reduce((a, x) => a + x.length, 0);
    const size = Math.min(
      H * (portrait ? 0.068 : 0.112),
      (colW * 0.98) / widest,
      (H * 0.66) / (rows * LH + LABEL * 1.6 + 0.3),
    );
    if (size > F * 1.12) {
      F = size;
      blocks = b;
    }
  }

  const availWall = H - mY * 2;
  const wallUnits = m["\u0002wall"] * 1.08;
  const s = Math.min(
    H * (portrait ? 0.03 : 0.044),
    Math.max(
      H * (portrait ? 0.016 : 0.024),
      Math.sqrt((availWall * colW) / (wallUnits * WALL_LH)),
    ),
  );
  const wallRowH = s * WALL_LH;

  const labelS = F * LABEL;
  const heights = [
    labelS * 1.6,
    ...blocks.map((b, i) => b.length * F * LH + (i === 0 ? F * 0.06 : 0)),
  ];
  const headGap = F * 0.5;

  const span = durationInFrames * speed;
  const READ = 34;
  const STEP = Math.min(30, Math.max(18, (span - READ - 110) / list.length));
  const insertAt = (k: number) => READ + k * STEP;
  const OPEN = 18;
  const opens = heights.map((_, k) =>
    interpolate(t, [insertAt(k), insertAt(k) + OPEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    }),
  );
  const headTotal = heights.reduce((a, h, k) => a + h * opens[k], 0);
  const gapNow = headGap * opens[0];
  const restTop = mY + heights.reduce((a, h) => a + h, 0) + headGap;
  const sliverTop = Math.min(H - wallRowH * 3.4, restTop + H * 0.12);
  const pushStart = insertAt(heights.length - 1) + OPEN - 4;
  const push = interpolate(t, [pushStart, pushStart + 26], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });
  const wallTop =
    mY + headTotal + gapNow + Math.max(0, sliverTop - restTop) * push;

  const wallIn = interpolate(t, [0, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dim = interpolate(
    headTotal / heights.reduce((a, h) => a + h, 0),
    [0, 1],
    [0.86, 0.42],
  );

  const nodes: React.ReactNode[] = [];
  let y = mY;
  for (let k = 0; k < heights.length; k++) {
    const h = heights[k];
    const open = opens[k];
    if (open <= 0) {
      continue;
    }
    const reveal = interpolate(
      t,
      [insertAt(k) + 8, insertAt(k) + OPEN + 8],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const content =
      k === 0 ? (
        <div
          style={{
            fontFamily: rubik.fontFamily,
            fontWeight: WGHT,
            fontSize: labelS,
            lineHeight: `${labelS * 1.2}px`,
            letterSpacing: "0.01em",
            color: hi,
            whiteSpace: "pre",
          }}
        >
          {label}
        </div>
      ) : (
        blocks[k - 1].map((r) => (
          <div
            key={r}
            style={{
              height: F * LH,
              fontFamily: rubik.fontFamily,
              fontWeight: WGHT,
              fontSize: F,
              lineHeight: `${F * LH}px`,
              letterSpacing: `${TRACK}em`,
              color: c.ink,
              whiteSpace: "pre",
            }}
          >
            {r}
          </div>
        ))
      );
    nodes.push(
      <div
        key={`h-${k}`}
        style={{
          position: "absolute",
          left: mX - F * 0.1,
          top: y,
          width: colW + F * 0.2,
          height: h * open + F * 0.2,
          overflow: "hidden",
          paddingLeft: F * 0.1,
        }}
      >
        <div
          style={{
            paddingTop: k === 0 ? 0 : F * 0.06,
            opacity: reveal,
            transform: `translateY(${((1 - reveal) * -h * 0.35).toFixed(2)}px)`,
          }}
        >
          {content}
        </div>
      </div>,
    );
    y += h * open;
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: mX,
          top: wallTop,
          width: colW,
          fontFamily: rubik.fontFamily,
          fontWeight: 400,
          fontSize: s,
          lineHeight: `${wallRowH}px`,
          letterSpacing: "-0.005em",
          color: c.ink,
          opacity: wallIn * dim,
          transform: `translateY(${((1 - wallIn) * s).toFixed(2)}px)`,
          textWrap: "pretty",
        }}
      >
        {text}
      </div>
      {nodes}
    </AbsoluteFill>
  );
}
