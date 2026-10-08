"use client";

import { type CSSProperties, Fragment } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionLabelMakerProps extends CaptionBaseProps {
  tapeColor?: string;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const PRESS_MS = 50;
const PRESS_SCALE = 0.92;
const TILT_DEG = -1.5;
const PAD_Y = 0.16;
const LEAD_EM = 0.42;
const RADIUS = 0.16;
const EMBOSS = "0 1px 0 rgba(0, 0, 0, 0.55)";
const RELIEF =
  "inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(0, 0, 0, 0.5)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function revealedCount(
  count: number,
  fromMs: number,
  toMs: number,
  timeMs: number,
): number {
  if (timeMs < fromMs) return 0;
  const duration = Math.max(toMs - fromMs, 1);
  return Math.min(
    count,
    Math.floor(((timeMs - fromMs) / duration) * count) + 1,
  );
}

export function CaptionLabelMaker({
  captions,
  combineTokensWithinMilliseconds = 1000,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  tapeColor = "#18181b",
  className,
}: CaptionLabelMakerProps) {
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

  const segment: CSSProperties = {
    display: "inline-block",
    verticalAlign: "top",
    background: tapeColor,
    paddingBlock: `${PAD_Y}em`,
    paddingRight: 1,
    marginRight: -1,
    boxShadow: RELIEF,
  };

  const words = groupCaptionWords(state.tokens).map((word) => {
    const chars = Array.from(captionWordText(word));
    const fromMs = word[0].token.fromMs;
    const toMs = word[word.length - 1].token.toMs;
    return {
      key: `${state.pageIndex}-${word[0].index}`,
      chars,
      fromMs,
      toMs,
      revealed: revealedCount(chars.length, fromMs, toMs, state.timeMs),
    };
  });
  const last = words[words.length - 1];
  const finished = last !== undefined && last.revealed === last.chars.length;

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.1,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      <span
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          transform: `rotate(${TILT_DEG}deg)`,
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))",
        }}
      >
        <span
          style={{
            ...segment,
            width: `${LEAD_EM}em`,
            borderRadius: `${RADIUS}em 0 0 ${RADIUS}em`,
          }}
        >
          {"\u00a0"}
        </span>
        {words.map((word, w) => {
          const duration = Math.max(word.toMs - word.fromMs, 1);
          return (
            <Fragment key={word.key}>
              {w > 0 && (
                <span
                  style={{
                    ...segment,
                    visibility: word.revealed > 0 ? "visible" : "hidden",
                  }}
                >
                  {"\u00a0"}
                </span>
              )}
              {word.chars.map((char, c) => {
                const pressedAt =
                  word.fromMs + (c / word.chars.length) * duration;
                const press = interpolate(
                  state.timeMs - pressedAt,
                  [0, PRESS_MS],
                  [PRESS_SCALE, 1],
                  clamp,
                );
                return (
                  <span
                    key={c}
                    style={{
                      ...segment,
                      visibility: c < word.revealed ? "visible" : "hidden",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: `scale(${press})`,
                        textShadow: EMBOSS,
                      }}
                    >
                      {char}
                    </span>
                  </span>
                );
              })}
            </Fragment>
          );
        })}
        <span
          style={{
            ...segment,
            width: `${LEAD_EM}em`,
            borderRadius: `0 ${RADIUS}em ${RADIUS}em 0`,
            visibility: finished ? "visible" : "hidden",
          }}
        >
          {"\u00a0"}
        </span>
      </span>
    </div>
  );
}
