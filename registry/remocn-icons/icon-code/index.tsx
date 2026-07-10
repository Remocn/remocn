"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const RIGHT_PATH = "M16 18 22 12 16 6";
const LEFT_PATH = "M8 6 2 12 8 18";

const TIMINGS = {
  drawDurationInFrames: 12,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function CodeIcon({
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

  const acting = animation !== "draw" && actionFrame >= 0;

  const open = acting
    ? interpolate(actionProgress, [0, 0.4, 1], [0, 2.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0.4, 0.7, 1], [1, 1.04, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const right = drawnPathProps(RIGHT_PATH, drawProgress);
  const left = drawnPathProps(LEFT_PATH, drawProgress);

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
      <g transform={`translate(${open} 0)`}>
        <path
          d={RIGHT_PATH}
          strokeDasharray={right.strokeDasharray}
          strokeDashoffset={right.strokeDashoffset}
        />
      </g>
      <g transform={`translate(${-open} 0)`}>
        <path
          d={LEFT_PATH}
          strokeDasharray={left.strokeDasharray}
          strokeDashoffset={left.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function CodeIconStatic({
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
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );
}
