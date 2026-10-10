"use client";

import { Fragment } from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionOutlineProps extends CaptionBaseProps {
  activeColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const SWITCH_MS = 70;

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionOutline({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  activeColor = "#facc15",
  strokeColor = "#000000",
  strokeWidth = 0.12,
  className,
}: CaptionOutlineProps) {
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
  const activeSince =
    activeWord >= 0 ? state.timeMs - words[activeWord][0].token.fromMs : 0;
  const highlight = (w: number): number => {
    if (w === activeWord) {
      return interpolate(activeSince, [0, SWITCH_MS], [0, 1], clamp);
    }
    if (w === activeWord - 1) {
      return 1 - interpolate(activeSince, [0, SWITCH_MS], [0, 1], clamp);
    }
    return 0;
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
        WebkitTextStroke: `${strokeWidth * 2}em ${strokeColor}`,
        paintOrder: "stroke fill",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {words.map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              color: interpolateColors(
                highlight(w),
                [0, 1],
                [color, activeColor],
              ),
            }}
          >
            {captionWordText(word)}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
