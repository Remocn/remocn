"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const MOON_PATH =
  "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401";

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function MoonIcon({
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

  const settle = acting
    ? interpolate(actionProgress, [0, 0.2, 0.5, 0.78, 1], [0, -16, 9, -3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.sin),
      })
    : 0;

  const moon = drawnPathProps(MOON_PATH, drawProgress);

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
      <g transform={`rotate(${settle} ${CENTER} ${CENTER})`}>
        <path
          d={MOON_PATH}
          strokeDasharray={moon.strokeDasharray}
          strokeDashoffset={moon.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function MoonIconStatic({
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
      <path d={MOON_PATH} />
    </svg>
  );
}
