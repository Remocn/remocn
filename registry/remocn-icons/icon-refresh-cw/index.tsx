"use client";

import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const ARC_TOP = "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8";
const ARROW_TOP = "M21 3v5h-5";
const ARC_BOTTOM = "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16";
const ARROW_BOTTOM = "M8 16H3v5";

const SPIN_EASE = Easing.bezier(0.45, 0, 0.25, 1);

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 55,
  loop: true,
} as const;

export function RefreshCwIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionFrame, cycleIndex } = useIconAnimation(
    { animation, loop, speed },
    TIMINGS,
  );
  const { fps } = useVideoConfig();

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const arcProgress = interpolate(linearDraw, [0, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const arrowTopPop = interpolate(linearDraw, [0.6, 0.714], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });
  const arrowBottomPop = interpolate(linearDraw, [0.76, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });

  const arcTop = drawnPathProps(ARC_TOP, arcProgress);
  const arcBottom = drawnPathProps(ARC_BOTTOM, arcProgress);

  const resolvedLoop = loop ?? TIMINGS.loop;
  const rotate = resolvedLoop
    ? cycleIndex * 360 +
      interpolate(actionFrame, [0, 44], [0, 360], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: SPIN_EASE,
      })
    : 360 *
      spring({
        frame: actionFrame,
        fps,
        config: { damping: 14, stiffness: 120, mass: 0.9 },
        durationInFrames: 44,
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
        transform: `rotate(${rotate}deg) scale(${scale})`,
      }}
    >
      <path
        d={ARC_TOP}
        strokeDasharray={arcTop.strokeDasharray}
        strokeDashoffset={arcTop.strokeDashoffset}
      />
      <path
        d={ARC_BOTTOM}
        strokeDasharray={arcBottom.strokeDasharray}
        strokeDashoffset={arcBottom.strokeDashoffset}
      />
      <g transform={`translate(21 8) scale(${arrowTopPop}) translate(-21 -8)`}>
        <path d={ARROW_TOP} />
      </g>
      <g transform={`translate(3 16) scale(${arrowBottomPop}) translate(-3 -16)`}>
        <path d={ARROW_BOTTOM} />
      </g>
    </svg>
  );
}

export function RefreshCwIconStatic({
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
      <path d={ARC_TOP} />
      <path d={ARROW_TOP} />
      <path d={ARC_BOTTOM} />
      <path d={ARROW_BOTTOM} />
    </svg>
  );
}
