"use client";

import { Fragment } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  createKeywordMatcher,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionMarkerProps extends CaptionBaseProps {
  keywords?: string[];
  markerColor?: string;
  markerTextColor?: string;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const MIN_DRAW_MS = 220;
const PAD_EM = 0.12;
const RADIUS_EM = 0.18;
const TILT_DEG = -1;
const BAND_TOP = "12%";
const BAND_BOTTOM = "2%";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const drawEasing = Easing.bezier(0.25, 1, 0.5, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function legibilityShadow(strength: number): string | undefined {
  if (strength <= 0) return undefined;
  return `0 2px 3px rgba(0, 0, 0, ${0.5 * strength}), 0 4px 16px rgba(0, 0, 0, ${0.35 * strength})`;
}

export function CaptionMarker({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  keywords,
  markerColor = "#facc15",
  markerTextColor = "#0a0a0a",
  shadow = true,
  className,
}: CaptionMarkerProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const isKeyword = createKeywordMatcher(keywords);
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
  const baseShadow = shadow ? 1 : 0;

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
        const key = `${state.pageIndex}-${word[0].index}`;
        const text = word.map(({ index, token }) => (
          <span key={index}>{token.text}</span>
        ));
        if (!isKeyword(captionWordText(word))) {
          return (
            <Fragment key={key}>
              {w > 0 && " "}
              <span
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  textShadow: legibilityShadow(baseShadow),
                }}
              >
                {text}
              </span>
            </Fragment>
          );
        }
        const fromMs = word[0].token.fromMs;
        const toMs = word[word.length - 1].token.toMs;
        const drawMs = Math.max(toMs - fromMs, MIN_DRAW_MS);
        const drawn = interpolate(state.timeMs - fromMs, [0, drawMs], [0, 1], {
          ...clamp,
          easing: drawEasing,
        });
        const hidden = `${(1 - drawn) * 100}%`;
        return (
          <Fragment key={key}>
            {w > 0 && " "}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
                padding: `0 ${PAD_EM}em`,
                margin: `0 -${PAD_EM}em`,
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: BAND_TOP,
                  bottom: BAND_BOTTOM,
                  background: markerColor,
                  borderRadius: `${RADIUS_EM}em`,
                  transform: `rotate(${TILT_DEG}deg)`,
                  clipPath: `inset(0 ${hidden} 0 0 round ${RADIUS_EM}em)`,
                }}
              />
              <span
                style={{
                  position: "relative",
                  textShadow: legibilityShadow(baseShadow * (1 - drawn)),
                }}
              >
                {text}
              </span>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: `0 ${PAD_EM}em`,
                  color: markerTextColor,
                  clipPath: `inset(${BAND_TOP} ${hidden} ${BAND_BOTTOM} 0)`,
                }}
              >
                {text}
              </span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
