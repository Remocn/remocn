"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CROWN_PATH =
  "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z";
const BAND_PATH = "M5 21h14";

const BASE_X = 12;
const BASE_Y = 21;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 28,
  loop: false,
} as const;

export function CrownIcon({
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

  const crownDraw = interpolate(linearDraw, [0, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const bandDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const descend = acting
    ? interpolate(actionProgress, [0, 0.22, 0.55], [0, -3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.sin),
      })
    : 0;
  const pop = acting
    ? interpolate(actionProgress, [0.4, 0.55, 0.7], [1, 1.06, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const rock = acting
    ? interpolate(
        actionProgress,
        [0.55, 0.68, 0.82, 0.94, 1],
        [0, 2, -1.5, 0.8, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        },
      )
    : 0;

  const crown = drawnPathProps(CROWN_PATH, acting ? 1 : crownDraw);
  const band = drawnPathProps(BAND_PATH, acting ? 1 : bandDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const actionTransform = `translate(0 ${descend}) rotate(${rock} ${BASE_X} ${BASE_Y}) translate(${BASE_X * (1 - pop)} ${BASE_Y * (1 - pop)}) scale(${pop})`;

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
      <g transform={actionTransform}>
        <path
          d={CROWN_PATH}
          strokeDasharray={crown.strokeDasharray}
          strokeDashoffset={crown.strokeDashoffset}
        />
        <path
          d={BAND_PATH}
          strokeDasharray={band.strokeDasharray}
          strokeDashoffset={band.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function CrownIconStatic({
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
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}
