"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TRAY_PATH =
  "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z";
const LIP_PATH = "M22 12H16L14 15H10L8 12H2";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

export function InboxIcon({
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

  const trayDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lipDraw = interpolate(linearDraw, [0.45, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const dip = acting
    ? interpolate(actionProgress, [0, 0.25, 0.55, 1], [0, 0, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0.55, 0.75, 1], [1, 1.03, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const tray = drawnPathProps(TRAY_PATH, acting ? 1 : trayDraw);
  const lip = drawnPathProps(LIP_PATH, acting ? 1 : lipDraw);

  const scale = (0.85 + 0.15 * scaleIn) * pop;

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
        transform: `translateY(${dip}px) scale(${scale})`,
      }}
    >
      <path
        d={TRAY_PATH}
        strokeDasharray={tray.strokeDasharray}
        strokeDashoffset={tray.strokeDashoffset}
      />
      <path
        d={LIP_PATH}
        strokeDasharray={lip.strokeDasharray}
        strokeDashoffset={lip.strokeDashoffset}
      />
    </svg>
  );
}

export function InboxIconStatic({
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
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d={TRAY_PATH} />
    </svg>
  );
}
