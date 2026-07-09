"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const AXIS_PATH = "M3 3v16a2 2 0 0 0 2 2h16";
const BARS = ["M8 17V14", "M13 17V5", "M18 17V9"];
const BASE_Y = 17;

const TIMINGS = {
  drawDurationInFrames: 12,
  actionDelayInFrames: 2,
  actionDurationInFrames: 30,
  loop: false,
} as const;

export function BarChart3Icon({
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

  const axis = drawnPathProps(AXIS_PATH, drawProgress);

  const bars = BARS.map((d, i) => {
    const start = i * 0.22;
    const grow = interpolate(
      actionProgress,
      [start, start + 0.3, start + 0.42],
      [0, 1.08, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      },
    );
    const scaleY = animation === "draw" ? 1 : acting ? grow : 0;
    return { d, scaleY };
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
        transform: `scale(${scale})`,
      }}
    >
      <path
        d={AXIS_PATH}
        strokeDasharray={axis.strokeDasharray}
        strokeDashoffset={axis.strokeDashoffset}
      />
      {bars.map((bar) => (
        <g
          key={bar.d}
          transform={`translate(0 ${BASE_Y * (1 - bar.scaleY)}) scale(1 ${bar.scaleY})`}
        >
          <path d={bar.d} />
        </g>
      ))}
    </svg>
  );
}

export function BarChart3IconStatic({
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
      <path d={AXIS_PATH} />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
