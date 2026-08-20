"use client";

import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext } from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CLAMP, FADE, stagger } from "@/lib/remocn/scene-motion";

export type SpringSettleConfig = {
  sceneFrames: number;
  gapFrames: number;
  enterScale: number;
  enterFadeFrames: number;
  enterStagger: number;
  enterStaggerPower: number;
  enterStaggerJitter: number;
  springDamping: number;
  springStiffness: number;
  springMass: number;
  exitFrames: number;
  exitScale: number;
  exitPower: number;
  bgFadeFrames: number;
};

export const SPRING_SETTLE_DEFAULTS: SpringSettleConfig = {
  sceneFrames: 70,
  gapFrames: 1,
  enterScale: 1.24,
  enterFadeFrames: 5,
  enterStagger: 3,
  enterStaggerPower: 0.8,
  enterStaggerJitter: 1,
  springDamping: 30,
  springStiffness: 320,
  springMass: 1,
  exitFrames: 6,
  exitScale: 0.84,
  exitPower: 5,
  bgFadeFrames: 4,
};

export type SpringSettleSceneDef = {
  name?: string;
  bg?: string;
  durationInFrames?: number;
  content: ReactNode;
};

export type SpringSettlePhase = "enter" | "dwell" | "exit" | "gap";

export type SpringSettleTimeline = {
  index: number;
  local: number;
  dwellFrames: number;
};

type SceneClock = {
  local: number;
  cfg: SpringSettleConfig;
  fps: number;
};

const SceneCtx = createContext<SceneClock | null>(null);

const resolveConfig = (
  config?: Partial<SpringSettleConfig>,
): SpringSettleConfig => ({ ...SPRING_SETTLE_DEFAULTS, ...config });

const dwellOf = (scene: SpringSettleSceneDef, cfg: SpringSettleConfig) =>
  scene.durationInFrames ?? cfg.sceneFrames;

export const springSettleTimeline = (
  frame: number,
  scenes: SpringSettleSceneDef[],
  config?: Partial<SpringSettleConfig>,
  opts?: { loop?: boolean },
): SpringSettleTimeline => {
  const cfg = resolveConfig(config);
  const lens = scenes.map((s) => dwellOf(s, cfg) + cfg.gapFrames);
  const total = lens.reduce((a, b) => a + b, 0);
  let w = opts?.loop ? ((frame % total) + total) % total : frame;
  let index = 0;
  while (index < scenes.length - 1 && w >= lens[index]) {
    w -= lens[index];
    index += 1;
  }
  const local = Math.min(w, lens[index] - 1);
  return { index, local, dwellFrames: dwellOf(scenes[index], cfg) };
};

export const springSettlePhase = (
  timeline: SpringSettleTimeline,
  fps: number,
  config?: Partial<SpringSettleConfig>,
): SpringSettlePhase => {
  const cfg = resolveConfig(config);
  const { local, dwellFrames } = timeline;
  if (local >= dwellFrames) return "gap";
  if (local >= dwellFrames - cfg.exitFrames) return "exit";
  const settled =
    spring({
      frame: local,
      fps,
      config: {
        damping: cfg.springDamping,
        stiffness: cfg.springStiffness,
        mass: cfg.springMass,
      },
    }) > 0.985;
  return settled ? "dwell" : "enter";
};

export const springSettleExitStyle = (
  local: number,
  dwellFrames: number,
  config?: Partial<SpringSettleConfig>,
): CSSProperties => {
  const cfg = resolveConfig(config);
  const tExit = interpolate(
    local,
    [dwellFrames - cfg.exitFrames, dwellFrames],
    [0, 1],
    CLAMP,
  );
  if (tExit <= 0) return {};
  const eExit = tExit ** cfg.exitPower;
  return {
    scale: `${1 - (1 - cfg.exitScale) * eExit}`,
    opacity: 1 - eExit,
    willChange: "transform, opacity",
  };
};

export interface SpringSettleEnterProps {
  local: number;
  config?: Partial<SpringSettleConfig>;
  children: ReactNode;
}

export function SpringSettleEnter({
  local,
  config,
  children,
}: SpringSettleEnterProps) {
  const { fps } = useVideoConfig();
  return (
    <SceneCtx.Provider value={{ local, cfg: resolveConfig(config), fps }}>
      {children}
    </SceneCtx.Provider>
  );
}

export interface SpringSettleItemProps {
  index?: number;
  style?: CSSProperties;
  children: ReactNode;
}

export function SpringSettleItem({
  index = 0,
  style,
  children,
}: SpringSettleItemProps) {
  const clock = useContext(SceneCtx);
  if (!clock) {
    return <div style={style}>{children}</div>;
  }
  const { local, cfg, fps } = clock;
  const tEnter =
    local -
    stagger(
      index,
      cfg.enterStagger,
      cfg.enterStaggerPower,
      cfg.enterStaggerJitter,
    );
  const enterP = spring({
    frame: tEnter,
    fps,
    config: {
      damping: cfg.springDamping,
      stiffness: cfg.springStiffness,
      mass: cfg.springMass,
    },
  });
  const scaleEnter = interpolate(enterP, [0, 1], [cfg.enterScale, 1]);
  const opacityEnter = interpolate(tEnter, [0, cfg.enterFadeFrames], [0, 1], {
    ...CLAMP,
    easing: FADE,
  });
  return (
    <div
      style={{
        ...style,
        scale: `${scaleEnter}`,
        opacity: opacityEnter,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

const wrapSigned = (d: number, total: number) =>
  (((d % total) + total * 1.5) % total) - total / 2;

export interface SpringSettleScenesProps {
  scenes: SpringSettleSceneDef[];
  config?: Partial<SpringSettleConfig>;
  loop?: boolean;
  style?: CSSProperties;
}

export function SpringSettleScenes({
  scenes,
  config,
  loop = false,
  style,
}: SpringSettleScenesProps) {
  const frame = useCurrentFrame();
  const cfg = resolveConfig(config);

  const lens = scenes.map((s) => dwellOf(s, cfg) + cfg.gapFrames);
  const total = lens.reduce((a, b) => a + b, 0);
  const { index, local, dwellFrames } = springSettleTimeline(
    frame,
    scenes,
    cfg,
    { loop },
  );

  const n = scenes.length;
  const cur = scenes[index];
  const prev = loop ? scenes[(index - 1 + n) % n] : scenes[index - 1];
  const next = loop ? scenes[(index + 1) % n] : scenes[index + 1];

  const w = loop ? ((frame % total) + total) % total : frame;
  const slotStart = w - local;
  const half = Math.max(cfg.bgFadeFrames, 0.001) / 2;
  let bg = cur.bg;
  if (prev?.bg && cur.bg) {
    let d = w - (slotStart - cfg.gapFrames / 2);
    if (loop) d = wrapSigned(d, total);
    if (Math.abs(d) <= half) {
      bg = interpolateColors(d, [-half, half], [prev.bg, cur.bg]);
    }
  }
  if (next?.bg && cur.bg && bg === cur.bg) {
    let d = w - (slotStart + dwellFrames + cfg.gapFrames / 2);
    if (loop) d = wrapSigned(d, total);
    if (Math.abs(d) <= half) {
      bg = interpolateColors(d, [-half, half], [cur.bg, next.bg]);
    }
  }

  return (
    <AbsoluteFill style={{ background: bg, ...style }}>
      {local < dwellFrames ? (
        <AbsoluteFill style={springSettleExitStyle(local, dwellFrames, cfg)}>
          <SpringSettleEnter local={local} config={cfg}>
            {cur.content}
          </SpringSettleEnter>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}
