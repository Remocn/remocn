"use client";

import type { ReactNode } from "react";
import {
  AbsoluteFill,
  type EasingFunction,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CLAMP, EXPO } from "@/lib/remocn/scene-motion";

export interface CameraKey {
  at: number;
  x?: number;
  y?: number;
  zoom?: number;
  rotate?: number;
  easing?: EasingFunction;
}

export interface CameraProps {
  children: ReactNode;
  moves?: CameraKey[];
  shake?: number;
  seed?: string;
}

export interface CameraPose {
  x: number;
  y: number;
  zoom: number;
  rotate: number;
}

export interface CameraShake {
  x: number;
  y: number;
  rotate: number;
}

const NEUTRAL_POSE: CameraPose = { x: 0, y: 0, zoom: 1, rotate: 0 };

const poseFromKey = (key: CameraKey): CameraPose => ({
  x: key.x ?? NEUTRAL_POSE.x,
  y: key.y ?? NEUTRAL_POSE.y,
  zoom: key.zoom ?? NEUTRAL_POSE.zoom,
  rotate: key.rotate ?? NEUTRAL_POSE.rotate,
});

export function normalizeCameraKeys(moves: CameraKey[]): CameraKey[] {
  const byFrame = new Map<number, CameraKey>();
  for (const move of moves) byFrame.set(move.at, move);
  return [...byFrame.values()].sort((a, b) => a.at - b.at);
}

export function resolveCameraPose(
  frame: number,
  moves: CameraKey[],
): CameraPose {
  const keys = normalizeCameraKeys(moves);
  if (keys.length === 0) return NEUTRAL_POSE;
  if (frame <= keys[0].at) return poseFromKey(keys[0]);
  if (frame >= keys[keys.length - 1].at) {
    return poseFromKey(keys[keys.length - 1]);
  }

  const rightIndex = keys.findIndex((key) => frame <= key.at);
  const left = keys[rightIndex - 1];
  const right = keys[rightIndex];
  const progress = interpolate(frame, [left.at, right.at], [0, 1], {
    ...CLAMP,
    easing: right.easing ?? EXPO,
  });
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

export function getCameraShake(
  frame: number,
  shake: number,
  seed = "remocn-camera",
): CameraShake {
  const amount = Math.min(1, Math.max(0, shake));
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

export function getCameraTransform(
  pose: CameraPose,
  width: number,
  height: number,
  shake: CameraShake = { x: 0, y: 0, rotate: 0 },
): string {
  const translateX = -pose.x * width - shake.x;
  const translateY = -pose.y * height - shake.y;
  const rotate = -pose.rotate - shake.rotate;
  return `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg) scale(${pose.zoom})`;
}

export function Camera({
  children,
  moves = [],
  shake = 0,
  seed = "remocn-camera",
}: CameraProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pose = resolveCameraPose(frame, moves);
  const handheld = getCameraShake(frame, shake, seed);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: getCameraTransform(pose, width, height, handheld),
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
