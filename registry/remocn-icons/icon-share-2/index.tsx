"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const LEFT_NODE_PATH =
  "M6 9 A3 3 0 0 1 9 12 A3 3 0 0 1 6 15 A3 3 0 0 1 3 12 A3 3 0 0 1 6 9";
const TOP_NODE_PATH =
  "M18 2 A3 3 0 0 1 21 5 A3 3 0 0 1 18 8 A3 3 0 0 1 15 5 A3 3 0 0 1 18 2";
const BOTTOM_NODE_PATH =
  "M18 16 A3 3 0 0 1 21 19 A3 3 0 0 1 18 22 A3 3 0 0 1 15 19 A3 3 0 0 1 18 16";
const TOP_LINE_PATH = "M8.59 10.49 15.41 6.51";
const BOTTOM_LINE_PATH = "M8.59 13.51 15.42 17.49";

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function Share2Icon({
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

  const leftNodeDraw = interpolate(linearDraw, [0, 0.44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const connectorDraw = interpolate(linearDraw, [0.33, 0.78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const rightNodeDraw = interpolate(linearDraw, [0.56, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const topLineProgress = acting
    ? interpolate(actionProgress, [0, 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : connectorDraw;
  const bottomLineProgress = acting
    ? interpolate(actionProgress, [0.15, 0.55], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : connectorDraw;

  const topPop = acting
    ? interpolate(actionProgress, [0.3, 0.45, 0.65], [1, 1.25, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;
  const bottomPop = acting
    ? interpolate(actionProgress, [0.45, 0.6, 0.8], [1, 1.25, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const leftNode = drawnPathProps(LEFT_NODE_PATH, leftNodeDraw);
  const topLine = drawnPathProps(TOP_LINE_PATH, topLineProgress);
  const bottomLine = drawnPathProps(BOTTOM_LINE_PATH, bottomLineProgress);
  const topNode = drawnPathProps(TOP_NODE_PATH, rightNodeDraw);
  const bottomNode = drawnPathProps(BOTTOM_NODE_PATH, rightNodeDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const topTransform = `translate(${18 * (1 - topPop)} ${5 * (1 - topPop)}) scale(${topPop})`;
  const bottomTransform = `translate(${18 * (1 - bottomPop)} ${19 * (1 - bottomPop)}) scale(${bottomPop})`;

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
        d={LEFT_NODE_PATH}
        strokeDasharray={leftNode.strokeDasharray}
        strokeDashoffset={leftNode.strokeDashoffset}
      />
      <path
        d={TOP_LINE_PATH}
        strokeDasharray={topLine.strokeDasharray}
        strokeDashoffset={topLine.strokeDashoffset}
      />
      <path
        d={BOTTOM_LINE_PATH}
        strokeDasharray={bottomLine.strokeDasharray}
        strokeDashoffset={bottomLine.strokeDashoffset}
      />
      <g transform={topTransform}>
        <path
          d={TOP_NODE_PATH}
          strokeDasharray={topNode.strokeDasharray}
          strokeDashoffset={topNode.strokeDashoffset}
        />
      </g>
      <g transform={bottomTransform}>
        <path
          d={BOTTOM_NODE_PATH}
          strokeDasharray={bottomNode.strokeDasharray}
          strokeDashoffset={bottomNode.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function Share2IconStatic({
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}
