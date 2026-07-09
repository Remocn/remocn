"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12";
const BACK_WHEEL_PATH = "M8 20a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z";
const FRONT_WHEEL_PATH = "M19 20a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z";

const BACK_CX = 8;
const FRONT_CX = 19;
const WHEEL_CY = 21;

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function ShoppingCartIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const wheelsDraw = interpolate(linearDraw, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const rollX = acting
    ? interpolate(actionProgress, [0, 0.4, 0.7], [0, 4, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const tilt = acting
    ? interpolate(actionProgress, [0, 0.4, 0.7], [0, -1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const backPop = acting
    ? interpolate(actionProgress, [0.5, 0.65, 0.85], [1, 1.2, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const frontPop = acting
    ? interpolate(actionProgress, [0.6, 0.75, 0.95], [1, 1.2, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const body = drawnPathProps(BODY_PATH, acting ? 1 : bodyDraw);
  const backWheel = drawnPathProps(BACK_WHEEL_PATH, acting ? 1 : wheelsDraw);
  const frontWheel = drawnPathProps(FRONT_WHEEL_PATH, acting ? 1 : wheelsDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const backTransform = `translate(${BACK_CX * (1 - backPop)} ${WHEEL_CY * (1 - backPop)}) scale(${backPop})`;
  const frontTransform = `translate(${FRONT_CX * (1 - frontPop)} ${WHEEL_CY * (1 - frontPop)}) scale(${frontPop})`;

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
      <g transform={`translate(${rollX} 0) rotate(${tilt} 12 12)`}>
        <path
          d={BODY_PATH}
          strokeDasharray={body.strokeDasharray}
          strokeDashoffset={body.strokeDashoffset}
        />
        <g transform={backTransform}>
          <path
            d={BACK_WHEEL_PATH}
            strokeDasharray={backWheel.strokeDasharray}
            strokeDashoffset={backWheel.strokeDashoffset}
          />
        </g>
        <g transform={frontTransform}>
          <path
            d={FRONT_WHEEL_PATH}
            strokeDasharray={frontWheel.strokeDasharray}
            strokeDashoffset={frontWheel.strokeDashoffset}
          />
        </g>
      </g>
    </svg>
  );
}

export function ShoppingCartIconStatic({
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
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d={BODY_PATH} />
    </svg>
  );
}
