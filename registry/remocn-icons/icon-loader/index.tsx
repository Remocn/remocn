"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const ARC_PATH = "M21 12a9 9 0 1 1-6.219-8.56";

const TIMINGS = {
  drawDurationInFrames: 10,
  actionDelayInFrames: 2,
  actionDurationInFrames: 40,
  loop: true,
} as const;

export function LoaderIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, actionProgress, cycleIndex } = useIconAnimation(
    { animation, loop, speed },
    TIMINGS,
  );

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const arcProgress = interpolate(linearDraw, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const entrance = interpolate(linearDraw, [0, 1], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const arc = drawnPathProps(ARC_PATH, arcProgress);
  const rotate = (cycleIndex + actionProgress) * 360;

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
        transform: `rotate(${rotate}deg) scale(${entrance})`,
      }}
    >
      <path
        d={ARC_PATH}
        strokeDasharray={arc.strokeDasharray}
        strokeDashoffset={arc.strokeDashoffset}
      />
    </svg>
  );
}

export function LoaderIconStatic({
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
      <path d={ARC_PATH} />
    </svg>
  );
}
