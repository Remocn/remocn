"use client";

import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import {
  drawnPathProps,
  type IconAnimationProps,
  useIconAnimation,
} from "@/lib/remocn-icons";

const CONE_MAIN = "M5.8 11.3 2 22l10.7-3.79";
const CONE_CURL =
  "M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z";

const CONFETTI = [
  {
    d: "M11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7",
    cx: 10,
    cy: 4.5,
    dx: 0.22,
    dy: -0.98,
  },
  { d: "M4 3h.01", cx: 4, cy: 3, dx: -0.64, dy: -0.77 },
  { d: "M15 2h.01", cx: 15, cy: 2, dx: 0.65, dy: -0.76 },
  {
    d: "m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10",
    cx: 18,
    cy: 6,
    dx: 0.95,
    dy: -0.32,
  },
  {
    d: "m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17",
    cx: 19,
    cy: 14,
    dx: 0.89,
    dy: 0.45,
  },
  { d: "M22 8h.01", cx: 22, cy: 8, dx: 1, dy: -0.08 },
  { d: "M22 20h.01", cx: 22, cy: 20, dx: 0.76, dy: 0.65 },
] as const;

const TIMINGS = {
  drawDurationInFrames: 12,
  actionDelayInFrames: 2,
  actionDurationInFrames: 26,
  loop: false,
} as const;

export function PartyPopperIcon({
  animation = "both",
  loop,
  speed,
  size = 48,
  color = "currentColor",
  strokeWidth = 2,
  className,
}: IconAnimationProps) {
  const { drawProgress, scaleIn, actionFrame, actionProgress } =
    useIconAnimation({ animation, loop, speed }, TIMINGS);
  const { fps } = useVideoConfig();

  const linearDraw = 1 - (1 - drawProgress) ** (1 / 3);

  const mainProgress = interpolate(linearDraw, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const curlProgress = interpolate(linearDraw, [0.4, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const main = drawnPathProps(CONE_MAIN, mainProgress);
  const curl = drawnPathProps(CONE_CURL, curlProgress);

  const recoil = interpolate(actionProgress, [0, 0.35, 1], [0, -6, 0], {
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
      <g transform={`rotate(${recoil} 2 22)`}>
        <path
          d={CONE_MAIN}
          strokeDasharray={main.strokeDasharray}
          strokeDashoffset={main.strokeDashoffset}
        />
        <path
          d={CONE_CURL}
          strokeDasharray={curl.strokeDasharray}
          strokeDashoffset={curl.strokeDashoffset}
        />
      </g>
      {CONFETTI.map((piece, index) => {
        const pieceFrame = actionFrame - index * 2;
        const burst =
          pieceFrame <= 0
            ? 0
            : spring({
                frame: pieceFrame,
                fps,
                config: { damping: 12, stiffness: 170, mass: 0.7 },
                durationInFrames: 20,
              });
        const dist = 3 * burst;
        const opacity = interpolate(burst, [0, 0.15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <path
            key={index}
            d={piece.d}
            opacity={opacity}
            transform={`translate(${piece.dx * dist} ${piece.dy * dist}) translate(${piece.cx} ${piece.cy}) scale(${burst}) translate(${-piece.cx} ${-piece.cy})`}
          />
        );
      })}
    </svg>
  );
}

export function PartyPopperIconStatic({
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
      <path d={CONE_MAIN} />
      <path d={CONE_CURL} />
      {CONFETTI.map((piece, index) => (
        <path key={index} d={piece.d} />
      ))}
    </svg>
  );
}
