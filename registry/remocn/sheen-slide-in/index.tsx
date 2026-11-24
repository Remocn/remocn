"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  EXIT_FRAMES,
  type SheenSlideInElementId,
  sheenSlideInTimeline,
} from "./timeline";

export interface SheenSlideInProps {
  text: string;
  exitAt?: number;
  fontSize?: number;
  baseColor?: string;
  sheenColor?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the slide, the sheen and the exit, by the ids
   * in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SheenSlideInElementId>;
}

const SETTLE_AMP_EM = 1.8;
const CREEP_AMP_EM = 0.28;
const EXIT_SCALE = 0.9;

export function sheenSlideInLength(exitAt = 60): number {
  return exitAt + EXIT_FRAMES;
}

function travelEm(frame: number, settleTau: number, creepTau: number): number {
  return (
    SETTLE_AMP_EM * Math.exp(-frame / settleTau) +
    CREEP_AMP_EM * Math.exp(-frame / creepTau)
  );
}

const exitEasing = Easing.out(Easing.quad);
const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function SheenSlideIn(props: SheenSlideInProps) {
  const {
    text,
    fontSize = 72,
    baseColor = "#18181b",
    sheenColor = "#4f8ef7",
    fontWeight = 400,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    sheenSlideInTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const enter = tl.get("enter");
  const sheen = tl.get("sheen");
  const leave = tl.get("exit");

  const x =
    fontSize *
    travelEm(frame - enter.start, enter.beat("settle"), enter.beat("creep"));

  const exit = interpolate(frame, [leave.start, leave.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const opacity = interpolate(frame, [enter.start, enter.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sheenOutAt = sheen.start + sheen.beat("outAt");
  const sheenOpacity =
    interpolate(frame, [sheen.start, sheen.start + sheen.beat("in")], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [sheenOutAt, sheenOutAt + sheen.beat("out")], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const sheenPosition = interpolate(
    frame,
    [sheen.start, sheen.start + sheen.beat("sweep")],
    [160, -60],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    },
  );

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    margin: 0,
    fontFamily:
      "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
  };

  if (exit >= 1) {
    return (
      <div
        style={{ position: "absolute", inset: 0, background: "transparent" }}
      />
    );
  }

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
      <div
        style={{
          position: "relative",
          display: "inline-block",
          opacity,
          // The slide is horizontal and needs no mark of its own; the exit
          // scale carries the text vertically.
          transform: `translate(${x}px, 0px) scale(${1 - (1 - EXIT_SCALE) * exit})${glide(midway(exit))}`,
        }}
      >
        <span className={className} style={{ ...textStyle, color: baseColor }}>
          {text}
        </span>
        <span
          aria-hidden
          style={{
            ...textStyle,
            position: "absolute",
            inset: 0,
            color: "transparent",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(100deg, transparent 25%, ${sheenColor} 50%, transparent 75%)`,
            backgroundSize: "250% 100%",
            backgroundPosition: `${sheenPosition}% 50%`,
            opacity: sheenOpacity,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
