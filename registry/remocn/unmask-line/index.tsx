"use client";

import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
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

const plex = loadPlexMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface UnmaskLineProps {
  lines?: string[];
  highlight?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const GREEN = { dark: "#00C805", light: "#00873C" } as const;

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF" },
  light: { bg: "#FFFFFF", ink: "#000000" },
} as const;

const DOT_R = 0.1;
const LEADING = 1.08;
const DOT_GAP = 1.2;
const DOT_LEN = 10;
const BREATH_AT = 18;
const BREATH_GAP = 1.4;
const BREATH_LEN = 12;
const OPEN_AT = 38;
const OPEN_GAP = 2.2;
const OPEN_LEN = 12;
const LINE_LAG = 4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_OPEN = Easing.bezier(0.33, 0, 0.15, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: number;
  cap: number;
  xh: number;
  base: number;
}

function measure(): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("unmask-line: no 2d context");
  ctx.font = `500 100px "${plex.fontFamily}"`;
  const m = ctx.measureText("HHHHHHHHHH");
  const asc = m.fontBoundingBoxAscent / 100;
  const desc = m.fontBoundingBoxDescent / 100;
  return {
    adv: m.width / 1000,
    cap: m.actualBoundingBoxAscent / 100,
    xh: ctx.measureText("x").actualBoundingBoxAscent / 100,
    base: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics() {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("unmask-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      plex.waitUntilDone(),
      document.fonts.load(`500 100px "${plex.fontFamily}"`),
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

export function UnmaskLine({
  lines = ["Out of", "stealth."],
  highlight = -1,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: UnmaskLineProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const green = accent ?? GREEN[theme];
  const m = useMetrics();

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const list = lines.length > 0 ? lines : [" "];
  const hl = highlight < 0 ? list.length + highlight : highlight;
  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.09);
  const widest = Math.max(...list.map((l) => Array.from(l).length));
  const F = Math.min(
    (H * (portrait ? 0.4 : 0.66)) / (list.length * LEADING),
    (W - 2 * margin) / Math.max(1, widest * m.adv),
  );
  const lineH = F * LEADING;
  const blockH = lineH * (list.length - 1) + m.cap * F;
  const firstBase = (H - blockH) / 2 + m.cap * F;
  const cell = m.adv * F;

  let order = 0;
  const nodes: React.ReactNode[] = [];
  list.forEach((line, li) => {
    const baseY = firstBase + li * lineH;
    const color = li === hl ? green : c.ink;
    Array.from(line).forEach((ch, ci) => {
      if (ch === " ") return;
      const i = order++;
      const x = margin + ci * cell;
      const cx = x + cell / 2;
      const cy = baseY - m.xh * F * 0.5;
      const arrive = interpolate(
        t,
        [li * LINE_LAG + i * DOT_GAP, li * LINE_LAG + i * DOT_GAP + DOT_LEN],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const bt = t - (BREATH_AT + i * BREATH_GAP);
      const breath =
        bt > 0 && bt < BREATH_LEN ? Math.sin((bt / BREATH_LEN) * Math.PI) : 0;
      const p = interpolate(
        t,
        [OPEN_AT + i * OPEN_GAP, OPEN_AT + i * OPEN_GAP + OPEN_LEN],
        [0, 1],
        { ...CLAMP, easing: EASE_OPEN },
      );
      const r0 = DOT_R * F * (0.5 + 0.5 * arrive) * (1 + 0.22 * breath);
      const rFull = Math.hypot(cell * 0.6, F * 0.8);
      const r = r0 + (rFull - r0) * p;
      const dotOpacity = arrive * interpolate(p, [0, 0.4], [1, 0], CLAMP);
      if (dotOpacity > 0.002) {
        nodes.push(
          <div
            key={`d${li}-${ci}`}
            style={{
              position: "absolute",
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: color,
              opacity: dotOpacity,
            }}
          />,
        );
      }
      if (p > 0) {
        const top = baseY - m.base * F;
        nodes.push(
          <div
            key={`g${li}-${ci}`}
            style={{
              position: "absolute",
              left: x,
              top,
              height: F,
              lineHeight: `${F}px`,
              fontFamily: plex.fontFamily,
              fontWeight: 500,
              fontSize: F,
              whiteSpace: "pre",
              color,
              clipPath:
                p >= 0.999
                  ? undefined
                  : `circle(${r.toFixed(2)}px at ${(cx - x).toFixed(2)}px ${(cy - top).toFixed(2)}px)`,
            }}
          >
            {ch}
          </div>,
        );
      }
    });
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
