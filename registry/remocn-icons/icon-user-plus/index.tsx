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
const PLUS_H_PATH = "M22 11 16 11";
const PLUS_V_PATH = "M19 8 19 14";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function UserPlusIcon({
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

  const hProgress = acting
    ? interpolate(actionProgress, [0.08, 0.31], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;
  const vProgress = acting
    ? interpolate(actionProgress, [0.19, 0.42], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;
  const plusPop = acting
    ? interpolate(actionProgress, [0.42, 0.65, 1], [1, 1.3, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const head = drawnPathProps(HEAD_PATH, headDraw);
  const shoulders = drawnPathProps(SHOULDERS_PATH, shouldersDraw);
  const plusH = drawnPathProps(PLUS_H_PATH, hProgress);
  const plusV = drawnPathProps(PLUS_V_PATH, vProgress);

  const scale = 0.85 + 0.15 * scaleIn;
  const plusTransform = `translate(${19 * (1 - plusPop)} ${11 * (1 - plusPop)}) scale(${plusPop})`;

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
      <g transform={plusTransform}>
        <path
          d={PLUS_H_PATH}
          strokeDasharray={plusH.strokeDasharray}
          strokeDashoffset={plusH.strokeDashoffset}
        />
        <path
          d={PLUS_V_PATH}
          strokeDasharray={plusV.strokeDasharray}
          strokeDashoffset={plusV.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function UserPlusIconStatic({
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
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
