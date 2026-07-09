"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CAPSULE_PATH =
  "M12 2A3 3 0 0 1 15 5V12A3 3 0 0 1 12 15A3 3 0 0 1 9 12V5A3 3 0 0 1 12 2Z";
const ARC_PATH = "M19 10v2a7 7 0 0 1-14 0v-2";
const STAND_PATH = "M12 19v3";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function MicIcon({
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

  const capsuleDraw = interpolate(linearDraw, [0, 0.625], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const arcDraw = interpolate(linearDraw, [0.375, 0.875], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const standDraw = interpolate(linearDraw, [0.625, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const acting = animation !== "draw" && actionFrame >= 0;

  const capsuleScaleY = acting
    ? interpolate(
        actionProgress,
        [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1],
        [1, 0.94, 1.04, 1, 0.97, 1.02, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.quad),
        },
      )
    : 1;

  const capsule = drawnPathProps(CAPSULE_PATH, capsuleDraw);
  const arc = drawnPathProps(ARC_PATH, arcDraw);
  const stand = drawnPathProps(STAND_PATH, standDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const capsuleTransform = `translate(0 ${8.5 * (1 - capsuleScaleY)}) scale(1 ${capsuleScaleY})`;

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
      <g transform={capsuleTransform}>
        <path
          d={CAPSULE_PATH}
          strokeDasharray={capsule.strokeDasharray}
          strokeDashoffset={capsule.strokeDashoffset}
        />
      </g>
      <path
        d={ARC_PATH}
        strokeDasharray={arc.strokeDasharray}
        strokeDashoffset={arc.strokeDashoffset}
      />
      <path
        d={STAND_PATH}
        strokeDasharray={stand.strokeDasharray}
        strokeDashoffset={stand.strokeDashoffset}
      />
    </svg>
  );
}

export function MicIconStatic({
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
      <path d={STAND_PATH} />
      <path d={ARC_PATH} />
      <rect x="9" y="2" width="6" height="13" rx="3" />
    </svg>
  );
}
