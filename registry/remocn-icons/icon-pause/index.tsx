"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const LEFT_PATH =
  "M6 21A1 1 0 0 1 5 20V4A1 1 0 0 1 6 3H9A1 1 0 0 1 10 4V20A1 1 0 0 1 9 21H6Z";
const RIGHT_PATH =
  "M18 21A1 1 0 0 0 19 20V4A1 1 0 0 0 18 3H15A1 1 0 0 0 14 4V20A1 1 0 0 0 15 21H18Z";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function PauseIcon({
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

  const leftProgress = interpolate(linearDraw, [0, 0.88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const rightProgress = interpolate(linearDraw, [0.12, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const left = drawnPathProps(LEFT_PATH, leftProgress);
  const right = drawnPathProps(RIGHT_PATH, rightProgress);

  const pinch = interpolate(actionProgress, [0, 0.45, 1], [0, 1.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const squash = interpolate(actionProgress, [0, 0.45, 1], [1, 0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

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
        transform: `scaleX(${scale}) scaleY(${scale * squash})`,
      }}
    >
      <g transform={`translate(${pinch} 0)`}>
        <path
          d={LEFT_PATH}
          strokeDasharray={left.strokeDasharray}
          strokeDashoffset={left.strokeDashoffset}
        />
      </g>
      <g transform={`translate(${-pinch} 0)`}>
        <path
          d={RIGHT_PATH}
          strokeDasharray={right.strokeDasharray}
          strokeDashoffset={right.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function PauseIconStatic({
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
      <rect x="14" y="3" width="5" height="18" rx="1" />
      <rect x="5" y="3" width="5" height="18" rx="1" />
    </svg>
  );
}
