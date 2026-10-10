"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Easing,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";

export interface InlineWordRollProps {
  prefix?: string;
  /** Separate words or phrases with | or newlines. */
  text?: string;
  suffix?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  /** Initial interval between switches, in frames. */
  interval?: number;
  /** Each following interval is multiplied by this number; 1 keeps a steady pace. */
  acceleration?: number;
  transitionFrames?: number;
}

export const inlineWordRollDefaultText =
  "leads | customers | subscribers | appointments | demos | quotes | registrants | trials | conversions";

export const parseInlineWords = (text: string) =>
  text
    .split(/[|\n\r]+/)
    .map((word) => word.trim())
    .filter(Boolean);

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = Easing.bezier(0.22, 0.75, 0.25, 1);

export function getInlineWordRollState(
  frame: number,
  count: number,
  interval = 12,
  acceleration = 0.9,
  transitionFrames = 6,
) {
  const transition = Math.max(1, finite(transitionFrames, 6));
  const gap = Math.max(transition, finite(interval, 12));
  const rate = Math.min(1, Math.max(0.5, finite(acceleration, 0.9)));
  const f = Math.max(0, finite(frame, 0));
  let start = 0;
  for (let index = 1; index < count; index++) {
    start += Math.max(transition, gap * rate ** (index - 1));
    if (f < start) return { from: index - 1, to: index - 1, progress: 1 };
    if (f < start + transition)
      return {
        from: index - 1,
        to: index,
        progress: clamp((f - start) / transition),
      };
  }
  const last = Math.max(0, count - 1);
  return { from: last, to: last, progress: 1 };
}

export function getInlineWordRollDuration({
  text = inlineWordRollDefaultText,
  interval = 12,
  acceleration = 0.9,
  transitionFrames = 6,
}: Pick<
  InlineWordRollProps,
  "text" | "interval" | "acceleration" | "transitionFrames"
> = {}) {
  const count = parseInlineWords(text).length;
  const transition = Math.max(1, finite(transitionFrames, 6));
  const gap = Math.max(transition, finite(interval, 12));
  const rate = Math.min(1, Math.max(0.5, finite(acceleration, 0.9)));
  let total = 0;
  for (let index = 0; index < count - 1; index++)
    total += Math.max(transition, gap * rate ** index);
  return count < 2 ? 0 : Math.ceil(total + transition);
}

export function InlineWordRoll({
  prefix = "Looking for",
  text = inlineWordRollDefaultText,
  suffix = "?",
  fontSize = 60,
  fontFamily = "Arial, Helvetica, sans-serif",
  fontWeight = 400,
  color = "#f5f5f5",
  interval = 12,
  acceleration = 0.9,
  transitionFrames = 6,
}: InlineWordRollProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const words = parseInlineWords(text);
  const measurement = useRef<HTMLDivElement>(null);
  const pending = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<{
    prefix: number;
    words: number[];
  } | null>(null);
  const size = Math.max(1, finite(fontSize, 60));
  const typography = {
    fontFamily,
    fontSize: size,
    fontWeight,
    letterSpacing: "-0.035em",
    lineHeight: 1.2,
    whiteSpace: "pre" as const,
  };

  useLayoutEffect(() => {
    let cancelled = false;
    const handle = delayRender("Measure Inline Word Roll font");
    pending.current = handle;
    void document.fonts
      .load(
        `${fontWeight} ${size}px ${fontFamily}`,
        `${prefix} ${text}${suffix}`,
      )
      .then(() => {
        if (cancelled || !measurement.current) return;
        const children = Array.from(measurement.current.children);
        // Computed widths are in composition pixels. Bounding rectangles include
        // the Player's preview scale and would shrink our layout a second time.
        const measure = (node: Element) =>
          Number.parseFloat(getComputedStyle(node).width);
        setMetrics({
          prefix: measure(children[0]),
          words: children.slice(1).map(measure),
        });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          cancelRender(
            error instanceof Error ? error : new Error(String(error)),
          );
      });
    return () => {
      cancelled = true;
      continueRender(handle);
      if (pending.current === handle) pending.current = null;
    };
  }, [
    prefix,
    text,
    suffix,
    size,
    fontFamily,
    fontWeight,
    delayRender,
    continueRender,
    cancelRender,
  ]);

  useLayoutEffect(() => {
    if (metrics && pending.current !== null) {
      continueRender(pending.current);
      pending.current = null;
    }
  }, [metrics, continueRender]);

  const state = getInlineWordRollState(
    frame,
    words.length,
    interval,
    acceleration,
    transitionFrames,
  );
  const moving = state.from !== state.to;
  const p = ease(state.progress);
  const gap = prefix ? size * 0.23 : 0;
  const prefixWidth = metrics?.prefix ?? 0;
  const fromWidth = metrics?.words[state.from] ?? 0;
  const toWidth = metrics?.words[state.to] ?? 0;
  const slotWidth = fromWidth + (toWidth - fromWidth) * p;
  const totalWidth = prefixWidth + gap + slotWidth;
  const widest = prefixWidth + gap + Math.max(0, ...(metrics?.words ?? []));
  const fit = Math.min(
    1,
    (width * 0.84) / Math.max(1, widest),
    (height * 0.5) / (size * 1.2),
  );
  const rowHeight = size * 1.2;

  return (
    <div
      role="img"
      aria-label={[prefix, words[state.to] ? `${words[state.to]}${suffix}` : ""]
        .filter(Boolean)
        .join(" ")}
      style={{ position: "absolute", inset: 0, overflow: "hidden", color }}
    >
      <div
        ref={measurement}
        aria-hidden="true"
        style={{
          ...typography,
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "inline-block" }}>{prefix}</span>
        {words.map((word, index) => (
          <span key={`${index}:${word}`} style={{ display: "inline-block" }}>
            {word}
            {suffix}
          </span>
        ))}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          scale: fit,
          visibility: metrics && words.length ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            ...typography,
            position: "absolute",
            left: -totalWidth / 2,
            top: -rowHeight / 2,
            height: rowHeight,
          }}
        >
          <span style={{ position: "absolute", left: 0 }}>{prefix}</span>
          <div
            style={{
              position: "absolute",
              left: prefixWidth + gap,
              top: 0,
              width: Math.max(fromWidth, toWidth) + size * 0.12,
              height: rowHeight,
              overflow: "hidden",
              maskImage:
                "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                translate: `0 ${moving ? -p * rowHeight : 0}px`,
                opacity: moving ? 1 - clamp(p * 1.2) : 1,
              }}
            >
              {words[state.from]}
              {words.length ? suffix : ""}
            </span>
            {moving ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  translate: `0 ${(1 - p) * rowHeight}px`,
                  opacity: clamp(p * 1.6),
                }}
              >
                {words[state.to]}
                {suffix}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
