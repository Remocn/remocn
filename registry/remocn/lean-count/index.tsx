"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
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

const bricolage = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface LeanCountProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  lean?: number;
  steps?: number;
  /** Frames between one surge and the next. */
  beat?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  /** Weight of the figure. */
  fontWeight?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#16130F",
    ink: "#F2EFE8",
    accent: "#E5342A",
    rule: "rgba(242,239,232,0.28)",
    grain: 0.05,
  },
  light: {
    bg: "#F2EFE8",
    ink: "#111111",
    accent: "#E5342A",
    rule: "rgba(17,17,17,0.24)",
    grain: 0.035,
  },
} as const;

const TRACK = -0.04;
const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 3;
const FIRST_SURGE = 30;
const SURGE_GAP = 16;
const COUNT_LEN = 13;
const LABEL_AT = 6;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const SNAP = { damping: 11, stiffness: 230, mass: 0.6 };

interface Metrics {
  adv: Record<string, number>;
  cap: number;
  baseline: number;
}

function measure(chars: string[], fontFamily: string, weight: number): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${fontFamily}"`,
    fontWeight: String(weight),
    fontSize: "100px",
    lineHeight: "1",
    fontFeatureSettings: '"tnum" 1',
  });
  document.body.appendChild(probe);
  const adv: Record<string, number> = {};
  for (const ch of chars) {
    probe.textContent = ch;
    adv[ch] = probe.getBoundingClientRect().width / 100 + TRACK;
  }
  probe.remove();
  const ctx = document.createElement("canvas").getContext("2d");
  let cap = 0.72;
  let baseline = 0.8;
  if (ctx) {
    ctx.font = `${weight} 100px "${fontFamily}"`;
    const fm = ctx.measureText("0123456789");
    cap = fm.actualBoundingBoxAscent / 100;
    const asc = fm.fontBoundingBoxAscent / 100;
    const desc = fm.fontBoundingBoxDescent / 100;
    baseline = (1 - (asc + desc)) / 2 + asc;
  }
  return { adv, cap, baseline };
}

function useMetrics(chars: string[], fontFamily: string, fontWeight: number) {
  const key = `${chars.join("")}\u0001${fontFamily}\u0001${fontWeight}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("lean-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      bricolage.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(
            Array.from(key.split("\u0001")[0]),
            fontFamily,
            fontWeight,
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

function Grain({ opacity }: { opacity: number }) {
  const id = `lc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={9}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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

export function LeanCount({
  value = 3.2,
  from = 1,
  decimals = 1,
  prefix = "",
  suffix = "×",
  label = "Faster renders on the laptop you already own.",
  lean = 14,
  steps = 3,
  beat = SURGE_GAP,
  accent,
  ink,
  background,
  fontFamily = bricolage.fontFamily,
  fontWeight = 500,
  scale = 1,
  delay = 0,
  grain = true,
  speed = 1,
  theme = "dark",
}: LeanCountProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const n = Math.max(1, Math.round(steps));
  const chars = Array.from(
    new Set(
      Array.from(
        `${prefix}${suffix}0123456789.,${format(value, decimals)}${format(from, decimals)}`,
      ),
    ),
  ).sort();
  const m = useMetrics(chars, fontFamily, fontWeight);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const surgeAt = (k: number) => FIRST_SURGE + k * beat;
  let countK = 0;
  let slantK = 0;
  for (let k = 0; k < n; k++) {
    countK += interpolate(t, [surgeAt(k), surgeAt(k) + COUNT_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    slantK += spring({ frame: t - surgeAt(k), fps, config: SNAP });
  }
  countK /= n;
  slantK /= n;
  const v = from + (value - from) * countK;
  const glyphs = Array.from(`${prefix}${format(v, decimals)}${suffix}`);
  const runOf = (s: string) =>
    Array.from(s).reduce((a, ch) => a + (m.adv[ch] ?? 0.6), -TRACK);
  const widest = Math.max(
    runOf(`${prefix}${format(value, decimals)}${suffix}`),
    runOf(`${prefix}${format(from, decimals)}${suffix}`),
  );
  const slant = -lean + 2 * lean * slantK;
  const tan = Math.tan((Math.abs(lean) * Math.PI) / 180);

  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * (portrait ? 0.08 : 0.075);
  const labelSize = portrait ? W * 0.068 : H * 0.062;
  const labelW = portrait ? W - M * 2 : W * 0.4;
  const F = Math.min(
    (H * (portrait ? 0.26 : 0.5)) / m.cap,
    (W - M * 2) / (widest + tan * m.cap),
  );
  const capPx = m.cap * F;
  const baseY = H - M * (portrait ? 2.2 : 1.25);
  const right = W - M - tan * capPx;

  let x = 0;
  const slots = glyphs.map((ch, i) => {
    const gx = x;
    x += m.adv[ch] ?? 0.6;
    return { ch, i, gx };
  });
  const runW = (x - TRACK) * F;
  const left = right - runW;
  const suffixFrom = glyphs.length - Array.from(suffix).length;

  const ruleP = interpolate(t, [2, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const labelWords = label ? label.split(" ") : [];

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: baseY + Math.max(1.5, F * 0.012),
            width: W,
            height: Math.max(1.5, F * 0.008),
            background: c.rule,
            transformOrigin: "100% 50%",
            transform: `scaleX(${ruleP.toFixed(4)})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left,
            top: baseY - m.baseline * F,
            width: runW + F,
            height: F * 1.3,
            transformOrigin: `0px ${(m.baseline * F).toFixed(2)}px`,
            transform: `skewX(${(-slant).toFixed(3)}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(${(-F * 0.3).toFixed(1)}px ${-F}px ${((1.3 - m.baseline - 0.02) * F).toFixed(1)}px ${-F}px)`,
            }}
          >
            {slots.map(({ ch, i, gx }) => {
              const p = interpolate(
                t,
                [RISE_AT + i * RISE_GAP, RISE_AT + i * RISE_GAP + RISE_LEN],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <span
                  key={`g${i}`}
                  style={{
                    position: "absolute",
                    left: gx * F,
                    top: 0,
                    height: F * 1.3,
                    lineHeight: `${F}px`,
                    whiteSpace: "pre",
                    fontFamily,
                    fontWeight,
                    fontSize: F,
                    fontFeatureSettings: '"tnum" 1',
                    color: i >= suffixFrom ? spot : fg,
                    transform: `translateY(${((1 - p) * F * 0.95).toFixed(2)}px)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: M,
              top: M,
              width: labelW,
              fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: fg,
              textWrap: "balance",
            }}
          >
            {labelWords.map((w, i) => {
              const p = interpolate(
                t,
                [LABEL_AT + i * 3, LABEL_AT + i * 3 + 16],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <span key={`${w}-${i}`}>
                  <span
                    style={{
                      display: "inline-block",
                      opacity: p,
                      transform: `translateY(${((1 - p) * labelSize * 0.6).toFixed(2)}px)`,
                    }}
                  >
                    {w}
                  </span>
                  {i < labelWords.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ) : null}
      </ScaleLayer>
      {transparent || !grain ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
