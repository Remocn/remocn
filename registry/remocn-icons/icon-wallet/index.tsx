"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FLAP_PATH =
  "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1";
const BODY_PATH = "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4";

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function WalletIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const flapDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const fatten = acting
    ? interpolate(actionProgress, [0.1, 0.5, 1], [1, 1.05, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const flap = drawnPathProps(FLAP_PATH, acting ? 1 : flapDraw);
  const body = drawnPathProps(BODY_PATH, acting ? 1 : bodyDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const fattenTransform = `translate(${CENTER * (1 - fatten)} 0) scale(${fatten} 1)`;

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
      <g transform={fattenTransform}>
        <path
          d={BODY_PATH}
          strokeDasharray={body.strokeDasharray}
          strokeDashoffset={body.strokeDashoffset}
        />
        <path
          d={FLAP_PATH}
          strokeDasharray={flap.strokeDasharray}
          strokeDashoffset={flap.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function WalletIconStatic({
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
      <path d={FLAP_PATH} />
      <path d={BODY_PATH} />
    </svg>
  );
}
