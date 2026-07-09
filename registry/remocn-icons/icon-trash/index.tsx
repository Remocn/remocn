"use client";

import { Easing, interpolate } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const BODY_PATH = "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6";
const INNER1_PATH = "M10 11v6";
const INNER2_PATH = "M14 11v6";
const LID_PATH = "M3 6h18";
const HANDLE_PATH = "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2";

const TIMINGS = {
  drawDurationInFrames: 14,
  actionDelayInFrames: 2,
  actionDurationInFrames: 24,
  loop: false,
} as const;

export function TrashIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionProgress } = useIconAnimation(
    { animation, loop, speed },
    TIMINGS,
  );

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const bodyProgress = interpolate(linearDraw, [0, 0.714], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const innerProgress = interpolate(linearDraw, [0.571, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lidProgress = interpolate(linearDraw, [0.714, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const body = drawnPathProps(BODY_PATH, bodyProgress);
  const inner1 = drawnPathProps(INNER1_PATH, innerProgress);
  const inner2 = drawnPathProps(INNER2_PATH, innerProgress);
  const lid = drawnPathProps(LID_PATH, lidProgress);
  const handle = drawnPathProps(HANDLE_PATH, lidProgress);

  const lidRotate = interpolate(actionProgress, [0, 0.4, 1], [0, -14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const lidLift = interpolate(actionProgress, [0, 0.4, 1], [0, -1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

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
        d={BODY_PATH}
        strokeDasharray={body.strokeDasharray}
        strokeDashoffset={body.strokeDashoffset}
      />
      <path
        d={INNER1_PATH}
        strokeDasharray={inner1.strokeDasharray}
        strokeDashoffset={inner1.strokeDashoffset}
      />
      <path
        d={INNER2_PATH}
        strokeDasharray={inner2.strokeDasharray}
        strokeDashoffset={inner2.strokeDashoffset}
      />
      <g transform={`translate(0 ${lidLift}) rotate(${lidRotate} 3 6)`}>
        <path
          d={LID_PATH}
          strokeDasharray={lid.strokeDasharray}
          strokeDashoffset={lid.strokeDashoffset}
        />
        <path
          d={HANDLE_PATH}
          strokeDasharray={handle.strokeDasharray}
          strokeDashoffset={handle.strokeDashoffset}
        />
      </g>
    </svg>
  );
}

export function TrashIconStatic({
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
      <path d={INNER1_PATH} />
      <path d={INNER2_PATH} />
      <path d={BODY_PATH} />
      <path d={LID_PATH} />
      <path d={HANDLE_PATH} />
    </svg>
  );
}
