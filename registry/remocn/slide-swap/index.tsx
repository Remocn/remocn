"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SlideSwapConfig = {
  sceneFrames: number;
  slideFrames: number;
  inDistance: number;
  inDamping: number;
  inStiffness: number;
  inMass: number;
  inFadeFrames: number;
  outFrames: number;
  outDistance: number;
  outPower: number;
};

export const SLIDE_SWAP_DEFAULTS: SlideSwapConfig = {
  sceneFrames: 70,
  slideFrames: 30,
  inDistance: 0.28,
  inDamping: 60,
  inStiffness: 300,
  inMass: 0.5,
  inFadeFrames: 24,
  outFrames: 22,
  outDistance: 0.1,
  outPower: 5,
};

export type SlideAxis = "x" | "y";

const translate = (axis: SlideAxis, v: number) =>
  axis === "x" ? `${v}px` : `0 ${v}px`;

export const slideInStyle = (
  e: number,
  size: number,
  fps: number,
  config?: Partial<SlideSwapConfig>,
  axis: SlideAxis = "x",
): CSSProperties => {
  const cfg = { ...SLIDE_SWAP_DEFAULTS, ...config };
  if (e >= cfg.slideFrames) return {};
  const p = spring({
    frame: Math.max(e, 0),
    fps,
    config: {
      damping: cfg.inDamping,
      stiffness: cfg.inStiffness,
      mass: cfg.inMass,
      overshootClamping: true,
    },
  });
  const tFade = Math.min(Math.max(e / cfg.inFadeFrames, 0), 1);
  return {
    translate: translate(axis, cfg.inDistance * size * (1 - p)),
    opacity: 1 - (1 - tFade) * (1 - tFade),
    willChange: "transform, opacity",
  };
};

export const slideOutStyle = (
  e: number,
  size: number,
  config?: Partial<SlideSwapConfig>,
  axis: SlideAxis = "x",
): CSSProperties => {
  const cfg = { ...SLIDE_SWAP_DEFAULTS, ...config };
  if (e <= 0) return {};
  const t = Math.min(e / cfg.outFrames, 1);
  return {
    translate: translate(axis, -cfg.outDistance * size * t ** cfg.outPower),
    opacity: 1 - t * t,
    willChange: "transform, opacity",
  };
};

export type SlideSwapSceneDef = {
  name?: string;
  durationInFrames?: number;
  content: ReactNode;
};

export type SlideSwapPhase = "slide" | "dwell" | "exit";

export type SlideSwapTimeline = {
  index: number;
  local: number;
  dwellFrames: number;
  phase: SlideSwapPhase;
};

export const slideSwapTimeline = (
  frame: number,
  scenes: SlideSwapSceneDef[],
  config?: Partial<SlideSwapConfig>,
  opts?: { loop?: boolean },
): SlideSwapTimeline => {
  const cfg = { ...SLIDE_SWAP_DEFAULTS, ...config };
  const lens = scenes.map((s) => s.durationInFrames ?? cfg.sceneFrames);
  const total = lens.reduce((a, b) => a + b, 0);
  let w = opts?.loop
    ? ((frame % total) + total) % total
    : Math.min(frame, total - 1);
  let index = 0;
  while (index < scenes.length - 1 && w >= lens[index]) {
    w -= lens[index];
    index += 1;
  }
  const local = Math.min(w, lens[index] - 1);
  const dwellFrames = lens[index];
  const exits = index < scenes.length - 1 || Boolean(opts?.loop);
  const enters = index > 0 || Boolean(opts?.loop);
  const phase: SlideSwapPhase =
    exits && local >= dwellFrames - cfg.outFrames
      ? "exit"
      : enters && local + 1 < cfg.slideFrames
        ? "slide"
        : "dwell";
  return { index, local, dwellFrames, phase };
};

export interface SlideSwapScenesProps {
  scenes: SlideSwapSceneDef[];
  bg?: string;
  axis?: SlideAxis;
  config?: Partial<SlideSwapConfig>;
  loop?: boolean;
  style?: CSSProperties;
}

export function SlideSwapScenes({
  scenes,
  bg,
  axis = "x",
  config,
  loop = false,
  style,
}: SlideSwapScenesProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const cfg = { ...SLIDE_SWAP_DEFAULTS, ...config };
  const size = axis === "x" ? width : height;

  const { index, local, dwellFrames, phase } = slideSwapTimeline(
    frame,
    scenes,
    cfg,
    { loop },
  );
  const cur = scenes[index];
  const enters = index > 0 || loop;

  const sceneStyle =
    phase === "exit"
      ? slideOutStyle(local - (dwellFrames - cfg.outFrames), size, cfg, axis)
      : enters
        ? slideInStyle(local + 1, size, fps, cfg, axis)
        : undefined;

  return (
    <AbsoluteFill style={{ background: bg, ...style }}>
      <AbsoluteFill style={sceneStyle}>{cur.content}</AbsoluteFill>
    </AbsoluteFill>
  );
}
