"use client";

import { type CSSProperties, Fragment } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  type CaptionTokenState,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionSlotProps extends CaptionBaseProps {
  activeColor?: string;
  shadow?: boolean;
}

const LINE_HEIGHT = 1.3;
const CLIP_MARGIN_EM = 0.2;
const TRAVEL_EM = LINE_HEIGHT + CLIP_MARGIN_EM * 2;
const ROLL_MS = 260;
const EXIT_MS = 220;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const rollIn = Easing.bezier(0.16, 1, 0.3, 1);
const rollOut = Easing.bezier(0.7, 0, 0.84, 0);

function SlotLine({
  tokens,
  activeIndex,
  activeColor,
  style,
}: {
  tokens: CaptionTokenState[];
  activeIndex: number;
  activeColor?: string;
  style: CSSProperties;
}) {
  return (
    <div style={{ whiteSpace: "nowrap", ...style }}>
      {groupCaptionWords(tokens).map((word, w) => (
        <Fragment key={word[0].index}>
          {w > 0 && " "}
          {word.map(({ index, token }) => (
            <span
              key={index}
              style={{
                color:
                  activeColor !== undefined && index === activeIndex
                    ? activeColor
                    : undefined,
              }}
            >
              {token.text}
            </span>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export function CaptionSlot({
  captions,
  combineTokensWithinMilliseconds = 800,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  activeColor,
  shadow = true,
  className,
}: CaptionSlotProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const roll = interpolate(state.sinceStartMs, [0, ROLL_MS], [0, 1], {
    easing: rollIn,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitProgress = Math.min(
    1,
    Math.max(0, 1 - state.untilEndMs / getExitWindowMs(state, EXIT_MS)),
  );
  const exit = state.endsInSilence ? rollOut(exitProgress) : 0;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        fontSize,
        fontWeight,
        color,
        lineHeight: LINE_HEIGHT,
        height: `${LINE_HEIGHT}em`,
        textAlign: "center",
        textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
        clipPath: `inset(-${CLIP_MARGIN_EM}em -100000px)`,
      }}
    >
      {state.previous && roll < 1 ? (
        <SlotLine
          key={`page-${state.previous.pageIndex}`}
          tokens={state.previous.tokens}
          activeIndex={-1}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: `translate(-50%, ${-roll * TRAVEL_EM}em)`,
          }}
        />
      ) : null}
      <SlotLine
        key={`page-${state.pageIndex}`}
        tokens={state.tokens}
        activeIndex={state.activeIndex}
        activeColor={activeColor}
        style={{
          transform: `translateY(${(1 - roll - exit) * TRAVEL_EM}em)`,
        }}
      />
    </div>
  );
}
