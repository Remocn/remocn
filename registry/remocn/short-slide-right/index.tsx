"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type ShortSlideRightElementId,
  shortSlideRightTimeline,
} from "./timeline";

export interface ShortSlideRightProps {
  text: string;
  distance?: number;
  staggerDelay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the slide and single words, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<ShortSlideRightElementId>;
}

export function ShortSlideRight(props: ShortSlideRightProps) {
  const {
    text,
    distance = 24,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    shortSlideRightTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const words = text.split(" ");

  const slide = tl.get("slide");
  const easing = Easing.bezier(0.2, 0.8, 0.2, 1);

  const x = interpolate(
    frame,
    [slide.start, slide.start + slide.beat("travel")],
    [-distance, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    },
  );

  const blurVal = interpolate(frame, [slide.start, slide.end], [1.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
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
          translate: `${x}px`,
          filter: `blur(${blurVal}px)`,
        }}
      >
        {words.map((word, i) => {
          const fade = tl.get(`word:${i}`);
          const opacity = interpolate(
            frame - fade.start,
            [0, fade.length],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing,
            },
          );
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                opacity,
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
