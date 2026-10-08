"use client";

import { Fragment, useId } from "react";
import { Easing, interpolate, random } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  createKeywordMatcher,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  normalizeCaptionWord,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionStampProps extends CaptionBaseProps {
  keywords?: string[];
  stampColor?: string;
  texture?: boolean;
  shadow?: boolean;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const SLAM_MS = 90;
const SETTLE_MS = 170;
const INK_MS = 50;
const PAD_EM = 0.16;
const BORDER_EM = 0.06;
const RADIUS_EM = 0.08;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);
const slamEasing = Easing.in(Easing.quad);
const settleEasing = Easing.out(Easing.quad);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function stampScale(sinceMs: number): number {
  if (sinceMs <= SLAM_MS) {
    return interpolate(sinceMs, [0, SLAM_MS], [1.8, 0.96], {
      ...clamp,
      easing: slamEasing,
    });
  }
  return interpolate(sinceMs, [SLAM_MS, SETTLE_MS], [0.96, 1], {
    ...clamp,
    easing: settleEasing,
  });
}

export function CaptionStamp({
  captions,
  combineTokensWithinMilliseconds = 1200,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  keywords,
  stampColor = "#ef4444",
  texture = true,
  shadow = true,
  className,
}: CaptionStampProps) {
  const filterId = `caption-stamp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
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

  const words = groupCaptionWords(state.tokens);
  const isKeyword = createKeywordMatcher(keywords);
  const byKeyword = keywords !== undefined && keywords.length > 0;
  let longest = -1;
  let longestLength = 0;
  if (!byKeyword) {
    words.forEach((word, w) => {
      const length = normalizeCaptionWord(captionWordText(word)).length;
      if (length > longestLength) {
        longest = w;
        longestLength = length;
      }
    });
  }
  const textShadow = shadow ? LEGIBILITY_SHADOW : undefined;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {texture && (
        <svg
          aria-hidden
          width={0}
          height={0}
          style={{ position: "absolute", overflow: "hidden" }}
        >
          <filter id={filterId} x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.45"
              numOctaves={2}
              seed={4}
              result="warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale={fontSize * 0.035}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rough"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves={1}
              seed={9}
              result="grain"
            />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -10 6.8"
              result="holes"
            />
            <feComposite in="rough" in2="holes" operator="in" />
          </filter>
        </svg>
      )}
      {words.map((word, w) => {
        const key = `${state.pageIndex}-${word[0].index}`;
        const text = captionWordText(word);
        const stamped = byKeyword ? isKeyword(text) : w === longest;
        if (!stamped) {
          return (
            <Fragment key={key}>
              {w > 0 && " "}
              <span
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  textShadow,
                }}
              >
                {text}
              </span>
            </Fragment>
          );
        }
        const sinceMs = state.timeMs - word[0].token.fromMs;
        const rotation =
          -8 + random(`caption-stamp-${state.pageIndex}-${word[0].index}`) * 5;
        return (
          <Fragment key={key}>
            {w > 0 && " "}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  opacity: interpolate(
                    sinceMs,
                    [SLAM_MS * 0.6, SLAM_MS],
                    [1, 0],
                    clamp,
                  ),
                  textShadow,
                }}
              >
                {text}
              </span>
              {sinceMs >= 0 && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: `-${PAD_EM}em`,
                    right: `-${PAD_EM}em`,
                    top: "8%",
                    bottom: "4%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    color: stampColor,
                    border: `${BORDER_EM}em solid ${stampColor}`,
                    borderRadius: `${RADIUS_EM}em`,
                    opacity: interpolate(sinceMs, [0, INK_MS], [0, 1], clamp),
                    transform: `rotate(${rotation}deg) scale(${stampScale(sinceMs)})`,
                    filter: texture ? `url(#${filterId})` : undefined,
                  }}
                >
                  {text}
                </span>
              )}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
