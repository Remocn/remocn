"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CHEVRON_PATH = "M4 17 10 11 4 5";
const CURSOR_PATH = "M12 19H20";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 32,
  loop: false,
} as const;

export function TerminalIcon({
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

  const chevronDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const cursorDraw = interpolate(linearDraw, [0.55, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const nudge = acting
    ? interpolate(actionProgress, [0, 0.15, 0.35], [0, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const cursorOpacity = acting
    ? interpolate(
        actionProgress,
        [0.3, 0.42, 0.54, 0.66, 0.78],
        [1, 0, 1, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 1;

  const chevron = drawnPathProps(CHEVRON_PATH, acting ? 1 : chevronDraw);
  const cursor = drawnPathProps(CURSOR_PATH, acting ? 1 : cursorDraw);

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
      <g transform={`translate(${nudge} 0)`}>
        <path
          d={CHEVRON_PATH}
          strokeDasharray={chevron.strokeDasharray}
          strokeDashoffset={chevron.strokeDashoffset}
        />
      </g>
      <path
        d={CURSOR_PATH}
        strokeDasharray={cursor.strokeDasharray}
        strokeDashoffset={cursor.strokeDashoffset}
        opacity={cursorOpacity}
      />
    </svg>
  );
}

export function TerminalIconStatic({
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
      <path d="M12 19h8" />
      <path d="m4 17 6-6-6-6" />
    </svg>
  );
}
