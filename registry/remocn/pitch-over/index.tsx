"use client";

import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { useEffect, useMemo, useRef, useState } from "react";
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

const grotesk = loadSpaceGrotesk("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const mono = loadSpaceMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PitchOverProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  /** Color of the number, ruler and label; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the number. Load it yourself; Space Grotesk by default. */
  fontFamily?: string;
  /** Frames the count runs before the ruler turns flat. */
  countLength?: number;
  /** Major ticks on the ruler; four minor ticks sit between each pair. */
  ticks?: number;
  /** Size of the number and ruler, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF", dim: "rgba(255,255,255,0.28)" },
  light: { bg: "#FFFFFF", ink: "#000000", dim: "rgba(0,0,0,0.26)" },
} as const;

const TRACK = -0.03;
const PROBE_PX = 200;

const ENTER_END = 10;
const COUNT_END = 46;
const PITCH_LEN = 34;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.25, 0.6, 0.25, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_TURN = Easing.bezier(0.6, 0, 0.28, 1.06);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  digit: number;
  comma: number;
  dot: number;
  prefix: number;
  suffix: number;
  cap: number;
  base: number;
  label: number;
}

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function measure(
  prefix: string,
  suffix: string,
  label: string,
  fontFamily: string,
): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${fontFamily}"`,
    fontWeight: "400",
    fontSize: `${PROBE_PX}px`,
    lineHeight: "1",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: `${TRACK}em`,
  });
  document.body.appendChild(probe);
  const w = (s: string) => {
    if (!s) return 0;
    probe.textContent = s;
    return probe.getBoundingClientRect().width / PROBE_PX;
  };
  const digit = w("0000000000") / 10;
  const comma = w(",");
  const dot = w(".");
  const pre = w(prefix);
  const suf = w(suffix);
  probe.remove();

  let cap = 0.7;
  let base = 0.8;
  let labelW = 0;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `400 ${PROBE_PX}px "${fontFamily}"`;
    const m = ctx.measureText("0");
    const asc = m.fontBoundingBoxAscent / PROBE_PX;
    const desc = m.fontBoundingBoxDescent / PROBE_PX;
    cap = m.actualBoundingBoxAscent / PROBE_PX;
    base = (1 - (asc + desc)) / 2 + asc;
    ctx.font = `400 ${PROBE_PX}px "${mono.fontFamily}"`;
    labelW = label ? ctx.measureText(label).width / PROBE_PX : 0;
  }
  return {
    digit,
    comma,
    dot,
    prefix: pre,
    suffix: suf,
    cap,
    base,
    label: labelW,
  };
}

function useMetrics(
  prefix: string,
  suffix: string,
  label: string,
  fontFamily: string,
) {
  const key = [prefix, suffix, label, fontFamily].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("pitch-over: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [p, s, l, f] = key.split("\u0001");
    Promise.all([
      grotesk.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`400 100px "${f}"`),
      document.fonts.load(`400 100px "${mono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(p, s, l, f) });
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

export function PitchOver({
  value = 7200,
  from = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  label = "Frames rendered, T+04:00",
  accent,
  ink,
  background,
  fontFamily = grotesk.fontFamily,
  countLength = COUNT_END,
  ticks: majors = 10,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: PitchOverProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const mark = accent ?? fg;
  const pitchAt = countLength - 4;
  const labelAt = pitchAt + PITCH_LEN - 6;
  const m = useMetrics(prefix, suffix, label, fontFamily);
  const finalText = useMemo(
    () => `${prefix}${format(value, decimals)}${suffix}`,
    [prefix, value, decimals, suffix],
  );

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const widthOf = (text: string) => {
    let w = m.prefix + m.suffix;
    const body = text.slice(prefix.length, text.length - suffix.length);
    for (const ch of body) {
      if (ch === ",") w += m.comma;
      else if (ch === ".") w += m.dot;
      else w += m.digit;
    }
    return w;
  };

  const portrait = H > W * 1.1;
  const minDim = Math.min(W, H);
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginY = H * (portrait ? 0.08 : 0.11);
  const finalEm = widthOf(finalText);

  const F = Math.min(
    (W * (portrait ? 0.84 : 0.62)) / finalEm,
    (H * (portrait ? 0.16 : 0.36)) / m.cap,
  );
  const rulerLen = Math.max(finalEm * F, W * (portrait ? 0.84 : 0.5));
  const capH = m.cap * F;
  const gap = F * 0.14;
  const tickMajor = Math.max(10, F * 0.07);
  const tickMinor = tickMajor * 0.45;
  const labelFs = Math.max(minDim * 0.026, Math.min(minDim * 0.036, F * 0.1));
  const labelTop = gap + tickMajor + labelFs * 0.9;
  const below = labelTop + labelFs * 1.3;
  const stroke = Math.max(1, minDim * 0.0018);

  const kV = Math.min(
    portrait ? 1.5 : 1,
    (H - marginY * 2) / rulerLen,
    (W * (portrait ? 0.62 : 0.4)) / (capH + below),
  );

  const enter = interpolate(t, [0, ENTER_END], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const g = interpolate(t, [0, countLength], [0, 1], {
    ...CLAMP,
    easing: EASE_COUNT,
  });
  const count = from + (value - from) * g;
  const text = `${prefix}${format(
    Math.round(count * 10 ** decimals) / 10 ** decimals,
    decimals,
  )}${suffix}`;

  const move = interpolate(t, [pitchAt, pitchAt + PITCH_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const turn = interpolate(t, [pitchAt, pitchAt + PITCH_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_TURN,
  });
  const angle = -90 * (1 - turn);
  const k = kV + (1 - kV) * move;

  const vx = marginX + capH * kV;
  const vy = H - marginY;
  const hx = marginX;
  const hy = H - marginY - below;
  // Layout rounds a box and a baseline to whole pixels, so a block eased by
  // `left`/`top` clicks along pixel by pixel. It is laid out where it lands
  // and the travel is a transform. Upright it sat on layout's whole pixels,
  // so the start of the travel is the same whole-pixel distance.
  const dx = (Math.round(vx) - Math.round(hx)) * (1 - move);
  const dy =
    (Math.round(vy) - Math.round(hy)) * (1 - move) + (1 - enter) * H * 0.05;
  const travelling = Math.abs(dx) > 1e-3 || Math.abs(dy) > 1e-3;
  const moving = enter < 1 || (t > pitchAt && t < pitchAt + PITCH_LEN);

  const minors = majors * 5;
  const reach = g * rulerLen;
  const ticks: { x: number; major: boolean }[] = [];
  for (let i = 0; i <= minors; i++) {
    ticks.push({
      x: (i / minors) * rulerLen,
      major: i % (minors / majors) === 0,
    });
  }
  const labelP = interpolate(t, [labelAt, labelAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const notch = tickMajor * 0.9;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: hx,
            top: hy,
            width: 0,
            height: 0,
            transformOrigin: "0 0",
            transform: `${travelling ? `translate(${dx}px, ${dy}px) ` : ""}rotate(${angle.toFixed(3)}deg) scale(${k.toFixed(4)})${glide(moving)}`,
            opacity: enter,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -m.base * F,
              height: F,
              lineHeight: `${F}px`,
              whiteSpace: "pre",
              fontFamily,
              fontWeight: 400,
              fontSize: F,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: `${TRACK}em`,
              color: fg,
            }}
          >
            {text}
          </div>
          <svg
            width={rulerLen + notch * 2}
            height={below}
            viewBox={`${-notch} 0 ${rulerLen + notch * 2} ${below}`}
            style={{
              position: "absolute",
              left: -notch,
              top: 0,
              overflow: "visible",
            }}
            aria-hidden
          >
            <line
              x1={0}
              x2={rulerLen}
              y1={gap}
              y2={gap}
              stroke={c.dim}
              strokeWidth={stroke}
            />
            <line
              x1={0}
              x2={reach}
              y1={gap}
              y2={gap}
              stroke={fg}
              strokeWidth={stroke}
            />
            {ticks.map((tk) => (
              <line
                key={tk.x}
                x1={tk.x}
                x2={tk.x}
                y1={gap}
                y2={gap + (tk.major ? tickMajor : tickMinor)}
                stroke={tk.x <= reach + 0.5 ? fg : c.dim}
                strokeWidth={stroke}
              />
            ))}
            <path
              d={`M${reach.toFixed(2)} ${gap.toFixed(2)} l${(-notch / 2).toFixed(2)} ${(-notch * 0.8).toFixed(2)} h${notch.toFixed(2)} Z`}
              fill={mark}
            />
          </svg>
          {label ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: labelTop,
                whiteSpace: "pre",
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: labelFs,
                lineHeight: 1,
                color: fg,
                opacity: labelP,
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
