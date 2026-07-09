"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CORE_PATH = "M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z";

const RAYS = [
  "M12 4 12 2",
  "M17.66 6.34 19.07 4.93",
  "M20 12 22 12",
  "M17.66 17.66 19.07 19.07",
  "M12 20 12 22",
  "M6.34 17.66 4.93 19.07",
  "M4 12 2 12",
  "M6.34 6.34 4.93 4.93",
];

const CENTER = 12;

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 30,
  loop: false,
} as const;

export function SunIcon({
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

  const acting = animation !== "draw" && actionFrame >= 0;

  const corePop = acting
    ? interpolate(actionProgress, [0.55, 0.75, 1], [1, 1.08, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const core = drawnPathProps(CORE_PATH, drawProgress);

  const rays = RAYS.map((d, i) => {
    const start = i * 0.07;
    const rayFan = interpolate(actionProgress, [start, start + 0.28], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });
    const progress = animation === "draw" ? 1 : acting ? rayFan : 0;
    return { d, ...drawnPathProps(d, progress) };
  });

  const scale = 0.85 + 0.15 * scaleIn;
  const coreTransform = `translate(${CENTER * (1 - corePop)} ${CENTER * (1 - corePop)}) scale(${corePop})`;

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
      {rays.map((ray) => (
        <path
          key={ray.d}
          d={ray.d}
          strokeDasharray={ray.strokeDasharray}
          strokeDashoffset={ray.strokeDashoffset}
        />
      ))}
      <g transform={coreTransform}>
        <path
          d={CORE_PATH}
          strokeDasharray={core.strokeDasharray}
          strokeDashoffset={core.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function SunIconStatic({
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}
