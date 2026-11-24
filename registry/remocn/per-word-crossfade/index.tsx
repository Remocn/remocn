"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type PerWordCrossfadeElementId,
  perWordCrossfadeTimeline,
} from "./timeline";

export interface PerWordCrossfadeProps {
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
  timing?: Timing<PerWordCrossfadeElementId>;
}

// Chrome parks a glyph raster on a whole pixel vertically for as long as the
// matrix is axis-aligned, so text under a slow transform clicks along pixel by
// pixel. Each word's transform is marked so it leans off that grid while it
// moves.
const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function PerWordCrossfade(props: PerWordCrossfadeProps) {
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
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    perWordCrossfadeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const fromWords = fromText.split(" ");
  const toWords = toText.split(" ");

  const enterEasing = Easing.bezier(0.16, 1, 0.3, 1);
  const exitEasing = Easing.bezier(0.7, 0, 0.84, 0);

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
              easing: exitEasing,
            });
            const y = interpolate(
              local,
              [out.beat("travelFrom"), out.length],
              [0, -6],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: exitEasing,
              },
            );
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: "0.25em",
                  transformOrigin: "50% 55%",
                  opacity,
                  transform: `translateY(${y}px)${glide(midway(y / -6))}`,
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
              easing: enterEasing,
            });
            const y = interpolate(local, [0, arrival.beat("travel")], [8, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: enterEasing,
            });
            return (
              <span
                key={j}
                style={{
                  display: "inline-block",
                  marginRight: "0.25em",
                  transformOrigin: "50% 55%",
                  opacity,
                  transform: `translateY(${y}px)${glide(midway(1 - y / 8))}`,
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
