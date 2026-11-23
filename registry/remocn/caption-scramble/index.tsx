"use client";

import { type ForwardedRef, Fragment, forwardRef } from "react";
import {
  Easing,
  Interactive,
  type InteractiveTransformProps,
  interpolate,
  random,
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

export interface CaptionScrambleProps extends CaptionBaseProps {
  glyphColor?: string;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const MAX_RESOLVE_MS = 300;
const FRAMES_PER_ROLL = 2;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/+=";
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function resolveProgress(sinceMs: number, fromMs: number, toMs: number) {
  const duration = Math.min(toMs - fromMs, MAX_RESOLVE_MS);
  if (duration <= 0) return 1;
  return Math.min(1, sinceMs / duration);
}

function CaptionScrambleContent(
  {
    captions,
    combineTokensWithinMilliseconds = 1200,
    holdMs = DEFAULT_HOLD_MS,
    fontSize = 64,
    fontWeight = 800,
    color = "#ffffff",
    glyphColor = "#a3a3a3",
    shadow = true,
    className,
    style,
  }: CaptionScrambleProps & InteractiveTransformProps,
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
  const step = Math.floor(((state.timeMs / 1000) * fps) / FRAMES_PER_ROLL);
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
          opacity: Math.min(enter, exit),
          transform: `translateY(${(1 - enter) * RISE_EM}em)${glide(midway(enter))}`,
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
                    <span key={index} style={{ opacity: 0 }}>
                      {token.text}
                    </span>
                  );
                }
                const progress = resolveProgress(
                  sinceMs,
                  token.fromMs,
                  token.toMs,
                );
                if (progress >= 1) {
                  return (
                    <span key={index} style={{ textShadow }}>
                      {token.text}
                    </span>
                  );
                }
                const chars = Array.from(token.text);
                const resolved = Math.floor(progress * chars.length);
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
                        left: 0,
                        right: 0,
                        top: 0,
                        whiteSpace: "nowrap",
                        clipPath: "inset(-50% 0 -50% 0)",
                        textShadow,
                      }}
                    >
                      <span>{chars.slice(0, resolved).join("")}</span>
                      <span style={{ color: glyphColor }}>
                        {chars
                          .slice(resolved)
                          .map((char, c) =>
                            /\s/.test(char)
                              ? char
                              : GLYPHS[
                                  Math.floor(
                                    random(
                                      `${state.pageIndex}-${index}-${resolved + c}-${step}`,
                                    ) * GLYPHS.length,
                                  )
                                ],
                          )
                          .join("")}
                      </span>
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

export const CaptionScramble = Interactive.create({
  Component: forwardRef(CaptionScrambleContent),
  componentName: "<CaptionScramble>",
  layout: "none",
  schema: Interactive.captionsSchema,
});
