"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z";
const TIP_PATH = "M15 5 19 9";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function PencilIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const tipDraw = interpolate(linearDraw, [0.571, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const acting = animation !== "draw" && actionFrame >= 0;

  const rotate = acting
    ? interpolate(actionProgress, [0, 0.25, 0.5, 0.75, 1], [0, -6, 4, -2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const nudge = acting
    ? interpolate(
        actionProgress,
        [0, 0.25, 0.5, 0.75, 1],
        [0, 1, -0.5, 0.5, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        },
      )
    : 0;

  const body = drawnPathProps(BODY_PATH, bodyDraw);
  const tip = drawnPathProps(TIP_PATH, tipDraw);

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
      <g transform={`rotate(${rotate} 3 21) translate(${nudge} 0)`}>
        <path
          d={BODY_PATH}
          strokeDasharray={body.strokeDasharray}
          strokeDashoffset={body.strokeDashoffset}
        />
        <path
          d={TIP_PATH}
          strokeDasharray={tip.strokeDasharray}
          strokeDashoffset={tip.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function PencilIconStatic({
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
      <path d={TIP_PATH} />
    </svg>
  );
}
