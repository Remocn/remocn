"use client";

import { Fragment } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionWeightProps extends CaptionBaseProps {
  activeWeight?: number;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const RAMP_MS = 150;
const RELEASE_MS = 220;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const rampEasing = Easing.bezier(0.2, 0.8, 0.3, 1);
const releaseEasing = Easing.bezier(0.4, 0, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionWeight({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 400,
  activeWeight = 900,
  color = "#ffffff",
  shadow = true,
  className,
}: CaptionWeightProps) {
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

  const words = groupCaptionWords(state.tokens);
  const activeWord = words.findIndex((word) =>
    word.some(({ index }) => index === state.activeIndex),
  );

  const emphasis = (w: number): number => {
    if (activeWord < 0 || w > activeWord) return 0;
    const startMs = words[w][0].token.fromMs;
    const rise = interpolate(state.timeMs - startMs, [0, RAMP_MS], [0, 1], {
      ...clamp,
      easing: rampEasing,
    });
    if (w === activeWord) return rise;
    const releaseMs = words[w + 1][0].token.fromMs;
    const peak = interpolate(releaseMs - startMs, [0, RAMP_MS], [0, 1], {
      ...clamp,
      easing: rampEasing,
    });
    const release = interpolate(
      state.timeMs - releaseMs,
      [0, RELEASE_MS],
      [0, 1],
      { ...clamp, easing: releaseEasing },
    );
    return peak * (1 - release);
  };

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
      {words.map((word, w) => {
        const weight = fontWeight + (activeWeight - fontWeight) * emphasis(w);
        return (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span style={{ display: "inline-grid", whiteSpace: "nowrap" }}>
              <span
                aria-hidden
                style={{
                  gridArea: "1 / 1",
                  fontWeight: Math.max(fontWeight, activeWeight),
                  visibility: "hidden",
                }}
              >
                {captionWordText(word)}
              </span>
              <span
                style={{
                  gridArea: "1 / 1",
                  justifySelf: "center",
                  fontWeight: weight,
                  textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
                }}
              >
                {word.map(({ index, token }) => (
                  <span key={index}>{token.text}</span>
                ))}
              </span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
