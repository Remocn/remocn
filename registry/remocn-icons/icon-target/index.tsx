"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const RING_OUTER = "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z";
const RING_MID = "M12 6a6 6 0 1 0 0 12 6 6 0 1 0 0-12Z";
const RING_INNER = "M12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4Z";

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function TargetIcon({
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

  const outerDraw = interpolate(linearDraw, [0, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const midDraw = interpolate(linearDraw, [0.28, 0.83], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const innerDraw = interpolate(linearDraw, [0.55, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const pop = acting
    ? interpolate(actionProgress, [0, 0.25, 0.6], [1, 1.5, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const shake = acting
    ? interpolate(
        actionProgress,
        [0.6, 0.68, 0.78, 0.88, 1],
        [0, 0.6, -0.6, 0.3, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      )
    : 0;

  const outer = drawnPathProps(RING_OUTER, acting ? 1 : outerDraw);
  const mid = drawnPathProps(RING_MID, acting ? 1 : midDraw);
  const inner = drawnPathProps(RING_INNER, acting ? 1 : innerDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const popTransform = `translate(${CENTER * (1 - pop)} ${CENTER * (1 - pop)}) scale(${pop})`;

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
      <g transform={`translate(${shake} 0)`}>
        <path
          d={RING_OUTER}
          strokeDasharray={outer.strokeDasharray}
          strokeDashoffset={outer.strokeDashoffset}
        />
        <path
          d={RING_MID}
          strokeDasharray={mid.strokeDasharray}
          strokeDashoffset={mid.strokeDashoffset}
        />
        <g transform={popTransform}>
          <path
            d={RING_INNER}
            strokeDasharray={inner.strokeDasharray}
            strokeDashoffset={inner.strokeDashoffset}
          />
        </g>
      </g>
    </svg>
  );
}

export function TargetIconStatic({
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
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
