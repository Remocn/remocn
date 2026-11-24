"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  type EasingFunction,
  interpolate,
  random,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { CLAMP, EXPO, SETTLE_SOFT } from "@/lib/remocn/scene-motion";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type StageElementId, stageKeyOrder, stageTimeline } from "./timeline";

export interface StageKey {
  at: number;
  x?: number;
  y?: number;
  zoom?: number;
  rotate?: number;
  easing?: EasingFunction;
}

export interface StageContentSize {
  width: number;
  height: number;
}

export interface StageProps {
  children: ReactNode;
  contentSize?: StageContentSize;
  moves?: StageKey[];
  shake?: number;
  seed?: string;
  backdrop?: string;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  scale?: number;
  radius?: number;
  reflection?: number;
  shadow?: number;
  light?: number;
  className?: string;
  /**
   * Moves, trims or stretches the entry and each camera move, by the ids in
   * `./timeline`. Frames on the scene timeline.
   */
  timing?: Timing<StageElementId>;
}

export interface StagePose {
  x: number;
  y: number;
  zoom: number;
  rotate: number;
}

export interface StageShake {
  x: number;
  y: number;
  rotate: number;
}

export interface StagePlaneGeometry {
  width: number;
  height: number;
  left: number;
  top: number;
  targetX: number;
  targetY: number;
  translateX: number;
  translateY: number;
}

