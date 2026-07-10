"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const PAGE_PATH =
  "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z";
const FOLD_PATH = "M14 2v5a1 1 0 0 0 1 1h5";
const LINE1_PATH = "M8 9H10";
const LINE2_PATH = "M8 13H16";
const LINE3_PATH = "M8 17H16";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function FileTextIcon({
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

  const pageDraw = interpolate(linearDraw, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const foldDraw = interpolate(linearDraw, [0.55, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const line1Type = interpolate(actionProgress, [0.05, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const line2Type = interpolate(actionProgress, [0.3, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const line3Type = interpolate(actionProgress, [0.55, 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  const line1Progress = animation === "draw" ? 1 : acting ? line1Type : 0;
  const line2Progress = animation === "draw" ? 1 : acting ? line2Type : 0;
  const line3Progress = animation === "draw" ? 1 : acting ? line3Type : 0;

  const page = drawnPathProps(PAGE_PATH, acting ? 1 : pageDraw);
  const fold = drawnPathProps(FOLD_PATH, acting ? 1 : foldDraw);
  const line1 = drawnPathProps(LINE1_PATH, line1Progress);
  const line2 = drawnPathProps(LINE2_PATH, line2Progress);
  const line3 = drawnPathProps(LINE3_PATH, line3Progress);

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
        d={PAGE_PATH}
        strokeDasharray={page.strokeDasharray}
        strokeDashoffset={page.strokeDashoffset}
      />
      <path
        d={FOLD_PATH}
        strokeDasharray={fold.strokeDasharray}
        strokeDashoffset={fold.strokeDashoffset}
      />
      <path
        d={LINE1_PATH}
        strokeDasharray={line1.strokeDasharray}
        strokeDashoffset={line1.strokeDashoffset}
      />
      <path
        d={LINE2_PATH}
        strokeDasharray={line2.strokeDasharray}
        strokeDashoffset={line2.strokeDashoffset}
      />
      <path
        d={LINE3_PATH}
        strokeDasharray={line3.strokeDasharray}
        strokeDashoffset={line3.strokeDashoffset}
      />
    </svg>
  );
}

export function FileTextIconStatic({
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
      <path d={PAGE_PATH} />
      <path d={FOLD_PATH} />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
