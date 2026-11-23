"use client";

import { type ForwardedRef, Fragment, forwardRef } from "react";
import {
  Easing,
  Interactive,
  type InteractiveTransformProps,
  interpolate,
} from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionSliceProps extends CaptionBaseProps {
  distance?: number;
  shadow?: boolean;
}

const SLIDE_MS = 240;
const FADE_MS = 90;
const EXIT_MS = 220;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";
const TOP_HALF = "inset(-0.5em -0.5em 50% -0.5em)";
const BOTTOM_HALF = "inset(50% -0.5em -0.5em -0.5em)";

const slideEasing = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function CaptionSliceContent(
  {
    captions,
    combineTokensWithinMilliseconds = 1200,
    holdMs = DEFAULT_HOLD_MS,
    fontSize = 64,
    fontWeight = 800,
    color = "#ffffff",
    distance = 0.6,
    shadow = true,
    className,
    style,
  }: CaptionSliceProps & InteractiveTransformProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return <div ref={ref} style={style} />;

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
    <div ref={ref} style={style}>
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
                if (sinceMs < 0) {
                  return (
                    <span
                      key={index}
                      style={{ display: "inline-block", color: "transparent" }}
                    >
                      {token.text}
                    </span>
                  );
                }
                const slide = interpolate(sinceMs, [0, SLIDE_MS], [0, 1], {
                  ...clamp,
                  easing: slideEasing,
                });
                if (slide >= 1) {
                  return (
                    <span
                      key={index}
                      style={{ display: "inline-block", textShadow }}
                    >
                      {token.text}
                    </span>
                  );
                }
                const opacity = interpolate(
                  sinceMs,
                  [0, FADE_MS],
                  [0, 1],
                  clamp,
                );
                const offset = (1 - slide) * distance;
                return (
                  <span
                    key={index}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <span style={{ color: "transparent" }}>{token.text}</span>
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        whiteSpace: "nowrap",
                        clipPath: TOP_HALF,
                        opacity,
                        transform: `translateX(${-offset}em)`,
                        textShadow,
                      }}
                    >
                      {token.text}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        whiteSpace: "nowrap",
                        clipPath: BOTTOM_HALF,
                        opacity,
                        transform: `translateX(${offset}em)`,
                        textShadow,
                      }}
                    >
                      {token.text}
                    </span>
                  </span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export const CaptionSlice = Interactive.create({
  Component: forwardRef(CaptionSliceContent),
  componentName: "<CaptionSlice>",
  layout: "none",
  schema: Interactive.captionsSchema,
});
