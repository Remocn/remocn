"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const SPHERE_PATH = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z";
const MERIDIAN_PATH = "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20";
const EQUATOR_PATH = "M2 12H22";

const AXIS_X = 12;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 40,
  loop: true,
} as const;

export function GlobeIcon({
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

  const sphereDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const linesDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const spinX = acting ? Math.cos(actionProgress * Math.PI * 2) : 1;

  const sphere = drawnPathProps(SPHERE_PATH, acting ? 1 : sphereDraw);
  const meridian = drawnPathProps(MERIDIAN_PATH, acting ? 1 : linesDraw);
  const equator = drawnPathProps(EQUATOR_PATH, acting ? 1 : linesDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const spinTransform = `translate(${AXIS_X * (1 - spinX)} 0) scale(${spinX} 1)`;

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
      <g transform={spinTransform}>
        <path
          d={SPHERE_PATH}
          strokeDasharray={sphere.strokeDasharray}
          strokeDashoffset={sphere.strokeDashoffset}
        />
        <path
          d={EQUATOR_PATH}
          strokeDasharray={equator.strokeDasharray}
          strokeDashoffset={equator.strokeDashoffset}
        />
        <path
          d={MERIDIAN_PATH}
          strokeDasharray={meridian.strokeDasharray}
          strokeDashoffset={meridian.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function GlobeIconStatic({
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
      <path d={MERIDIAN_PATH} />
      <path d="M2 12h20" />
    </svg>
  );
}
