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
  type CaptionTokenState,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";
import { useGlide } from "@/lib/remocn/glide";

export interface CaptionProsodyProps extends CaptionBaseProps {
  minScale?: number;
  maxScale?: number;
  activeColor?: string;
  shadow?: boolean;
}

const EXIT_MS = 220;
const WORD_IN_MS = 180;
const RISE_EM = 0.2;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const appearEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function letterCount(text: string): number {
  return Math.max(1, text.match(/[\p{L}\p{N}]/gu)?.length ?? 0);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getProsodyScales(
  words: { token: CaptionTokenState }[][],
  minScale: number,
  maxScale: number,
): number[] {
  const paces = words.map((word) => {
    const fromMs = word[0].token.fromMs;
    const toMs = word[word.length - 1].token.toMs;
    return Math.max(0, toMs - fromMs) / letterCount(captionWordText(word));
  });
  const typical = median(paces);
  if (!(typical > 0)) return words.map(() => 1);
  return paces.map((pace) => {
    const t = Math.max(-1, Math.min(1, Math.log2(Math.max(pace, 1) / typical)));
    return t >= 0 ? 1 + t * (maxScale - 1) : 1 + t * (1 - minScale);
  });
}

function CaptionProsodyContent(
  {
    captions,
    combineTokensWithinMilliseconds = 1200,
    holdMs = DEFAULT_HOLD_MS,
    fontSize = 64,
    fontWeight = 800,
    color = "#ffffff",
    minScale = 0.75,
    maxScale = 1.6,
    activeColor = "#facc15",
    shadow = true,
    className,
    style,
  }: CaptionProsodyProps & InteractiveTransformProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const glide = useGlide();
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
  const words = groupCaptionWords(state.tokens);
  const scales = getProsodyScales(words, minScale, maxScale);

  return (
    <div ref={ref} style={style}>
      <div
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          lineHeight: 1.1,
          textAlign: "center",
          opacity: exit,
        }}
      >
        {words.map((word, w) => {
          const appear = interpolate(
            state.timeMs - word[0].token.fromMs,
            [0, WORD_IN_MS],
            [0, 1],
            { ...clamp, easing: appearEasing },
          );
          const active = word.some(({ index }) => index === state.activeIndex);
          return (
            <Fragment key={`${state.pageIndex}-${word[0].index}`}>
              {w > 0 && " "}
              <span
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontSize: `${scales[w]}em`,
                  color: active ? activeColor : color,
                  opacity: appear,
                  transform: `translateY(${(1 - appear) * RISE_EM}em)${glide(midway(appear))}`,
                  textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
                }}
              >
                {captionWordText(word)}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export const CaptionProsody = Interactive.create({
  Component: forwardRef(CaptionProsodyContent),
  componentName: "<CaptionProsody>",
  layout: "none",
  schema: Interactive.captionsSchema,
});
