"use client";

import { type ForwardedRef, Fragment, forwardRef } from "react";
import {
  Easing,
  Interactive,
  type InteractiveTransformProps,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

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

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function CaptionActivePopContent(
  {
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
    style,
  }: CaptionActivePopProps & InteractiveTransformProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const glide = useGlide();
  const { fps } = useSceneConfig();
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

  const emphasisAt = (w: number, timeMs: number): number => {
    if (activeWord < 0 || w > activeWord) return 0;
    const startMs = words[w][0].token.fromMs;
    if (w === activeWord) {
      return spring({
        frame: toFrames(timeMs - startMs),
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
      frame: toFrames(timeMs - releaseMs),
      fps,
      config: RELEASE_SPRING,
    });
    return peak * (1 - release);
  };
  const emphasis = (w: number) => emphasisAt(w, state.timeMs);
  // The pop overshoots and settles on a long tail, so a word counts as moving
  // while its scale still shifts a glyph (~1em from the origin) by 2e-3px a
  // frame; below that the tail is a held word, and a tilt would change it.
  const frameMs = 1000 / fps;
  const popping = (w: number, amount: number) => {
    const reach = (popScale - 1) * fontSize;
    return (
      Math.abs(emphasisAt(w, state.timeMs + frameMs) - amount) * reach > 2e-3 ||
      Math.abs(amount - emphasisAt(w, state.timeMs - frameMs)) * reach > 2e-3
    );
  };
  const rising = midway(enter);

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
          transform: `translateY(${(1 - enter) * RISE_EM}em)${glide(rising)}`,
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
                  transform: `scale(${1 + (popScale - 1) * amount})${glide(!rising && popping(w, amount))}`,
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
    </div>
  );
}

export const CaptionActivePop = Interactive.create({
  Component: forwardRef(CaptionActivePopContent),
  componentName: "<CaptionActivePop>",
  layout: "none",
  schema: Interactive.captionsSchema,
});
