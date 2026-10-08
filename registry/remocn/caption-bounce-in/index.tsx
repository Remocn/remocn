"use client";

import { Fragment } from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionBounceInProps extends CaptionBaseProps {
  bounce?: number;
  shadow?: boolean;
}

const EXIT_MS = 220;
const FADE_IN_MS = 90;
const DROP_EM = 0.35;
const START_SCALE = 0.7;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

export function CaptionBounceIn({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  bounce = 0.6,
  shadow = true,
  className,
}: CaptionBounceInProps) {
  const { fps } = useVideoConfig();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const damping = interpolate(bounce, [0, 1], [22, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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
              const arrived = sinceMs >= 0;
              const p = arrived
                ? spring({
                    frame: (sinceMs / 1000) * fps,
                    fps,
                    config: { damping, stiffness: 220, mass: 0.6 },
                  })
                : 0;
              const opacity = arrived
                ? interpolate(sinceMs, [0, FADE_IN_MS], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : 0;
              return (
                <span
                  key={index}
                  style={{
                    display: "inline-block",
                    opacity,
                    transform: `translateY(${(1 - p) * DROP_EM}em) scale(${
                      START_SCALE + (1 - START_SCALE) * p
                    })`,
                    transformOrigin: "50% 80%",
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
