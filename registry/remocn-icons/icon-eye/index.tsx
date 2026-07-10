"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const OUTLINE_PATH =
  "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0";
const PUPIL_PATH =
  "M12 9 A3 3 0 0 1 15 12 A3 3 0 0 1 12 15 A3 3 0 0 1 9 12 A3 3 0 0 1 12 9";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function EyeIcon({
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

  const outlineDraw = interpolate(linearDraw, [0, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const pupilDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const blink = acting
    ? interpolate(actionProgress, [0, 0.27, 0.55], [1, 0.4, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const pupilPop =
    acting && actionProgress >= 0.55
      ? interpolate(actionProgress, [0.55, 0.77, 1], [0.8, 1.1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        })
      : 1;

  const outline = drawnPathProps(OUTLINE_PATH, outlineDraw);
  const pupil = drawnPathProps(PUPIL_PATH, pupilDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const pupilTransform = `translate(${12 * (1 - pupilPop)} ${12 * (1 - pupilPop)}) scale(${pupilPop})`;

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
        transform: `scale(${scale}) scaleY(${blink})`,
      }}
    >
      <path
        d={OUTLINE_PATH}
        strokeDasharray={outline.strokeDasharray}
        strokeDashoffset={outline.strokeDashoffset}
      />
      <g transform={pupilTransform}>
        <path
          d={PUPIL_PATH}
          strokeDasharray={pupil.strokeDasharray}
          strokeDashoffset={pupil.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function EyeIconStatic({
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
      <path d={OUTLINE_PATH} />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