const NEUTRAL_POSE: StagePose = { x: 0.5, y: 0.5, zoom: 1, rotate: 0 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const poseFromKey = (key: StageKey): StagePose => ({
  x: clamp01(key.x ?? NEUTRAL_POSE.x),
  y: clamp01(key.y ?? NEUTRAL_POSE.y),
  zoom: key.zoom ?? NEUTRAL_POSE.zoom,
  rotate: key.rotate ?? NEUTRAL_POSE.rotate,
});

export const normalizeStageKeys: (moves: StageKey[]) => StageKey[] =
  stageKeyOrder;

/** When the camera moves from one key to the next. */
export interface StageSpan {
  start: number;
  end: number;
}

/**
 * The camera pose at `frame`. `spans` time the moves between consecutive
 * keys (the resolved `move:<i>` elements); without them, each move runs
 * from one key's `at` to the next.
 */
export function resolveStagePose(
  frame: number,
  moves: StageKey[],
  spans?: StageSpan[],
): StagePose {
  const keys = normalizeStageKeys(moves);
  if (keys.length === 0) return NEUTRAL_POSE;
  const segments =
    spans ??
    keys.slice(1).map((key, i) => ({ start: keys[i].at, end: key.at }));
  if (segments.length === 0 || frame <= segments[0].start) {
    return poseFromKey(keys[0]);
  }
  if (frame >= segments[segments.length - 1].end) {
    return poseFromKey(keys[keys.length - 1]);
  }

  const index = segments.findIndex((span) => frame <= span.end);
  const span = segments[index];
  const left = keys[index];
  const right = keys[index + 1];
  const easing = right.easing ?? EXPO;
  const progress =
    span.end > span.start
      ? interpolate(frame, [span.start, span.end], [0, 1], {
          ...CLAMP,
          easing,
        })
      : frame >= span.end
        ? 1
        : 0;
  const from = poseFromKey(left);
  const to = poseFromKey(right);
  const lerp = (a: number, b: number) => a + (b - a) * progress;

  return {
    x: lerp(from.x, to.x),
    y: lerp(from.y, to.y),
    zoom: lerp(from.zoom, to.zoom),
    rotate: lerp(from.rotate, to.rotate),
  };
}

const smoothstep = (value: number) => value * value * (3 - 2 * value);

function smoothNoise(frame: number, seed: string, axis: string): number {
  const sample = frame / 6;
  const index = Math.floor(sample);
  const mix = smoothstep(sample - index);
  const a = random(`${seed}-${axis}-${index}`) * 2 - 1;
  const b = random(`${seed}-${axis}-${index + 1}`) * 2 - 1;
  return a + (b - a) * mix;
}

export function getStageShake(
  frame: number,
  shake: number,
  seed = "remocn-stage",
): StageShake {
  const amount = clamp01(shake);
  if (amount === 0) return { x: 0, y: 0, rotate: 0 };

  const phase = random(`${seed}-phase`) * Math.PI * 2;
  const xWave = Math.sin(frame * 0.19 + phase) * 0.58;
  const yWave = Math.sin(frame * 0.13 + phase * 1.37) * 0.5;
  const xFine = Math.sin(frame * 0.047 + phase * 0.71) * 0.22;
  const yFine = Math.sin(frame * 0.071 + phase * 1.91) * 0.2;

  return {
    x: (xWave + xFine + smoothNoise(frame, seed, "x") * 0.32) * 7 * amount,
    y: (yWave + yFine + smoothNoise(frame, seed, "y") * 0.3) * 5 * amount,
    rotate:
      (Math.sin(frame * 0.083 + phase * 0.43) * 0.65 +
        smoothNoise(frame, seed, "roll") * 0.35) *
      0.28 *
      amount,
  };
}

export function getStagePlaneGeometry(
  compositionWidth: number,
  compositionHeight: number,
  contentSize: StageContentSize | undefined,
  pose: StagePose,
  widthRatio = 0.84,
): StagePlaneGeometry {
  const safeContentWidth =
    contentSize && contentSize.width > 0 ? contentSize.width : compositionWidth;
  const safeContentHeight =
    contentSize && contentSize.height > 0
      ? contentSize.height
      : compositionHeight;
  const width = compositionWidth * widthRatio;
  const height = width * (safeContentHeight / safeContentWidth);
  const left = (compositionWidth - width) / 2;
  const top = (compositionHeight - height) / 2;
  const targetX = clamp01(pose.x) * width;
  const targetY = clamp01(pose.y) * height;

  return {
    width,
    height,
    left,
    top,
    targetX,
    targetY,
    translateX: compositionWidth / 2 - (left + targetX),
    translateY: compositionHeight / 2 - (top + targetY),
  };
}

export function getStageTransform(
  geometry: StagePlaneGeometry,
  pose: StagePose,
  options: {
    scale: number;
    rotateX: number;
    rotateY: number;
    entryY?: number;
    shake?: StageShake;
  },
): string {
  const handheld = options.shake ?? { x: 0, y: 0, rotate: 0 };
  const translateX = geometry.translateX - handheld.x;
  const translateY = geometry.translateY + (options.entryY ?? 0) - handheld.y;
  const rotateZ = -pose.rotate - handheld.rotate;

  return `translate3d(${translateX}px, ${translateY}px, 0) scale(${options.scale * pose.zoom}) rotateZ(${rotateZ}deg) rotateX(${options.rotateX}deg) rotateY(${options.rotateY}deg)`;
}

export function Stage(props: StageProps) {
  const {
    children,
    contentSize,
    moves = [],
    shake = 0,
    seed = "remocn-stage",
    backdrop = "linear-gradient(145deg, #17181d 0%, #09090b 72%)",
    rotateX = 14,
    rotateY = -20,
    perspective = 900,
    scale = 0.86,
    radius = 1.4,
    reflection = 0.24,
    shadow = 0.7,
    light = 0.55,
    className,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(stageTimeline, props, durationInFrames, timing);
  const entry = tl.get("entry");
  const settle = interpolate(frame, [entry.start, entry.end], [0, 1], {
    ...CLAMP,
    easing: SETTLE_SOFT,
  });
  const opacity = interpolate(
    frame,
    [entry.start, entry.start + entry.beat("fade")],
    [0, 1],
    CLAMP,
  );
  const spans = normalizeStageKeys(moves)
    .slice(1)
    .map((_, i) => tl.get(`move:${i}`));
  const pose = resolveStagePose(frame, moves, spans);
  const handheld = getStageShake(frame, shake, seed);
  const geometry = getStagePlaneGeometry(width, height, contentSize, pose);
  const radiusPx = (radius / 100) * width;
  const reflectionStrength = clamp01(reflection);
  const shadowStrength = clamp01(shadow);
  const lightStrength = clamp01(light);
  const currentScale = interpolate(settle, [0, 1], [scale * 0.94, scale]);
  const currentRotateX = interpolate(settle, [0, 1], [rotateX + 8, rotateX]);
  const currentRotateY = interpolate(settle, [0, 1], [rotateY - 5, rotateY]);
  const entryY = interpolate(settle, [0, 1], [64, 0]);
  const transform = getStageTransform(geometry, pose, {
    scale: currentScale,
    rotateX: currentRotateX,
    rotateY: currentRotateY,
    entryY,
    shake: handheld,
  });

  const planeStyle: CSSProperties = {
    position: "absolute",
    left: geometry.left,
    top: geometry.top,
    width: geometry.width,
    height: geometry.height,
    overflow: "hidden",
    borderRadius: radiusPx,
    transform,
    transformOrigin: `${geometry.targetX}px ${geometry.targetY}px`,
    transformStyle: "preserve-3d",
    backfaceVisibility: "visible",
  };

  return (
    <AbsoluteFill
      className={className}
      style={{ overflow: "hidden", background: backdrop }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "13%",
          top: "72%",
          width: "74%",
          height: "30%",
          opacity: reflectionStrength * opacity,
          background:
            "linear-gradient(to bottom, rgba(188,181,255,0.32), rgba(91,81,145,0.1) 35%, transparent 76%)",
          clipPath: "polygon(7% 0, 93% 0, 78% 100%, 22% 100%)",
          filter: "blur(18px)",
          transform: `perspective(650px) rotateX(58deg) translateY(${entryY * 0.28}px)`,
          transformOrigin: "center top",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "16%",
          top: "70%",
          width: "68%",
          height: "11%",
          borderRadius: "50%",
          background: `rgba(0, 0, 0, ${0.52 * shadowStrength * opacity})`,
          filter: `blur(${20 + 30 * shadowStrength}px)`,
          transform: `translateY(${entryY * 0.35}px)`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          perspective,
          perspectiveOrigin: "50% 42%",
          opacity,
          pointerEvents: "none",
        }}
      >
        <div style={planeStyle}>{children}</div>
      </AbsoluteFill>

      <AbsoluteFill
        aria-hidden
        style={{
          pointerEvents: "none",
          opacity: lightStrength,
          background:
            "radial-gradient(ellipse at 38% 7%, rgba(255,255,255,0.2), transparent 36%), linear-gradient(115deg, rgba(255,255,255,0.08), transparent 38%, rgba(255,255,255,0.02) 68%, rgba(0,0,0,0.24))",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
}
