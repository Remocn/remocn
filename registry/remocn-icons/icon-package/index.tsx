"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BOX_PATH =
  "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z";
const CENTER_PATH = "M12 22V12";
const EDGE_PATH = "M7.5 4.27 16.5 9.42";
const SEAM_PATH = "M3.29 7 12 12 20.71 7";

const BASE_Y = 22;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function PackageIcon({
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

  const boxDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const edgesDraw = interpolate(linearDraw, [0.45, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const seamDraw = interpolate(linearDraw, [0.7, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const drop = acting
    ? interpolate(actionProgress, [0, 0.25, 0.5], [0, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const squashY = acting
    ? interpolate(actionProgress, [0, 0.25, 0.5, 0.7, 1], [1, 0.95, 1.04, 1, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const box = drawnPathProps(BOX_PATH, acting ? 1 : boxDraw);
  const center = drawnPathProps(CENTER_PATH, acting ? 1 : edgesDraw);
  const edge = drawnPathProps(EDGE_PATH, acting ? 1 : edgesDraw);
  const seam = drawnPathProps(SEAM_PATH, acting ? 1 : seamDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const bodyTransform = `translate(0 ${drop + BASE_Y * (1 - squashY)}) scale(1 ${squashY})`;

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
      <g transform={bodyTransform}>
        <path
          d={BOX_PATH}
          strokeDasharray={box.strokeDasharray}
          strokeDashoffset={box.strokeDashoffset}
        />
        <path
          d={CENTER_PATH}
          strokeDasharray={center.strokeDasharray}
          strokeDashoffset={center.strokeDashoffset}
        />
        <path
          d={EDGE_PATH}
          strokeDasharray={edge.strokeDasharray}
          strokeDashoffset={edge.strokeDashoffset}
        />
        <path
          d={SEAM_PATH}
          strokeDasharray={seam.strokeDasharray}
          strokeDashoffset={seam.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function PackageIconStatic({
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
      <path d={BOX_PATH} />
      <path d={CENTER_PATH} />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}
