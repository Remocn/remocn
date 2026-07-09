"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const RING_PATH = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z";
const SLASH1_PATH = "M15 9 9 15";
const SLASH2_PATH = "M9 9 15 15";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function XCircleIcon({
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

  const slash1Draw = interpolate(actionProgress, [0.1, 0.35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const slash2Draw = interpolate(actionProgress, [0.25, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const shake = acting
    ? interpolate(
        actionProgress,
        [0.5, 0.62, 0.74, 0.86, 1],
        [0, 2, -2, 1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        },
      )
    : 0;

  const slash1Progress = animation === "draw" ? 1 : acting ? slash1Draw : 0;
  const slash2Progress = animation === "draw" ? 1 : acting ? slash2Draw : 0;

  const ring = drawnPathProps(RING_PATH, drawProgress);
  const slash1 = drawnPathProps(SLASH1_PATH, slash1Progress);
  const slash2 = drawnPathProps(SLASH2_PATH, slash2Progress);

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
        transform: `translateX(${shake}px) scale(${scale})`,
      }}
    >
      <path
        d={RING_PATH}
        strokeDasharray={ring.strokeDasharray}
        strokeDashoffset={ring.strokeDashoffset}
      />
      <path
        d={SLASH1_PATH}
        strokeDasharray={slash1.strokeDasharray}
        strokeDashoffset={slash1.strokeDashoffset}
      />
      <path
        d={SLASH2_PATH}
        strokeDasharray={slash2.strokeDasharray}
        strokeDashoffset={slash2.strokeDashoffset}
      />
    </svg>
  );
}

export function XCircleIconStatic({
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
      <path d={SLASH1_PATH} />
      <path d={SLASH2_PATH} />
    </svg>
  );
}
