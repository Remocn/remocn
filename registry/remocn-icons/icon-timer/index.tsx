"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const DIAL_PATH = "M12 6a8 8 0 1 0 0 16 8 8 0 1 0 0-16Z";
const BUTTON_PATH = "M10 2H14";
const HAND_PATH = "M12 14 15 11";

const DIAL_CX = 12;
const DIAL_CY = 14;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 48,
  loop: false,
} as const;

export function TimerIcon({
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

  const dialDraw = interpolate(linearDraw, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const buttonDraw = interpolate(linearDraw, [0.45, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const handDraw = interpolate(linearDraw, [0.7, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const buttonDip = acting
    ? interpolate(actionProgress, [0, 0.15, 0.3], [0, 1.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const handSweep = acting
    ? interpolate(actionProgress, [0.3, 1], [0, 360], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 0;

  const dial = drawnPathProps(DIAL_PATH, acting ? 1 : dialDraw);
  const button = drawnPathProps(BUTTON_PATH, acting ? 1 : buttonDraw);
  const hand = drawnPathProps(HAND_PATH, acting ? 1 : handDraw);

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
        d={DIAL_PATH}
        strokeDasharray={dial.strokeDasharray}
        strokeDashoffset={dial.strokeDashoffset}
      />
      <g transform={`translate(0 ${buttonDip})`}>
        <path
          d={BUTTON_PATH}
          strokeDasharray={button.strokeDasharray}
          strokeDashoffset={button.strokeDashoffset}
        />
      </g>
      <g transform={`rotate(${handSweep} ${DIAL_CX} ${DIAL_CY})`}>
        <path
          d={HAND_PATH}
          strokeDasharray={hand.strokeDasharray}
          strokeDashoffset={hand.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function TimerIconStatic({
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
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}
