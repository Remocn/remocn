"use client";

import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type TypedSplitWipeElementId,
  typedSplitWipeTimeline,
} from "./timeline";

export interface TypedSplitWipeProps {
  prefix: string;
  anchor: string;
  suffix: string;
  typeFrames?: number;
  exitAt?: number;
  exitFrames?: number;
  wordStagger?: number;
  anchorShift?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the typing, the split and single suffix words,
   * by the ids in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<TypedSplitWipeElementId>;
}

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const wipeEasing = Easing.inOut(Easing.quad);

export function getTypedSplitWipeText(
  text: string,
  frame: number,
  typeFrames: number,
) {
  const characters = Array.from(text);
  const typedLength = interpolate(
    frame,
    [0, Math.max(typeFrames, 0.001)],
    [0, characters.length],
    clamp,
  );
  const visibleLength = Math.min(
    characters.length,
    Math.max(frame >= 0 ? 1 : 0, Math.floor(typedLength) + 1),
  );
  return characters.slice(0, visibleLength).join("");
}

export function TypedSplitWipe(props: TypedSplitWipeProps) {
  const {
    prefix,
    anchor,
    suffix,
    anchorShift = -72,
    fontSize = 42,
    color = "#e8e8e8",
    fontWeight = 400,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    typedSplitWipeTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const typing = tl.get("type");
  const exit = tl.get("exit");
  const closing = tl.get("anchor");
  const fullText = [prefix, anchor, suffix].filter(Boolean).join(" ");
  const typedText = getTypedSplitWipeText(
    fullText,
    frame - typing.start,
    typing.length,
  );
  const suffixWords = suffix.trim().split(/\s+/).filter(Boolean);

  const textStyle: CSSProperties = {
    color,
    fontFamily:
      "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
    fontSize,
    fontWeight,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    whiteSpace: "pre",
  };

  const prefixExit = interpolate(frame, [exit.start, exit.end], [0, 1], {
    ...clamp,
    easing: wipeEasing,
  });
  const anchorExit = interpolate(frame, [closing.start, closing.end], [0, 1], {
    ...clamp,
    easing: wipeEasing,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {frame < exit.start ? (
        <span className={className} style={textStyle}>
          {typedText}
        </span>
      ) : (
        <span
          className={className}
          style={{
            ...textStyle,
            display: "inline-flex",
            alignItems: "baseline",
            gap: "0.25em",
          }}
        >
          {prefix && (
            <span
              style={{
                display: "inline-block",
                clipPath: `inset(0 ${prefixExit * 100}% 0 0)`,
              }}
            >
              {prefix}
            </span>
          )}

          {anchor && (
            <span
              style={{
                display: "inline-block",
                clipPath: `inset(0 ${anchorExit * 50}% 0 ${anchorExit * 50}%)`,
                transform: `translateX(${anchorShift * prefixExit}px)`,
              }}
            >
              {anchor}
            </span>
          )}

          {suffixWords.map((word, index) => {
            const wipe = tl.get(`word:${index}`);
            const wordExit = interpolate(
              frame,
              [wipe.start, wipe.end],
              [0, 1],
              { ...clamp, easing: wipeEasing },
            );

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  display: "inline-block",
                  clipPath: `inset(0 0 0 ${wordExit * 100}%)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}
