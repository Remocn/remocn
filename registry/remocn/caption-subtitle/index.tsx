"use client";

import { interpolate } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionSubtitleProps extends CaptionBaseProps {
  box?: boolean;
  boxColor?: string;
  boxOpacity?: number;
}

const ENTER_MS = 120;
const EXIT_MS = 160;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

export function CaptionSubtitle({
  captions,
  combineTokensWithinMilliseconds = 2500,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 44,
  fontWeight = 600,
  color = "#ffffff",
  box = true,
  boxColor = "#000000",
  boxOpacity = 0.72,
  className,
}: CaptionSubtitleProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const enter = state.previous
    ? 1
    : interpolate(state.sinceStartMs, [0, ENTER_MS], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const exit = state.endsInSilence
    ? interpolate(
        state.untilEndMs,
        [0, getExitWindowMs(state, EXIT_MS)],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      )
    : 1;
  const opacityPercent = Math.round(Math.min(1, Math.max(0, boxOpacity)) * 100);

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.4,
        textAlign: "center",
        textWrap: "balance",
        opacity: Math.min(enter, exit),
      }}
    >
      <span
        style={
          box
            ? {
                backgroundColor: `color-mix(in srgb, ${boxColor} ${opacityPercent}%, transparent)`,
                padding: "0.06em 0.36em",
                borderRadius: "0.16em",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }
            : { textShadow: LEGIBILITY_SHADOW }
        }
      >
        {state.page.text}
      </span>
    </div>
  );
}
