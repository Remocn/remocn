"use client";

import type { Caption } from "@remotion/captions";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionBaseProps } from "@/lib/remocn/caption-core";

export interface CaptionTimelineProps extends CaptionBaseProps {
  width?: number;
  pxPerSecond?: number;
  playheadPosition?: number;
  playheadColor?: string;
  upcomingOpacity?: number;
  shadow?: boolean;
}

interface TimelineWord {
  id: number;
  text: string;
  startMs: number;
  endMs: number;
}

const LINE_HEIGHT = 1.3;
const GAP_EM = 0.32;
const LIGHT_MS = 80;
const EDGE_FADE =
  "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)";
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function getTimelineWords(captions: Caption[]): TimelineWord[] {
  const words: TimelineWord[] = [];
  for (const caption of captions) {
    if (caption.text.trim() === "") continue;
    const last = words[words.length - 1];
    if (last && !/^\s/.test(caption.text)) {
      last.text += caption.text;
      last.endMs = caption.endMs;
    } else {
      words.push({
        id: words.length,
        text: caption.text.trim(),
        startMs: caption.startMs,
        endMs: caption.endMs,
      });
    }
  }
  return words;
}

export function layoutTimeline(
  words: TimelineWord[],
  widths: number[],
  pxPerSecond: number,
  gap: number,
): number[] {
  const xs: number[] = [];
  words.forEach((word, i) => {
    const ideal = (word.startMs / 1000) * pxPerSecond;
    xs.push(i === 0 ? ideal : Math.max(ideal, xs[i - 1] + widths[i - 1] + gap));
  });
  return xs;
}

export function timelineOffset(
  words: TimelineWord[],
  xs: number[],
  timeMs: number,
  pxPerSecond: number,
): number {
  if (words.length === 0) return (timeMs / 1000) * pxPerSecond;
  let i = -1;
  while (i + 1 < words.length && words[i + 1].startMs <= timeMs) i++;
  if (i === -1) {
    return xs[0] - ((words[0].startMs - timeMs) / 1000) * pxPerSecond;
  }
  const next = words[i + 1];
  if (!next) {
    return xs[i] + ((timeMs - words[i].startMs) / 1000) * pxPerSecond;
  }
  const span = next.startMs - words[i].startMs;
  const t = span > 0 ? (timeMs - words[i].startMs) / span : 1;
  return xs[i] + (xs[i + 1] - xs[i]) * t;
}

function sameWidths(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((w, i) => w === b[i]);
}

export function CaptionTimeline({
  captions,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  width = 1100,
  pxPerSecond = 260,
  playheadPosition = 0.35,
  playheadColor = "#facc15",
  upcomingOpacity = 0.4,
  shadow = true,
  className,
}: CaptionTimelineProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;
  const words = useMemo(() => getTimelineWords(captions), [captions]);
  const elements = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[]>([]);

  useLayoutEffect(() => {
    const measured = words.map((_, i) => elements.current[i]?.offsetWidth ?? 0);
    setWidths((prev) => (sameWidths(prev, measured) ? prev : measured));
  });

  const gap = fontSize * GAP_EM;
  const resolved =
    widths.length === words.length
      ? widths
      : words.map((word) => word.text.length * fontSize * 0.55);
  const xs = layoutTimeline(words, resolved, pxPerSecond, gap);
  const playheadX = width * playheadPosition;
  const offset = timelineOffset(words, xs, timeMs, pxPerSecond);
  const thickness = Math.max(2, Math.round(fontSize * 0.04));

  if (words.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height: `${LINE_HEIGHT}em`,
        fontSize,
        fontWeight,
        color,
        lineHeight: LINE_HEIGHT,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          maskImage: EDGE_FADE,
          WebkitMaskImage: EDGE_FADE,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${playheadX - offset}px)`,
          }}
        >
          {words.map((word, i) => (
            <span
              key={word.id}
              ref={(el) => {
                elements.current[i] = el;
              }}
              style={{
                position: "absolute",
                left: xs[i],
                top: 0,
                whiteSpace: "nowrap",
                opacity: interpolate(
                  timeMs - word.startMs,
                  [-LIGHT_MS, 0],
                  [upcomingOpacity, 1],
                  clamp,
                ),
                textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
              }}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "8%",
          bottom: "8%",
          left: playheadX - thickness / 2,
          width: thickness,
          borderRadius: thickness,
          background: playheadColor,
        }}
      />
    </div>
  );
}
