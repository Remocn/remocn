"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FRAME_PATH =
  "M5 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3Z";
const SUN_PATH =
  "M9 7 A2 2 0 0 1 11 9 A2 2 0 0 1 9 11 A2 2 0 0 1 7 9 A2 2 0 0 1 9 7";
const MOUNTAIN_PATH = "M6 21 15.086 11.914A2 2 0 0 1 17.914 11.914L21 15";

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

export function ImageIcon({
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

  const frameDraw = interpolate(linearDraw, [0, 0.667], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const sunDraw = interpolate(linearDraw, [0.444, 0.778], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const mountainDraw = interpolate(linearDraw, [0.556, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const acting = animation !== "draw" && actionFrame >= 0;

  const mountainProgress = acting
    ? interpolate(actionProgress, [0, 0.6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : mountainDraw;
  const sunShiftY = acting
    ? interpolate(actionProgress, [0, 0.6, 0.9], [1, -0.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;
  const sunOpacity = acting
    ? interpolate(actionProgress, [0, 0.5], [0.6, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const frame = drawnPathProps(FRAME_PATH, frameDraw);
  const sun = drawnPathProps(SUN_PATH, acting ? 1 : sunDraw);
  const mountain = drawnPathProps(MOUNTAIN_PATH, mountainProgress);

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
        d={FRAME_PATH}
        strokeDasharray={frame.strokeDasharray}
        strokeDashoffset={frame.strokeDashoffset}
      />
      <g transform={`translate(0 ${sunShiftY})`} opacity={sunOpacity}>
        <path
          d={SUN_PATH}
          strokeDasharray={sun.strokeDasharray}
          strokeDashoffset={sun.strokeDashoffset}
        />
      </g>
      <path
        d={MOUNTAIN_PATH}
        strokeDasharray={mountain.strokeDasharray}
        strokeDashoffset={mountain.strokeDashoffset}
      />
    </svg>
  );
}

export function ImageIconStatic({
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
