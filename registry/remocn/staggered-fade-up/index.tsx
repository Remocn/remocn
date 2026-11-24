"use client";

import { interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type StaggeredFadeUpElementId,
  staggeredFadeUpTimeline,
} from "./timeline";

export interface StaggeredFadeUpProps {
  text: string;
  staggerDelay?: number;
  distance?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<StaggeredFadeUpElementId>;
}

export function StaggeredFadeUp(props: StaggeredFadeUpProps) {
  const {
    text,
    distance = 20,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const glide = useGlide();
  const tl = useTimeline(
    staggeredFadeUpTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const words = text.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
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
          const { start, length } = tl.get(`word:${i}`);
          const local = frame - start;
          const opacity = interpolate(local, [0, length], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(local, [0, length], [distance, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                opacity,
                transform: `translateY(${y}px)${glide(local > 0 && local < length)}`,
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
