"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FIRST_PATH = "M18 6 6 18";
const SECOND_PATH = "M6 6 18 18";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function XIcon({
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

  const firstProgress = interpolate(linearDraw, [0, 0.57], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const secondProgress = interpolate(linearDraw, [0.29, 0.86], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const first = drawnPathProps(FIRST_PATH, firstProgress);
  const second = drawnPathProps(SECOND_PATH, secondProgress);

  const rotate = interpolate(
    actionProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, -8, 6, -3, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
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
        transform: `rotate(${rotate}deg) scale(${scale})`,
      }}
    >
      <path
        d={FIRST_PATH}
        strokeDasharray={first.strokeDasharray}
        strokeDashoffset={first.strokeDashoffset}
      />
      <path
        d={SECOND_PATH}
        strokeDasharray={second.strokeDasharray}
        strokeDashoffset={second.strokeDashoffset}
      />
    </svg>
  );
}

export function XIconStatic({
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
      <path d={FIRST_PATH} />
      <path d={SECOND_PATH} />
    </svg>
  );
}
