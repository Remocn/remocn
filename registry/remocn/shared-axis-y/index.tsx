"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type SharedAxisYElementId, sharedAxisYTimeline } from "./timeline";

export interface SharedAxisYProps {
  fromText: string;
  toText: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SharedAxisYElementId>;
}

export function SharedAxisY(props: SharedAxisYProps) {
  const {
    fromText,
    toText,
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
    sharedAxisYTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const fromWords = fromText.split(" ");
  const toWords = toText.split(" ");

  const fontStack =
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight,
            color,
            letterSpacing: "-0.03em",
            fontFamily: fontStack,
          }}
        >
          {fromWords.map((word, i) => {
            const out = tl.get(`out:${i}`);
            const local = frame - out.start;
            const opacity = interpolate(local, [0, out.length], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.step1,
            });
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

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight,
            color,
            letterSpacing: "-0.03em",
            fontFamily: fontStack,
          }}
        >
          {toWords.map((word, j) => {
            const arrival = tl.get(`in:${j}`);
            const local = frame - arrival.start;
            const opacity = interpolate(local, [0, arrival.length], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.step1,
            });
            return (
              <span
                key={j}
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
    </div>
  );
}
