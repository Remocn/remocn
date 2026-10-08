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

export interface CaptionCubeProps extends CaptionBaseProps {
  tintActive?: boolean;
  activeColor?: string;
  shadow?: boolean;
}

const LINE_HEIGHT = 1.3;
const DEPTH_EM = LINE_HEIGHT / 2;
const TURN_MS = 320;
const EXIT_MS = 280;
const PERSPECTIVE_EM = 10;
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const turnEasing = Easing.bezier(0.65, 0, 0.35, 1);
const exitEasing = Easing.bezier(0.7, 0, 0.84, 0);

function CubeFace({
  tokens,
  activeIndex,
  activeColor,
  angle,
  before,
  style,
}: {
  tokens: CaptionTokenState[];
  activeIndex: number;
  activeColor: string | undefined;
  angle: number;
  before: string;
  style?: CSSProperties;
}) {
  const facing = Math.max(0, Math.cos((angle * Math.PI) / 180));
  return (
    <div
      style={{
        whiteSpace: "nowrap",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        opacity: 0.35 + 0.65 * facing,
        transform: `${before}rotateX(${angle}deg) translateZ(${DEPTH_EM}em)`,
        ...style,
      }}
    >
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

export function CaptionCube({
  captions,
  combineTokensWithinMilliseconds = 800,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  tintActive = false,
  activeColor = "#facc15",
  shadow = true,
  className,
}: CaptionCubeProps) {
  const state = useCaptions({
    captions,
    combineTokensWithinMilliseconds,
    holdMs,
  });
  if (!state) return null;

  const turnMs = Math.max(
    1,
    Math.min(TURN_MS, state.sinceStartMs + state.untilEndMs),
  );
  const turn = interpolate(state.sinceStartMs, [0, turnMs], [0, 1], {
    easing: turnEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitProgress = state.endsInSilence
    ? exitEasing(
        Math.min(
          1,
          Math.max(0, 1 - state.untilEndMs / getExitWindowMs(state, EXIT_MS)),
        ),
      )
    : 0;
  const currentAngle = (turn - 1) * 90 + exitProgress * 90;

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
        perspective: `${PERSPECTIVE_EM}em`,
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `translateZ(${-DEPTH_EM}em)`,
        }}
      >
        {state.previous && turn < 1 ? (
          <CubeFace
            key={`page-${state.previous.pageIndex}`}
            tokens={state.previous.tokens}
            activeIndex={-1}
            activeColor={undefined}
            angle={turn * 90}
            before="translateX(-50%) "
            style={{ position: "absolute", top: 0, left: "50%" }}
          />
        ) : null}
        <CubeFace
          key={`page-${state.pageIndex}`}
          tokens={state.tokens}
          activeIndex={state.activeIndex}
          activeColor={tintActive ? activeColor : undefined}
          angle={currentAngle}
          before=""
        />
      </div>
    </div>
  );
}
