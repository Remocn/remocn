"use client";

import { Fragment } from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
  useCaptionWordRects,
} from "@/lib/remocn/caption-core";

export interface CaptionHighlightBoxProps extends CaptionBaseProps {
  activeColor?: string;
  boxColor?: string;
  boxRadius?: number;
  boxPadding?: number;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const TRAVEL_MS = 120;

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const travelEasing = Easing.bezier(0.3, 0, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function legibilityShadow(strength: number): string | undefined {
  if (strength <= 0) return undefined;
  return `0 2px 3px rgba(0, 0, 0, ${0.5 * strength}), 0 4px 16px rgba(0, 0, 0, ${0.35 * strength})`;
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function CaptionHighlightBox({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  activeColor = "#0a0a0a",
  boxColor = "#facc15",
  boxRadius = 0.16,
  boxPadding = 0.14,
  shadow = true,
  className,
}: CaptionHighlightBoxProps) {
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
  const padX = boxPadding * fontSize;
  const padY = boxPadding * 0.3 * fontSize;
  const box = target
    ? {
        left: origin ? mix(origin.left, target.left, travel) : target.left,
        top: origin ? mix(origin.top, target.top, travel) : target.top,
        width: origin ? mix(origin.width, target.width, travel) : target.width,
        height: origin
          ? mix(origin.height, target.height, travel)
          : target.height,
        opacity: origin ? 1 : travel,
      }
    : null;

  const coverage = (w: number): number => {
    if (!box) return 0;
    if (w === activeWord) {
      return origin ? interpolate(travel, [0.3, 0.8], [0, 1], clamp) : travel;
    }
    if (origin && w === activeWord - 1) {
      return 1 - interpolate(travel, [0.2, 0.7], [0, 1], clamp);
    }
    return 0;
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        isolation: "isolate",
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {box && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: box.left - padX,
            top: box.top - padY,
            width: box.width + padX * 2,
            height: box.height + padY * 2,
            borderRadius: boxRadius * fontSize,
            background: boxColor,
            opacity: box.opacity,
          }}
        />
      )}
      {words.map((word, w) => {
        const covered = coverage(w);
        return (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span
              ref={wordRef(w)}
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
                color: interpolateColors(covered, [0, 1], [color, activeColor]),
                textShadow: legibilityShadow(shadow ? 1 - covered : 0),
              }}
            >
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
