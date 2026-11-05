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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const redHat = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface OnApproachProps {
  lead?: string;
  steps?: string[];
  interval?: number;
  accent?: string;
  background?: string;
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

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("on-approach: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${redHat.fontFamily}"`;
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

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("on-approach: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      redHat.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${redHat.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureAll(key.split("\u0001")) });
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

export function OnApproach({
  lead = "Wheels up",
  steps = ["in June.", "next week.", "tomorrow.", "today."],
  interval = 30,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: OnApproachProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = steps.length > 0 ? steps : ["today."];
  const leadSp = `${lead} `;
  const m = useMetrics([leadSp, lead, ...list, ...list.map((s) => leadSp + s)]);

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

  const stepAt = (k: number) => FIRST + (k - 1) * Math.max(16, interval);

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
    fontFamily: redHat.fontFamily,
    fontWeight: WGHT,
    fontSize: s,
    letterSpacing: `${TRACK}em`,
    color,
  });

  const intro = interpolate(t, [IN, IN + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const base = baseOf(size);
  const nodes: React.ReactNode[] = [];
  nodes.push(
    <div
      key="lead"
      style={{
        ...textStyle(size, c.ink),
        left: marginX,
        top: boxTop(base, size),
        opacity: intro,
        transform: `translateY(${((1 - intro) * size * 0.6).toFixed(2)}px)`,
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

  const tail = (idx: number, s: number, p: number, dir: 1 | -1) => {
    const pos = tailPos(idx, s);
    const clipTop = pos.base - (m.cap + 0.12) * s;
    const clipH = (m.cap + 0.12 + m.desc * 0.9) * s;
    const dy = dir * (1 - p) * (m.cap + 0.3) * s;
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
        }}
      >
        <div
          style={{
            ...textStyle(s, hi),
            left: pos.x,
            top: boxTop(pos.base, s) - clipTop,
            transform: `translateY(${dy.toFixed(2)}px)`,
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
      {nodes}
    </AbsoluteFill>
  );
}
