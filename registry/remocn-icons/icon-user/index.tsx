"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const HEAD_PATH =
  "M12 3 A4 4 0 0 1 16 7 A4 4 0 0 1 12 11 A4 4 0 0 1 8 7 A4 4 0 0 1 12 3";
const SHOULDERS_PATH = "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function UserIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionProgress, actionFrame } =
    useIconAnimation({ animation, loop, speed }, TIMINGS);

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);
  const acting = animation !== "draw" && actionFrame >= 0;

  const headDraw = interpolate(linearDraw, [0, 0.71], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const shouldersDraw = interpolate(linearDraw, [0.43, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const headDip = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const shoulderRise = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [0, -1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const head = drawnPathProps(HEAD_PATH, headDraw);
  const shoulders = drawnPathProps(SHOULDERS_PATH, shouldersDraw);

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
      <g transform={`translate(0 ${headDip})`}>
        <path
          d={HEAD_PATH}
          strokeDasharray={head.strokeDasharray}
          strokeDashoffset={head.strokeDashoffset}
        />
      </g>
      <g transform={`translate(0 ${shoulderRise})`}>
        <path
          d={SHOULDERS_PATH}
          strokeDasharray={shoulders.strokeDasharray}
          strokeDashoffset={shoulders.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function UserIconStatic({
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
      <path d={SHOULDERS_PATH} />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
