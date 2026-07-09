"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326";
const CLAPPER_PATH = "M10.268 21a2 2 0 0 0 3.464 0";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 30,
  loop: false,
} as const;

export function BellIcon({
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

  const bodyProgress = interpolate(linearDraw, [0, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const clapperProgress = interpolate(linearDraw, [0.714, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const body = drawnPathProps(BODY_PATH, bodyProgress);
  const clapper = drawnPathProps(CLAPPER_PATH, clapperProgress);

  const ring = interpolate(
    actionProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    [0, 14, -11, 7, -3, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
      <g transform={`rotate(${ring} 12 2)`}>
        <path
          d={BODY_PATH}
          strokeDasharray={body.strokeDasharray}
          strokeDashoffset={body.strokeDashoffset}
        />
        <path
          d={CLAPPER_PATH}
          strokeDasharray={clapper.strokeDasharray}
          strokeDashoffset={clapper.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function BellIconStatic({
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
      <path d={BODY_PATH} />
      <path d={CLAPPER_PATH} />
    </svg>
  );
}
