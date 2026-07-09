"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const RING_PATH = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z";
const CURVE_PATH = "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3";
const DOT_PATH = "M12 17h.01";

const PIVOT_X = 12;
const PIVOT_Y = 8;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function HelpCircleIcon({
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

  const ringDraw = interpolate(linearDraw, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const curveDraw = interpolate(linearDraw, [0.4, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const dotDraw = interpolate(linearDraw, [0.75, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const tilt = acting
    ? interpolate(actionProgress, [0, 0.4, 0.7, 1], [0, 6, -4, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const ring = drawnPathProps(RING_PATH, acting ? 1 : ringDraw);
  const curve = drawnPathProps(CURVE_PATH, acting ? 1 : curveDraw);
  const dot = drawnPathProps(DOT_PATH, acting ? 1 : dotDraw);

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
        d={RING_PATH}
        strokeDasharray={ring.strokeDasharray}
        strokeDashoffset={ring.strokeDashoffset}
      />
      <g transform={`rotate(${tilt} ${PIVOT_X} ${PIVOT_Y})`}>
        <path
          d={CURVE_PATH}
          strokeDasharray={curve.strokeDasharray}
          strokeDashoffset={curve.strokeDashoffset}
        />
        <path
          d={DOT_PATH}
          strokeDasharray={dot.strokeDasharray}
          strokeDashoffset={dot.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function HelpCircleIconStatic({
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
      <path d={CURVE_PATH} />
      <path d={DOT_PATH} />
    </svg>
  );
}
