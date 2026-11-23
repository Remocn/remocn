"use client";

import { type ForwardedRef, Fragment, forwardRef } from "react";
import {
  Easing,
  Interactive,
  type InteractiveTransformProps,
  type InteractivitySchema,
  interpolate,
} from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";
import { useGlide } from "@/lib/remocn/glide";

export interface CaptionKaraokeProps extends CaptionBaseProps {
  activeColor?: string;
  shadow?: boolean;
}

export const captionKaraokeSchema = {
  ...Interactive.captionsSchema,
  fontSize: {
    type: "number",
    min: 24,
    max: 140,
    step: 1,
    default: 64,
    description: "Font size",
    hiddenFromList: false,
  },
  fontWeight: {
    type: "number",
    min: 400,
    max: 900,
    step: 100,
    default: 800,
    description: "Font weight",
    hiddenFromList: false,
  },
  color: {
    type: "color",
    default: "#ffffff",
    description: "Text color",
  },
  activeColor: {
    type: "color",
    default: "#facc15",
    description: "Fill color",
  },
  combineTokensWithinMilliseconds: {
    type: "number",
    min: 0,
    max: 3000,
    step: 100,
    default: 1200,
    description: "Page window (ms)",
    hiddenFromList: false,
  },
  holdMs: {
    type: "number",
    min: 0,
    max: 2000,
    step: 50,
    default: DEFAULT_HOLD_MS,
    description: "Hold (ms)",
    hiddenFromList: false,
  },
  shadow: {
    type: "boolean",
    default: true,
    description: "Shadow",
  },
} as const satisfies InteractivitySchema;

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

function CaptionKaraokeContent(
  {
    captions,
    combineTokensWithinMilliseconds = captionKaraokeSchema
      .combineTokensWithinMilliseconds.default,
    holdMs = captionKaraokeSchema.holdMs.default,
    fontSize = captionKaraokeSchema.fontSize.default,
    fontWeight = captionKaraokeSchema.fontWeight.default,
    color = captionKaraokeSchema.color.default,
    activeColor = captionKaraokeSchema.activeColor.default,
    shadow = captionKaraokeSchema.shadow.default,
    className,
    style,
  }: CaptionKaraokeProps & InteractiveTransformProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const glide = useGlide();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return <div ref={ref} style={style} />;

  const enter = interpolate(
    state.previous ? ENTER_MS : state.sinceStartMs,
    [0, ENTER_MS],
    [0, 1],
    {
      easing: enterEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
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
    <div ref={ref} style={style}>
      <div
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          lineHeight: 1.2,
          textAlign: "center",
          opacity: Math.min(enter, exit),
          transform: `translateY(${(1 - enter) * RISE_EM}em)${glide(midway(enter))}`,
        }}
      >
        {groupCaptionWords(state.tokens).map((word, w) => (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {word.map(({ index, token }) => (
                <span
                  key={index}
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <span
                    style={{
                      textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
                    }}
                  >
                    {token.text}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      color: activeColor,
                      clipPath: `inset(0 ${(1 - token.progress) * 100}% 0 0)`,
                    }}
                  >
                    {token.text}
                  </span>
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export const CaptionKaraoke = Interactive.create({
  Component: forwardRef(CaptionKaraokeContent),
  componentName: "<CaptionKaraoke>",
  layout: "none",
  schema: captionKaraokeSchema,
});
