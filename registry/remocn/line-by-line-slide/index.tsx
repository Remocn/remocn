"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type LineByLineSlideElementId,
  lineByLineSlideTimeline,
} from "./timeline";

export interface LineByLineSlideProps {
  text: string;
  distance?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single lines and their exits, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<LineByLineSlideElementId>;
}

export function LineByLineSlide(props: LineByLineSlideProps) {
  const {
    text,
    distance = 48,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  // The exit is timed against the composition length without `speed`.
  const tl = useTimeline(
    lineByLineSlideTimeline,
    props,
    durationInFrames,
    timing,
  );

  const lines = text.split("\n");

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
          lineHeight: 1.1,
          textAlign: "left",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {lines.map((line, i) => {
          const enter = tl.get(`line:${i}`);
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

          const xEnter = interpolate(
            enterLocal,
            [0, enterTravel],
            [-distance, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: enterEasing,
            },
          );

          const xExit = interpolate(
            exitLocal,
            [exitTravelFrom, exitDur],
            [0, distance],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: exitEasing,
            },
          );

          const x = xEnter + xExit;

          return (
            <span
              key={i}
              style={{
                display: "block",
                transformOrigin: "0% 50%",
                opacity,
                translate: `${x}px`,
              }}
            >
              {line}
            </span>
          );
        })}
      </span>
    </div>
  );
}
