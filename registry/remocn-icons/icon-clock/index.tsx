"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FACE_PATH = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z";
const HANDS_PATH = "M12 6v6l4 2";
const MINUTE_PATH = "M12 6V12";
const HOUR_PATH = "M12 12 16 14";

const CENTER = 12;
const STEPS = 4;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 40,
  loop: true,
} as const;

export function ClockIcon({
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

  const faceDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const handsDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const scaled = actionProgress * STEPS;
  const stepIndex = Math.floor(scaled);
  const frac = scaled - stepIndex;
  const eased = interpolate(frac, [0, 0.55, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const tick = acting ? ((stepIndex + eased) / STEPS) * 360 : 0;

  const face = drawnPathProps(FACE_PATH, acting ? 1 : faceDraw);
  const minute = drawnPathProps(MINUTE_PATH, acting ? 1 : handsDraw);
  const hour = drawnPathProps(HOUR_PATH, acting ? 1 : handsDraw);

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
        d={FACE_PATH}
        strokeDasharray={face.strokeDasharray}
        strokeDashoffset={face.strokeDashoffset}
      />
      <path
        d={HOUR_PATH}
        strokeDasharray={hour.strokeDasharray}
        strokeDashoffset={hour.strokeDashoffset}
      />
      <g transform={`rotate(${tick} ${CENTER} ${CENTER})`}>
        <path
          d={MINUTE_PATH}
          strokeDasharray={minute.strokeDasharray}
          strokeDashoffset={minute.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function ClockIconStatic({
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
      <circle cx="12" cy="12" r="10" />
      <path d={HANDS_PATH} />
    </svg>
  );
}
