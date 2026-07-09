"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CUP_PATH = "M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z";
const LEG_LEFT_PATH =
  "M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978";
const LEG_RIGHT_PATH =
  "M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978";
const BASE_PATH = "M4 22h16";
const HANDLE_LEFT_PATH = "M6 9H4.5a1 1 0 0 1 0-5H6";
const HANDLE_RIGHT_PATH = "M18 9h1.5a1 1 0 0 0 0-5H18";

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function TrophyIcon({
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

  const cupDraw = interpolate(linearDraw, [0, 0.78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const legDraw = interpolate(linearDraw, [0.56, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const hop = acting
    ? interpolate(actionProgress, [0, 0.4, 1], [0, -3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0, 0.4, 0.75, 1], [1, 1.08, 1, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const handleDraw = acting
    ? interpolate(actionProgress, [0.1, 0.6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;

  const cup = drawnPathProps(CUP_PATH, acting ? 1 : cupDraw);
  const legLeft = drawnPathProps(LEG_LEFT_PATH, acting ? 1 : legDraw);
  const legRight = drawnPathProps(LEG_RIGHT_PATH, acting ? 1 : legDraw);
  const base = drawnPathProps(BASE_PATH, acting ? 1 : legDraw);
  const handleLeft = drawnPathProps(HANDLE_LEFT_PATH, handleDraw);
  const handleRight = drawnPathProps(HANDLE_RIGHT_PATH, handleDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const hoistTransform = `translate(${CENTER * (1 - pop)} ${CENTER * (1 - pop) + hop}) scale(${pop})`;

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
      <g transform={hoistTransform}>
        <path
          d={HANDLE_LEFT_PATH}
          strokeDasharray={handleLeft.strokeDasharray}
          strokeDashoffset={handleLeft.strokeDashoffset}
        />
        <path
          d={HANDLE_RIGHT_PATH}
          strokeDasharray={handleRight.strokeDasharray}
          strokeDashoffset={handleRight.strokeDashoffset}
        />
        <path
          d={CUP_PATH}
          strokeDasharray={cup.strokeDasharray}
          strokeDashoffset={cup.strokeDashoffset}
        />
        <path
          d={LEG_LEFT_PATH}
          strokeDasharray={legLeft.strokeDasharray}
          strokeDashoffset={legLeft.strokeDashoffset}
        />
        <path
          d={LEG_RIGHT_PATH}
          strokeDasharray={legRight.strokeDasharray}
          strokeDashoffset={legRight.strokeDashoffset}
        />
        <path
          d={BASE_PATH}
          strokeDasharray={base.strokeDasharray}
          strokeDashoffset={base.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function TrophyIconStatic({
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
      <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
      <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
      <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
    </svg>
  );
}
