"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TAG_PATH =
  "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z";

const HOLE_X = 7.5;
const HOLE_Y = 7.5;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function TagIcon({
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

  const holeScale = acting
    ? 1
    : interpolate(linearDraw, [0.7, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      });

  const swing = acting
    ? interpolate(
        actionProgress,
        [0, 0.2, 0.45, 0.7, 1],
        [0, 8, -6, 3, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        },
      )
    : 0;

  const tag = drawnPathProps(TAG_PATH, drawProgress);

  const scale = 0.85 + 0.15 * scaleIn;
  const holeTransform = `translate(${HOLE_X * (1 - holeScale)} ${HOLE_Y * (1 - holeScale)}) scale(${holeScale})`;

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
      <g transform={`rotate(${swing} ${HOLE_X} ${HOLE_Y})`}>
        <path
          d={TAG_PATH}
          strokeDasharray={tag.strokeDasharray}
          strokeDashoffset={tag.strokeDashoffset}
        />
        <g transform={holeTransform}>
          <circle cx="7.5" cy="7.5" r="0.5" fill={color} stroke="none" />
        </g>
      </g>
    </svg>
  );
}

export function TagIconStatic({
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
      <path d={TAG_PATH} />
      <circle cx="7.5" cy="7.5" r="0.5" fill={color} stroke="none" />
    </svg>
  );
}
