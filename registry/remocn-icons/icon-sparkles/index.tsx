"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const MAIN_PATH =
  "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z";
const ACCENT_TR_V = "M20 2v4";
const ACCENT_TR_H = "M22 4h-4";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 45,
  loop: true,
} as const;

export function SparklesIcon({
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

  const mainProgress = interpolate(linearDraw, [0, 0.857], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const popTR = interpolate(linearDraw, [0.55, 0.714], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });
  const popBL = interpolate(linearDraw, [0.857, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.8)),
  });

  const main = drawnPathProps(MAIN_PATH, mainProgress);

  const mainPulse = interpolate(actionProgress, [0, 0.5, 1], [1, 1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const smallPulse = interpolate(actionProgress, [0, 0.5, 1], [1, 0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const smallOpacity = interpolate(actionProgress, [0, 0.5, 1], [1, 0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const scale = 0.85 + 0.15 * scaleIn;
  const trScale = popTR * smallPulse;
  const blScale = popBL * smallPulse;

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
      <g transform={`translate(12 12) scale(${mainPulse}) translate(-12 -12)`}>
        <path
          d={MAIN_PATH}
          strokeDasharray={main.strokeDasharray}
          strokeDashoffset={main.strokeDashoffset}
        />
      </g>
      <g
        opacity={smallOpacity}
        transform={`translate(20 4) scale(${trScale}) translate(-20 -4)`}
      >
        <path d={ACCENT_TR_V} />
        <path d={ACCENT_TR_H} />
      </g>
      <g
        opacity={smallOpacity}
        transform={`translate(4 20) scale(${blScale}) translate(-4 -20)`}
      >
        <circle cx="4" cy="20" r="2" />
      </g>
    </svg>
  );
}

export function SparklesIconStatic({
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
      <path d={MAIN_PATH} />
      <path d={ACCENT_TR_V} />
      <path d={ACCENT_TR_H} />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}
