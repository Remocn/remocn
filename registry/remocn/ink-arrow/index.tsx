"use client";

import { useCurrentFrame } from "remotion";
import { DEFAULT_STEP, hashRange, steppedRamp } from "@/lib/remocn/stop-motion";

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const HEAD_ANGLE = 0.6;

export type InkArrowPoint = { x: number; y: number };

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

export function inkArrowViewport(
  from: InkArrowPoint,
  to: InkArrowPoint,
  curvature: number,
  headSize: number,
  strokeWidth: number,
): { width: number; height: number } {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const margin = headSize + Math.abs(curvature) * distance + strokeWidth;
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
  strokeWidth = 3,
  delay = 0,
  drawDur = 36,
  headSize = 24,
  headDur,
  seed = "arrow",
  step = DEFAULT_STEP,
}: InkArrowProps) {
  const frame = useCurrentFrame();
  const progress = steppedRamp(frame, delay, delay + drawDur, {
    ease: easeOutCubic,
    step,
  });
  const { c1, c2 } = inkArrowControls(from, to, curvature, seed);
  const head = inkArrowHead(c2, to, headSize);

  const headFrames = headDur ?? step * 4;
  const headStart = delay + drawDur;
  const headMid = headStart + headFrames / 2;
  const leftArm = steppedRamp(frame, headStart, headMid, {
    ease: easeOutCubic,
    step,
  });
  const rightArm = steppedRamp(frame, headMid, headStart + headFrames, {
    ease: easeOutCubic,
    step,
  });

  const { width, height } = inkArrowViewport(
    from,
    to,
    curvature,
    headSize,
    strokeWidth,
  );

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
      <path
        d={`M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
      <path
        d={`M ${to.x} ${to.y} L ${head.left.x} ${head.left.y}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - leftArm}
      />
      <path
        d={`M ${to.x} ${to.y} L ${head.right.x} ${head.right.y}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - rightArm}
      />
    </svg>
  );
}
