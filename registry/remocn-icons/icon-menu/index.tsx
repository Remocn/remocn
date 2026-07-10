"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TOP_PATH = "M4 5 20 5";
const MID_PATH = "M4 12 20 12";
const BOT_PATH = "M4 19 20 19";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 20,
  loop: false,
} as const;

const BARS = [
  { path: TOP_PATH, drawWindow: [0, 0.5], stagger: 0 },
  { path: MID_PATH, drawWindow: [0.25, 0.75], stagger: 0.18 },
  { path: BOT_PATH, drawWindow: [0.5, 1], stagger: 0.36 },
] as const;

export function MenuIcon({
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
      {BARS.map((bar) => {
        const drawn = interpolate(linearDraw, [...bar.drawWindow], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });
        const dash = drawnPathProps(bar.path, drawn);
        const slide = acting
          ? interpolate(
              actionProgress,
              [bar.stagger, bar.stagger + 0.3, bar.stagger + 0.55],
              [-3, 2, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.quad),
              },
            )
          : 0;
        return (
          <g key={bar.path} transform={`translate(${slide} 0)`}>
            <path
              d={bar.path}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function MenuIconStatic({
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
      <path d={TOP_PATH} />
      <path d={MID_PATH} />
      <path d={BOT_PATH} />
    </svg>
  );
}
