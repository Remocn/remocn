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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_BEFORE,
  type PressStatElementId,
  pressStatTimeline,
} from "./timeline";

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
  /**
   * Moves, trims or stretches the caption words, the number's rise and the
   * press, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<PressStatElementId>;
}

const GREEN = { dark: "#00C805", light: "#00873C" } as const;

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF" },
  light: { bg: "#FFFFFF", ink: "#000000" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const INFLATE = { damping: 16, stiffness: 70, mass: 1 };

const midway = (p: number) => p > 0 && p < 1;

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

export function PressStat(props: PressStatProps) {
  const {
    before = DEFAULT_BEFORE,
    value = 73,
    from = 0,
    prefix = "",
    suffix = "%",
    accent,
    ink,
    background,
    fontFamily = plex.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const tAt = (df: number) => Math.max(0, frame + df - delay) * speed;
  const t = tAt(0);
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    pressStatTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const press = tl.get("press");
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
  const line0 =
    (wordsEm + (words.length ? gapEm : 0) + len(startText) * m.adv) * Fw;
  const left0 = (W - line0) / 2;
  const numRight0 = left0 + line0;
  const base0 = (H + m.cap * Fw) / 2;
  const base1 = (H + m.cap * Fh) / 2;
  const fitWords = (numLeft: number, wordsLeft: number) => {
    const room = numLeft - gapEm * Fw - wordsLeft;
    return words.length
      ? Math.max(Fw * 0.3, Math.min(Fw, room / Math.max(0.01, wordsEm)))
      : Fw;
  };

  // The press at time `tt`, so the blocks can tell motion from rest.
  const pressState = (tt: number) => {
    const pCount = interpolate(tt, [press.start, press.end], [0, 1], {
      ...CLAMP,
      easing: EASE_COUNT,
    });
    const shown = Math.round(start + (target - start) * pCount);
    const numText = `${prefix}${fmt(shown)}${suffix}`;
    const g = spring({ frame: tt - press.start, fps, config: INFLATE });
    const gc = Math.min(1, Math.max(0, g));
    const Fn = Fw + (Fh - Fw) * g;
    const numW = len(numText) * m.adv * Fn;
    const numRight = numRight0 + (W - margin - numRight0) * gc;
    const numLeft = numRight - numW;
    const wordsLeft = left0 + (margin - left0) * gc;
    return {
      numText,
      Fn,
      numLeft,
      wordsLeft,
      Fwords: fitWords(numLeft, wordsLeft),
      baseY: base0 + (base1 - base0) * gc,
    };
  };
  const now = pressState(t);
  const { numText, Fn, numLeft, wordsLeft, Fwords, baseY } = now;
  // Layout rounds a box and a baseline to whole pixels, and the number grows
  // by font size, so the press would click into place pixel by pixel. Every
  // block is laid out once where the press settles and carried to its live
  // place and size by a transform, before the press too: a block handed back
  // to plain layout would jump by the rounding.
  const reach = (a: typeof now, b: typeof now) =>
    Math.max(
      Math.abs(a.baseY - b.baseY),
      Math.abs(a.numLeft - b.numLeft),
      Math.abs(a.wordsLeft - b.wordsLeft),
      Math.abs(a.Fn - b.Fn) * len(a.numText) * m.adv,
      Math.abs(a.Fwords - b.Fwords) * wordsEm,
    );
  const pressing =
    reach(pressState(tAt(1)), now) > 1e-3 ||
    reach(now, pressState(tAt(-1))) > 1e-3;
  const Fwords1 = fitWords(W - margin - len(finalText) * m.adv * Fh, margin);

  const rise = (i: number) => {
    const e = tl.get(i < words.length ? `word:${i}` : "number");
    return interpolate(t, [e.start, e.end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const masked = (
    key: string,
    x: number,
    F: number,
    r: number,
    text: string,
    color: string,
    weight: number,
    rest: { x: number; F: number },
  ) => {
    // the settled geometry, carried to the live one by a transform; the
    // spring's leftover under a millipixel is dropped, so the settled frame
    // is laid out exactly as before
    const L = { x: rest.x, F: rest.F, baseY: base1 };
    const h = L.F * 1.25;
    const dx = Math.abs(x - L.x) < 1e-3 ? 0 : x - L.x;
    const dy = Math.abs(baseY - L.baseY) < 1e-3 ? 0 : baseY - L.baseY;
    const k = Math.abs(F - L.F) * len(text) * m.adv < 1e-3 ? 1 : F / L.F;
    // the rise below the mask is a transform too, for the same reason
    const lift = (1 - r) * h;
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: L.x - L.F * 0.05,
          top: L.baseY - m.cap * L.F - L.F * 0.2,
          width: len(text) * m.adv * L.F + L.F * 0.1,
          height: h,
          overflow: "hidden",
          transformOrigin: `${L.F * 0.05}px ${m.cap * L.F + L.F * 0.2}px`,
          transform: `translate(${dx}px, ${dy}px) scale(${k})${glide(pressing)}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: L.F * 0.05,
            top: L.F * 0.2 + m.cap * L.F - m.base * L.F,
            height: L.F,
            lineHeight: `${L.F}px`,
            fontFamily,
            fontWeight: weight,
            fontSize: L.F,
            whiteSpace: "pre",
            color,
            transform: `translateY(${lift > 1e-3 ? lift : 0}px)${glide(midway(r))}`,
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  const nodes: React.ReactNode[] = [];
  let x = wordsLeft;
  let x1 = margin;
  words.forEach((w, i) => {
    nodes.push(
      masked(`w${i}`, x, Fwords, rise(i), w, fg, 400, { x: x1, F: Fwords1 }),
    );
    x += (len(w) + 1) * m.adv * Fwords;
    x1 += (len(w) + 1) * m.adv * Fwords1;
  });
  nodes.push(
    masked("n", numLeft, Fn, rise(words.length), numText, green, 500, {
      x: W - margin - len(numText) * m.adv * Fh,
      F: Fh,
    }),
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
