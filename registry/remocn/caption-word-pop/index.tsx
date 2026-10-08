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

export interface CaptionWordPopProps extends CaptionBaseProps {
  popScale?: number;
  shadow?: boolean;
}

const FADE_MS = 50;
const EXIT_MS = 180;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const POP_SPRING = { damping: 11, stiffness: 240, mass: 0.6 };

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionWordPop({
  captions,
  combineTokensWithinMilliseconds = 0,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 96,
  fontWeight = 800,
  color = "#ffffff",
  popScale = 0.6,
  shadow = true,
  className,
}: CaptionWordPopProps) {
  const { fps } = useVideoConfig();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const pop = spring({
    frame: (state.sinceStartMs / 1000) * fps,
    fps,
    config: POP_SPRING,
  });
  const fadeIn = state.previous
    ? 1
    : interpolate(state.sinceStartMs, [0, FADE_MS], [0, 1], clamp);
  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        clamp,
      )
    : 1;

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.1,
        textAlign: "center",
        opacity: Math.min(fadeIn, exit),
        transform: `scale(${popScale + (1 - popScale) * pop})`,
        textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.map(({ index, token }) => (
              <span key={index}>{token.text}</span>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
