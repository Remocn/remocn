"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const FRAG1_PATH =
  "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49";
const FRAG2_PATH = "M14.084 14.158a3 3 0 0 1-4.242-4.242";
const FRAG3_PATH =
  "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143";
const SLASH_PATH = "M2 2 22 22";

const TIMINGS = {
  drawDurationInFrames: 16,
  actionDelayInFrames: 2,
  actionDurationInFrames: 22,
  loop: false,
} as const;

const FRAGMENTS = [
  { path: FRAG1_PATH, drawWindow: [0, 0.69] },
  { path: FRAG2_PATH, drawWindow: [0.19, 0.88] },
  { path: FRAG3_PATH, drawWindow: [0.375, 1] },
] as const;

export function EyeOffIcon({
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

  const slashProgress = acting
    ? interpolate(actionProgress, [0, 0.45], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;
  const fragOpacity = acting
    ? interpolate(actionProgress, [0.09, 0.5, 1], [1, 0.35, 0.6], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const slash = drawnPathProps(SLASH_PATH, slashProgress);
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
      <g opacity={fragOpacity}>
        {FRAGMENTS.map((frag) => {
          const drawn = acting
            ? 1
            : interpolate(linearDraw, [...frag.drawWindow], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              });
          const dash = drawnPathProps(frag.path, drawn);
          return (
            <path
              key={frag.path}
              d={frag.path}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
            />
          );
        })}
      </g>
      <path
        d={SLASH_PATH}
        strokeDasharray={slash.strokeDasharray}
        strokeDashoffset={slash.strokeDashoffset}
      />
    </svg>
  );
}

export function EyeOffIconStatic({
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
      <path d={FRAG1_PATH} />
      <path d={FRAG2_PATH} />
      <path d={FRAG3_PATH} />
      <path d={SLASH_PATH} />
    </svg>
  );
}
