"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M4 6H14A2 2 0 0 1 16 8V16A2 2 0 0 1 14 18H4A2 2 0 0 1 2 16V8A2 2 0 0 1 4 6Z";
const LENS_PATH =
  "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function VideoIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lensDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const acting = animation !== "draw" && actionFrame >= 0;

  const pan = acting
    ? interpolate(actionProgress, [0, 0.5, 0.75, 1], [0, 8, -1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const body = drawnPathProps(BODY_PATH, bodyDraw);
  const lens = drawnPathProps(LENS_PATH, lensDraw);

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
        d={BODY_PATH}
        strokeDasharray={body.strokeDasharray}
        strokeDashoffset={body.strokeDashoffset}
      />
      <g transform={`rotate(${pan} 16 11.75)`}>
        <path
          d={LENS_PATH}
          strokeDasharray={lens.strokeDasharray}
          strokeDashoffset={lens.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function VideoIconStatic({
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
      <path d={LENS_PATH} />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  );
}
