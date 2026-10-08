"use client";

import type { TikTokPage } from "@remotion/captions";
import { Fragment, useMemo } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  buildCaptionPages,
  type CaptionBaseProps,
  DEFAULT_HOLD_MS,
  useCaptionWordRects,
} from "@/lib/remocn/caption-core";

export interface CaptionTeleprompterProps extends CaptionBaseProps {
  visibleLines?: number;
  pastOpacity?: number;
  futureOpacity?: number;
  upcomingOpacity?: number;
  shadow?: boolean;
}

interface PrompterWord {
  key: number;
  text: string;
  fromMs: number;
}

const LINE_HEIGHT = 1.3;
const LINE_GAP_EM = 0.2;
const SCROLL_MS = 320;
const LIGHT_MS = 80;
const EDGE_FADE_LINES = 0.66;

function edgeFade(visibleLines: number): string | undefined {
  const fadeLines = Math.min(
    EDGE_FADE_LINES,
    Math.max(0, visibleLines - 1) / 3,
  );
  if (fadeLines <= 0) return undefined;
  const pct = (fadeLines / visibleLines) * 100;
  return `linear-gradient(to bottom, transparent, #000 ${pct}%, #000 ${100 - pct}%, transparent)`;
}
const LEGIBILITY_SHADOW =
  "0 2px 3px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.35)";

const scrollEasing = Easing.bezier(0.45, 0, 0.2, 1);

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function lineWords(page: TikTokPage): PrompterWord[] {
  const words: PrompterWord[] = [];
  page.tokens.forEach((token, i) => {
    const last = words[words.length - 1];
    if (last && !/^\s/.test(token.text)) {
      last.text += token.text;
    } else {
      words.push({ key: i, text: token.text.trim(), fromMs: token.fromMs });
    }
  });
  return words;
}

export function CaptionTeleprompter({
  captions,
  combineTokensWithinMilliseconds = 1500,
  holdMs = DEFAULT_HOLD_MS,
  fontSize = 64,
  fontWeight = 800,
  color = "#ffffff",
  visibleLines = 3,
  pastOpacity = 0.35,
  futureOpacity = 0.35,
  upcomingOpacity = 0.55,
  shadow = true,
  className,
}: CaptionTeleprompterProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;
  const lines = useMemo(
    () =>
      buildCaptionPages(captions, {
        combineTokensWithinMilliseconds,
        holdMs,
      }).map((line) => ({ ...line, words: lineWords(line.page) })),
    [captions, combineTokensWithinMilliseconds, holdMs],
  );
  const { wordRef: lineRef, rects } = useCaptionWordRects(0, lines.length);

  const step = (LINE_HEIGHT + LINE_GAP_EM) * fontSize;
  const windowHeight = visibleLines * step;
  const center = (i: number): number => {
    const rect = rects?.[i];
    return rect
      ? rect.top + rect.height / 2
      : i * step + (LINE_HEIGHT * fontSize) / 2;
  };

  const scrollMsAt = (i: number): number => {
    const before =
      i > 0
        ? lines[i].startMs - lines[i - 1].startMs
        : Number.POSITIVE_INFINITY;
    const after =
      i < lines.length - 1
        ? lines[i + 1].startMs - lines[i].startMs
        : Number.POSITIVE_INFINITY;
    return Math.max(1, Math.min(SCROLL_MS, before, after));
  };
  let k = -1;
  lines.forEach((line, i) => {
    if (line.startMs - scrollMsAt(i) / 2 <= timeMs) k = i;
  });
  const scrollMs = k > 0 ? scrollMsAt(k) : SCROLL_MS;
  const progress =
    k <= 0
      ? 1
      : interpolate(
          timeMs - (lines[k].startMs - scrollMs / 2),
          [0, scrollMs],
          [0, 1],
          { ...clamp, easing: scrollEasing },
        );
  const focus = Math.max(k, 0);
  const centerY =
    lines.length === 0
      ? 0
      : k <= 0
        ? center(0)
        : center(k - 1) + (center(k) - center(k - 1)) * progress;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        height: windowHeight,
        fontSize,
        fontWeight,
        color,
        textAlign: "center",
        overflow: "hidden",
        maskImage: edgeFade(visibleLines),
        WebkitMaskImage: edgeFade(visibleLines),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${windowHeight / 2 - centerY}px)`,
        }}
      >
        {lines.map((line, i) => {
          const weight =
            i === focus ? progress : i === focus - 1 ? 1 - progress : 0;
          const rest = i < focus ? pastOpacity : futureOpacity;
          return (
            <div
              key={line.index}
              ref={lineRef(i)}
              style={{
                lineHeight: LINE_HEIGHT,
                marginBottom: `${LINE_GAP_EM}em`,
                textShadow: shadow ? LEGIBILITY_SHADOW : undefined,
              }}
            >
              {line.words.map((word, w) => {
                const lit = interpolate(
                  timeMs - word.fromMs,
                  [-LIGHT_MS, 0],
                  [upcomingOpacity, 1],
                  clamp,
                );
                return (
                  <Fragment key={word.key}>
                    {w > 0 && " "}
                    <span style={{ opacity: rest + (lit - rest) * weight }}>
                      {word.text}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
