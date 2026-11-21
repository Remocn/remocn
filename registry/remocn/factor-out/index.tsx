"use client";

import { loadFont } from "@remotion/google-fonts/Rubik";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const rubik = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface FactorOutProps {
  heads?: string[];
  tail?: string;
  accent?: string;
  /** Text color of the lines; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Rubik by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames between one line entering and the next. */
  stagger?: number;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2A1033", ink: "#FFFFFF", accent: "#7CC4FF" },
  light: { bg: "#F3EEF5", ink: "#2A1033", accent: "#2B7BD6" },
} as const;

const DEFAULT_HEADS = ["Write the scenes", "Pick the colors", "Fix the typos"];
const DEFAULT_TAIL = "in your editor.";

const WGHT = 500;
const TRACK = -0.03;
const LH = 1.16;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Metrics = Record<string, number>;

function measureAll(texts: string[], font: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("factor-out: no 2d context");
  ctx.font = font;
  const w: Metrics = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / 100 + TRACK * Array.from(s).length;
  }
  return w;
}

function useMetrics(texts: string[], fontFamily: string, fontWeight: number) {
  const font = `${fontWeight} 100px "${fontFamily}"`;
  const key = `${font}\u0002${texts.join("\u0001")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("factor-out: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([rubik.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measureAll(key.split("\u0002")[1].split("\u0001"), font),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, font]);
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

export function FactorOut({
  heads = DEFAULT_HEADS,
  tail = DEFAULT_TAIL,
  accent,
  ink,
  background,
  fontFamily = rubik.fontFamily,
  fontWeight = WGHT,
  stagger = 8,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: FactorOutProps) {
  const glide = useGlide();
  const now = useSceneFrame();
  const tAt = (f: number) => Math.max(0, f - delay) * speed;
  const t = tAt(now);
  /** Whether a value in px, as a function of time, moves on this frame. */
  const stirs = (v: (t: number) => number) => {
    const here = v(t);
    return (
      Math.abs(v(tAt(now + 1)) - here) > 1e-3 ||
      Math.abs(here - v(tAt(now - 1))) > 1e-3
    );
  };
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = heads.length > 0 ? heads : DEFAULT_HEADS;
  const n = list.length;
  const m = useMetrics([" ", tail, ...list], fontFamily, fontWeight);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const mX = W * (portrait ? 0.08 : 0.075);
  const availW = W - mX * 2;
  const maxHead = Math.max(...list.map((h) => m[h]));
  const sp = m[" "];
  const tailW = Math.max(0.1, m[tail]);
  const rowsUnits = n * LH;
  let F = Math.min(
    H * (portrait ? 0.058 : 0.1),
    (availW * 0.98) / (maxHead + sp + tailW),
    (H * 0.8) / (rowsUnits + 0.4 + 1.6 * LH),
  );
  let G = Math.min(2.3, (availW * 0.98) / (tailW * F));
  const fitH = (H * 0.82 - F * (rowsUnits + 0.4)) / (F * LH);
  if (G > fitH) G = Math.max(1, fitH);
  if (G < 1) {
    F = F * G;
    G = 1;
  }
  const rowH = F * LH;
  const gapBelow = F * 0.42;
  const finalH = n * rowH + gapBelow + G * F * LH;
  const colX = mX + (maxHead + sp) * F;

  const span = durationInFrames * speed;
  const k = Math.min(1.5, Math.max(0.85, (span - 50) / 140));
  const enterAt = (i: number) => (6 + i * stagger) * k;
  const spotAt = (i: number) => (44 + i * 4) * k;
  const alignAt = 62 * k;
  const MERGE = 15 * k;
  const mergeAt = (i: number) => (86 + i * 18) * k;
  const liftAt = mergeAt(n - 2) + MERGE + 8 * k;
  const LIFT = 26 * k;

  const lineStyle: React.CSSProperties = {
    fontFamily,
    fontWeight,
    fontSize: F,
    lineHeight: `${rowH}px`,
    height: rowH,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre",
  };

  const nodes: React.ReactNode[] = [];

  const alignOf = (t: number) =>
    interpolate(t, [alignAt, alignAt + 22 * k], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
  const liftOf = (t: number) =>
    interpolate(t, [liftAt, liftAt + LIFT], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
  const align = alignOf(t);
  const lift = liftOf(t);
  const topOf = (lift: number) =>
    (H - finalH) / 2 + (1 - lift) * ((finalH - n * rowH) / 2);
  const rowAt = (i: number, lift: number) => topOf(lift) + i * rowH;
  const finalAt = (lift: number) => topOf(lift) + n * rowH + gapBelow;
  const rowY = (i: number) => rowAt(i, lift);
  // Rows and the tail are laid out at the nearer of their resting places and
  // the rest of the ride is a transform: layout rounds a box and a baseline to
  // whole pixels, so a row eased by `top`/`left` clicks along pixel by pixel.
  const liftRest = Math.round(lift);
  const alignRest = Math.round(align);
  const shift = (dx: number, dy: number) =>
    Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3
      ? ""
      : `translate(${dx}px, ${dy}px) `;

  for (let i = 0; i < n; i++) {
    const d = enterAt(i);
    if (t < d - 1) continue;
    const pinOf = (t: number) =>
      interpolate(t, [d, d + 18], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
    const pin = pinOf(t);
    const y = rowY(i);
    const yRest = rowAt(i, liftRest);
    const rowMoving = stirs((t) => rowAt(i, liftOf(t)));
    const rise = (1 - pin) * rowH * 0.85;
    const riseMoving = stirs((t) => (1 - pinOf(t)) * rowH * 0.85);
    const rowShift = shift(0, y - yRest);
    nodes.push(
      <div
        key={`h-${i}`}
        style={{
          position: "absolute",
          left: mX - F * 0.1,
          top: yRest - F * 0.1,
          height: rowH + F * 0.2,
          paddingLeft: F * 0.1,
          paddingRight: F * 0.2,
          paddingTop: F * 0.1,
          overflow: "hidden",
          transform: rowShift
            ? `${rowShift.trim()}${glide(rowMoving)}`
            : undefined,
        }}
      >
        <div
          style={{
            ...lineStyle,
            color: fg,
            transform: `translateY(${rise.toFixed(2)}px)${glide(riseMoving && !rowMoving)}`,
          }}
        >
          {list[i]}
        </div>
      </div>,
    );

    const x0 = mX + (m[list[i]] + sp) * F;
    const last = i === n - 1;
    const mpOf = (t: number) =>
      last
        ? 0
        : interpolate(t, [mergeAt(i), mergeAt(i) + MERGE], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
    const mp = mpOf(t);
    if (mp >= 1) continue;
    const landAt = i > 0 ? mergeAt(i - 1) + MERGE * 0.35 : -1000;
    const bumpOf = (t: number) =>
      Math.sin(
        Math.PI *
          interpolate(t, [landAt, landAt + 10 * k], [0, 1], { ...CLAMP }),
      ) * 0.045;
    /** The tail's top-left for an alignment and a lift. */
    const tailAt = (align: number, lift: number) => {
      const xA = x0 + (colX - x0) * align;
      const y = rowAt(i, lift);
      if (!last) return { x: xA, y };
      return {
        x: xA + (mX - xA) * lift,
        y: y + (finalAt(lift) - y) * lift,
      };
    };
    const at = tailAt(align, lift);
    const atRest = tailAt(alignRest, liftRest);
    const zoomOf = (t: number) =>
      1 + bumpOf(t) + (last ? (G - 1) * liftOf(t) : 0);
    const zoom = zoomOf(t);
    // Weighed over the tail's width, so the zoom term is in px.
    const tailMoving =
      stirs((t) => tailAt(alignOf(t), liftOf(t)).x) ||
      stirs((t) => tailAt(alignOf(t), liftOf(t)).y) ||
      stirs((t) => zoomOf(t) * tailW * F);
    const textMoving = stirs(
      (t) => (1 - pinOf(t)) * rowH * 0.85 + mpOf(t) * rowH * 0.55,
    );
    const tint = interpolate(t, [spotAt(i), spotAt(i) + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    nodes.push(
      <div
        key={`t-${i}`}
        style={{
          position: "absolute",
          left: atRest.x - F * 0.1,
          top: atRest.y - F * 0.1,
          height: rowH + F * 0.2,
          paddingLeft: F * 0.1,
          paddingRight: F * 0.2,
          paddingTop: F * 0.1,
          overflow: pin >= 1 ? "visible" : "hidden",
          zIndex: last ? 2 : 1,
          transform: `${shift(at.x - atRest.x, at.y - atRest.y)}scale(${zoom.toFixed(4)})${glide(tailMoving)}`,
          transformOrigin: `${F * 0.1}px ${F * 0.1}px`,
        }}
      >
        <div
          style={{
            ...lineStyle,
            color: interpolateColors(tint, [0, 1], [fg, hi]),
            opacity: interpolate(mp, [0.05, 0.85], [1, 0], CLAMP),
            transform: `translateY(${(rise + mp * rowH * 0.55).toFixed(2)}px)${glide(textMoving && !tailMoving)}`,
          }}
        >
          {tail}
        </div>
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
