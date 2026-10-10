"use client";

import { type CSSProperties, Fragment } from "react";
import { Easing, interpolate, random } from "remotion";
import {
  type CaptionBaseProps,
  captionWordText,
  DEFAULT_HOLD_MS,
  getExitWindowMs,
  groupCaptionWords,
  useCaptions,
} from "@/lib/remocn/caption-core";

export interface CaptionSplitFlapProps extends CaptionBaseProps {
  tileColor?: string;
}

const ENTER_MS = 160;
const EXIT_MS = 220;
const RISE_EM = 0.14;
const FLIP_MS = 60;
const MIN_SETTLE_MS = 350;
const TILE_W = 0.78;
const TILE_H = 1.2;
const TILE_GAP = 0.06;
const GLYPH_SCALE = 0.8;
const RADIUS = 0.08;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const enterEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface FlapFrame {
  current: string;
  next: string;
  progress: number | null;
}

function flapFrame(
  target: string,
  seed: string,
  index: number,
  count: number,
  fromMs: number,
  windowMs: number,
  timeMs: number,
): FlapFrame {
  const flips = 3 + Math.floor(random(`${seed}-flips`) * 4);
  const share = count > 1 ? index / (count - 1) : 1;
  const endMs = fromMs + windowMs * (0.55 + 0.45 * share);
  const flipMs = Math.min(FLIP_MS, (endMs - fromMs) / flips);
  const startMs = endMs - flips * flipMs;
  if (timeMs < startMs) return { current: "", next: "", progress: null };
  if (timeMs >= endMs) return { current: target, next: target, progress: null };
  const glyphAt = (k: number): string => {
    if (k <= 0) return "";
    if (k >= flips) return target;
    return GLYPHS[Math.floor(random(`${seed}-${k}`) * GLYPHS.length)];
  };
  const elapsed = (timeMs - startMs) / flipMs;
  const k = Math.floor(elapsed);
  return { current: glyphAt(k), next: glyphAt(k + 1), progress: elapsed - k };
}

const TOP_HALF = "inset(0 0 50% 0)";
const BOTTOM_HALF = "inset(50% 0 0 0)";

function Leaf({
  char,
  tileColor,
  clipPath,
  transform,
  brightness = 1,
}: {
  char: string;
  tileColor: string;
  clipPath?: string;
  transform?: string;
  brightness?: number;
}) {
  const style: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: tileColor,
    borderRadius: `${RADIUS}em`,
    clipPath,
    transform,
    transformOrigin: "50% 50%",
    filter: brightness < 1 ? `brightness(${brightness})` : undefined,
  };
  return (
    <span style={style}>
      <span style={{ fontSize: `${GLYPH_SCALE}em`, lineHeight: 1 }}>
        {char}
      </span>
    </span>
  );
}

function Tile({ frame, tileColor }: { frame: FlapFrame; tileColor: string }) {
  const perspective = `perspective(${TILE_H * 4}em)`;
  const { current, next, progress } = frame;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: `${TILE_W}em`,
        height: `${TILE_H}em`,
        flexShrink: 0,
      }}
    >
      {progress === null ? (
        <Leaf char={current} tileColor={tileColor} />
      ) : (
        <>
          <Leaf char={next} tileColor={tileColor} clipPath={TOP_HALF} />
          <Leaf char={current} tileColor={tileColor} clipPath={BOTTOM_HALF} />
          {progress < 0.5 ? (
            <Leaf
              char={current}
              tileColor={tileColor}
              clipPath={TOP_HALF}
              transform={`${perspective} rotateX(${-180 * progress}deg)`}
              brightness={1 - 0.7 * progress}
            />
          ) : (
            <Leaf
              char={next}
              tileColor={tileColor}
              clipPath={BOTTOM_HALF}
              transform={`${perspective} rotateX(${180 * (1 - progress)}deg)`}
              brightness={0.65 + 0.7 * (progress - 0.5)}
            />
          )}
        </>
      )}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: "max(1px, 0.025em)",
          transform: "translateY(-50%)",
          background: "rgba(0, 0, 0, 0.6)",
        }}
      />
    </span>
  );
}

export function CaptionSplitFlap({
  captions,
  combineTokensWithinMilliseconds = 1000,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 56,
  fontWeight = 800,
  color = "#ffffff",
  tileColor = "#111111",
  className,
}: CaptionSplitFlapProps) {
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

  return (
    <div
      className={className}
      style={{
        fontSize,
        fontWeight,
        color,
        lineHeight: TILE_H + 0.24,
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * RISE_EM}em)`,
      }}
    >
      {groupCaptionWords(state.tokens).map((word, w) => {
        const first = word[0];
        const fromMs = first.token.fromMs;
        const toMs = word[word.length - 1].token.toMs;
        const windowMs = Math.max(toMs - fromMs, MIN_SETTLE_MS);
        const chars = Array.from(captionWordText(word));
        return (
          <Fragment key={`${state.pageIndex}-${first.index}`}>
            {w > 0 && " "}
            <span
              style={{
                display: "inline-flex",
                gap: `${TILE_GAP}em`,
                verticalAlign: "top",
                paddingInline: `${TILE_GAP}em`,
              }}
            >
              {chars.map((char, c) => (
                <Tile
                  key={c}
                  tileColor={tileColor}
                  frame={flapFrame(
                    char,
                    `${state.pageIndex}-${first.index}-${c}`,
                    c,
                    chars.length,
                    fromMs,
                    windowMs,
                    state.timeMs,
                  )}
                />
              ))}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
