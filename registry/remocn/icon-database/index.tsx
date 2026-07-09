"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const DISC_PATH = "M3 5A9 3 0 0 0 21 5A9 3 0 0 0 3 5Z";
const BODY_PATH = "M3 5V19A9 3 0 0 0 21 19V5";
const MID_PATH = "M3 12A9 3 0 0 0 21 12";

const DISC_CX = 12;
const DISC_CY = 5;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function DatabaseIcon({
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

  const discDraw = interpolate(linearDraw, [0, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const bodyDraw = interpolate(linearDraw, [0.35, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const midDraw = interpolate(linearDraw, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const discPop = acting
    ? interpolate(actionProgress, [0, 0.25, 0.5], [1, 1.06, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const midDip = acting
    ? interpolate(actionProgress, [0.25, 0.5, 0.8], [0, 1.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const disc = drawnPathProps(DISC_PATH, acting ? 1 : discDraw);
  const body = drawnPathProps(BODY_PATH, acting ? 1 : bodyDraw);
  const mid = drawnPathProps(MID_PATH, acting ? 1 : midDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const discTransform = `translate(${DISC_CX * (1 - discPop)} ${DISC_CY * (1 - discPop)}) scale(${discPop})`;

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
        d={BODY_PATH}
        strokeDasharray={body.strokeDasharray}
        strokeDashoffset={body.strokeDashoffset}
      />
      <g transform={`translate(0 ${midDip})`}>
        <path
          d={MID_PATH}
          strokeDasharray={mid.strokeDasharray}
          strokeDashoffset={mid.strokeDashoffset}
        />
      </g>
      <g transform={discTransform}>
        <path
          d={DISC_PATH}
          strokeDasharray={disc.strokeDasharray}
          strokeDashoffset={disc.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function DatabaseIconStatic({
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
