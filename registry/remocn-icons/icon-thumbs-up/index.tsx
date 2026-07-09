"use client";

import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const HAND_PATH =
  "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z";
const CUFF_PATH = "M7 10v12";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function ThumbsUpIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionFrame, actionProgress } =
    useIconAnimation({ animation, loop, speed }, TIMINGS);
  const { fps } = useVideoConfig();

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const handProgress = interpolate(linearDraw, [0.25, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const cuffProgress = interpolate(linearDraw, [0, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const hand = drawnPathProps(HAND_PATH, handProgress);
  const cuff = drawnPathProps(CUFF_PATH, cuffProgress);

  const settle = spring({
    frame: actionFrame,
    fps,
    config: { damping: 11, stiffness: 150, mass: 0.8 },
    durationInFrames: 18,
  });
  const rotate = -18 * (1 - settle);
  const pop = interpolate(actionProgress, [0, 0.5, 1], [1, 1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
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
      <g transform={`rotate(${rotate} 4 22)`}>
        <path
          d={HAND_PATH}
          strokeDasharray={hand.strokeDasharray}
          strokeDashoffset={hand.strokeDashoffset}
        />
        <path
          d={CUFF_PATH}
          strokeDasharray={cuff.strokeDasharray}
          strokeDashoffset={cuff.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function ThumbsUpIconStatic({
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
      <path d={HAND_PATH} />
      <path d={CUFF_PATH} />
    </svg>
  );
}
