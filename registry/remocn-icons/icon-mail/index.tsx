"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M4 4H20A2 2 0 0 1 22 6V18A2 2 0 0 1 20 20H4A2 2 0 0 1 2 18V6A2 2 0 0 1 4 4Z";
const FLAP_PATH = "M22 7 13.009 12.727a2 2 0 0 1-2.009 0L2 7";
const FLAP_RIGHT_PATH = "M22 7 13.009 12.727";
const FLAP_LEFT_PATH = "M2 7 11 12.727";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function MailIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const flapDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const flapProgress = acting ? 1 : flapDraw;
  const pop = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [1, 1.05, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const bob = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [0, -1.6, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const body = drawnPathProps(BODY_PATH, bodyDraw);
  const flapRight = drawnPathProps(FLAP_RIGHT_PATH, flapProgress);
  const flapLeft = drawnPathProps(FLAP_LEFT_PATH, flapProgress);

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
        transform: `translateY(${bob}px) scale(${scale})`,
      }}
    >
      <path
        d={BODY_PATH}
        strokeDasharray={body.strokeDasharray}
        strokeDashoffset={body.strokeDashoffset}
      />
      <path
        d={FLAP_RIGHT_PATH}
        strokeDasharray={flapRight.strokeDasharray}
        strokeDashoffset={flapRight.strokeDashoffset}
      />
      <path
        d={FLAP_LEFT_PATH}
        strokeDasharray={flapLeft.strokeDasharray}
        strokeDashoffset={flapLeft.strokeDashoffset}
      />
    </svg>
  );
}

export function MailIconStatic({
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}
