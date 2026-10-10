"use client";

import { Fragment } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionRiseProps extends CaptionBaseProps {
  shadow?: boolean;
}

const EXIT_MS = 220;
const RISE_MS = 260;
const START_EM = 1.6;
const CLIP = "inset(-0.2em -0.6em -0.35em -0.6em)";
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const riseEasing = Easing.bezier(0.16, 1, 0.3, 1);

export function CaptionRise({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  shadow = true,
  className,
}: CaptionRiseProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      )
    : 1;

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: exit,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.map(({ index, token }) => {
              const sinceMs = state.timeMs - token.fromMs;
              const p =
                sinceMs < 0
                  ? 0
                  : interpolate(sinceMs, [0, RISE_MS], [0, 1], {
                      easing: riseEasing,
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
              return (
                <span
                  key={index}
                  style={{
                    display: "inline-block",
                    clipPath: CLIP,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      opacity: sinceMs < 0 ? 0 : 1,
                      transform: `translateY(${(1 - p) * START_EM}em)`,
                      textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
                    }}
                  >
                    {token.text}
                  </span>
                </span>
              );
            })}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
