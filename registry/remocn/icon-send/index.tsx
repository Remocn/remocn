"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const PLANE_PATH =
  "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z";
const FOLD_PATH = "m21.854 2.147-10.94 10.939";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function SendIcon({
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

  const planeProgress = interpolate(linearDraw, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const foldProgress = interpolate(linearDraw, [0.714, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const plane = drawnPathProps(PLANE_PATH, planeProgress);
  const fold = drawnPathProps(FOLD_PATH, foldProgress);

  const dartEase = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  } as const;
  const tx = interpolate(actionProgress, [0, 0.18, 0.5, 1], [0, -1.5, 5, 0], dartEase);
  const ty = interpolate(actionProgress, [0, 0.18, 0.5, 1], [0, 1, -4, 0], dartEase);
  const rot = interpolate(actionProgress, [0, 0.18, 0.5, 1], [0, 2, -12, 0], dartEase);

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
      <g transform={`translate(${tx} ${ty}) rotate(${rot} 12 12)`}>
        <path
          d={PLANE_PATH}
          strokeDasharray={plane.strokeDasharray}
          strokeDashoffset={plane.strokeDashoffset}
        />
        <path
          d={FOLD_PATH}
          strokeDasharray={fold.strokeDasharray}
          strokeDashoffset={fold.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function SendIconStatic({
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
      <path d={PLANE_PATH} />
      <path d={FOLD_PATH} />
    </svg>
  );
}
