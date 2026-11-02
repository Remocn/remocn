"use client";

import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
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

const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export interface SlimCountProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#1B2A6B",
    ink: "#F3E9D2",
  },
  light: {
    bg: "#F3E9D2",
    ink: "#1B2A6B",
  },
} as const;

const RISE_LEN = 16;
const LABEL_AT = 6;
const COUNT_AT = 24;
const COUNT_END = 84;
const WAVE_POINTS = 48;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.42, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  baseline: number;
  cap: number;
}

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function measure(): Metrics {
  let baseline = 0.8;
  let cap = 0.72;
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `400 200px "${anton.fontFamily}"`;
    const fm = ctx.measureText("0123456789");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    cap = fm.actualBoundingBoxAscent / 200;
  }
  return { baseline, cap };
}

function useMetrics() {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("slim-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      anton.waitUntilDone(),
      document.fonts.load(`400 100px "${anton.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setM(measure());
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return m;
}

function digitCount(v: number, decimals: number) {
  return Array.from(format(v, decimals)).length;
}

export function SlimCount({
  value = 0,
  from = 100,
  decimals = 0,
  prefix = "",
  suffix = "",
  label = "Keyframes left to set by hand",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SlimCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const fill = accent ?? c.ink;
  const m = useMetrics();

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const progress = (f: number) =>
    interpolate(f, [COUNT_AT, COUNT_END], [0, 1], {
      ...CLAMP,
      easing: EASE_COUNT,
    });
  const k = progress(t);
  const v = from + (value - from) * k;
  const q = 10 ** decimals;
  const text = `${prefix}${format(Math.round(v * q) / q, decimals)}${suffix}`;

  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * (portrait ? 0.08 : 0.075);
  const chars =
    Math.max(digitCount(from, decimals), digitCount(value, decimals)) +
    Array.from(prefix + suffix).length;
  const F = Math.min(
    (H * (portrait ? 0.4 : 0.74)) / m.cap,
    (W * (portrait ? 0.84 : 0.58)) / Math.max(0.5, chars * 0.47),
  );
  const capPx = m.cap * F;
  const baseY = portrait ? H - M * 2.2 : H / 2 + capPx / 2 + H * 0.04;
  const boxTop = baseY - m.baseline * F;
  const baseLocal = m.baseline * F;

  const level = 1 - k;
  const surge = Math.abs(progress(t + 1) - progress(t - 1)) * 20;
  const amp = capPx * (0.006 + Math.min(0.03, surge * 0.02));
  const phase = (t / 30) * Math.PI * 2 * 0.7;
  const levelY =
    baseLocal -
    (capPx + capPx * 0.06) * level +
    (level >= 0.999 ? -amp * 3 : 0);
  const pts: string[] = [];
  for (let i = 0; i <= WAVE_POINTS; i++) {
    const u = i / WAVE_POINTS;
    const y = levelY + amp * Math.sin(u * Math.PI * 2 * 2.2 + phase);
    pts.push(`${(u * 100).toFixed(2)}% ${y.toFixed(2)}px`);
  }
  const clip =
    level <= 0.0005
      ? "inset(100% 0 0 0)"
      : `polygon(${pts.join(", ")}, 100% 100%, 0% 100%)`;

  const rise = interpolate(t, [0, RISE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const strokeW = Math.max(2, F * 0.011);
  const labelSize = portrait ? W * 0.1 : H * 0.094;
  const words = label ? label.split(" ") : [];

  const numberStyle = {
    position: "absolute" as const,
    right: 0,
    top: 0,
    height: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre" as const,
    fontFamily: anton.fontFamily,
    fontWeight: 400,
    fontSize: F,
    letterSpacing: "0.005em",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: baseY - capPx - F * 0.1,
          height: capPx + F * 0.16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: M,
            left: 0,
            top: boxTop - (baseY - capPx - F * 0.1),
            height: F,
            transform: `translateY(${((1 - rise) * capPx * 1.15).toFixed(2)}px)`,
          }}
        >
          <div
            style={{
              ...numberStyle,
              color: fill,
              clipPath: clip,
            }}
          >
            {text}
          </div>
          <div
            style={{
              ...numberStyle,
              color: "transparent",
              WebkitTextStroke: `${strokeW.toFixed(2)}px ${c.ink}`,
            }}
          >
            {text}
          </div>
        </div>
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: M,
            top: M,
            width: portrait ? W - M * 2 : W * 0.34,
            fontFamily: anton.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            lineHeight: 1.02,
            letterSpacing: "0.005em",
            color: c.ink,
          }}
        >
          {words.map((w, i) => {
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
                    transform: `translateY(${((1 - p) * labelSize * 0.5).toFixed(2)}px)`,
                  }}
                >
                  {w}
                </span>
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
