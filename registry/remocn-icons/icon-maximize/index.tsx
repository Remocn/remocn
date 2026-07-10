"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TL_PATH = "M8 3H5a2 2 0 0 0-2 2v3";
const TR_PATH = "M21 8V5a2 2 0 0 0-2-2h-3";
const BL_PATH = "M3 16v3a2 2 0 0 0 2 2h3";
const BR_PATH = "M16 21h3a2 2 0 0 0 2-2v-3";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

const BRACKETS = [
  { path: TL_PATH, dx: -1, dy: -1 },
  { path: TR_PATH, dx: 1, dy: -1 },
  { path: BL_PATH, dx: -1, dy: 1 },
  { path: BR_PATH, dx: 1, dy: 1 },
] as const;

export function MaximizeIcon({
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
  const expand = acting
    ? interpolate(actionProgress, [0, 0.42, 1], [0, 1.77, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

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
      {BRACKETS.map((bracket) => {
        const dash = drawnPathProps(bracket.path, drawProgress);
        return (
          <g
            key={bracket.path}
            transform={`translate(${bracket.dx * expand} ${bracket.dy * expand})`}
          >
            <path
              d={bracket.path}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function MaximizeIconStatic({
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
      <path d={TL_PATH} />
      <path d={TR_PATH} />
      <path d={BL_PATH} />
      <path d={BR_PATH} />
    </svg>
  );
}
