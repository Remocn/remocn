"use client";

import { Fragment, useId } from "react";
import { Easing, interpolate } from "remotion";
import {
  type CaptionBaseProps,
  type CaptionTokenState,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
  useCaptionWordRects,
} from "@/lib/remocn/caption-core";

export interface CaptionKnockoutProps extends Omit<CaptionBaseProps, "color"> {
  plateColor?: string;
  upcomingOpacity?: number;
  radius?: number;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const PUNCH_MS = 120;
const PAD_Y_EM = 0.22;
const PAD_X_EM = 0.42;

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const punchEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function holeFill(
  token: CaptionTokenState,
  timeMs: number,
  upcomingOpacity: number,
): string {
  const since = timeMs - token.fromMs;
  const hole =
    since < 0
      ? upcomingOpacity
      : interpolate(since, [0, PUNCH_MS], [upcomingOpacity, 1], {
          ...clamp,
          easing: punchEasing,
        });
  const level = Math.round(255 * (1 - Math.min(1, Math.max(0, hole))));
  return `rgb(${level}, ${level}, ${level})`;
}

export function CaptionKnockout({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  plateColor = "#ffffff",
  upcomingOpacity = 0.15,
  radius = 0.16,
  className,
}: CaptionKnockoutProps) {
  const maskId = `caption-knockout-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  const words = state ? groupCaptionWords(state.tokens) : [];
  const { wordRef, rects } = useCaptionWordRects(
    state ? state.pageIndex : -1,
    words.length,
  );
  if (!state) return null;

  const enter = interpolate(
    state.previous ? ENTER_MS : state.sinceStartMs,
    [0, ENTER_MS],
    [0, 1],
    { ...clamp, easing: enterEasing },
  );
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
        position: "relative",
        fontSize,
        fontWeight,
        lineHeight: 1.2,
        textAlign: "center",
        padding: `${PAD_Y_EM}em ${PAD_X_EM}em`,
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {rects && (
        <svg
          aria-hidden
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <rect width="100%" height="100%" fill="#ffffff" />
              {words.map((word, w) => {
                const rect = rects[w];
                if (!rect) return null;
                return (
                  <text
                    key={`${state.pageIndex}-${word[0].index}`}
                    x={rect.left}
                    y={rect.top + rect.height / 2}
                    dominantBaseline="central"
                  >
                    {word.map(({ index, token }) => (
                      <tspan
                        key={index}
                        fill={holeFill(token, state.timeMs, upcomingOpacity)}
                      >
                        {token.text}
                      </tspan>
                    ))}
                  </text>
                );
              })}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            rx={radius * fontSize}
            fill={plateColor}
            mask={`url(#${maskId})`}
          />
        </svg>
      )}
      {words.map((word, w) => (
        <Fragment key={`${state.pageIndex}-${word[0].index}`}>
          {w > 0 && " "}
          <span
            ref={wordRef(w)}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              color: "transparent",
            }}
          >
            {word.map(({ index, token }) => (
              <span key={index}>{token.text}</span>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
