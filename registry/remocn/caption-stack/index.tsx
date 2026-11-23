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
  captionWordText,
  createKeywordMatcher,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  normalizeCaptionWord,
  useCaptions,
} from "@/lib/remocn/caption-core";
import { useGlide } from "@/lib/remocn/glide";

export interface CaptionStackProps extends CaptionBaseProps {
  keywords?: string[];
  emphasisScale?: number;
  emphasisColor?: string;
  shadow?: boolean;
}

type CaptionWord = ReturnType<typeof groupCaptionWords>[number];

interface StackLine {
  words: CaptionWord[];
  emphasis: boolean;
}

const WORDS_PER_LINE = 2;
const EXIT_MS = 220;
const FADE_IN_MS = 120;
const RISE_MS = 220;
const RISE_EM = 0.3;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const riseEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function buildLines(
  words: CaptionWord[],
  isEmphasis: (word: CaptionWord, index: number) => boolean,
): StackLine[] {
  const lines: StackLine[] = [];
  let current: CaptionWord[] = [];
  const flush = () => {
    if (current.length > 0) {
      lines.push({ words: current, emphasis: false });
      current = [];
    }
  };
  words.forEach((word, i) => {
    if (isEmphasis(word, i)) {
      flush();
      lines.push({ words: [word], emphasis: true });
      return;
    }
    current.push(word);
    if (current.length >= WORDS_PER_LINE) flush();
  });
  flush();
  return lines;
}

function longestWordIndex(words: CaptionWord[]): number {
  let longest = -1;
  let longestLength = 0;
  words.forEach((word, i) => {
    const length = normalizeCaptionWord(captionWordText(word)).length;
    if (length > longestLength) {
      longest = i;
      longestLength = length;
    }
  });
  return longest;
}

function CaptionStackContent(
  {
    captions,
    combineTokensWithinMilliseconds = 1600,
    holdMs = DEFAULT_HOLD_MS,
    fontSize = 64,
    fontWeight = 800,
    color = "#ffffff",
    keywords,
    emphasisScale = 1.7,
    emphasisColor = "#facc15",
    shadow = true,
    className,
    style,
  }: CaptionStackProps & InteractiveTransformProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const glide = useGlide();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return <div ref={ref} style={style} />;

  const words = groupCaptionWords(state.tokens);
  const hasKeywords = keywords !== undefined && keywords.length > 0;
  const isKeyword = createKeywordMatcher(keywords);
  const longest = hasKeywords ? -1 : longestWordIndex(words);
  const lines = buildLines(words, (word, i) =>
    hasKeywords ? isKeyword(captionWordText(word)) : i === longest,
  );

  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        clamp,
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
          lineHeight: 1,
          textAlign: "center",
          opacity: exit,
        }}
      >
        {lines.map((line) => (
          <div
            key={`${state.pageIndex}-${line.words[0][0].index}`}
            style={{
              fontSize: line.emphasis ? `${emphasisScale}em` : undefined,
              color: line.emphasis ? emphasisColor : undefined,
            }}
          >
            {line.words.map((word, w) => {
              const sinceMs = state.timeMs - word[0].token.fromMs;
              const arrived = sinceMs >= 0;
              const rise = arrived
                ? interpolate(sinceMs, [0, RISE_MS], [0, 1], {
                    ...clamp,
                    easing: riseEasing,
                  })
                : 0;
              const opacity = arrived
                ? interpolate(sinceMs, [0, FADE_IN_MS], [0, 1], clamp)
                : 0;
              return (
                <Fragment key={word[0].index}>
                  {w > 0 && " "}
                  <span
                    style={{
                      display: "inline-block",
                      whiteSpace: "nowrap",
                      opacity,
                      transform: `translateY(${(1 - rise) * RISE_EM}em)${glide(midway(rise))}`,
                      textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
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
        ))}
      </div>
    </div>
  );
}

export const CaptionStack = Interactive.create({
  Component: forwardRef(CaptionStackContent),
  componentName: "<CaptionStack>",
  layout: "none",
  schema: Interactive.captionsSchema,
});
