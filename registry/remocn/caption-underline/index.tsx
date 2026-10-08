"use client";

import { Fragment } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
  useCaptionWordRects,
} from "@/lib/remocn/caption-core";

export interface CaptionUnderlineProps extends CaptionBaseProps {
  underlineColor?: string;
  thickness?: number;
  underlineOffset?: number;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const TRAVEL_MS = 120;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const travelEasing = Easing.bezier(0.3, 0, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function CaptionUnderline({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  underlineColor = "#facc15",
  thickness = 0.08,
  underlineOffset = 0.02,
  shadow = true,
  className,
}: CaptionUnderlineProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  const words = state ? groupCaptionWords(state.tokens) : [];
  const pageIndex = state ? state.pageIndex : -1;
  const { wordRef, rects } = useCaptionWordRects(pageIndex, words.length);

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

  const activeWord = words.findIndex((word) =>
    word.some(({ index }) => index === state.activeIndex),
  );
  const travel =
    activeWord >= 0
      ? interpolate(
          state.timeMs - words[activeWord][0].token.fromMs,
          [0, TRAVEL_MS],
          [0, 1],
          { ...clamp, easing: travelEasing },
        )
      : 0;

  const target = rects && activeWord >= 0 ? rects[activeWord] : null;
  const origin = rects && activeWord > 0 ? rects[activeWord - 1] : null;
  const barHeight = thickness * fontSize;
  const gap = underlineOffset * fontSize;
  const bar = target
    ? origin
      ? {
          left: mix(origin.left, target.left, travel),
          top: mix(
            origin.top + origin.height,
            target.top + target.height,
            travel,
          ),
          width: mix(origin.width, target.width, travel),
          opacity: 1,
        }
      : {
          left: target.left,
          top: target.top + target.height,
          width: target.width * travel,
          opacity: travel,
        }
    : null;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {words.map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span
            ref={wordRef(w)}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "nowrap",
              textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
            }}
          >
            {word.map(({ index, token }) => (
              <span key={index}>{token.text}</span>
            ))}
          </span>
        </Fragment>
      ))}
      {bar && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: bar.left,
            top: bar.top + gap,
            width: bar.width,
            height: barHeight,
            borderRadius: barHeight / 2,
            background: underlineColor,
            opacity: bar.opacity,
          }}
        />
      )}
    </div>
  );
}
