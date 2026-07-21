"use client";

import { useCurrentFrame } from "remotion";
import {
  BrushGrain,
  type BrushPoint,
  brushFilterId,
  brushReach,
  brushRibbon,
  sampleCubic,
  sampleLine,
} from "@/components/remocn/brush";
import { DEFAULT_STEP, hashRange, steppedRamp } from "@/lib/remocn/stop-motion";

const HEAD_ANGLE = 0.72;
const SHAFT_SAMPLES = 40;
const ARM_SAMPLES = 10;
const ARM_TAPER = 0.6;
const ARM_OVERSHOOT = 0.16;
const HEAD_MIN_RATIO = 2.6;

export type InkArrowPoint = BrushPoint;

export function inkArrowControls(
  from: InkArrowPoint,
  to: InkArrowPoint,
  curvature: number,
  seed: string,
): { c1: InkArrowPoint; c2: InkArrowPoint } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const bow = curvature * distance;
  const wobble = distance * 0.06;

  const at = (t: number, key: string): InkArrowPoint => ({
    x:
      from.x +
      dx * t +
      normalX * bow +
      hashRange(`${seed}:${key}:x`, -wobble, wobble),
    y:
      from.y +
      dy * t +
      normalY * bow +
      hashRange(`${seed}:${key}:y`, -wobble, wobble),
  });

  return { c1: at(0.3, "c1"), c2: at(0.7, "c2") };
}

export function inkArrowHead(
  c2: InkArrowPoint,
  to: InkArrowPoint,
  headSize: number,
): { left: InkArrowPoint; right: InkArrowPoint } {
  const dx = to.x - c2.x;
  const dy = to.y - c2.y;
  const length = Math.hypot(dx, dy) || 1;
  const backX = -dx / length;
  const backY = -dy / length;

  const arm = (angle: number): InkArrowPoint => ({
    x: to.x + headSize * (backX * Math.cos(angle) - backY * Math.sin(angle)),
    y: to.y + headSize * (backX * Math.sin(angle) + backY * Math.cos(angle)),
  });

  return { left: arm(HEAD_ANGLE), right: arm(-HEAD_ANGLE) };
}

export function inkArrowArmWidth(strokeWidth: number, release: number): number {
  return strokeWidth * release;
}

export function inkArrowApex(
  c2: InkArrowPoint,
  to: InkArrowPoint,
  reach: number,
): InkArrowPoint {
  const dx = to.x - c2.x;
  const dy = to.y - c2.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: to.x + (dx / length) * reach * ARM_OVERSHOOT,
    y: to.y + (dy / length) * reach * ARM_OVERSHOOT,
  };
}

export function inkArrowHeadReach(
  headSize: number,
  strokeWidth: number,
): number {
  return Math.max(headSize, strokeWidth * HEAD_MIN_RATIO);
}

export function inkArrowViewport(
  from: InkArrowPoint,
  to: InkArrowPoint,
  curvature: number,
  headSize: number,
  strokeWidth: number,
  grain = 1,
): { width: number; height: number } {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const margin =
    inkArrowHeadReach(headSize, strokeWidth) +
    Math.abs(curvature) * distance +
    brushReach(strokeWidth, grain);
  return {
    width: Math.max(margin, Math.max(from.x, to.x) + margin),
    height: Math.max(margin, Math.max(from.y, to.y) + margin),
  };
}

export interface InkArrowProps {
  from: InkArrowPoint;
  to: InkArrowPoint;
  curvature?: number;
  color?: string;
  strokeWidth?: number;
  pressure?: number;
  release?: number;
  grain?: number;
  delay?: number;
  drawDur?: number;
  headSize?: number;
  headDur?: number;
  seed?: string;
  step?: number;
}

export function InkArrow({
  from,
  to,
  curvature = 0.35,
  color = "#26242c",
  strokeWidth = 8,
  pressure = 0.2,
  release = 1,
  grain = 1,
  delay = 0,
  drawDur = 36,
  headSize = 24,
  headDur,
  seed = "arrow",
  step = DEFAULT_STEP,
}: InkArrowProps) {
  const frame = useCurrentFrame();
  const progress = steppedRamp(frame, delay, delay + drawDur, { step });
  const { c1, c2 } = inkArrowControls(from, to, curvature, seed);
  const headReach = inkArrowHeadReach(headSize, strokeWidth);
  const head = inkArrowHead(c2, to, headReach);
  const apex = inkArrowApex(c2, to, headReach);

  const headFrames = headDur ?? step * 4;
  const headStart = delay + drawDur;
  const headMid = headStart + headFrames / 2;
  const leftArm = steppedRamp(frame, headStart, headMid, { step });
  const rightArm = steppedRamp(frame, headMid, headStart + headFrames, {
    step,
  });

  const { width, height } = inkArrowViewport(
    from,
    to,
    curvature,
    headSize,
    strokeWidth,
    grain,
  );

  const filterId = brushFilterId(seed, strokeWidth, grain);
  const filter = grain > 0 ? `url(#${filterId})` : undefined;

  const armRibbon = (tip: InkArrowPoint, armProgress: number) =>
    brushRibbon(sampleLine(apex, tip, ARM_SAMPLES), {
      strokeWidth: inkArrowArmWidth(strokeWidth, release),
      pressure: 1,
      release: ARM_TAPER,
      progress: armProgress,
    });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        display: "block",
        overflow: "visible",
        opacity: progress > 0 ? 1 : 0,
      }}
    >
      <title>Ink arrow</title>
      <BrushGrain seed={seed} strokeWidth={strokeWidth} grain={grain} />
      <path
        d={brushRibbon(sampleCubic(from, c1, c2, to, SHAFT_SAMPLES), {
          strokeWidth,
          pressure,
          release,
          progress,
        })}
        fill={color}
        opacity={0.85}
        filter={filter}
      />
      {leftArm > 0 ? (
        <path
          d={armRibbon(head.left, leftArm)}
          fill={color}
          opacity={0.85}
          filter={filter}
        />
      ) : null}
      {rightArm > 0 ? (
        <path
          d={armRibbon(head.right, rightArm)}
          fill={color}
          opacity={0.85}
          filter={filter}
        />
      ) : null}
    </svg>
  );
}
