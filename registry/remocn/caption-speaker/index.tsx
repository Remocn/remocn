"use client";

import { Fragment, useMemo } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  type SpeakerCaption,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionSpeakerProps extends CaptionBaseProps {
  captions: SpeakerCaption[];
  speakerColors?: Record<string, string>;
  upcomingOpacity?: number;
  shadow?: boolean;
}

const SPEAKER_PALETTE = ["#facc15", "#38bdf8", "#f472b6", "#4ade80"];

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const REVEAL_MS = 100;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function CaptionSpeaker({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  speakerColors,
  upcomingOpacity = 0.4,
  shadow = true,
  className,
}: CaptionSpeakerProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  const autoColors = useMemo(() => {
    const pinned = new Set(Object.values(speakerColors ?? {}));
    const free = SPEAKER_PALETTE.filter((c) => !pinned.has(c));
    const palette = free.length > 0 ? free : SPEAKER_PALETTE;
    const assigned = new Map<string, string>();
    for (const caption of captions) {
      const { speaker } = caption;
      if (
        speaker === undefined ||
        speakerColors?.[speaker] !== undefined ||
        assigned.has(speaker)
      ) {
        continue;
      }
      assigned.set(speaker, palette[assigned.size % palette.length]);
    }
    return assigned;
  }, [captions, speakerColors]);
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

  const { speaker } = state;
  const speakerColor =
    speaker === undefined
      ? color
      : (speakerColors?.[speaker] ?? autoColors.get(speaker) ?? color);

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color: speakerColor,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
            }}
          >
            {word.map(({ index, token }) => (
              <span
                key={index}
                style={{
                  opacity: interpolate(
                    state.timeMs - token.fromMs,
                    [0, REVEAL_MS],
                    [upcomingOpacity, 1],
                    clamp,
                  ),
                }}
              >
                {token.text}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
