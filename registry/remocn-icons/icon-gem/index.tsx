"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const STONE_PATH =
  "M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z";
const VCUT_PATH = "M10.5 3 8 9l4 13 4-13-2.5-6";
const BAND_PATH = "M2 9h20";

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function GemIcon({
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

  const stoneDraw = interpolate(linearDraw, [0, 0.67], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const vcutDraw = interpolate(linearDraw, [0.44, 0.89], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const bandDraw = interpolate(linearDraw, [0.67, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const pop = acting
    ? interpolate(actionProgress, [0, 0.35, 0.6, 1], [1, 1.06, 1, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const shimmer = acting
    ? interpolate(
        actionProgress,
        [0, 0.25, 0.45, 0.65, 0.85, 1],
        [1, 0.7, 1, 0.78, 1, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        },
      )
    : 1;

  const stone = drawnPathProps(STONE_PATH, acting ? 1 : stoneDraw);
  const vcut = drawnPathProps(VCUT_PATH, acting ? 1 : vcutDraw);
  const band = drawnPathProps(BAND_PATH, acting ? 1 : bandDraw);

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
      <g transform={popTransform}>
        <path
          d={STONE_PATH}
          strokeDasharray={stone.strokeDasharray}
          strokeDashoffset={stone.strokeDashoffset}
        />
        <g opacity={shimmer}>
          <path
            d={VCUT_PATH}
            strokeDasharray={vcut.strokeDasharray}
            strokeDashoffset={vcut.strokeDashoffset}
          />
          <path
            d={BAND_PATH}
            strokeDasharray={band.strokeDasharray}
            strokeDashoffset={band.strokeDashoffset}
          />
        </g>
      </g>
    </svg>
  );
}

export function GemIconStatic({
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
      <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />
      <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />
      <path d="M2 9h20" />
    </svg>
  );
}
