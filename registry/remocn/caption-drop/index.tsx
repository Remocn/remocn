"use client";

import { Fragment } from "react";
import { interpolate, random, spring, useVideoConfig } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionDropProps extends CaptionBaseProps {
  bounce?: number;
  shadow?: boolean;
}

const EXIT_MS = 360;
const EXIT_STAGGER_MS = 120;
const FADE_IN_MS = 80;
const FALL_EM = 1.4;
const EXIT_FALL_EM = 1.8;
const MAX_TILT_DEG = 6;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionDrop({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  bounce = 0.6,
  shadow = true,
  className,
}: CaptionDropProps) {
  const { fps } = useVideoConfig();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const damping = interpolate(bounce, [0, 1], [20, 6], clamp);
  const words = groupCaptionWords(state.tokens);
  const exitWindow = getExitWindowMs(state, EXIT_MS);
  const exitElapsed = state.endsInSilence
    ? Math.max(0, exitWindow - state.untilEndMs)
    : 0;
  const stagger = Math.min(EXIT_STAGGER_MS, exitWindow * 0.4);
  const fallSpan = Math.max(1, exitWindow - stagger);

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
      }}
    >
      {words.map((word, w) => {
        const first = word[0];
        const sinceMs = state.timeMs - first.token.fromMs;
        const arrived = sinceMs >= 0;
        const landed = arrived
          ? spring({
              frame: (sinceMs / 1000) * fps,
              fps,
              config: { damping, stiffness: 180, mass: 0.7 },
            })
          : 0;
        const fadeIn = arrived
          ? interpolate(sinceMs, [0, FADE_IN_MS], [0, 1], clamp)
          : 0;
        const tilt =
          (random(`${state.pageIndex}-${first.index}-tilt`) * 2 - 1) *
          MAX_TILT_DEG;
        const delay = words.length > 1 ? (w / (words.length - 1)) * stagger : 0;
        const out = state.endsInSilence
          ? Math.min(1, Math.max(0, (exitElapsed - delay) / fallSpan))
          : 0;
        const gravity = out * out;
        const y = -(1 - landed) * FALL_EM + gravity * EXIT_FALL_EM;
        const rotate = tilt * (1 - landed) - tilt * 0.6 * gravity;
        return (
          <Fragment key={`${state.pageIndex}-${first.index}`}>
            {w > 0 && " "}
            <span
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                opacity: fadeIn * (1 - out ** 1.5),
                transform: `translateY(${y}em) rotate(${rotate}deg)`,
                transformOrigin: "50% 100%",
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
