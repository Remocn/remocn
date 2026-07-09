"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z";
const LENS_PATH =
  "M12 10 A3 3 0 0 1 15 13 A3 3 0 0 1 12 16 A3 3 0 0 1 9 13 A3 3 0 0 1 12 10";

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function CameraIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.667], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lensDraw = interpolate(linearDraw, [0.444, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const acting = animation !== "draw" && actionFrame >= 0;

  const shutter = acting
    ? interpolate(
        actionProgress,
        [0, 0.28, 0.56, 0.78, 1],
        [1, 0.55, 1.08, 1, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        },
      )
    : 1;

  const body = drawnPathProps(BODY_PATH, bodyDraw);
  const lens = drawnPathProps(LENS_PATH, lensDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const lensTransform = `translate(${12 * (1 - shutter)} ${13 * (1 - shutter)}) scale(${shutter})`;

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
      <g transform={lensTransform}>
        <path
          d={LENS_PATH}
          strokeDasharray={lens.strokeDasharray}
          strokeDashoffset={lens.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function CameraIconStatic({
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
      <path d={BODY_PATH} />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
