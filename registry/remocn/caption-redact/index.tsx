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

export interface CaptionRedactProps extends CaptionBaseProps {
  barColor?: string;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const MIN_REVEAL_MS = 180;
const OVERHANG_EM = 0.06;
const RADIUS_EM = 0.06;
const BAR_TOP = "14%";
const BAR_BOTTOM = "6%";
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const revealEasing = Easing.inOut(Easing.cubic);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionRedact({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  barColor = "#0a0a0a",
  shadow = true,
  className,
}: CaptionRedactProps) {
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
    { ...clamp, easing: enterEasing },
  );
  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        clamp,
      )
    : 1;
  const textShadow = shadow ? LEGIBILITY_SHADOW : undefined;

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
        const fromMs = word[0].token.fromMs;
        const toMs = word[word.length - 1].token.toMs;
        const revealMs = Math.max(toMs - fromMs, MIN_REVEAL_MS);
        const revealed = interpolate(
          state.timeMs - fromMs,
          [0, revealMs],
          [0, 1],
          { ...clamp, easing: revealEasing },
        );
        return (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  textShadow,
                  visibility: revealed > 0 ? "visible" : "hidden",
                  clipPath:
                    revealed >= 1
                      ? undefined
                      : `inset(-50% ${(1 - revealed) * 100}% -50% -50%)`,
                }}
              >
                {captionWordText(word)}
              </span>
              {revealed < 1 && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: `-${OVERHANG_EM}em`,
                    right: `-${OVERHANG_EM}em`,
                    top: BAR_TOP,
                    bottom: BAR_BOTTOM,
                    background: barColor,
                    borderRadius: `${RADIUS_EM}em`,
                    transformOrigin: "right center",
                    transform: `scaleX(${1 - revealed})`,
                  }}
                />
              )}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
