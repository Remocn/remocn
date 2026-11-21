"use client";

import { loadFont as loadFamiljen } from "@remotion/google-fonts/FamiljenGrotesk";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
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

const familjen = loadFamiljen("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface TimesTurnProps {
  value?: string;
  before?: string;
  label?: string;
  accent?: string;
  /** Text color of the figure and label; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Familjen Grotesk by default. */
  fontFamily?: string;
  /** Weight of the figure. */
  fontWeight?: number;
  /** Frames between words of the label. */
  stagger?: number;
  /** Size of the figure and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const ORANGE = "#FF4F00";

const THEMES = {
  dark: { field: "#1E1E1E", ink: "#FFE7D6", inkOnAccent: "#1E1E1E" },
  light: { field: "#FFE7D6", ink: "#1E1E1E", inkOnAccent: "#1E1E1E" },
} as const;

const TRACK = -0.03;
const ARM = 0.56;
const STROKE = 0.085;
const CROSS_K = 0.86;
const GAP = 0.03;

const RISE_AT = 0;
const RISE_LEN = 16;
const TURN_AT = 30;
const PCT_AT = 32;
const SWELL_AT = 38;
const SWELL_END = 74;
const LABEL_AT = 64;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  digits: number;
  unit: number;
  figH: number;
  baseOff: number;
}

function measure(
  value: string,
  unit: string,
  fontFamily: string,
  fontWeight: number,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("times-turn: no 2d context");
  const fam = `"${fontFamily}"`;
  ctx.font = `${fontWeight} 100px ${fam}`;
  const n = Array.from(value).length;
  const digits = ctx.measureText(value).width / 100 + TRACK * n;
  const unitW = unit
    ? ctx.measureText(unit).width / 100 + TRACK * Array.from(unit).length
    : 0;
  const fm = ctx.measureText("0123456789");
  const figH = fm.actualBoundingBoxAscent / 100;
  const asc = fm.fontBoundingBoxAscent / 100;
  const desc = fm.fontBoundingBoxDescent / 100;
  const baseOff = (1 - (asc + desc)) / 2 + asc;
  return { digits, unit: unitW, figH, baseOff };
}

function useMetrics(
  value: string,
  unit: string,
  fontFamily: string,
  fontWeight: number,
) {
  const key = `${value}\u0001${unit}\u0001${fontFamily}\u0001${fontWeight}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("times-turn: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [v, u] = key.split("\u0001");
    Promise.all([
      familjen.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(v, u, fontFamily, fontWeight) });
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

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function TimesTurn({
  value = "3",
  before = "%",
  label = "more launch cuts from the same storyboard",
  accent,
  ink,
  background,
  fontFamily = familjen.fontFamily,
  fontWeight = 500,
  stagger = 2,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: TimesTurnProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const gid = `tt${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const m = useMetrics(value, before, fontFamily, fontWeight);

  const transparent = background === "transparent";
  const hot = accent ?? ORANGE;
  const field = transparent ? c.field : (background ?? c.field);

  if (!m) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: transparent ? "transparent" : field,
        }}
      />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);
  const pad = Math.min(W, H) * 0.075;

  const signBox = portrait
    ? { x: 0, y: 0, w: W, h: H * 0.4 }
    : { x: 0, y: 0, w: W * 0.4, h: H };
  const numBox = portrait
    ? { x: 0, y: signBox.h, w: W, h: H - signBox.h }
    : { x: signBox.w, y: 0, w: W - signBox.w, h: H };

  const turn = spring({
    frame: t - TURN_AT,
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.9 },
  });
  const turnPrev = spring({
    frame: t - TURN_AT - 1,
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.9 },
  });
  const angle = 45 * turn;
  const armK = 1 + (CROSS_K - 1) * Math.min(1, turn);
  const lean = Math.max(-9, Math.min(9, (turn - turnPrev) * 60));

  const pctOut = interpolate(t, [PCT_AT, PCT_AT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const swellRaw = (t - SWELL_AT) / (SWELL_END - SWELL_AT);
  const swelling = swellRaw > 0 && swellRaw < 1;
  const swell = interpolate(t, [SWELL_AT, SWELL_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const fill = interpolate(t, [SWELL_AT + 4, SWELL_END - 4], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });

  const labelFs = (portrait ? 48 : 34) * s;
  const labelLines = portrait ? 2 : 3;
  const labelRoom = label ? labelFs * (1.25 * labelLines + 0.9) : 0;
  const innerW = numBox.w - pad * 2;
  const F1 = Math.min(
    innerW / Math.max(0.01, m.digits),
    (numBox.h - pad * 2 - labelRoom) / m.figH,
    (signBox.w * 0.62) / ARM,
    (signBox.h * 0.62) / ARM,
  );
  const F0 = Math.min(F1 * 0.34, innerW / (m.digits + GAP + m.unit));
  const F = F0 + (F1 - F0) * swell;

  const base1 = numBox.y + pad + m.figH * F1;
  const base0 = numBox.y + numBox.h / 2 + (m.figH * F0) / 2;
  const baseY = base0 + (base1 - base0) * swell;
  const digitsLeft = numBox.x + pad;

  const rise = (k: number) =>
    interpolate(t, [RISE_AT + k * 2, RISE_AT + k * 2 + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const signCx = signBox.x + signBox.w / 2;
  const signCy = portrait
    ? signBox.y + signBox.h / 2
    : baseY - m.figH * F * 0.5;
  const arm = ARM * F * armK;
  const stroke = STROKE * F;
  const signRise = rise(0);
  const signDy = (1 - signRise) * F * 0.9;
  const digitsRise = rise(1);
  const unitRise = rise(2);

  const maskTop = baseY - m.figH * F - F * 0.12;
  const maskH = m.figH * F + F * 0.16;

  // An animated font size moves the baseline inside its own box by layout,
  // and the mask's `top` rounds as well. So the figure is laid out once at
  // its final size and scaled to the live one about the digits' left end on
  // the baseline, all its life: handed back to layout at rest, it would jump
  // by what the rounding takes.
  const FL = F1;
  const baseL = base1;
  const maskTopL = baseL - m.figH * FL - FL * 0.12;
  const maskHL = m.figH * FL + FL * 0.16;
  const lineTopL = baseL - m.baseOff * FL;
  // Exactly 1 once swollen, where the figure rests on its own layout.
  const k = swell === 1 ? 1 : F / FL;
  const swellDy = baseY - maskTopL + (maskTopL - baseL) * k;
  // the unit sits past the digits at the small size, so the clip box is
  // widened to keep its right edge at the frame edge once scaled down
  const maskW = numBox.w / k;
  const swellMove = `translate(${(digitsLeft - numBox.x) * (1 - k)}px, ${
    Math.abs(swellDy) > 1e-6 ? swellDy : 0
  }px) scale(${k})${glide(swelling)}`;
  const digitsDy = (1 - digitsRise) * maskHL;
  const unitDy = (1 - unitRise) * maskHL + pctOut * maskHL;
  const skew = `skewX(${(-lean).toFixed(2)}deg)`;

  const quietInk = `color-mix(in srgb, ${fg} 42%, ${field})`;
  const quietSign = `color-mix(in srgb, ${c.inkOnAccent} 45%, ${hot})`;
  const signInk = transparent ? fg : c.inkOnAccent;

  const labelWords = label ? label.split(" ") : [];

  const textStyle = {
    position: "absolute" as const,
    fontFamily,
    fontWeight,
    fontSize: FL,
    lineHeight: `${FL}px`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  };

  const signClipTop = portrait ? signBox.y : maskTop;
  const signClipH = portrait ? signBox.h : maskH;

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : field,
        overflow: "hidden",
      }}
    >
      {transparent ? null : (
        <div
          style={{
            position: "absolute",
            left: signBox.x,
            top: signBox.y,
            width: signBox.w,
            height: signBox.h,
            background: hot,
          }}
        />
      )}

      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <clipPath id={`${gid}s`}>
              <rect
                x={signBox.x}
                y={signClipTop}
                width={signBox.w}
                height={signClipH}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${gid}s)`}>
            <g
              transform={`translate(${signCx.toFixed(2)} ${(signCy + signDy).toFixed(2)}) rotate(${angle.toFixed(3)})`}
            >
              {[quietSign, signInk].map((paint, k) => (
                <g key={paint} opacity={k === 0 ? 1 - fill : fill}>
                  <rect
                    x={-arm / 2}
                    y={-stroke / 2}
                    width={arm}
                    height={stroke}
                    style={{ fill: paint }}
                  />
                  <rect
                    x={-stroke / 2}
                    y={-arm / 2}
                    width={stroke}
                    height={arm}
                    style={{ fill: paint }}
                  />
                </g>
              ))}
            </g>
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            left: numBox.x,
            width: maskW,
            top: maskTopL,
            height: maskHL,
            overflow: "hidden",
            transform: swellMove,
            transformOrigin: "0 0",
          }}
        >
          <div
            style={{
              ...textStyle,
              left: digitsLeft - numBox.x,
              // the rise is a transform, not `top`: layout rounds a baseline
              // to whole pixels, so the figure would click up pixel by pixel
              top: lineTopL - maskTopL,
              transform: `translateY(${digitsDy}px) ${skew}${glide(midway(digitsRise) && !swelling)}`,
              transformOrigin: `0 ${(m.baseOff * FL).toFixed(1)}px`,
            }}
          >
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ color: quietInk, opacity: 1 - fill }}>
                {value}
              </span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: fill,
                  color: fg,
                }}
              >
                {value}
              </span>
            </span>
          </div>
          {before ? (
            <div
              style={{
                ...textStyle,
                left: digitsLeft - numBox.x + (m.digits + GAP) * FL,
                top: lineTopL - maskTopL,
                color: quietInk,
                opacity: 1 - pctOut * pctOut,
                transform: `translateY(${unitDy}px) ${skew}${glide((midway(unitRise) || midway(pctOut)) && !swelling)}`,
                transformOrigin: `0 ${(m.baseOff * FL).toFixed(1)}px`,
              }}
            >
              {before}
            </div>
          ) : null}
        </div>

        {label ? (
          <div
            style={{
              position: "absolute",
              left: digitsLeft,
              width: Math.min(innerW, labelFs * 14),
              bottom: H - numBox.y - numBox.h + pad - labelFs * 0.2,
              display: "flex",
              flexWrap: "wrap",
              columnGap: "0.26em",
              fontFamily,
              fontWeight: 400,
              fontSize: labelFs,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: fg,
            }}
          >
            {labelWords.map((w, k) => {
              const p = interpolate(
                t,
                [LABEL_AT + k * stagger, LABEL_AT + k * stagger + 16],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <span
                  key={`${w}-${k}`}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${((1 - p) * labelFs * 0.7).toFixed(2)}px)${glide(midway(p))}`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
