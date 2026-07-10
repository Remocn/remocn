"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BOX_PATH = "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8";
const LID_PATH =
  "M4 7H20A1 1 0 0 1 21 8V10A1 1 0 0 1 20 11H4A1 1 0 0 1 3 10V8A1 1 0 0 1 4 7Z";
const CENTER_TOP_PATH = "M12 7V11";
const CENTER_BOTTOM_PATH = "M12 11V21";
const BOW_PATH =
  "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5";

const LID_CX = 12;
const LID_CY = 9;

const TIMINGS = {
  drawDurationInFrames: 18,
  actionDelayInFrames: 2,
  actionDurationInFrames: 28,
  loop: false,
} as const;

export function GiftIcon({
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

  const boxDraw = interpolate(linearDraw, [0, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lidDraw = interpolate(linearDraw, [0.35, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const ribbonDraw = interpolate(linearDraw, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const lidLift = acting
    ? interpolate(actionProgress, [0, 0.4, 0.65], [0, -2.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const lidTilt = acting
    ? interpolate(actionProgress, [0, 0.4, 0.65], [0, 3, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const lidPop = acting
    ? interpolate(actionProgress, [0.6, 0.78, 1], [1, 1.06, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 1;

  const box = drawnPathProps(BOX_PATH, acting ? 1 : boxDraw);
  const lid = drawnPathProps(LID_PATH, acting ? 1 : lidDraw);
  const centerTop = drawnPathProps(CENTER_TOP_PATH, acting ? 1 : ribbonDraw);
  const centerBottom = drawnPathProps(
    CENTER_BOTTOM_PATH,
    acting ? 1 : ribbonDraw,
  );
  const bow = drawnPathProps(BOW_PATH, acting ? 1 : ribbonDraw);

  const scale = 0.85 + 0.15 * scaleIn;
  const lidTransform = `translate(0 ${lidLift}) rotate(${lidTilt} ${LID_CX} ${LID_CY}) translate(${LID_CX * (1 - lidPop)} ${LID_CY * (1 - lidPop)}) scale(${lidPop})`;

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
        d={BOX_PATH}
        strokeDasharray={box.strokeDasharray}
        strokeDashoffset={box.strokeDashoffset}
      />
      <path
        d={CENTER_BOTTOM_PATH}
        strokeDasharray={centerBottom.strokeDasharray}
        strokeDashoffset={centerBottom.strokeDashoffset}
      />
      <g transform={lidTransform}>
        <path
          d={LID_PATH}
          strokeDasharray={lid.strokeDasharray}
          strokeDashoffset={lid.strokeDashoffset}
        />
        <path
          d={CENTER_TOP_PATH}
          strokeDasharray={centerTop.strokeDasharray}
          strokeDashoffset={centerTop.strokeDashoffset}
        />
        <path
          d={BOW_PATH}
          strokeDasharray={bow.strokeDasharray}
          strokeDashoffset={bow.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function GiftIconStatic({
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
      <path d="M12 7v14" />
      <path d={BOX_PATH} />
      <path d={BOW_PATH} />
      <rect x="3" y="7" width="18" height="4" rx="1" />
    </svg>
  );
}
