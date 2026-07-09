"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const SCREEN_PATH =
  "M4 3H20A2 2 0 0 1 22 5V15A2 2 0 0 1 20 17H4A2 2 0 0 1 2 15V5A2 2 0 0 1 4 3Z";
const BASE_PATH = "M8 21H16";
const NECK_PATH = "M12 17V21";

const SCREEN_CY = 10;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function MonitorIcon({
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

  const standDraw = interpolate(linearDraw, [0, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const screenDraw = interpolate(linearDraw, [0.35, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const screenYScale = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [0.92, 1.04, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 1;
  const pop = acting
    ? interpolate(actionProgress, [0.5, 0.7, 1], [1, 1.02, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const screen = drawnPathProps(SCREEN_PATH, acting ? 1 : screenDraw);
  const base = drawnPathProps(BASE_PATH, acting ? 1 : standDraw);
  const neck = drawnPathProps(NECK_PATH, acting ? 1 : standDraw);

  const scale = (0.85 + 0.15 * scaleIn) * pop;
  const screenTransform = `translate(0 ${SCREEN_CY * (1 - screenYScale)}) scale(1 ${screenYScale})`;

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
      <g transform={screenTransform}>
        <path
          d={SCREEN_PATH}
          strokeDasharray={screen.strokeDasharray}
          strokeDashoffset={screen.strokeDashoffset}
        />
      </g>
      <path
        d={BASE_PATH}
        strokeDasharray={base.strokeDasharray}
        strokeDashoffset={base.strokeDashoffset}
      />
      <path
        d={NECK_PATH}
        strokeDasharray={neck.strokeDasharray}
        strokeDashoffset={neck.strokeDashoffset}
      />
    </svg>
  );
}

export function MonitorIconStatic({
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
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
