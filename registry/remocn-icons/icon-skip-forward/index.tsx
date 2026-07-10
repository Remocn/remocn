"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TRIANGLE_PATH =
  "M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z";
const BAR_PATH = "M21 4v16";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function SkipForwardIcon({
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

  const triangleProgress = interpolate(linearDraw, [0, 0.71], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const barProgress = interpolate(linearDraw, [0.43, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const triangle = drawnPathProps(TRIANGLE_PATH, triangleProgress);
  const bar = drawnPathProps(BAR_PATH, barProgress);

  const dash = interpolate(
    actionProgress,
    [0, 0.2, 0.6, 0.82, 1],
    [0, -1.2, 2, -0.3, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );
  const squeeze = interpolate(actionProgress, [0.45, 0.6, 0.78], [1, 0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const shove = interpolate(actionProgress, [0.55, 0.62, 1], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
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
      <g
        transform={`translate(${dash} 0) scale(${squeeze} 1)`}
        style={{ transformOrigin: "16px 12px" }}
      >
        <path
          d={TRIANGLE_PATH}
          strokeDasharray={triangle.strokeDasharray}
          strokeDashoffset={triangle.strokeDashoffset}
        />
      </g>
      <g transform={`translate(${shove} 0)`}>
        <path
          d={BAR_PATH}
          strokeDasharray={bar.strokeDasharray}
          strokeDashoffset={bar.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function SkipForwardIconStatic({
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
      <path d={BAR_PATH} />
      <path d={TRIANGLE_PATH} />
    </svg>
  );
}
