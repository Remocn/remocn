"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const HEAD_PATH =
  "M7.5 10 A5.5 5.5 0 0 1 13 15.5 A5.5 5.5 0 0 1 7.5 21 A5.5 5.5 0 0 1 2 15.5 A5.5 5.5 0 0 1 7.5 10";
const SHAFT_PATH = "M21 2 11.4 11.6";
const TEETH_PATH =
  "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 28,
  loop: false,
} as const;

export function KeyIcon({
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

  const headDraw = interpolate(linearDraw, [0, 0.625], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const shaftDraw = interpolate(linearDraw, [0.375, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const teethDraw = interpolate(linearDraw, [0.56, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const turn = acting
    ? interpolate(actionProgress, [0, 0.5, 0.64, 0.9, 1], [0, -25, -25, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const head = drawnPathProps(HEAD_PATH, headDraw);
  const shaft = drawnPathProps(SHAFT_PATH, shaftDraw);
  const teeth = drawnPathProps(TEETH_PATH, teethDraw);

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
      <g transform={`rotate(${turn} 7.5 15.5)`}>
        <path
          d={HEAD_PATH}
          strokeDasharray={head.strokeDasharray}
          strokeDashoffset={head.strokeDashoffset}
        />
        <path
          d={SHAFT_PATH}
          strokeDasharray={shaft.strokeDasharray}
          strokeDashoffset={shaft.strokeDashoffset}
        />
        <path
          d={TEETH_PATH}
          strokeDasharray={teeth.strokeDasharray}
          strokeDashoffset={teeth.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function KeyIconStatic({
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
      <path d={TEETH_PATH} />
      <path d={SHAFT_PATH} />
      <circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  );
}
