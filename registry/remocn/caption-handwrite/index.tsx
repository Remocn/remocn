"use client";

import { Fragment } from "react";
import { Easing, interpolate, random } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionHandwriteProps extends CaptionBaseProps {
  wobble?: number;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const MIN_WRITE_MS = 200;
const EDGE_PERCENT = 22;
const MASK_PAD_EM = 0.4;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionHandwrite({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  wobble = 1,
  shadow = true,
  className,
}: CaptionHandwriteProps) {
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
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => {
        const text = captionWordText(word);
        const fromMs = word[0].token.fromMs;
        const toMs = word[word.length - 1].token.toMs;
        const writeMs = Math.max(toMs - fromMs, MIN_WRITE_MS);
        const written = interpolate(
          state.timeMs - fromMs,
          [0, writeMs],
          [0, 1],
          clamp,
        );
        const seed = `caption-handwrite-${state.pageIndex}-${word[0].index}`;
        const tilt = (random(`${seed}-tilt`) * 3 - 1.5) * wobble;
        const lift = (random(`${seed}-lift`) * 0.08 - 0.04) * wobble;
        const head = written * (100 + EDGE_PERCENT);
        const stop = (percent: number): string =>
          `calc(${MASK_PAD_EM}em + (100% - ${MASK_PAD_EM * 2}em) * ${percent / 100})`;
        const mask =
          written > 0 && written < 1
            ? `linear-gradient(90deg, #000 ${stop(head - EDGE_PERCENT)}, transparent ${stop(head)})`
            : undefined;
        return (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                opacity: written > 0 ? 1 : 0,
                padding: `${MASK_PAD_EM}em`,
                margin: `-${MASK_PAD_EM}em`,
                transform: `translateY(${lift}em) rotate(${tilt}deg)`,
                WebkitMaskImage: mask,
                maskImage: mask,
                textShadow,
              }}
            >
              {Array.from(text).map((char, c) => (
                <span
                  key={c}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    transform: `rotate(${(random(`${seed}-${c}`) * 6 - 3) * wobble}deg)`,
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
