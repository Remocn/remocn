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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LINES,
  linesOf,
  type UnmaskLineElementId,
  unmaskLineTimeline,
} from "./timeline";

const plex = loadPlexMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface UnmaskLineProps {
  lines?: string[];
  highlight?: number;
  /** Frame the dots start opening into letters. */
  openAt?: number;
  /** Frames between letters opening. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines; keep it monospaced so letters sit on the dot grid. Load it yourself; IBM Plex Mono by default. */
  fontFamily?: string;
  /** Size of the lines, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single dots arriving, the breath and single
   * letters opening, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<UnmaskLineElementId>;
}

const GREEN = { dark: "#00C805", light: "#00873C" } as const;

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF" },
  light: { bg: "#FFFFFF", ink: "#000000" },
} as const;

const DOT_R = 0.1;
const LEADING = 1.08;

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

function measure(fontFamily: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("unmask-line: no 2d context");
  ctx.font = `500 100px "${fontFamily}"`;
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

function useMetrics(fontFamily: string) {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("unmask-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      plex.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setM(measure(fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [fontFamily, handle]);
  return m;
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

export function UnmaskLine(props: UnmaskLineProps) {
  const {
    lines = DEFAULT_LINES,
    highlight = -1,
    accent,
    ink,
    background,
    fontFamily = plex.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    unmaskLineTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const green = accent ?? GREEN[theme];
  const fg = ink ?? c.ink;
  const m = useMetrics(fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const list = linesOf(lines);
  const breathEl = tl.get("breath");
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
    const color = li === hl ? green : fg;
    Array.from(line).forEach((ch, ci) => {
      if (ch === " ") return;
      const i = order++;
      const x = margin + ci * cell;
      const cx = x + cell / 2;
      const cy = baseY - m.xh * F * 0.5;
      const dot = tl.get(`dot:${i}`);
      const letter = tl.get(`letter:${i}`);
      const arrive = interpolate(t, [dot.start, dot.end], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const pulse = breathEl.beat("pulse");
      const bt = t - (breathEl.start + i * breathEl.beat("gap"));
      const breath =
        bt > 0 && bt < pulse ? Math.sin((bt / pulse) * Math.PI) : 0;
      const p = interpolate(t, [letter.start, letter.end], [0, 1], {
        ...CLAMP,
        easing: EASE_OPEN,
      });
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
              fontFamily,
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
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
