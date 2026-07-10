"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FRAME_PATH =
  "M5 4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4Z";
const RING1_PATH = "M8 2v4";
const RING2_PATH = "M16 2v4";
const RULE_PATH = "M3 10H21";

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function CalendarIcon({
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

  const frameDraw = interpolate(linearDraw, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const ringsDraw = interpolate(linearDraw, [0.4, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const ruleDraw = interpolate(linearDraw, [0.65, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const ring1Dip = acting
    ? interpolate(actionProgress, [0, 0.25, 0.5], [0, 1.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const ring2Dip = acting
    ? interpolate(actionProgress, [0.1, 0.35, 0.6], [0, 1.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0.5, 0.7, 1], [1, 1.04, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const frame = drawnPathProps(FRAME_PATH, acting ? 1 : frameDraw);
  const ring1 = drawnPathProps(RING1_PATH, acting ? 1 : ringsDraw);
  const ring2 = drawnPathProps(RING2_PATH, acting ? 1 : ringsDraw);
  const rule = drawnPathProps(RULE_PATH, acting ? 1 : ruleDraw);

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
        d={FRAME_PATH}
        strokeDasharray={frame.strokeDasharray}
        strokeDashoffset={frame.strokeDashoffset}
      />
      <g transform={`translate(0 ${ring1Dip})`}>
        <path
          d={RING1_PATH}
          strokeDasharray={ring1.strokeDasharray}
          strokeDashoffset={ring1.strokeDashoffset}
        />
      </g>
      <g transform={`translate(0 ${ring2Dip})`}>
        <path
          d={RING2_PATH}
          strokeDasharray={ring2.strokeDasharray}
          strokeDashoffset={ring2.strokeDashoffset}
        />
      </g>
      <path
        d={RULE_PATH}
        strokeDasharray={rule.strokeDasharray}
        strokeDashoffset={rule.strokeDashoffset}
      />
    </svg>
  );
}

export function CalendarIconStatic({
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
