"use client";

import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useGlide } from "@/lib/remocn/glide";

export interface FocusBlurResolveProps {
  text: string;
  blur?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function FocusBlurResolve({
  text,
  blur = 14,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
}: FocusBlurResolveProps) {
  const glide = useGlide();
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  const enterDur = 23;
  const exitDur = 16;
  const exitStart = Math.max(enterDur, durationInFrames - exitDur);

  const enterEasing = Easing.bezier(0.22, 1, 0.36, 1);
  const exitEasing = Easing.bezier(0.64, 0, 0.78, 0);

  const enterP = interpolate(frame, [0, enterDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const exitP = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const opacity = enterP * (1 - exitP);

  const yEnter = interpolate(frame, [0, enterDur], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const yExit = interpolate(frame, [exitStart, durationInFrames], [0, -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const y = yEnter + yExit;

  const blurEnter = interpolate(frame, [0, enterDur], [blur, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const blurExit = interpolate(frame, [exitStart, durationInFrames], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const blurVal = blurEnter + blurExit;

  const scale = interpolate(frame, [0, enterDur], [1.01, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.03em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          display: "inline-block",
          transformOrigin: "50% 50%",
          opacity,
          // One `transform` rather than `translate` and `scale`: the mark
          // that leans the line while it rises rides on `transform` only.
          transform: `translate(0px, ${y}px) scale(${scale})${glide(midway(enterP) || midway(exitP))}`,
          filter: `blur(${blurVal}px)`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
