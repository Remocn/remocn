"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TREND_PATH = "M2 17 8.5 10.5 13.5 15.5 22 7";
const ARROW_PATH = "M16 7H22V13";

const PEAK_X = 22;
const PEAK_Y = 7;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function TrendingUpIcon({
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

  const trendDraw = interpolate(linearDraw, [0, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const arrowDraw = interpolate(linearDraw, [0.65, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const pop = acting
    ? interpolate(actionProgress, [0.1, 0.45, 1], [1, 1.25, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const trend = drawnPathProps(TREND_PATH, acting ? 1 : trendDraw);
  const arrow = drawnPathProps(ARROW_PATH, acting ? 1 : arrowDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const popTransform = `translate(${PEAK_X * (1 - pop)} ${PEAK_Y * (1 - pop)}) scale(${pop})`;

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
        d={TREND_PATH}
        strokeDasharray={trend.strokeDasharray}
        strokeDashoffset={trend.strokeDashoffset}
      />
      <g transform={popTransform}>
        <path
          d={ARROW_PATH}
          strokeDasharray={arrow.strokeDasharray}
          strokeDashoffset={arrow.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function TrendingUpIconStatic({
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
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </svg>
  );
}
