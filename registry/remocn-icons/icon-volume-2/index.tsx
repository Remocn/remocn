"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const SPEAKER_PATH =
  "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z";
const INNER_PATH = "M16 9a5 5 0 0 1 0 6";
const OUTER_PATH = "M19.364 18.364a9 9 0 0 0 0-12.728";

const TIMINGS = {
  drawDurationInFrames: 20,
  actionDelayInFrames: 2,
  actionDurationInFrames: 18,
  loop: false,
} as const;

export function Volume2Icon({
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

  const bodyDraw = interpolate(linearDraw, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const innerDraw = interpolate(linearDraw, [0.4, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const outerDraw = interpolate(linearDraw, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const acting = animation !== "draw" && actionFrame >= 0;

  const innerProgress = acting ? 1 : innerDraw;
  const outerProgress = acting ? 1 : outerDraw;

  const innerShift = acting
    ? interpolate(actionProgress, [0, 0.35, 0.7], [0, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const innerGrow = acting
    ? interpolate(actionProgress, [0, 0.35, 0.7], [1, 1.08, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const outerShift = acting
    ? interpolate(actionProgress, [0.12, 0.47, 0.82], [0, 2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const outerGrow = acting
    ? interpolate(actionProgress, [0.12, 0.47, 0.82], [1, 1.08, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const body = drawnPathProps(SPEAKER_PATH, bodyDraw);
  const inner = drawnPathProps(INNER_PATH, innerProgress);
  const outer = drawnPathProps(OUTER_PATH, outerProgress);

  const innerTransform = `translate(${11 * (1 - innerGrow) + innerShift} ${12 * (1 - innerGrow)}) scale(${innerGrow})`;
  const outerTransform = `translate(${11 * (1 - outerGrow) + outerShift} ${12 * (1 - outerGrow)}) scale(${outerGrow})`;

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
      <path
        d={SPEAKER_PATH}
        strokeDasharray={body.strokeDasharray}
        strokeDashoffset={body.strokeDashoffset}
      />
      <g transform={innerTransform}>
        <path
          d={INNER_PATH}
          strokeDasharray={inner.strokeDasharray}
          strokeDashoffset={inner.strokeDashoffset}
        />
      </g>
      <g transform={outerTransform}>
        <path
          d={OUTER_PATH}
          strokeDasharray={outer.strokeDasharray}
          strokeDashoffset={outer.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function Volume2IconStatic({
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
      <path d={SPEAKER_PATH} />
      <path d={INNER_PATH} />
      <path d={OUTER_PATH} />
    </svg>
  );
}
