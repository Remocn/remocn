"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TRAY_DRAW = "M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4";
const TRAY_STATIC = "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4";
const SHAFT_DRAW = "M12 3V15";
const SHAFT_STATIC = "M12 15V3";
const HEAD_PATH = "M7 10 12 15 17 10";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function DownloadIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionProgress } = useIconAnimation(
    { animation, loop, speed },
    TIMINGS,
  );

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const trayProgress = interpolate(linearDraw, [0, 0.714], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const arrowProgress = interpolate(linearDraw, [0.429, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const arrowOpacity = interpolate(linearDraw, [0.429, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tray = drawnPathProps(TRAY_DRAW, trayProgress);
  const shaft = drawnPathProps(SHAFT_DRAW, arrowProgress);
  const head = drawnPathProps(HEAD_PATH, arrowProgress);

  const dropY = interpolate(actionProgress, [0, 0.25, 0.65, 1], [0, -4, 3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const traySquash = interpolate(
    actionProgress,
    [0, 0.5, 0.65, 0.8, 1],
    [1, 1, 0.94, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
      <g transform={`translate(12 21) scale(1 ${traySquash}) translate(-12 -21)`}>
        <path
          d={TRAY_DRAW}
          strokeDasharray={tray.strokeDasharray}
          strokeDashoffset={tray.strokeDashoffset}
        />
      </g>
      <g opacity={arrowOpacity} transform={`translate(0 ${dropY})`}>
        <path
          d={SHAFT_DRAW}
          strokeDasharray={shaft.strokeDasharray}
          strokeDashoffset={shaft.strokeDashoffset}
        />
        <path
          d={HEAD_PATH}
          strokeDasharray={head.strokeDasharray}
          strokeDashoffset={head.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function DownloadIconStatic({
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
      <path d={SHAFT_STATIC} />
      <path d={TRAY_STATIC} />
      <path d={HEAD_PATH} />
    </svg>
  );
}
