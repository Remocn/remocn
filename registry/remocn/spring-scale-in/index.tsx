"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type SpringScaleInElementId, springScaleInTimeline } from "./timeline";

export interface SpringScaleInProps {
  text: string;
  staggerDelay?: number;
  scaleFrom?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SpringScaleInElementId>;
}

export function SpringScaleIn(props: SpringScaleInProps) {
  const {
    text,
    scaleFrom = 0.7,
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
    springScaleInTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const glide = useGlide();

  const words = text.split(" ");
  const easing = Easing.bezier(0.34, 1.56, 0.64, 1);

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
          const item = tl.get(`word:${i}`);
          const local = frame - item.start;
          const wordDurationFrames = item.length;
          const opacity = interpolate(local, [0, wordDurationFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          });
          const scale = interpolate(
            local,
            [0, wordDurationFrames],
            [scaleFrom, 1],
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
                transformOrigin: "50% 50%",
                opacity,
                // The window, not the value: the ease overshoots past 1.
                transform: `scale(${scale})${glide(local > 0 && local < wordDurationFrames)}`,
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
