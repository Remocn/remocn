"use client";

import { loadVariableFont } from "@remotion/google-fonts/InterTight";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const inter = loadVariableFont("normal", { subsets: ["latin"] });

export interface BeatCountProps {
  value?: number;
  from?: number;
  beats?: number;
  bpm?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  /** Text color of the number; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the number and caption. Load it yourself; Inter Tight by default. */
  fontFamily?: string;
  /** Weight of the number between beats; each beat swells it toward 500. */
  fontWeight?: number;
  /** How far each beat squashes the number, as a fraction of its height. */
  punch?: number;
  /** Size of the number and caption, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#1C1C1E",
    ink: "#E9E9E6",
    accent: "#6D5BFF",
  },
  light: {
    bg: "#E9E9E6",
    ink: "#0B0B0C",
    accent: "#6D5BFF",
  },
} as const;

const WGHT = { rest: 200, duck: 500 } as const;
const TRACK = { rest: -0.045, duck: -0.01 } as const;
const DUCK = 0.2;
const LAST_DUCK = 0.3;

const FIRST_BEAT = 12;
const ENTER_LEN = 10;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface Metrics {
  rest: number;
  duck: number;
  figTop: number;
  baseline: number;
}

function measure(text: string, fontFamily: string, weight: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  let rest = 0.55 * text.length;
  let duck = 0.62 * text.length;
  let figTop = 0.72;
  let baseline = 0.8;
  if (ctx) {
    ctx.font = `${weight} 200px "${fontFamily}"`;
    ctx.letterSpacing = `${TRACK.rest * 200}px`;
    rest = ctx.measureText(text).width / 200;
    ctx.font = `${WGHT.duck} 200px "${fontFamily}"`;
    ctx.letterSpacing = `${TRACK.duck * 200}px`;
    duck = ctx.measureText(text).width / 200;
    const fm = ctx.measureText("0");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    figTop = fm.actualBoundingBoxAscent / 200;
  }
  return { rest, duck, figTop, baseline };
}

function useMetrics(text: string, fontFamily: string, rest: number) {
  const key = `${rest} ${fontFamily} ${text}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("beat-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      inter.waitUntilDone(),
      document.fonts.load(`${rest} 100px "${fontFamily}"`),
      document.fonts.load(`${WGHT.duck} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(text, fontFamily, rest) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, text, fontFamily, rest, handle]);
  return state && state.key === key ? state.m : null;
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

function envelope(since: number, release: number) {
  if (since < 0) return 0;
  const attack = Math.min(1, (since + 1) / 2);
  return attack * Math.exp(-Math.max(0, since - 1) / release);
}

export function BeatCount({
  value = 64,
  from = 0,
  beats = 8,
  bpm = 120,
  decimals = 0,
  prefix = "",
  suffix = "",
  label = "cuts, each one landing on the kick",
  accent,
  ink,
  background,
  fontFamily = inter.fontFamily,
  fontWeight = WGHT.rest,
  punch = DUCK,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: BeatCountProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const finalText = useMemo(
    () => `${prefix}${format(value, decimals)}${suffix}`,
    [prefix, value, decimals, suffix],
  );
  const m = useMetrics(finalText, fontFamily, fontWeight);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);

  const n = Math.max(1, Math.round(beats));
  const beatLen = (fps * 60) / Math.max(30, bpm);
  const lastBeat = FIRST_BEAT + (n - 1) * beatLen;
  const k =
    t < FIRST_BEAT
      ? -1
      : Math.min(n - 1, Math.floor((t - FIRST_BEAT) / beatLen));
  const beatT = FIRST_BEAT + Math.max(0, k) * beatLen;
  const isLast = k === n - 1;

  const shown = k < 0 ? from : from + ((value - from) * (k + 1)) / n;
  const text = `${prefix}${format(
    Math.round(shown * 10 ** decimals) / 10 ** decimals,
    decimals,
  )}${suffix}`;

  const release = Math.max(2, beatLen * 0.26);
  let d = k < 0 ? 0 : envelope(t - beatT, release) * punch;
  if (isLast) {
    const since = t - lastBeat;
    const back = spring({
      frame: since - 2,
      fps,
      config: { damping: 9, stiffness: 120, mass: 0.8 },
    });
    const attack = Math.min(1, (since + 1) / 2);
    d = LAST_DUCK * (since < 2 ? attack : 1 - back);
  }
  const duck = Math.max(0, Math.min(1, d / LAST_DUCK));
  const sy = 1 - d;
  const wght = fontWeight + (WGHT.duck - fontWeight) * duck;
  const track = TRACK.rest + (TRACK.duck - TRACK.rest) * duck;

  const margin = portrait ? W * 0.08 : W * 0.065;
  const F = Math.min(
    (W * (portrait ? 0.84 : 0.66)) / Math.max(0.1, m.duck),
    (H * (portrait ? 0.3 : 0.66)) / Math.max(0.1, m.figTop),
  );
  const baseY = H - margin;
  const boxTop = baseY - m.baseline * F;
  const labelFs = (portrait ? 50 : 32) * s;

  const enter = interpolate(t, [0, ENTER_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelP = interpolate(
    t,
    [FIRST_BEAT + beatLen, FIRST_BEAT + beatLen + 16],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_OUT,
    },
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            right: margin - F * 0.02,
            top: boxTop,
            height: F,
            lineHeight: `${F}px`,
            whiteSpace: "pre",
            fontFamily,
            fontSize: F,
            fontVariationSettings: `"wght" ${wght.toFixed(1)}`,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: `${track.toFixed(4)}em`,
            color: fg,
            opacity: enter,
            transformOrigin: `100% ${(m.baseline * F).toFixed(1)}px`,
            transform: `translateY(${((1 - enter) * F * 0.08).toFixed(2)}px) scaleY(${sy.toFixed(4)})`,
          }}
        >
          {text}
        </div>

        {label ? (
          <div
            style={{
              position: "absolute",
              left: margin,
              top: margin,
              width: W * (portrait ? 0.7 : 0.34),
              fontFamily,
              fontVariationSettings: `"wght" 400`,
              fontSize: labelFs,
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              textWrap: "balance",
              color: spot,
              opacity: labelP,
              transform: `translateY(${((1 - labelP) * labelFs * 0.5).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
