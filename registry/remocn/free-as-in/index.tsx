"use client";

import { loadFont } from "@remotion/google-fonts/AlbertSans";
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

const albert = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface FreeAsInProps {
  word?: string;
  glosses?: string[];
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Albert Sans by default. */
  fontFamily?: string;
  /** Weight of the big word. */
  fontWeight?: number;
  /** Frames the last gloss holds before the end. */
  hold?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#141414", ink: "#FFFFFF", accent: "#3DD9FF" },
  light: { bg: "#FFFFFF", ink: "#000000", accent: "#0077B6" },
} as const;

const DEFAULT_GLOSSES = [
  "as in beer.",
  "as in speech.",
  "as in no seats.",
  "as in yours.",
];

const TRACK_WORD = -0.045;
const TRACK_GLOSS = -0.015;
const GLH = 1.22;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function useWidths(keys: string[], fontFamily: string, fontWeight: number) {
  const key = `${fontFamily}\u0001${keys.join("\u0001")}`;
  const [state, setState] = useState<{
    key: string;
    w: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("free-as-in: measuring"));
  const released = useRef(false);
  const ref = useRef(keys);
  ref.current = keys;
  useEffect(() => {
    let live = true;
    Promise.all([
      albert.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const w: Record<string, number> = {};
        for (const k of ref.current) {
          const cut = k.indexOf("|");
          const wt = k.slice(0, cut);
          const s = k.slice(cut + 1);
          if (ctx) ctx.font = `${wt} 100px "${fontFamily}"`;
          w[k] = ctx ? ctx.measureText(s).width / 100 : s.length * 0.5;
        }
        setState({ key, w });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily, fontWeight]);
  return state && state.key === key ? state.w : null;
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

export function FreeAsIn({
  word = "Free",
  glosses = DEFAULT_GLOSSES,
  accent,
  ink,
  background,
  fontFamily = albert.fontFamily,
  fontWeight = 500,
  hold = 46,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: FreeAsInProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const T = (durationInFrames - delay) * speed;
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = glosses.filter((s) => s.trim().length > 0);
  const keys = [`${fontWeight}|${word}`, ...list.map((s) => `400|${s}`)];
  const w = useWidths(keys, fontFamily, fontWeight);

  if (!w) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const adv = (wt: number, s: string, track: number) =>
    (w[`${wt}|${s}`] ?? 0) + track * Array.from(s).length;

  const portrait = H > W * 1.1;
  const n = list.length;
  const left = W * (portrait ? 0.08 : 0.07);
  const wordEm = Math.max(0.01, adv(fontWeight, word, TRACK_WORD));
  const glossEm = Math.max(0.01, ...list.map((s) => adv(400, s, TRACK_GLOSS)));

  let Fw: number;
  let Fg: number;
  let gx: number;
  let slotY: number;
  if (portrait) {
    Fw = Math.min(H * 0.2, (W * 0.84) / wordEm);
    Fg = Math.min(Fw * 0.3, (W * 0.84) / glossEm);
    gx = left;
    slotY = H * 0.5 + Fw * 0.15 + Fg * 1.5;
  } else {
    const capW = Math.min(H * 0.46, (W * 0.52) / wordEm);
    Fw = Math.max(
      Math.min(H * 0.28, capW),
      Math.min(capW, (W * 0.87) / (wordEm + 0.13 + glossEm * 0.17)),
    );
    gx = left + wordEm * Fw + Fw * 0.13;
    const avail = W - W * 0.06 - gx;
    Fg = Math.min(Fw * 0.17, avail / glossEm);
    slotY = H * 0.8;
  }
  const gLine = Fg * GLH;
  const wordBase = portrait ? H * 0.5 + Fw * 0.15 : slotY;

  const wordInAt = (tt: number) =>
    interpolate(tt, [0, 20], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const wordIn = wordInAt(t);
  const first = 22;
  const tail = hold;
  const step =
    n > 0 ? Math.max(12, Math.min(30, (T - first - tail) / Math.max(1, n))) : 0;
  const startOf = (k: number) => first + k * step;
  const push = (k: number, tt: number) =>
    interpolate(tt, [startOf(k), startOf(k) + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const enterAt = (k: number, tt: number) =>
    interpolate(
      tt,
      [startOf(k) + (k > 0 ? 5 : 0), startOf(k) + (k > 0 ? 21 : 16)],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
  const levelAt = (k: number, tt: number) => {
    let level = 0;
    for (let j = k + 1; j < n; j++) level += push(j, tt);
    return level;
  };
  // Where each line is drawn, as the attributes place it.
  const wordShiftAt = (tt: number) => (1 - wordInAt(tt)) * Fw * 0.12;
  const glossYAt = (k: number, tt: number) =>
    slotY +
    (portrait ? 1 : -1) * levelAt(k, tt) * gLine +
    (1 - enterAt(k, tt)) * Fg * 0.7;

  // The lines move by SVG attributes, which can't carry the mark, so the
  // drawing is marked instead. It counts as moving from the frame before a
  // line's first step to the frame after its last, so the lean never comes
  // or goes on the frame a line moves.
  const movesAround = (at: (tt: number) => number) =>
    at(t - speed) !== at(t) || at(t) !== at(t + speed);
  let moving = movesAround(wordShiftAt);

  const glossNodes = list.map((s, k) => {
    const enter = enterAt(k, t);
    if (enter <= 0) return null;
    const level = levelAt(k, t);
    const last = k === n - 1;
    const fade = interpolate(level, [0, 1, 3, 4], [1, 0.38, 0.38, 0], CLAMP);
    if (fade <= 0) return null;
    moving ||= movesAround((tt) => glossYAt(k, tt));
    return (
      <text
        key={`g${k}`}
        x={gx}
        y={glossYAt(k, t)}
        fontSize={Fg}
        fontWeight={400}
        letterSpacing={`${TRACK_GLOSS}em`}
        fill={last ? hi : fg}
        opacity={enter * fade}
      >
        {s}
      </text>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, transform: glide(moving) }}
          fontFamily={fontFamily}
          aria-hidden
        >
          <text
            x={left - Fw * 0.04}
            y={wordBase}
            fontSize={Fw}
            fontWeight={fontWeight}
            letterSpacing={`${TRACK_WORD}em`}
            fill={fg}
            opacity={wordIn}
            transform={`translate(0 ${wordShiftAt(t).toFixed(2)})`}
          >
            {word}
          </text>
          {glossNodes}
        </svg>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
