"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const TL_PATH =
  "M4 3H9A1 1 0 0 1 10 4V9A1 1 0 0 1 9 10H4A1 1 0 0 1 3 9V4A1 1 0 0 1 4 3Z";
const TR_PATH =
  "M15 3H20A1 1 0 0 1 21 4V9A1 1 0 0 1 20 10H15A1 1 0 0 1 14 9V4A1 1 0 0 1 15 3Z";
const BR_PATH =
  "M15 14H20A1 1 0 0 1 21 15V20A1 1 0 0 1 20 21H15A1 1 0 0 1 14 20V15A1 1 0 0 1 15 14Z";
const BL_PATH =
  "M4 14H9A1 1 0 0 1 10 15V20A1 1 0 0 1 9 21H4A1 1 0 0 1 3 20V15A1 1 0 0 1 4 14Z";

const TIMINGS = {
  drawDurationInFrames: 20,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

const TILES = [
  { path: TL_PATH, cx: 6.5, cy: 6.5, drawWindow: [0, 0.4], stagger: 0 },
  { path: TR_PATH, cx: 17.5, cy: 6.5, drawWindow: [0.2, 0.6], stagger: 0.23 },
  { path: BR_PATH, cx: 17.5, cy: 17.5, drawWindow: [0.4, 0.8], stagger: 0.46 },
  { path: BL_PATH, cx: 6.5, cy: 17.5, drawWindow: [0.6, 1], stagger: 0.69 },
] as const;

export function LayoutGridIcon({
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
      {TILES.map((tile) => {
        const drawn = interpolate(linearDraw, [...tile.drawWindow], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        });
        const dash = drawnPathProps(tile.path, drawn);
        const pop =
          acting && actionProgress >= tile.stagger
            ? interpolate(
                actionProgress,
                [tile.stagger, tile.stagger + 0.25, tile.stagger + 0.5],
                [0.85, 1.06, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.inOut(Easing.quad),
                },
              )
            : 1;
        const tx = tile.cx * (1 - pop);
        const ty = tile.cy * (1 - pop);
        return (
          <g key={tile.path} transform={`translate(${tx} ${ty}) scale(${pop})`}>
            <path
              d={tile.path}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function LayoutGridIconStatic({
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
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
