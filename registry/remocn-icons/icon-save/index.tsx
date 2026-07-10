"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const DISK_PATH =
  "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z";
const LABEL_PATH = "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7";
const SLOT_PATH = "M7 3v4a1 1 0 0 0 1 1h7";

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function SaveIcon({
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

  const diskDraw = interpolate(linearDraw, [0, 0.667], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const labelDraw = interpolate(linearDraw, [0.444, 0.889], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const slotDraw = interpolate(linearDraw, [0.667, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const slotProgress = acting
    ? interpolate(actionProgress, [0.25, 0.75], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : slotDraw;

  const squash = acting
    ? interpolate(actionProgress, [0, 0.3, 0.6], [1, 0.92, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const dip = acting
    ? interpolate(actionProgress, [0, 0.3, 0.6], [0, -1.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;

  const disk = drawnPathProps(DISK_PATH, diskDraw);
  const label = drawnPathProps(LABEL_PATH, labelDraw);
  const slot = drawnPathProps(SLOT_PATH, slotProgress);

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
        transform: `translateY(${dip}px) scale(${scale}) scaleY(${squash})`,
      }}
    >
      <path
        d={DISK_PATH}
        strokeDasharray={disk.strokeDasharray}
        strokeDashoffset={disk.strokeDashoffset}
      />
      <path
        d={LABEL_PATH}
        strokeDasharray={label.strokeDasharray}
        strokeDashoffset={label.strokeDashoffset}
      />
      <path
        d={SLOT_PATH}
        strokeDasharray={slot.strokeDasharray}
        strokeDashoffset={slot.strokeDashoffset}
      />
    </svg>
  );
}

export function SaveIconStatic({
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
      <path d={DISK_PATH} />
      <path d={LABEL_PATH} />
      <path d={SLOT_PATH} />
    </svg>
  );
}
