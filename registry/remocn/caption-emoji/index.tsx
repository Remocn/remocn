"use client";

import { Fragment } from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  normalizeCaptionWord,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionEmojiProps extends CaptionBaseProps {
  emoji?: Record<string, string>;
  emojiSize?: number;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const POP_SPRING = { damping: 9, stiffness: 180, mass: 0.6 };

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionEmoji({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  emoji = {},
  emojiSize = 0.9,
  shadow = true,
  className,
}: CaptionEmojiProps) {
  const { fps } = useVideoConfig();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const enter = interpolate(
    state.previous ? ENTER_MS : state.sinceStartMs,
    [0, ENTER_MS],
    [0, 1],
    {
      ...clamp,
      easing: enterEasing,
    },
  );
  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        clamp,
      )
    : 1;

  const lookup = new Map(
    Object.entries(emoji).map(([word, glyph]) => [
      normalizeCaptionWord(word),
      glyph,
    ]),
  );

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => {
        const first = word[0].token;
        const glyph = lookup.get(normalizeCaptionWord(captionWordText(word)));
        const pop =
          glyph && first.status !== "upcoming"
            ? spring({
                frame: ((state.timeMs - first.fromMs) / 1000) * fps,
                fps,
                config: POP_SPRING,
              })
            : 0;
        return (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
                textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
              }}
            >
              {glyph && pop > 0 && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "92%",
                    fontSize: `${emojiSize}em`,
                    lineHeight: 1,
                    textShadow: "none",
                    transformOrigin: "50% 100%",
                    transform: `translateX(-50%) rotate(${14 - 20 * pop}deg) scale(${pop})`,
                  }}
                >
                  {glyph}
                </span>
              )}
              {word.map(({ index, token }) => (
                <span key={index}>{token.text}</span>
              ))}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
