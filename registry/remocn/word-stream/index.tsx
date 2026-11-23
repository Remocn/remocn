"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  HOLD,
  REVEAL_FRAMES,
  schedulePhrases,
  WORD_GAP,
  type WordStreamElementId,
  wordStreamTimeline,
} from "./timeline";

export interface WordStreamProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  wordGap?: number;
  hold?: number;
  drift?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single phrases, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<WordStreamElementId>;
}

export function wordStreamLength(
  text: string,
  wordGap = WORD_GAP,
  hold = HOLD,
): number {
  const schedule = schedulePhrases(text, wordGap, hold);
  const finalPhrase = schedule[schedule.length - 1];
  if (!finalPhrase) return 0;
  return (
    finalPhrase.start + (finalPhrase.words.length - 1) * wordGap + REVEAL_FRAMES
  );
}

const revealEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const entryEasing = Easing.bezier(0.2, 0.8, 0.3, 1);
const runOutEasing = Easing.bezier(0.7, 0, 0.9, 0.4);

export function WordStream(props: WordStreamProps) {
  const {
    fontSize = 72,
    color = "#171717",
    fontWeight = 400,
    drift = 2,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    wordStreamTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const schedule = tl.elements.map((phrase, i) => ({
    words: phrase.label.split(" "),
    start: phrase.start,
    exitStart: phrase.end,
    last: i === tl.elements.length - 1,
    wordGap: phrase.beat("wordGap"),
    reveal: phrase.beat("reveal"),
    entry: phrase.beat("entry"),
    runOut: phrase.beat("runOut"),
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
      }}
    >
      {schedule.map((phrase, i) => {
        if (frame < phrase.start) return null;
        if (!phrase.last && frame >= phrase.exitStart) return null;

        const scale = fontSize / 72;
        const crawl = scale * drift;
        const life = phrase.exitStart - phrase.start;

        const entryX = interpolate(
          frame,
          [phrase.start, phrase.start + phrase.entry],
          [scale * 30, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: entryEasing,
          },
        );
        const crawlX =
          crawl *
          (life / 2 - (Math.min(frame, phrase.exitStart) - phrase.start));
        const runOutX = phrase.last
          ? 0
          : interpolate(
              frame,
              [phrase.exitStart - phrase.runOut, phrase.exitStart],
              [0, -scale * 80],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: runOutEasing,
              },
            );
        const x = entryX + crawlX + runOutX;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              translate: `${x}px 0`,
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
              {phrase.words.map((word, j) => {
                const revealAt = phrase.start + j * phrase.wordGap;

                const opacity = interpolate(
                  frame,
                  [revealAt, revealAt + phrase.reveal],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: revealEasing,
                  },
                );

                return (
                  <span
                    key={j}
                    style={{
                      display: "inline-block",
                      whiteSpace: "pre",
                      marginRight:
                        j < phrase.words.length - 1 ? "0.28em" : undefined,
                      opacity,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
