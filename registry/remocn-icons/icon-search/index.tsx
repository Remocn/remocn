"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CIRCLE_PATH =
  "M11 3 A8 8 0 0 1 19 11 A8 8 0 0 1 11 19 A8 8 0 0 1 3 11 A8 8 0 0 1 11 3";
const HANDLE_DRAW = "M16.66 16.66 21 21";
const HANDLE_STATIC = "m21 21-4.34-4.34";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 40,
  loop: false,
} as const;

export function SearchIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionProgress } = useIconAnimation(
    { animation, loop, speed },
    TIMINGS,
  );

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const circleProgress = interpolate(linearDraw, [0, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const handleProgress = interpolate(linearDraw, [0.571, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const circle = drawnPathProps(CIRCLE_PATH, circleProgress);
  const handle = drawnPathProps(HANDLE_DRAW, handleProgress);

  const scanEase = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  } as const;
  const scanX = interpolate(
    actionProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, -3, 3, -1, 0],
    scanEase,
  );
  const scanY = interpolate(
    actionProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, -2, -1, 2, 0],
    scanEase,
  );

  const scale = 0.85 + 0.15 * scaleIn;

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
        transform: `scale(${scale})`,
      }}
    >
      <g transform={`translate(${scanX} ${scanY})`}>
        <path
          d={CIRCLE_PATH}
          strokeDasharray={circle.strokeDasharray}
          strokeDashoffset={circle.strokeDashoffset}
        />
        <path
          d={HANDLE_DRAW}
          strokeDasharray={handle.strokeDasharray}
          strokeDashoffset={handle.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function SearchIconStatic({
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
      <circle cx="11" cy="11" r="8" />
      <path d={HANDLE_STATIC} />
    </svg>
  );
}
