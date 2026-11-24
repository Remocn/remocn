"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type BlurOutUpElementId, blurOutUpTimeline } from "./timeline";

export interface BlurOutUpProps {
  text: string;
  staggerDelay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words and their exits, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<BlurOutUpElementId>;
}

export function BlurOutUp(props: BlurOutUpProps) {
  const {
    text,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const glide = useGlide();
  const { durationInFrames } = useSceneConfig();
  // The exit is timed against the composition length without `speed`.
  const tl = useTimeline(blurOutUpTimeline, props, durationInFrames, timing);

  const words = text.split(" ");

  const enterEasing = Easing.bezier(0.22, 1, 0.36, 1);
  const exitEasing = Easing.bezier(0.64, 0, 0.78, 0);

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
          const enter = tl.get(`word:${i}`);
          const exit = tl.get(`exit:${i}`);
          const enterLocal = frame - enter.start;
          const exitLocal = frame - exit.start;
          const enterDur = enter.length;
          const enterTravel = enter.beat("travel");
          const exitDur = exit.length;
          const exitTravelFrom = exit.beat("travelFrom");

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
          const moving =
            (yEnter > 0 && yEnter < 10) || (yExit < 0 && yExit > -14);

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
                transform: `translateY(${y}px)${glide(moving)}`,
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
