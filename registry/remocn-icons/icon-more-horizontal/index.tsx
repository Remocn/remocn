"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const LEFT_PATH =
  "M5 11 A1 1 0 0 1 6 12 A1 1 0 0 1 5 13 A1 1 0 0 1 4 12 A1 1 0 0 1 5 11";
const CENTER_PATH =
  "M12 11 A1 1 0 0 1 13 12 A1 1 0 0 1 12 13 A1 1 0 0 1 11 12 A1 1 0 0 1 12 11";
const RIGHT_PATH =
  "M19 11 A1 1 0 0 1 20 12 A1 1 0 0 1 19 13 A1 1 0 0 1 18 12 A1 1 0 0 1 19 11";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

const DOTS = [
  { cx: 5, path: LEFT_PATH, drawWindow: [0, 0.5], stagger: 0 },
  { cx: 12, path: CENTER_PATH, drawWindow: [0.25, 0.75], stagger: 0.27 },
  { cx: 19, path: RIGHT_PATH, drawWindow: [0.5, 1], stagger: 0.54 },
] as const;

export function MoreHorizontalIcon({
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
      {DOTS.map((dot) => {
        const drawn = interpolate(linearDraw, [...dot.drawWindow], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });
        const dash = drawnPathProps(dot.path, drawn);
        const dotScale = 0.6 + 0.4 * drawn;
        const lift = acting
          ? interpolate(
              actionProgress,
              [dot.stagger, dot.stagger + 0.2, dot.stagger + 0.4],
              [0, -3, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.quad),
              },
            )
          : 0;
        const tx = dot.cx * (1 - dotScale);
        const ty = 12 * (1 - dotScale) + lift;
        return (
          <g
            key={dot.cx}
            transform={`translate(${tx} ${ty}) scale(${dotScale})`}
          >
            <path
              d={dot.path}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function MoreHorizontalIconStatic({
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
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}
