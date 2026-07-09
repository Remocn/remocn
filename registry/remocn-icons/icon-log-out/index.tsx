"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const DOOR_PATH = "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4";
const SHAFT_PATH = "M21 12H9";
const HEAD_PATH = "M16 17 21 12 16 7";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function LogOutIcon({
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

  const doorDraw = interpolate(linearDraw, [0, 0.625], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const shaftDraw = interpolate(linearDraw, [0.375, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const headDraw = interpolate(linearDraw, [0.56, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const exit = acting
    ? interpolate(actionProgress, [0, 0.22, 0.45, 0.68, 1], [0, 4, 0, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const door = drawnPathProps(DOOR_PATH, doorDraw);
  const shaft = drawnPathProps(SHAFT_PATH, shaftDraw);
  const head = drawnPathProps(HEAD_PATH, headDraw);

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
        d={DOOR_PATH}
        strokeDasharray={door.strokeDasharray}
        strokeDashoffset={door.strokeDashoffset}
      />
      <g transform={`translate(${exit} 0)`}>
        <path
          d={SHAFT_PATH}
          strokeDasharray={shaft.strokeDasharray}
          strokeDashoffset={shaft.strokeDashoffset}
        />
        <path
          d={HEAD_PATH}
          strokeDasharray={head.strokeDasharray}
          strokeDashoffset={head.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function LogOutIconStatic({
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
      <path d={HEAD_PATH} />
      <path d={SHAFT_PATH} />
      <path d={DOOR_PATH} />
    </svg>
  );
}
