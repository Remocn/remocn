"use client";

import { Fragment } from "react";
import { interpolate } from "remotion";
import {
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionTypewriterProps extends CaptionBaseProps {
  caret?: boolean;
  shadow?: boolean;
}

const EXIT_MS = 220;
const BLINK_MS = 500;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";
const CARET_SHADOW = "0 2px 6px rgba(0, 0, 0, 0.45)";

function typedCount(text: string, progress: number): number {
  const length = Array.from(text).length;
  return Math.min(length, Math.ceil(progress * length));
}

export function CaptionTypewriter({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  caret = true,
  shadow = true,
  className,
}: CaptionTypewriterProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

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

  const active = state.tokens[state.activeIndex];
  const typing = active !== undefined && active.progress < 1;
  const idleMs = active ? state.timeMs - active.toMs : 0;
  const caretOn = typing || Math.floor(idleMs / BLINK_MS) % 2 === 0;

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: exit,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.map(({ index, token }) => {
              const chars = Array.from(token.text);
              const typed = typedCount(token.text, token.progress);
              return (
                <Fragment key={index}>
                  <span
                    style={{
                      textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
                    }}
                  >
                    {chars.slice(0, typed).join("")}
                  </span>
                  {caret && index === state.activeIndex ? (
                    <span style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "0.03em",
                          top: "0.1em",
                          bottom: "0.1em",
                          width: "0.07em",
                          backgroundColor: color,
                          boxShadow: shadow ? CARET_SHADOW : undefined,
                          opacity: caretOn ? 1 : 0,
                        }}
                      />
                    </span>
                  ) : null}
                  <span aria-hidden style={{ color: "transparent" }}>
                    {chars.slice(typed).join("")}
                  </span>
                </Fragment>
              );
            })}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
