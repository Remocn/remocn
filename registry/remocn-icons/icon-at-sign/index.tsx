"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CIRCLE_PATH = "M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z";
const SWOOSH_PATH = "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8";

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function AtSignIcon({
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

  const circleDraw = interpolate(linearDraw, [0, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const swooshDraw = interpolate(linearDraw, [0.35, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const circlePop = acting
    ? interpolate(actionProgress, [0, 0.22, 0.45], [1, 1.15, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const swooshProgress = acting ? 1 : swooshDraw;
  const circleProgress = acting ? 1 : circleDraw;

  const circle = drawnPathProps(CIRCLE_PATH, circleProgress);
  const swoosh = drawnPathProps(SWOOSH_PATH, swooshProgress);

  const scale = 0.85 + 0.15 * scaleIn;
  const popTransform = `translate(${CENTER * (1 - circlePop)} ${CENTER * (1 - circlePop)}) scale(${circlePop})`;

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
      <g transform={popTransform}>
        <path
          d={CIRCLE_PATH}
          strokeDasharray={circle.strokeDasharray}
          strokeDashoffset={circle.strokeDashoffset}
        />
      </g>
      <path
        d={SWOOSH_PATH}
        strokeDasharray={swoosh.strokeDasharray}
        strokeDashoffset={swoosh.strokeDashoffset}
      />
    </svg>
  );
}

export function AtSignIconStatic({
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
      <circle cx="12" cy="12" r="4" />
      <path d={SWOOSH_PATH} />
    </svg>
  );
}
