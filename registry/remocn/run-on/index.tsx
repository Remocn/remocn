"use client";

import { loadFont } from "@remotion/google-fonts/DMSans";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const dmSans = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface RunOnProps {
  text?: string;
  promise?: string;
  highlight?: string;
  joiners?: string[];
  /** Frames the full stop holds before the sentence drains away. */
  hold?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; DM Sans by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2E3440", ink: "#FFFFFF", dim: "#FFFFFF8C", accent: "#FFB020" },
  light: {
    bg: "#F1F2F4",
    ink: "#2E3440",
    dim: "#2E34408C",
    accent: "#B86E00",
  },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const PROBE = 200;
const BASE = 200;
const LEAD = 1.08;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const START = 6;
const FIRST_GAP = 9;
const LAST_GAP = 2.6;
const REVEAL = 6;
const STOP_GAP = 7;
const SLAM = 5;
const HOLD = 16;
const DRAIN = 16;
const PROMISE_LAG = 5;
const SCROLL = 10;
const PROMISE_STAGGER = 4;
const PROMISE_IN = 16;

interface Word {
  text: string;
  start: number;
  x: number;
  w: number;
}

interface Metrics {
  words: Word[];
  promise: Word[];
  promiseW: number;
  dotW: number;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

function layoutWords(s: string, em: (x: string) => number) {
  const out: Word[] = [];
  const re = /\S+/g;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    out.push({
      text: m[0],
      start: m.index,
      x: em(s.slice(0, m.index)),
      w: em(m[0]),
    });
  }
  return out;
}

function measure(text: string, promise: string, font: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("run-on: no 2d context");
  ctx.font = font;
  const em = (x: string) =>
    ctx.measureText(x).width / PROBE + TRACK * Array.from(x).length;
  const body = promise.replace(/\.$/, "");
  return {
    words: layoutWords(text, em),
    promise: layoutWords(body, em),
    promiseW: em(body),
    dotW: em("."),
  };
}

function useMetrics(
  text: string,
  promise: string,
  fontFamily: string,
  fontWeight: number,
) {
  const key = `${text}\u0001${promise}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("run-on: measuring"));
  const released = useRef(false);
  const src = useRef({ text, promise });
  src.current = { text, promise };
  useEffect(() => {
    let live = true;
    Promise.all([
      dmSans.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(
            src.current.text,
            src.current.promise,
            `${fontWeight} ${PROBE}px "${fontFamily}"`,
          ),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily, fontWeight]);
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

export function RunOn({
  text = "Open last year’s project and relink the fonts and nudge every keyframe and render and spot a typo and render it all again",
  promise = "Or change one line.",
  highlight = "one line",
  joiners = ["and", "then"],
  hold = HOLD,
  accent,
  ink,
  background,
  fontFamily = dmSans.fontFamily,
  fontWeight = WGHT,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: RunOnProps) {
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const k = Math.min(1, durationInFrames / BASE);
  const t = (frame * speed) / k;
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const body = text.trim().replace(/[.!?…]+$/, "");
  const said = promise.trim();
  const m = useMetrics(body, said, fontFamily, fontWeight);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const F = portrait ? W * 0.105 : H * 0.135;
  const pitch = F * LEAD;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const measureW = (W - marginX * 2) / F;
  const top0 = H * (portrait ? 0.2 : 0.14);
  const floor = H * (portrait ? 0.62 : 0.86);
  const n = m.words.length;

  const placed: { line: number; x: number }[] = [];
  let line = 0;
  let lineStart = 0;
  m.words.forEach((w, i) => {
    if (i > 0 && w.x + w.w - lineStart > measureW) {
      line += 1;
      lineStart = w.x;
    }
    placed.push({ line, x: w.x - lineStart });
  });

  const arrive: number[] = [];
  let acc = START;
  for (let i = 0; i < n; i++) {
    arrive.push(acc);
    const p = n > 1 ? i / (n - 1) : 1;
    acc += FIRST_GAP + (LAST_GAP - FIRST_GAP) * p ** 0.6;
  }
  const stopAt = arrive[n - 1] + STOP_GAP;
  const drainAt = stopAt + SLAM + hold;
  const promiseAt = drainAt + DRAIN - PROMISE_LAG;

  const need = (ln: number) => Math.max(0, top0 + (ln + 1) * pitch - floor);
  const scrollAt = (f: number) => {
    let at = 0;
    for (let i = 0; i < n; i++) {
      if (f < arrive[i]) break;
      const from = i === 0 ? 0 : need(placed[i - 1].line);
      const to = need(placed[i].line);
      if (to !== from) {
        at =
          from +
          (to - from) *
            interpolate(f, [arrive[i], arrive[i] + SCROLL], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
      } else {
        at = to;
      }
    }
    return at;
  };
  const scroll = scrollAt(t);
  const step = speed / k;
  const scrolling =
    Math.abs(scrollAt(t + step) - scroll) > 1e-3 ||
    Math.abs(scroll - scrollAt(t - step)) > 1e-3;
  const drain = interpolate(t, [drainAt, drainAt + DRAIN], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });
  const wallY = -scroll - drain * H * 1.05;

  const Fp = Math.min(
    portrait ? W * 0.16 : H * 0.22,
    (W - marginX * 2) / (m.promiseW + m.dotW),
  );
  const promiseBase = H * (portrait ? 0.62 : 0.66);
  const joinSet = new Set(joiners.map((j) => j.toLowerCase()));

  const hiStart = highlight ? said.lastIndexOf(highlight) : -1;
  const hiEnd = hiStart >= 0 ? hiStart + highlight.length : -1;

  const glyph = (
    key: string,
    text: string,
    x: number,
    baseY: number,
    size: number,
    dy: number,
    opacity: number,
    color: string,
    moving: boolean,
    // Layout puts a baseline on a whole pixel inside its box, so a glyph whose
    // font size eases clicks even under a transform. While it grows it is laid
    // out at `laid` and scaled from there; otherwise `laid` is `size`.
    laid = size,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: laid * 1.2,
        lineHeight: `${laid * 1.2}px`,
        whiteSpace: "pre",
        fontFamily,
        fontWeight,
        fontSize: laid,
        letterSpacing: `${TRACK}em`,
        fontKerning: "normal",
        color,
        opacity,
        transform: `translate(${x.toFixed(2)}px, ${(baseY - size * 0.93 + dy).toFixed(2)}px)${glide(moving)}${laid === size ? "" : ` scale(${size / laid})`}`,
        transformOrigin: laid === size ? undefined : "0 0",
      }}
    >
      {text}
    </div>
  );

  const baseOf = (ln: number) => top0 + ln * pitch + F * 0.93;
  const nodes: React.ReactNode[] = [];
  if (drain < 1) {
    m.words.forEach((w, i) => {
      const r = interpolate(t, [arrive[i], arrive[i] + REVEAL], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      if (r <= 0) return;
      const y = baseOf(placed[i].line) + wallY;
      if (y < -F || y > H + F * 2) return;
      const join = joinSet.has(w.text.toLowerCase());
      nodes.push(
        glyph(
          `w${i}`,
          w.text,
          marginX + placed[i].x * F,
          y,
          F,
          F * 0.3 * (1 - r),
          r * (1 - drain * 0.5),
          join ? c.dim : fg,
          midway(r) || scrolling || midway(drain),
        ),
      );
    });
  }

  const slam = interpolate(t, [stopAt, stopAt + SLAM], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dotTravel = interpolate(t, [drainAt, drainAt + DRAIN + 6], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  if (slam > 0) {
    const last = n - 1;
    const stopX = marginX + (placed[last].x + m.words[last].w) * F;
    const stopY = baseOf(placed[last].line) - scroll;
    const restX = marginX + m.promiseW * Fp;
    const size = F + (Fp - F) * dotTravel;
    // Both eases crawl into their ends, so they count as moving until they
    // are exactly there.
    const travelling = dotTravel > 0 && dotTravel < 1;
    nodes.push(
      glyph(
        "stop",
        ".",
        stopX + (restX - stopX) * dotTravel,
        stopY + (promiseBase - stopY) * dotTravel,
        size,
        -F * 0.7 * (1 - slam),
        Math.min(1, slam * 1.6),
        hi,
        (slam > 0 && slam < 1) || travelling || scrolling,
        travelling ? Fp : size,
      ),
    );
  }

  m.promise.forEach((w, i) => {
    const at = promiseAt + i * PROMISE_STAGGER;
    const r = interpolate(t, [at, at + PROMISE_IN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (r <= 0) return;
    const lit = interpolate(
      t,
      [promiseAt + PROMISE_IN + 4, promiseAt + PROMISE_IN + 14],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const inHi =
      hiStart >= 0 && w.start < hiEnd && w.start + w.text.length > hiStart;
    const color = inHi
      ? `color-mix(in oklab, ${hi} ${(lit * 100).toFixed(1)}%, ${fg})`
      : fg;
    nodes.push(
      glyph(
        `p${i}`,
        w.text,
        marginX + w.x * Fp,
        promiseBase,
        Fp,
        Fp * 0.4 * (1 - r),
        r,
        color,
        midway(r),
      ),
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
