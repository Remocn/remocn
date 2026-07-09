"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const RING_PATH = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z";
const H_PATH = "M8 12h8";
const V_PATH = "M12 8v8";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function PlusCircleIcon({
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

  const hDraw = interpolate(actionProgress, [0.1, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const vDraw = interpolate(actionProgress, [0.25, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const pop = acting
    ? interpolate(actionProgress, [0.55, 0.75, 1], [1, 1.06, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const hProgress = animation === "draw" ? 1 : acting ? hDraw : 0;
  const vProgress = animation === "draw" ? 1 : acting ? vDraw : 0;

  const ring = drawnPathProps(RING_PATH, drawProgress);
  const h = drawnPathProps(H_PATH, hProgress);
  const v = drawnPathProps(V_PATH, vProgress);

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
      <path
        d={RING_PATH}
        strokeDasharray={ring.strokeDasharray}
        strokeDashoffset={ring.strokeDashoffset}
      />
      <path
        d={H_PATH}
        strokeDasharray={h.strokeDasharray}
        strokeDashoffset={h.strokeDashoffset}
      />
      <path
        d={V_PATH}
        strokeDasharray={v.strokeDasharray}
        strokeDashoffset={v.strokeDashoffset}
      />
    </svg>
  );
}

export function PlusCircleIconStatic({
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
      <path d={H_PATH} />
      <path d={V_PATH} />
    </svg>
  );
}
