"use client";

import { Fragment } from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";
import { useGlide } from "@/lib/remocn/glide";

export interface CaptionWordPopProps extends CaptionBaseProps {
  popScale?: number;
  shadow?: boolean;
}

const FADE_MS = 50;
const EXIT_MS = 180;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const POP_SPRING = { damping: 11, stiffness: 240, mass: 0.6 };

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionWordPop({
  captions,
  combineTokensWithinMilliseconds = 0,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 96,
  fontWeight = 800,
  color = "#ffffff",
  popScale = 0.6,
  shadow = true,
  className,
}: CaptionWordPopProps) {
  const glide = useGlide();
  const { fps } = useVideoConfig();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const since = (state.sinceStartMs / 1000) * fps;
  const scaleAt = (f: number) =>
    popScale + (1 - popScale) * spring({ frame: f, fps, config: POP_SPRING });
  // The pop overshoots and its tail never quite lands, so it counts as moving
  // while a baseline a line or so off the centre still shifts by a thousandth
  // of a pixel; only vertical travel snaps.
  const reach = fontSize * 1.5;
  const step = (a: number, b: number) =>
    Math.abs(scaleAt(a) - scaleAt(b)) * reach > 1e-3;
  const moving = step(since + 1, since) || step(since, since - 1);
  const fadeIn = state.previous
    ? 1
    : interpolate(state.sinceStartMs, [0, FADE_MS], [0, 1], clamp);
  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        clamp,
      )
    : 1;

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.1,
        textAlign: "center",
        opacity: Math.min(fadeIn, exit),
        transform: `scale(${scaleAt(since)})${glide(moving)}`,
        textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.map(({ index, token }) => (
              <span key={index}>{token.text}</span>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
