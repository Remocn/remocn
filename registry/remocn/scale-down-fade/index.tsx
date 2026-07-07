"use client";

import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface ScaleDownFadeProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function ScaleDownFade({
  text,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
}: ScaleDownFadeProps) {
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  const enterDurFrames = 16;
  const exitDurFrames = 11;
  const exitStart = Math.max(enterDurFrames, durationInFrames - exitDurFrames);

  const enterEasing = Easing.bezier(0.22, 1, 0.36, 1);
  const exitEasing = Easing.bezier(0.64, 0, 0.78, 0);

  const enterP = interpolate(frame, [0, enterDurFrames], [0, 1], {
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

  const yEnter = interpolate(frame, [0, enterDurFrames], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const yExit = interpolate(frame, [exitStart, durationInFrames], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const y = yEnter + yExit;

  const scaleEnter = interpolate(frame, [0, enterDurFrames], [1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const scaleExitDelta = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, -0.06],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: exitEasing,
    },
  );

  const scale = scaleEnter + scaleExitDelta;

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
          transform: `translateY(${y}px) scale(${scale})`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
