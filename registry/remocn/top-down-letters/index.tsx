"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type TopDownLettersElementId,
  topDownLettersTimeline,
} from "./timeline";

export interface TopDownLettersProps {
  text: string;
  staggerDelay?: number;
  distance?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single letters, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<TopDownLettersElementId>;
}

export function TopDownLetters(props: TopDownLettersProps) {
  const {
    text,
    distance = 46,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    topDownLettersTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const chars = Array.from(text);

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
          letterSpacing: "-0.05em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {chars.map((char, i) => {
          const letter = tl.get(`char:${i}`);
          const local = frame - letter.start;
          const charDurationFrames = letter.length;
          const charTravelFrames = letter.beat("travel");
          const easing = Easing.bezier(0.18, 1, 0.32, 1);
          const opacity = interpolate(local, [0, charDurationFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          });
          const y = interpolate(local, [0, charTravelFrames], [-distance, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                backfaceVisibility: "hidden",
                transformOrigin: "50% 55%",
                opacity,
                transform: `translateY(${y}px)${glide(local > 0 && local < charTravelFrames)}`,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
