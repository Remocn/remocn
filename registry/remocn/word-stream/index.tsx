"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

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
}

interface PhraseSchedule {
  words: string[];
  start: number;
  exitStart: number;
  last: boolean;
}

const REVEAL_FRAMES = 3;
const ENTRY_FRAMES = 8;
const RUN_OUT_FRAMES = 5;
const SWAP_OVERLAP = 0;

export function wordStreamLength(
  text: string,
  wordGap = 6,
  hold = 18,
): number {
  const schedule = schedulePhrases(text, wordGap, hold);
  const finalPhrase = schedule[schedule.length - 1];
  if (!finalPhrase) return 0;
  return (
    finalPhrase.start +
    (finalPhrase.words.length - 1) * wordGap +
    REVEAL_FRAMES
  );
}

function schedulePhrases(
  text: string,
  wordGap: number,
  hold: number,
): PhraseSchedule[] {
  const phrases = text
    .split("|")
    .map((phrase) => phrase.trim())
    .filter(Boolean);
  let cursor = 0;
  return phrases.map((phrase, i) => {
    const words = phrase.split(/\s+/);
    const start = cursor;
    const complete = start + (words.length - 1) * wordGap + REVEAL_FRAMES;
    const exitStart = complete + hold;
    cursor = exitStart + SWAP_OVERLAP;
    return { words, start, exitStart, last: i === phrases.length - 1 };
  });
}

const revealEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const entryEasing = Easing.bezier(0.2, 0.8, 0.3, 1);
const runOutEasing = Easing.bezier(0.7, 0, 0.9, 0.4);

export function WordStream({
  text,
  fontSize = 72,
  color = "#171717",
  fontWeight = 400,
  wordGap = 6,
  hold = 18,
  drift = 2,
  speed = 1,
  className,
}: WordStreamProps) {
  const frame = useCurrentFrame() * speed;

  const schedule = schedulePhrases(text, wordGap, hold);

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
          [phrase.start, phrase.start + ENTRY_FRAMES],
          [scale * 30, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: entryEasing,
          },
        );
        const crawlX =
          crawl * (life / 2 - (Math.min(frame, phrase.exitStart) - phrase.start));
        const runOutX = phrase.last
          ? 0
          : interpolate(
              frame,
              [phrase.exitStart - RUN_OUT_FRAMES, phrase.exitStart],
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
                const revealAt = phrase.start + j * wordGap;

                const opacity = interpolate(
                  frame,
                  [revealAt, revealAt + REVEAL_FRAMES],
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
