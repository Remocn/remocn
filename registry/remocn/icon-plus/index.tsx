"use client";

import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const HORIZONTAL_PATH = "M5 12h14";
const VERTICAL_PATH = "M12 5v14";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 16,
  loop: false,
} as const;

export function PlusIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionFrame, actionProgress } =
    useIconAnimation({ animation, loop, speed }, TIMINGS);
  const { fps } = useVideoConfig();

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const horizontalProgress = interpolate(linearDraw, [0, 0.571], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const verticalProgress = interpolate(linearDraw, [0.286, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const horizontal = drawnPathProps(HORIZONTAL_PATH, horizontalProgress);
  const vertical = drawnPathProps(VERTICAL_PATH, verticalProgress);

  const rotate =
    90 *
    spring({
      frame: actionFrame,
      fps,
      config: { damping: 14, stiffness: 130, mass: 0.8 },
      durationInFrames: 16,
    });
  const pop = interpolate(actionProgress, [0, 0.5, 1], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const scale = (0.85 + 0.15 * scaleIn) * (1 + 0.15 * pop);

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
        d={HORIZONTAL_PATH}
        strokeDasharray={horizontal.strokeDasharray}
        strokeDashoffset={horizontal.strokeDashoffset}
      />
      <path
        d={VERTICAL_PATH}
        strokeDasharray={vertical.strokeDasharray}
        strokeDashoffset={vertical.strokeDashoffset}
      />
    </svg>
  );
}

export function PlusIconStatic({
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
      <path d={HORIZONTAL_PATH} />
      <path d={VERTICAL_PATH} />
    </svg>
  );
}
