"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TRIANGLE_PATH =
  "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3";
const STEM_PATH = "M12 9v4";
const DOT_PATH = "M12 17h.01";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function AlertTriangleIcon({
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

  const triangleProgress = interpolate(linearDraw, [0, 0.875], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const stemProgress = interpolate(linearDraw, [0.625, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const dotPop = interpolate(linearDraw, [0.85, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });

  const triangle = drawnPathProps(TRIANGLE_PATH, triangleProgress);
  const stem = drawnPathProps(STEM_PATH, stemProgress);

  const blinkOpacity = interpolate(
    actionProgress,
    [0, 0.2, 0.4, 0.6, 0.8],
    [1, 0.25, 1, 0.25, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const stemSquash = interpolate(
    actionProgress,
    [0, 0.2, 0.4, 0.6, 0.8],
    [1, 0.85, 1, 0.85, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
        d={TRIANGLE_PATH}
        strokeDasharray={triangle.strokeDasharray}
        strokeDashoffset={triangle.strokeDashoffset}
      />
      <g opacity={blinkOpacity}>
        <g
          transform={`translate(12 13) scale(1 ${stemSquash}) translate(-12 -13)`}
        >
          <path
            d={STEM_PATH}
            strokeDasharray={stem.strokeDasharray}
            strokeDashoffset={stem.strokeDashoffset}
          />
        </g>
        <g transform={`translate(12 17) scale(${dotPop}) translate(-12 -17)`}>
          <path d={DOT_PATH} />
        </g>
      </g>
    </svg>
  );
}

export function AlertTriangleIconStatic({
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
      <path d={TRIANGLE_PATH} />
      <path d={STEM_PATH} />
      <path d={DOT_PATH} />
    </svg>
  );
}
