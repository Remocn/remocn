"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CIRCLE_PATH =
  "M12 2 A10 10 0 0 1 22 12 A10 10 0 0 1 12 22 A10 10 0 0 1 2 12 A10 10 0 0 1 12 2";
const STEM_PATH = "M12 12v4";
const DOT_PATH = "M12 8h.01";

const TIMINGS = {
  drawDurationInFrames: 20,
  actionDelayInFrames: 2,
  actionDurationInFrames: 16,
  loop: false,
} as const;

export function InfoIcon({
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

  const circleProgress = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const stemProgress = interpolate(linearDraw, [0.7, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const dotPop = interpolate(linearDraw, [0.5, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });

  const circle = drawnPathProps(CIRCLE_PATH, circleProgress);
  const stem = drawnPathProps(STEM_PATH, stemProgress);

  const bob = interpolate(actionProgress, [0, 0.5, 1], [0, -2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
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
        d={CIRCLE_PATH}
        strokeDasharray={circle.strokeDasharray}
        strokeDashoffset={circle.strokeDashoffset}
      />
      <path
        d={STEM_PATH}
        strokeDasharray={stem.strokeDasharray}
        strokeDashoffset={stem.strokeDashoffset}
      />
      <g
        transform={`translate(0 ${bob}) translate(12 8) scale(${dotPop}) translate(-12 -8)`}
      >
        <path d={DOT_PATH} />
      </g>
    </svg>
  );
}

export function InfoIconStatic({
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d={DOT_PATH} />
    </svg>
  );
}
