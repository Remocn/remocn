"use client";

import { loadFont } from "@remotion/google-fonts/RedHatDisplay";
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

const redHat = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface OnApproachProps {
  lead?: string;
  steps?: string[];
  interval?: number;
  /** Frame of the first swap. */
  swapAt?: number;
  accent?: string;
  /** Text color of the lead; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the line. Load it yourself; Red Hat Display by default. */
  fontFamily?: string;
  /** Size of the line, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#B84A26", ink: "#FFF1E0", accent: "#8FD3FF" },
  light: { bg: "#FFF1E0", ink: "#B84A26", accent: "#1B4F72" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const FONT_PX = 200;
const LEADING = 0.9;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GROW = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const IN = 2;
const FIRST = 36;
const GROW = 18;

interface Metrics {
  w: Record<string, number>;
  asc: number;
  desc: number;
  cap: number;
}

function measureAll(texts: string[], family: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("on-approach: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${family}"`;
  const w: Record<string, number> = {};
  for (const s of texts) {
    w[s] = ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  }
  const fm = ctx.measureText("Hxg");
  const h = ctx.measureText("H");
  return {
    w,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    cap: h.actualBoundingBoxAscent / FONT_PX,
  };
}

function useMetrics(texts: string[], family: string) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("on-approach: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      redHat.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key: key + family,
          m: measureAll(key.split("\u0001"), family),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key + family ? state.m : null;
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

export function OnApproach({
  lead = "Wheels up",
  steps = ["in June.", "next week.", "tomorrow.", "today."],
  interval = 30,
  swapAt = FIRST,
  accent,
  ink,
  background,
  fontFamily = redHat.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: OnApproachProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H } = useSceneConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = steps.length > 0 ? steps : ["today."];
  const leadSp = `${lead} `;
  const m = useMetrics(
    [leadSp, lead, ...list, ...list.map((s) => leadSp + s)],
    fontFamily,
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.06);
  const marginY = H * (portrait ? 0.07 : 0.09);
  const measureW = W - marginX * 2;
  const measureH = H - marginY * 2;
  const last = list.length - 1;

  const finalSize = Math.min(
    measureW / Math.max(m.w[lead], m.w[list[last]], 0.1),
    measureH / (m.cap + LEADING + m.desc * 0.6),
  );
  const startSize = Math.min(
    H * (portrait ? 0.035 : 0.075),
    measureW / Math.max(0.1, m.w[leadSp + list[0]]),
  );
  const sizes = list.map((s, k) => {
    if (k === last && last > 0) return finalSize;
    const geo =
      last > 0 ? startSize * (finalSize / startSize) ** (k / last) : finalSize;
    return Math.min(geo, measureW / Math.max(0.1, m.w[leadSp + s]));
  });

  const stepAt = (k: number) => swapAt + (k - 1) * Math.max(16, interval);

  let k = 0;
  for (let i = 1; i <= last; i++) if (t >= stepAt(i)) k = i;
  const g =
    k > 0
      ? interpolate(t, [stepAt(k), stepAt(k) + GROW], [0, 1], {
          ...CLAMP,
          easing: EASE_GROW,
        })
      : 1;
  const moving = k > 0 && g < 1;
  const growing = moving && g > 0;
  const from = Math.max(0, k - 1);
  const to = k;
  const size = moving ? sizes[from] + (sizes[to] - sizes[from]) * g : sizes[k];

  const capTop = marginY;
  const baseOf = (s: number) => capTop + m.cap * s;
  const boxTop = (base: number, s: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * s;

  const textStyle = (s: number, color: string): React.CSSProperties => ({
    position: "absolute",
    height: s,
    lineHeight: `${s}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight: WGHT,
    fontSize: s,
    letterSpacing: `${TRACK}em`,
    color,
  });

  const intro = interpolate(t, [IN, IN + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // An animated font size would move the baseline inside its own box by
  // layout, a pixel at a time. So the lead is laid out once, at the size it
  // finally rests at, and scaled to the live one about its cap line, which
  // stays put. One layout for its whole life: a hand-over between layout and
  // a transform would jump by the rounding between them.
  const leadSize = sizes[last];
  const leadTop = boxTop(baseOf(leadSize), leadSize);
  const leadK = size / leadSize;
  const nodes: React.ReactNode[] = [];
  nodes.push(
    <div
      key="lead"
      style={{
        ...textStyle(leadSize, ink ?? c.ink),
        left: marginX,
        top: leadTop,
        opacity: intro,
        transform: `translateY(${((1 - intro) * size * 0.6).toFixed(2)}px) scale(${leadK})${glide(
          midway(intro) || growing,
        )}`,
        transformOrigin: `0 ${capTop - leadTop}px`,
      }}
    >
      {lead}
    </div>,
  );

  const tailPos = (idx: number, s: number) => {
    const b = baseOf(s);
    if (idx === last && last > 0) {
      return { x: marginX, base: b + LEADING * s };
    }
    return { x: marginX + m.w[leadSp] * s, base: b };
  };

  // The same goes for a tail: its whole layout is proportional to the size
  // about the start of the cap line, so it is laid out at the size it rests
  // at and scaled about that point while the size grows.
  const tail = (idx: number, s: number, p: number, dir: 1 | -1) => {
    const ls = sizes[idx];
    const kk = s / ls;
    const pos = tailPos(idx, ls);
    const clipTop = pos.base - (m.cap + 0.12) * ls;
    const clipH = (m.cap + 0.12 + m.desc * 0.9) * ls;
    const dy = dir * (1 - p) * (m.cap + 0.3) * ls;
    return (
      <div
        key={`tail-${idx}-${dir}`}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: clipTop,
          height: clipH,
          overflow: "hidden",
          transform: growing ? `scale(${kk})` : undefined,
          transformOrigin: growing
            ? `${marginX}px ${capTop - clipTop}px`
            : undefined,
        }}
      >
        <div
          style={{
            ...textStyle(ls, hi),
            left: pos.x,
            top: boxTop(pos.base, ls) - clipTop,
            transform: `translateY(${dy.toFixed(2)}px)${glide(midway(p) || growing)}`,
          }}
        >
          {list[idx]}
        </div>
      </div>
    );
  };

  if (moving) {
    const out = interpolate(g, [0, 0.4], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    const inn = interpolate(g, [0.35, 1], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (out < 1) nodes.push(tail(from, size, 1 - out, -1));
    if (inn > 0) nodes.push(tail(to, size, inn, 1));
  } else {
    const p = k === 0 ? intro : 1;
    nodes.push(tail(k, size, p, 1));
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
