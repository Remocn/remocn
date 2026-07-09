"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH =
  "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z";
const FIN_RIGHT_PATH = "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5";
const FIN_LEFT_PATH = "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05";
const FLAME_PATH =
  "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09";

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 30,
  loop: false,
} as const;

export function RocketIcon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.67], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const finsDraw = interpolate(linearDraw, [0.44, 0.89], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const flameDraw = interpolate(linearDraw, [0.67, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const rise = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [0, -4, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const tilt = acting
    ? interpolate(actionProgress, [0, 0.45, 1], [0, -3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const flicker = acting
    ? interpolate(actionProgress, [0, 0.2, 0.4, 0.6, 0.8], [1, 1.2, 1, 1.18, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const body = drawnPathProps(BODY_PATH, acting ? 1 : bodyDraw);
  const finRight = drawnPathProps(FIN_RIGHT_PATH, acting ? 1 : finsDraw);
  const finLeft = drawnPathProps(FIN_LEFT_PATH, acting ? 1 : finsDraw);
  const flame = drawnPathProps(FLAME_PATH, acting ? 1 : flameDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const flameTransform = `translate(${4.5 * (1 - flicker)} ${18 * (1 - flicker)}) scale(${flicker})`;

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
      <g transform={`translate(0 ${rise}) rotate(${tilt} 8 20)`}>
        <path
          d={BODY_PATH}
          strokeDasharray={body.strokeDasharray}
          strokeDashoffset={body.strokeDashoffset}
        />
        <path
          d={FIN_RIGHT_PATH}
          strokeDasharray={finRight.strokeDasharray}
          strokeDashoffset={finRight.strokeDashoffset}
        />
        <path
          d={FIN_LEFT_PATH}
          strokeDasharray={finLeft.strokeDasharray}
          strokeDashoffset={finLeft.strokeDashoffset}
        />
        <g transform={flameTransform}>
          <path
            d={FLAME_PATH}
            strokeDasharray={flame.strokeDasharray}
            strokeDashoffset={flame.strokeDashoffset}
          />
        </g>
      </g>
    </svg>
  );
}

export function RocketIconStatic({
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
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
      <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
    </svg>
  );
}
