"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BOX_PATH = "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6";
const SHAFT_PATH = "M10 14 21 3";
const HEAD_PATH = "M15 3h6v6";

const ARROW_CX = 15.5;
const ARROW_CY = 8.5;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function ExternalLinkIcon({
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

  const boxProgress = interpolate(linearDraw, [0, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const shaftProgress = interpolate(linearDraw, [0.5, 0.875], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const headProgress = interpolate(linearDraw, [0.75, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const box = drawnPathProps(BOX_PATH, boxProgress);
  const shaft = drawnPathProps(SHAFT_PATH, shaftProgress);
  const head = drawnPathProps(HEAD_PATH, headProgress);

  const dart = interpolate(actionProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const tx = 3 * dart;
  const ty = -3 * dart;
  const arrowScale = 1 + 0.05 * dart;
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
        d={BOX_PATH}
        strokeDasharray={box.strokeDasharray}
        strokeDashoffset={box.strokeDashoffset}
      />
      <g
        transform={`translate(${tx} ${ty}) translate(${ARROW_CX} ${ARROW_CY}) scale(${arrowScale}) translate(${-ARROW_CX} ${-ARROW_CY})`}
      >
        <path
          d={SHAFT_PATH}
          strokeDasharray={shaft.strokeDasharray}
          strokeDashoffset={shaft.strokeDashoffset}
        />
        <path
          d={HEAD_PATH}
          strokeDasharray={head.strokeDasharray}
          strokeDashoffset={head.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function ExternalLinkIconStatic({
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
      <path d={BOX_PATH} />
      <path d={SHAFT_PATH} />
      <path d={HEAD_PATH} />
    </svg>
  );
}
