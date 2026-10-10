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

export interface CaptionBlurInProps extends CaptionBaseProps {
  blur?: number;
  shadow?: boolean;
}

const EXIT_MS = 220;
const RESOLVE_MS = 220;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const resolveEasing = Easing.bezier(0.25, 0.6, 0.3, 1);

export function CaptionBlurIn({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  blur = 12,
  shadow = true,
  className,
}: CaptionBlurInProps) {
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
                  : interpolate(sinceMs, [0, RESOLVE_MS], [0, 1], {
                      easing: resolveEasing,
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
              const radius = (1 - p) * blur;
              return (
                <span
                  key={index}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    filter: radius > 0.01 ? `blur(${radius}px)` : undefined,
                    textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
                  }}
                >
                  {token.text}
                </span>
              );
            })}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
