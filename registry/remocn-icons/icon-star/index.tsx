"use client";

import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function StarIcon({
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

  const starProgress = interpolate(linearDraw, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const star = drawnPathProps(STAR_PATH, starProgress);

  const settle = spring({
    frame: actionFrame,
    fps,
    config: { damping: 12, stiffness: 140, mass: 0.8 },
    durationInFrames: 18,
  });
  const rotate = -8 * (1 - settle);
  const pop = interpolate(actionProgress, [0, 0.5, 1], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const scale = (0.85 + 0.15 * scaleIn) * (1 + 0.12 * pop);

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
        d={STAR_PATH}
        strokeDasharray={star.strokeDasharray}
        strokeDashoffset={star.strokeDashoffset}
      />
    </svg>
  );
}

export function StarIconStatic({
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
      <path d={STAR_PATH} />
    </svg>
  );
}
