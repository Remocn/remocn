"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const MEDAL_PATH = "M12 2a6 6 0 1 0 0 12 6 6 0 1 0 0-12Z";
const RIBBON_PATH =
  "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526";

const MEDAL_CX = 12;
const MEDAL_CY = 8;
const PIVOT_X = 12;
const PIVOT_Y = 2;

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 30,
  loop: false,
} as const;

export function AwardIcon({
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

  const ribbonDraw = acting
    ? interpolate(actionProgress, [0.05, 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0.35, 0.55, 1], [1, 1.15, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const swing = acting
    ? interpolate(
        actionProgress,
        [0.35, 0.5, 0.65, 0.8, 1],
        [0, 4, -3, 1.5, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        },
      )
    : 0;

  const medal = drawnPathProps(MEDAL_PATH, acting ? 1 : drawProgress);
  const ribbon = drawnPathProps(RIBBON_PATH, ribbonDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const popTransform = `translate(${MEDAL_CX * (1 - pop)} ${MEDAL_CY * (1 - pop)}) scale(${pop})`;

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
      <g transform={`rotate(${swing} ${PIVOT_X} ${PIVOT_Y})`}>
        <path
          d={RIBBON_PATH}
          strokeDasharray={ribbon.strokeDasharray}
          strokeDashoffset={ribbon.strokeDashoffset}
        />
        <g transform={popTransform}>
          <path
            d={MEDAL_PATH}
            strokeDasharray={medal.strokeDasharray}
            strokeDashoffset={medal.strokeDashoffset}
          />
        </g>
      </g>
    </svg>
  );
}

export function AwardIconStatic({
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
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
      <circle cx="12" cy="8" r="6" />
    </svg>
  );
}
