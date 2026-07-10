"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const ZAP_PATH =
  "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z";

const TIMINGS = {
  drawDurationInFrames: 10,
  actionDelayInFrames: 2,
  actionDurationInFrames: 14,
  loop: false,
} as const;

export function ZapIcon({
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

  const boltProgress = interpolate(linearDraw, [0, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const bolt = drawnPathProps(ZAP_PATH, boltProgress);

  const flash = interpolate(
    actionProgress,
    [0, 0.15, 0.3, 0.45, 0.6, 1],
    [1, 0.3, 1, 0.3, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pop = interpolate(actionProgress, [0, 0.3, 0.6, 1], [1, 1.1, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const strikeEase = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  } as const;
  const strikeX = interpolate(
    actionProgress,
    [0, 0.15, 0.4, 1],
    [0, 1.5, -3, 0],
    strikeEase,
  );
  const strikeY = interpolate(
    actionProgress,
    [0, 0.15, 0.4, 1],
    [0, -2, 4, 0],
    strikeEase,
  );
  const skew = interpolate(
    actionProgress,
    [0, 0.15, 0.4, 0.7, 1],
    [0, -4, 9, -2, 0],
    strikeEase,
  );
  const scale = (0.85 + 0.15 * scaleIn) * pop;

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
      <g
        opacity={flash}
        transform={`translate(${strikeX} ${strikeY}) translate(12 12) skewX(${skew}) translate(-12 -12)`}
      >
        <path
          d={ZAP_PATH}
          strokeDasharray={bolt.strokeDasharray}
          strokeDashoffset={bolt.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function ZapIconStatic({
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
      <path d={ZAP_PATH} />
    </svg>
  );
}
