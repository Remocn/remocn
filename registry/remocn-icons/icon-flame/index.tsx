"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FLAME_PATH =
  "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 40,
  loop: true,
} as const;

export function FlameIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, actionProgress } = useIconAnimation(
    { animation, loop, speed },
    TIMINGS,
  );

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const flameProgress = interpolate(linearDraw, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const entrance = interpolate(linearDraw, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const flame = drawnPathProps(FLAME_PATH, flameProgress);

  const flickerEase = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  } as const;
  const scaleY = interpolate(
    actionProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [1, 1.06, 0.97, 1.04, 1],
    flickerEase,
  );
  const skew = interpolate(
    actionProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, -2, 2, -1, 0],
    flickerEase,
  );

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        overflow: "visible",
        transformOrigin: "center",
        transform: `scale(${entrance})`,
      }}
    >
      <g
        transform={`translate(12 22) scale(1 ${scaleY}) skewX(${skew}) translate(-12 -22)`}
      >
        <path
          d={FLAME_PATH}
          strokeDasharray={flame.strokeDasharray}
          strokeDashoffset={flame.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function FlameIconStatic({
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={FLAME_PATH} />
    </svg>
  );
}
