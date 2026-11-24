"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type MicroScaleFadeElementId,
  microScaleFadeTimeline,
} from "./timeline";

export interface MicroScaleFadeProps {
  text: string;
  scaleFrom?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the fade, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<MicroScaleFadeElementId>;
}

export function MicroScaleFade(props: MicroScaleFadeProps) {
  const {
    text,
    scaleFrom = 0.96,
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
    microScaleFadeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const enter = tl.get("text");
  const easing = Easing.bezier(0.32, 0.72, 0, 1);

  const opacity = interpolate(frame, [enter.start, enter.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

  const scale = interpolate(frame, [enter.start, enter.end], [scaleFrom, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
  const moving = frame > enter.start && frame < enter.end && scale !== 1;

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
          transform: `scale(${scale})${glide(moving)}`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
