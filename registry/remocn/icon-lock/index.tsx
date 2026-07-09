"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M5 11H19A2 2 0 0 1 21 13V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V13A2 2 0 0 1 5 11Z";
const SHACKLE_PATH = "M7 11V7a5 5 0 0 1 10 0v4";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function LockIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const shackleDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lift = acting
    ? interpolate(actionProgress, [0, 0.35, 0.7], [0, -2.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0.7, 0.85, 1], [1, 1.05, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const body = drawnPathProps(BODY_PATH, bodyDraw);
  const shackle = drawnPathProps(SHACKLE_PATH, shackleDraw);

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
      <path
        d={BODY_PATH}
        strokeDasharray={body.strokeDasharray}
        strokeDashoffset={body.strokeDashoffset}
      />
      <g transform={`translate(0 ${lift})`}>
        <path
          d={SHACKLE_PATH}
          strokeDasharray={shackle.strokeDasharray}
          strokeDashoffset={shackle.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function LockIconStatic({
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d={SHACKLE_PATH} />
    </svg>
  );
}
