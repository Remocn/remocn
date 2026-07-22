"use client";

import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface BlurOutUpProps {
  text: string;
  staggerDelay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function BlurOutUp({
  text,
  staggerDelay = 1,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
}: BlurOutUpProps) {
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  const words = text.split(" ");

  const enterDur = 17;
  const enterTravel = 6;
  const exitDur = 14;
  const exitTravelFrom = 8;

  const enterEasing = Easing.bezier(0.22, 1, 0.36, 1);
  const exitEasing = Easing.bezier(0.64, 0, 0.78, 0);

  const enterEnd = enterDur + (words.length - 1) * staggerDelay;
  const exitStart = Math.max(
    enterEnd,
    durationInFrames - exitDur - (words.length - 1) * staggerDelay,
  );

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
        }}
      >
        {words.map((word, i) => {
          const enterLocal = frame - i * staggerDelay;
          const exitLocal = frame - exitStart - i * staggerDelay;

          const enterP = interpolate(enterLocal, [0, enterDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: enterEasing,
          });

          const exitP = interpolate(exitLocal, [0, exitDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: exitEasing,
          });

          const opacity = enterP * (1 - exitP);

          const yEnter = interpolate(enterLocal, [0, enterTravel], [10, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: enterEasing,
          });

          const yExit = interpolate(
            exitLocal,
            [exitTravelFrom, exitDur],
            [0, -14],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: exitEasing,
            },
          );

          const y = yEnter + yExit;

          const blurEnter = interpolate(enterLocal, [0, enterDur], [6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: enterEasing,
          });

          const blurExit = interpolate(exitLocal, [0, exitDur], [0, 8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: exitEasing,
          });

          const blur = blurEnter + blurExit;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                transformOrigin: "50% 55%",
                opacity,
                transform: `translateY(${y}px)`,
                filter: `blur(${blur}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    </div>
  );
}
