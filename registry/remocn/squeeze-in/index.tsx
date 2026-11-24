"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  SQUEEZE_FRAMES,
  type SqueezeInElementId,
  STAGGER,
  squeezeInTimeline,
} from "./timeline";

export interface SqueezeInProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  stagger?: number;
  squeeze?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the wipe and the squeeze, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SqueezeInElementId>;
}

export function squeezeInLength(text: string, stagger = STAGGER): number {
  const chars = Array.from(text);
  if (chars.length === 0) return 0;
  return chars.length * stagger + SQUEEZE_FRAMES;
}

const squeezeEasing = Easing.out(Easing.cubic);

export function SqueezeIn(props: SqueezeInProps) {
  const {
    text,
    fontSize = 72,
    color = "#171717",
    fontWeight = 400,
    squeeze = 0.03,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    squeezeInTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const chars = Array.from(text);
  const reveal = tl.get("reveal");
  const closing = tl.get("squeeze");

  const squeezeProgress = interpolate(
    frame,
    [closing.start, closing.end],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: squeezeEasing,
    },
  );

  const gap = squeeze * fontSize * (1 - squeezeProgress);
  const wipe = interpolate(frame, [reveal.start, reveal.end], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const anchorX =
    (-squeeze * fontSize * squeezeProgress * (chars.length - 1)) / 2;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          translate: `${anchorX}px 0`,
          clipPath: `inset(-0.2em ${wipe}% -0.25em -0.1em)`,
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        {chars.map((char, j) => (
          <span
            key={j}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              marginRight: j < chars.length - 1 ? gap : undefined,
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}
