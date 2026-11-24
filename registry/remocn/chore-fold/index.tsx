"use client";

import { loadFont } from "@remotion/google-fonts/Geologica";
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
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type ChoreFoldElementId,
  choreFoldTimeline,
  DEFAULT_LABEL,
  DEFAULT_NAME,
  DEFAULT_PAYOFF,
  DEFAULT_RESULT,
  DEFAULT_STEPS,
  splitWords,
  stepsOf,
} from "./timeline";

const geologica = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ChoreFoldProps {
  steps?: string[];
  label?: string;
  name?: string;
  result?: string;
  payoff?: string;
  accent?: string;
  /** Text color of the steps and hero; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Geologica by default. */
  fontFamily?: string;
  /** Frames between steps as the list builds. */
  lineStagger?: number;
  /** Frames between words within a line. */
  stagger?: number;
  /** Size of the text, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the label, single steps, the rounds of the
   * fold, the swap, the hero and the payoff, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<ChoreFoldElementId>;
}

const THEMES = {
  dark: { bg: "#0E3B43", ink: "#FFFFFF", accent: "#4FE3D0" },
  light: { bg: "#E8F6F5", ink: "#0B3138", accent: "#0F8C7E" },
} as const;

const FONT_PX = 200;
const STEP_W = 400;
const HERO_W = 500;
const STEP_TRACK = -0.02;
const HERO_TRACK = -0.035;
const PITCH = 1.34;
const HERO_LH = 1.08;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

type Metrics = Record<string, number>;
const key = (w: number, s: string) => `${w}\u0002${s}`;

function measureAll(texts: string[], fontFamily: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("chore-fold: no 2d context");
  const out: Metrics = {};
  for (const weight of [STEP_W, HERO_W]) {
    ctx.font = `${weight} ${FONT_PX}px "${fontFamily}"`;
    for (const s of texts) {
      out[key(weight, s)] = ctx.measureText(s).width / FONT_PX;
    }
  }
  return out;
}

function useMetrics(texts: string[], fontFamily: string) {
  const id = texts.join("\u0001");
  const [state, setState] = useState<{ id: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("chore-fold: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geologica.waitUntilDone(),
      document.fonts.load(`${STEP_W} 100px "${fontFamily}"`),
      document.fonts.load(`${HERO_W} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ id, m: measureAll(id.split("\u0001"), fontFamily) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [id, handle, fontFamily]);
  return state && state.id === id ? state.m : null;
}

function balanced(
  words: string[],
  width: (w: string) => number,
  space: number,
  limit: number,
) {
  const greedy = (lim: number) => {
    const lines: string[][] = [];
    let cur: string[] = [];
    let acc = 0;
    for (const w of words) {
      const ww = width(w);
      if (cur.length > 0 && acc + space + ww > lim) {
        lines.push(cur);
        cur = [w];
        acc = ww;
      } else {
        acc = cur.length > 0 ? acc + space + ww : ww;
        cur.push(w);
      }
    }
    if (cur.length > 0) lines.push(cur);
    return lines;
  };
  const count = greedy(limit).length;
  let lo = 0;
  let hi = limit;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(mid).length <= count) hi = mid;
    else lo = mid;
  }
  return greedy(hi);
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

export function ChoreFold(props: ChoreFoldProps) {
  const {
    steps = DEFAULT_STEPS,
    label = DEFAULT_LABEL,
    name = DEFAULT_NAME,
    result = DEFAULT_RESULT,
    payoff = DEFAULT_PAYOFF,
    accent,
    ink,
    background,
    fontFamily = geologica.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    choreFoldTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = stepsOf(steps);
  const heroWords = [
    ...splitWords(name).map((w) => ({ w, lit: true })),
    ...splitWords(result).map((w) => ({ w, lit: false })),
  ];
  const m = useMetrics(
    [
      " ",
      ...list,
      ...list.flatMap(splitWords),
      ...heroWords.map((h) => h.w),
      payoff,
      ...splitWords(payoff),
      label,
    ],
    fontFamily,
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const measureW = W * (portrait ? 0.84 : 0.8);

  const sW = (s: string) =>
    m[key(STEP_W, s)] + STEP_TRACK * Array.from(s).length;
  const hW = (s: string) =>
    m[key(HERO_W, s)] + HERO_TRACK * Array.from(s).length;

  const widest = Math.max(...list.map(sW));
  const capF = H * (portrait ? 0.05 : 0.1);
  const fitH = (H * (portrait ? 0.56 : 0.8)) / (n * PITCH);
  const F = Math.min(capF, measureW / widest, fitH);
  const pitch = F * PITCH;

  const heroCap = F * (portrait ? 2 : 1.45);
  let heroF = heroCap;
  let heroLines: { w: string; lit: boolean }[][] = [heroWords];
  for (let i = 0; i < 40; i++) {
    const words = heroWords.map((h) => h.w);
    const lines = balanced(words, hW, hW(" "), measureW / heroF);
    if (lines.length <= (portrait ? 3 : 2) || i === 39) {
      let idx = 0;
      heroLines = lines.map((line) => line.map(() => heroWords[idx++]));
      break;
    }
    heroF *= 0.95;
  }

  const easeAt = (at: number, from: number, dur: number, curve = EASE_OUT) =>
    interpolate(at, [from, from + dur], [0, 1], { ...CLAMP, easing: curve });
  const ease = (from: number, dur: number, curve = EASE_OUT) =>
    easeAt(t, from, dur, curve);

  const D = (n - 1) / 2;
  const rounds = Math.max(1, Math.ceil(D));
  const roundEls = Array.from({ length: rounds }, (_, r) =>
    tl.get(`round:${r}`),
  );

  const foldP = (at: number) => {
    let acc = 0;
    for (let r = 0; r < rounds; r++) {
      const e = roundEls[r];
      acc += Math.min(1, D - r) * easeAt(at, e.start, e.length, EASE_MOVE);
    }
    return acc;
  };
  const p = foldP(t);
  // The in-out fold creeps at both ends of each round, so "moving" is read
  // off the pixels the outermost line travels, not off a progress.
  const foldPx = (at: number) => foldP(at) * pitch;
  const folding =
    Math.abs(foldPx(t + speed) - foldPx(t)) > 1e-3 ||
    Math.abs(foldPx(t) - foldPx(t - speed)) > 1e-3;
  const swap = tl.get("swap");
  const hero = tl.get("hero");

  const cy = H * (portrait ? 0.47 : 0.48);
  const ys = list.map((_, i) => {
    const sign = i - D < 0 ? -1 : 1;
    const d = Math.abs(i - D);
    return cy + sign * Math.min(d, Math.max(0, D - p)) * pitch;
  });
  // Where each line sits before the fold, and how far the fold has pulled it
  // in: exactly 0 until the fold starts.
  const yRest = list.map((_, i) => cy + (i - D) * pitch);
  const fold = list.map((_, i) => {
    const sign = i - D < 0 ? -1 : 1;
    const d = Math.abs(i - D);
    return sign * (Math.min(d, Math.max(0, D - p)) - d) * pitch;
  });

  const nodes: React.ReactNode[] = [];

  if (label) {
    const labelEl = tl.get("label");
    const lin = ease(labelEl.start, labelEl.length);
    const lout = ease(roundEls[0].start, roundEls[0].beat("labelOut"));
    const labelF = Math.max(12, F * 0.46);
    const top = cy - D * pitch - pitch / 2 - labelF * 1.6;
    // The pull rides the transform, not `top`: layout rounds a baseline to
    // whole pixels, so text eased by `top` clicks along pixel by pixel.
    const pull = p * pitch * 0.5;
    nodes.push(
      <div
        key="label"
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top,
          textAlign: "center",
          fontFamily,
          fontWeight: STEP_W,
          fontSize: labelF,
          lineHeight: 1,
          color: hi,
          opacity: lin * (1 - lout),
          transform: `translateY(${(1 - lin) * labelF * 0.6 + pull}px)${glide(midway(lin) || (folding && lout < 1))}`,
          whiteSpace: "pre",
        }}
      >
        {label}
      </div>,
    );
  }

  const swapOut = ease(swap.start, swap.length, EASE_MOVE);
  const centre = Math.ceil(D);

  list.forEach((line, i) => {
    const lineEl = tl.get(`line:${i}`);
    const enter = lineEl.start;
    if (t < enter - 1) return;
    const y = ys[i];
    let clipTop = 0;
    let clipBottom = 0;
    if (i - D < 0 && i + 1 < n) {
      clipBottom = Math.max(0, y + pitch / 2 - (ys[i + 1] - pitch / 2));
    } else if (i - 1 - D >= 0) {
      clipTop = Math.max(0, ys[i - 1] + pitch / 2 - (y - pitch / 2));
    }
    const hidden = (clipTop + clipBottom) / pitch;
    if (hidden >= 0.98) return;
    const tuck = 1 - interpolate(hidden, [0.04, 0.5], [0, 1], CLAMP);
    const lastStanding = i === centre;
    const out = lastStanding ? swapOut : 0;
    if (out >= 1) return;
    const words = splitWords(line);
    const lineMoving = folding || midway(out);
    nodes.push(
      <div
        key={`step-${i}-${line}`}
        style={{
          position: "absolute",
          left: 0,
          // Laid out where the line enters; the fold is a transform, for the
          // same reason as the label's pull.
          top: yRest[i] - pitch / 2,
          width: W,
          height: pitch,
          transform:
            Math.abs(fold[i]) > 1e-3 ? `translateY(${fold[i]}px)` : undefined,
          clipPath: `inset(${clipTop.toFixed(2)}px 0px ${clipBottom.toFixed(2)}px 0px)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontWeight: STEP_W,
            fontSize: F,
            letterSpacing: `${STEP_TRACK}em`,
            lineHeight: `${pitch}px`,
            color: fg,
            whiteSpace: "pre",
            opacity: (1 - out) * tuck,
            transform: `translateY(${(-out * pitch * 0.7).toFixed(2)}px)${glide(lineMoving)}`,
          }}
        >
          {words.map((w, wi) => {
            const e = ease(
              enter + wi * lineEl.beat("stagger"),
              lineEl.beat("rise"),
            );
            return (
              <span
                key={`${w}-${wi}`}
                style={{
                  display: "inline-block",
                  opacity: e,
                  transform: `translateY(${((1 - e) * pitch * 0.7).toFixed(2)}px)${glide(midway(e) && !lineMoving)}`,
                }}
              >
                {wi > 0 ? ` ${w}` : w}
              </span>
            );
          })}
        </div>
      </div>,
    );
  });

  const heroAt = hero.start;
  if (t >= heroAt - 1) {
    const lh = heroF * HERO_LH;
    const blockH = heroLines.length * lh;
    const top = cy - blockH / 2;
    let wordIndex = 0;
    nodes.push(
      <div
        key="hero"
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: top - heroF * 0.1,
          height: blockH + heroF * 0.3,
          overflow: "hidden",
          textAlign: "center",
          fontFamily,
          fontWeight: HERO_W,
          fontSize: heroF,
          letterSpacing: `${HERO_TRACK}em`,
          lineHeight: `${lh}px`,
          paddingTop: heroF * 0.1,
          whiteSpace: "pre",
          zIndex: 20,
        }}
      >
        {heroLines.map((line) => (
          <div key={line.map((h) => h.w).join(" ")}>
            {line.map((h, wi) => {
              const e = ease(
                heroAt + wordIndex++ * hero.beat("stagger"),
                hero.beat("rise"),
              );
              return (
                <span
                  key={`${h.w}-${wi}`}
                  style={{
                    display: "inline-block",
                    color: h.lit ? hi : fg,
                    transform: `translateY(${((1 - e) * blockH * 1.1).toFixed(2)}px)${glide(midway(e))}`,
                  }}
                >
                  {wi > 0 ? ` ${h.w}` : h.w}
                </span>
              );
            })}
          </div>
        ))}
      </div>,
    );

    if (payoff) {
      const pf = Math.max(12, Math.min(heroF * 0.5, F * 0.95));
      const payoffEl = tl.get("payoff");
      const pin = ease(payoffEl.start, payoffEl.length);
      nodes.push(
        <div
          key="payoff"
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: top + blockH + pf * 0.9,
            textAlign: "center",
            fontFamily,
            fontWeight: STEP_W,
            fontSize: pf,
            letterSpacing: `${STEP_TRACK}em`,
            lineHeight: 1.2,
            color: fg,
            opacity: pin * 0.72,
            transform: `translateY(${((1 - pin) * pf * 0.6).toFixed(2)}px)${glide(midway(pin))}`,
            whiteSpace: "pre",
          }}
        >
          {payoff}
        </div>,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
