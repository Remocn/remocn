"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const HEAD_PATH =
  "M9 3 A4 4 0 0 1 13 7 A4 4 0 0 1 9 11 A4 4 0 0 1 5 7 A4 4 0 0 1 9 3";
const SHOULDERS_PATH = "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2";
const BACK_HEAD_PATH = "M16 3.128a4 4 0 0 1 0 7.744";
const BACK_SHOULDERS_PATH = "M22 21v-2a4 4 0 0 0-3-3.87";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function UsersIcon({
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

  const pop = acting
    ? interpolate(actionProgress, [0, 0.25, 0.42], [1, 1.08, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const backOpacity = acting
    ? interpolate(actionProgress, [0.33, 0.9], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const backSlide = acting
    ? interpolate(actionProgress, [0.33, 1], [-2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : -2;

  const head = drawnPathProps(HEAD_PATH, headDraw);
  const shoulders = drawnPathProps(SHOULDERS_PATH, shouldersDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const frontTransform = `translate(${9 * (1 - pop)} ${12 * (1 - pop)}) scale(${pop})`;

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
      <g transform={`translate(${backSlide} 0)`} opacity={backOpacity}>
        <path d={BACK_HEAD_PATH} />
        <path d={BACK_SHOULDERS_PATH} />
      </g>
      <g transform={frontTransform}>
        <path
          d={HEAD_PATH}
          strokeDasharray={head.strokeDasharray}
          strokeDashoffset={head.strokeDashoffset}
        />
        <path
          d={SHOULDERS_PATH}
          strokeDasharray={shoulders.strokeDasharray}
          strokeDashoffset={shoulders.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function UsersIconStatic({
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
      <path d={BACK_HEAD_PATH} />
      <path d={BACK_SHOULDERS_PATH} />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}
