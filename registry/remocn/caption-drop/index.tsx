"use client";

import { Fragment } from "react";
import { interpolate, random, spring } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

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
  const { fps } = useSceneConfig();
  const glide = useGlide();
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const damping = interpolate(bounce, [0, 1], [20, 6], clamp);
  const words = groupCaptionWords(state.tokens);
  const exitWindow = getExitWindowMs(state, EXIT_MS);
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
        const delay = words.length > 1 ? (w / (words.length - 1)) * stagger : 0;
        // The word's fall, `df` frames away from now, so the glide mark
        // below can tell motion from rest.
        const at = (df: number) => {
          const ms = (df * 1000) / fps;
          const sinceMs = state.timeMs + ms - first.token.fromMs;
          const landed =
            sinceMs >= 0
              ? spring({
                  frame: (sinceMs / 1000) * fps,
                  fps,
                  config: { damping, stiffness: 180, mass: 0.7 },
                })
              : 0;
          const elapsed = state.endsInSilence
            ? Math.max(0, exitWindow - state.untilEndMs + ms)
            : 0;
          const out = state.endsInSilence
            ? Math.min(1, Math.max(0, (elapsed - delay) / fallSpan))
            : 0;
          return { sinceMs, landed, out };
        };
        const { sinceMs, landed, out } = at(0);
        const arrived = sinceMs >= 0;
        const fadeIn = arrived
          ? interpolate(sinceMs, [0, FADE_IN_MS], [0, 1], clamp)
          : 0;
        const tilt =
          (random(`${state.pageIndex}-${first.index}-tilt`) * 2 - 1) *
          MAX_TILT_DEG;
        const yPx = (p: { landed: number; out: number }) =>
          (-(1 - p.landed) * FALL_EM + p.out * p.out * EXIT_FALL_EM) * fontSize;
        // Any step counts: a spring's tail creeps under a thousandth of a
        // pixel a frame and still crosses a pixel now and then.
        const moving =
          Math.abs(yPx(at(1)) - yPx(at(0))) > 1e-7 ||
          Math.abs(yPx(at(0)) - yPx(at(-1))) > 1e-7;
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
                transform: `translateY(${y}em) rotate(${rotate}deg)${glide(moving)}`,
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
