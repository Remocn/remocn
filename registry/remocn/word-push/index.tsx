"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  ACCEL,
  revealFrame,
  SLIDE_FRAMES,
  WORD_GAP,
  type WordPushElementId,
  wordPushTimeline,
} from "./timeline";

export interface WordPushProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  wordGap?: number;
  accel?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<WordPushElementId>;
}

const OVERSHOOT_EM = 0.5;
const CHAR_WIDTH_EM = 0.5;
const SPACE_WIDTH_EM = 0.22;

export function wordPushLength(
  text: string,
  wordGap = WORD_GAP,
  accel = ACCEL,
): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return (
    Math.ceil(revealFrame(words.length - 1, wordGap, accel)) + SLIDE_FRAMES
  );
}

const pushEasing = Easing.out(Easing.cubic);
const driveEasing = Easing.bezier(0.15, 0.7, 0.25, 1);

export function WordPush(props: WordPushProps) {
  const {
    text,
    fontSize = 72,
    color = "#171717",
    fontWeight = 400,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    wordPushTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const words = text.trim().split(/\s+/).filter(Boolean);

  // The line drives in with the first word.
  const first = tl.get("word:0");
  let lineX = interpolate(
    frame,
    [first.start, first.end],
    [-OVERSHOOT_EM * fontSize, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: driveEasing,
    },
  );
  for (let j = 1; j < words.length; j++) {
    const wordWidth =
      (words[j].length * CHAR_WIDTH_EM + SPACE_WIDTH_EM) * fontSize;
    const word = tl.get(`word:${j}`);
    const pushAt = word.start + word.beat("push");
    const pushed = interpolate(frame, [pushAt, pushAt + word.length], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: pushEasing,
    });
    lineX += (wordWidth / 2) * (1 - pushed);
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
        translate: `${lineX}px 0`,
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.02em",
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        {words.map((word, j) => {
          const { start, end, beat } = tl.get(`word:${j}`);

          const opacity = interpolate(
            frame,
            [start, start + beat("reveal")],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const driven =
            j === 0
              ? 1
              : interpolate(frame, [start, end], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: driveEasing,
                });

          return (
            <span
              key={j}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                marginRight: j < words.length - 1 ? "0.22em" : undefined,
                opacity,
                translate: `${OVERSHOOT_EM * fontSize * (1 - driven)}px 0`,
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
