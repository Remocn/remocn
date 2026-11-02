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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0E3B43", ink: "#FFFFFF", accent: "#4FE3D0" },
  light: { bg: "#E8F6F5", ink: "#0B3138", accent: "#0F8C7E" },
} as const;

const DEFAULT_STEPS = [
  "Export the audio.",
  "Send it off for a transcript.",
  "Fix every timestamp by hand.",
  "Style each line to match.",
  "Render the whole film again.",
];

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

const LINE_AT = 6;
const LINE_GAP = 8;
const WORD_STAGGER = 2;
const WORD_IN = 13;
const ROUND = [17, 13, 11, 10, 9];
const ROUND_GAP = 3;
const SWAP_LEAD = 5;
const SWAP_OUT = 10;
const SWAP_IN = 18;
const PAYOFF_AFTER = 16;
const HOLD = 40;

type Metrics = Record<string, number>;
const key = (w: number, s: string) => `${w}\u0002${s}`;

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("chore-fold: no 2d context");
  const out: Metrics = {};
  for (const weight of [STEP_W, HERO_W]) {
    ctx.font = `${weight} ${FONT_PX}px "${geologica.fontFamily}"`;
    for (const s of texts) {
      out[key(weight, s)] = ctx.measureText(s).width / FONT_PX;
    }
  }
  return out;
}

function useMetrics(texts: string[]) {
  const id = texts.join("\u0001");
  const [state, setState] = useState<{ id: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("chore-fold: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geologica.waitUntilDone(),
      document.fonts.load(`${STEP_W} 100px "${geologica.fontFamily}"`),
      document.fonts.load(`${HERO_W} 100px "${geologica.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ id, m: measureAll(id.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [id, handle]);
  return state && state.id === id ? state.m : null;
}

const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

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

export function ChoreFold({
  steps = DEFAULT_STEPS,
  label = "By hand",
  name = "Captions",
  result = "does all of that.",
  payoff = "You just talk.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: ChoreFoldProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = steps.length > 0 ? steps : DEFAULT_STEPS;
  const heroWords = [
    ...splitWords(name).map((w) => ({ w, lit: true })),
    ...splitWords(result).map((w) => ({ w, lit: false })),
  ];
  const m = useMetrics([
    " ",
    ...list,
    ...list.flatMap(splitWords),
    ...heroWords.map((h) => h.w),
    payoff,
    ...splitWords(payoff),
    label,
  ]);

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

  const ease = (from: number, dur: number, curve = EASE_OUT) =>
    interpolate(t, [from, from + dur], [0, 1], { ...CLAMP, easing: curve });

  const D = (n - 1) / 2;
  const rounds = Math.max(1, Math.ceil(D));
  const roundDur = (r: number) => ROUND[Math.min(r, ROUND.length - 1)];
  let foldLen = 0;
  for (let r = 0; r < rounds; r++) foldLen += roundDur(r) + ROUND_GAP;

  const linesDone = LINE_AT + (n - 1) * LINE_GAP + 16;
  const tail = foldLen + SWAP_LEAD + SWAP_IN + PAYOFF_AFTER + 14 + HOLD;
  const span = durationInFrames * speed;
  const read = Math.min(70, Math.max(18, span - linesDone - tail));
  const foldAt = linesDone + read;

  let p = 0;
  let cursor = foldAt;
  for (let r = 0; r < rounds; r++) {
    const step = Math.min(1, D - r);
    p += step * ease(cursor, roundDur(r), EASE_MOVE);
    cursor += roundDur(r) + ROUND_GAP;
  }
  const foldEnd = cursor;
  const swapAt = foldEnd + SWAP_LEAD - ROUND_GAP;
  const heroAt = swapAt + 4;
  const payoffAt = heroAt + PAYOFF_AFTER;

  const cy = H * (portrait ? 0.47 : 0.48);
  const ys = list.map((_, i) => {
    const sign = i - D < 0 ? -1 : 1;
    const d = Math.abs(i - D);
    return cy + sign * Math.min(d, Math.max(0, D - p)) * pitch;
  });

  const nodes: React.ReactNode[] = [];

  if (label) {
    const lin = ease(2, 12);
    const lout = ease(foldAt, 10);
    const labelF = Math.max(12, F * 0.46);
    const top = cy - D * pitch - pitch / 2 - labelF * 1.6;
    const pull = p * pitch * 0.5;
    nodes.push(
      <div
        key="label"
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: top + pull,
          textAlign: "center",
          fontFamily: geologica.fontFamily,
          fontWeight: STEP_W,
          fontSize: labelF,
          lineHeight: 1,
          color: hi,
          opacity: lin * (1 - lout),
          transform: `translateY(${((1 - lin) * labelF * 0.6).toFixed(2)}px)`,
          whiteSpace: "pre",
        }}
      >
        {label}
      </div>,
    );
  }

  const swapOut = ease(swapAt, SWAP_OUT, EASE_MOVE);
  const centre = Math.ceil(D);

  list.forEach((line, i) => {
    const enter = LINE_AT + i * LINE_GAP;
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
    nodes.push(
      <div
        key={`step-${i}-${line}`}
        style={{
          position: "absolute",
          left: 0,
          top: y - pitch / 2,
          width: W,
          height: pitch,
          clipPath: `inset(${clipTop.toFixed(2)}px 0px ${clipBottom.toFixed(2)}px 0px)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontFamily: geologica.fontFamily,
            fontWeight: STEP_W,
            fontSize: F,
            letterSpacing: `${STEP_TRACK}em`,
            lineHeight: `${pitch}px`,
            color: c.ink,
            whiteSpace: "pre",
            opacity: (1 - out) * tuck,
            transform: `translateY(${(-out * pitch * 0.7).toFixed(2)}px)`,
          }}
        >
          {words.map((w, wi) => {
            const e = ease(enter + wi * WORD_STAGGER, WORD_IN);
            return (
              <span
                key={`${w}-${wi}`}
                style={{
                  display: "inline-block",
                  opacity: e,
                  transform: `translateY(${((1 - e) * pitch * 0.7).toFixed(2)}px)`,
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
          fontFamily: geologica.fontFamily,
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
              const e = ease(heroAt + wordIndex++ * WORD_STAGGER, SWAP_IN);
              return (
                <span
                  key={`${h.w}-${wi}`}
                  style={{
                    display: "inline-block",
                    color: h.lit ? hi : c.ink,
                    transform: `translateY(${((1 - e) * blockH * 1.1).toFixed(2)}px)`,
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
      const pin = ease(payoffAt, 16);
      nodes.push(
        <div
          key="payoff"
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: top + blockH + pf * 0.9,
            textAlign: "center",
            fontFamily: geologica.fontFamily,
            fontWeight: STEP_W,
            fontSize: pf,
            letterSpacing: `${STEP_TRACK}em`,
            lineHeight: 1.2,
            color: c.ink,
            opacity: pin * 0.72,
            transform: `translateY(${((1 - pin) * pf * 0.6).toFixed(2)}px)`,
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
      {nodes}
    </AbsoluteFill>
  );
}
