"use client";

import { Fragment } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useVideoConfig,
} from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionActivePopProps extends CaptionBaseProps {
  activeColor?: string;
  popScale?: number;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const POP_SPRING = { damping: 12, stiffness: 220, mass: 0.6 };
const RELEASE_SPRING = { damping: 20, stiffness: 200, mass: 0.6 };

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionActivePop({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  activeColor = "#facc15",
  popScale = 1.12,
  shadow = true,
  className,
}: CaptionActivePopProps) {
  const { fps } = useVideoConfig();
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

  const words = groupCaptionWords(state.tokens);
  const activeWord = words.findIndex((word) =>
    word.some(({ index }) => index === state.activeIndex),
  );
  const toFrames = (ms: number) => (ms / 1000) * fps;

  const emphasis = (w: number): number => {
    if (activeWord < 0 || w > activeWord) return 0;
    const startMs = words[w][0].token.fromMs;
    if (w === activeWord) {
      return spring({
        frame: toFrames(state.timeMs - startMs),
        fps,
        config: POP_SPRING,
      });
    }
    if (w < activeWord - 1) return 0;
    const releaseMs = words[w + 1][0].token.fromMs;
    const peak = spring({
      frame: toFrames(releaseMs - startMs),
      fps,
      config: POP_SPRING,
    });
    const release = spring({
      frame: toFrames(state.timeMs - releaseMs),
      fps,
      config: RELEASE_SPRING,
    });
    return peak * (1 - release);
  };

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
      {words.map((word, w) => {
        const amount = emphasis(w);
        return (
          <Fragment key={`${state.pageIndex}-${word[0].index}`}>
            {w > 0 && " "}
            <span
              style={{
                position: "relative",
                zIndex: w === activeWord ? 1 : 0,
                display: "inline-block",
                whiteSpace: "nowrap",
                transform: `scale(${1 + (popScale - 1) * amount})`,
                transformOrigin: "50% 60%",
                color: interpolateColors(
                  Math.min(1, Math.max(0, amount)),
                  [0, 1],
                  [color, activeColor],
                ),
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
  );
}
