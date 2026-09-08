"use client";

import { useId, useLayoutEffect, useMemo, useState } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

export interface KineticMorphTextProps {
  /** One phrase per line, or separate phrases with |. */
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  /** Flight radius in composition pixels. */
  spread?: number;
  /** Maximum letter rotation in degrees. */
  rotation?: number;
  /** Strength of the soft silhouette blend, from 0 to 1. */
  morph?: number;
  /** Opacity of the sampled outline echoes, from 0 to 1. */
  trails?: number;
  transitionFrames?: number;
  holdFrames?: number;
  loop?: boolean;
  speed?: number;
  className?: string;
}

export const kineticMorphTextDefaultText =
  "Hello | Make it move | Shape what's next";

const FONT_FAMILY = "Arial, Helvetica, sans-serif";
const TRANSITION = 54;
const HOLD = 42;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const ease = Easing.bezier(0.65, 0, 0.25, 1);
const smooth = (value: number) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const noise = (index: number) => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function parseKineticMorphText(text: string): string[] {
  return text
    .split(/[|\n\r]+/)
    .map((phrase) => phrase.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/** Includes the last readable hold. Timing values are authored at 30 fps. */
export function getKineticMorphTextDuration({
  text = kineticMorphTextDefaultText,
  transitionFrames = TRANSITION,
  holdFrames = HOLD,
  speed = 1,
}: Pick<
  KineticMorphTextProps,
  "text" | "transitionFrames" | "holdFrames" | "speed" | "loop"
> = {}): number {
  const count = parseKineticMorphText(text).length;
  const transition = Math.max(1, finite(transitionFrames, TRANSITION));
  const hold = Math.max(0, finite(holdFrames, HOLD));
  const rate = Math.max(0.01, finite(speed, 1));
  // Both modes use one transition + hold per phrase. Loop mode starts with
  // a readable first phrase and spends its last transition returning to it.
  const frames = count * (transition + hold);
  return Math.max(1, Math.ceil(frames / rate));
}

/** Last moving frame at defaults; the demo adds a final 42-frame hold. */
export const kineticMorphTextLength = 246;

export interface KineticMorphGlyph {
  character: string;
  x: number;
}

export interface KineticMorphPair {
  from?: KineticMorphGlyph;
  to?: KineticMorphGlyph;
}

/** Reserve identical graphemes before pairing remaining replacements. */
export function matchKineticMorphGlyphs(
  from: KineticMorphGlyph[],
  to: KineticMorphGlyph[],
): KineticMorphPair[] {
  const unused = new Set(from.map((_, index) => index));
  const matches = to.map((target) => {
    let closest = -1;
    let distance = Number.POSITIVE_INFINITY;
    for (const index of unused) {
      const source = from[index];
      if (source.character !== target.character) continue;
      const travel = Math.abs(source.x - target.x);
      if (travel < distance) {
        closest = index;
        distance = travel;
      }
    }
    if (closest !== -1) unused.delete(closest);
    return closest;
  });
  const remaining = [...unused];
  const pairs: KineticMorphPair[] = to.map((target, index) => {
    const source = matches[index] === -1 ? remaining.shift() : matches[index];
    return {
      from: source === undefined ? undefined : from[source],
      to: target,
    };
  });
  for (const index of remaining) pairs.push({ from: from[index] });
  return pairs;
}

export function getKineticMorphTimeline(
  frame: number,
  count: number,
  transitionFrames = TRANSITION,
  holdFrames = HOLD,
  loop = false,
) {
  const transition = Math.max(1, finite(transitionFrames, TRANSITION));
  const hold = Math.max(0, finite(holdFrames, HOLD));
  const time = Math.max(0, finite(frame, 0));
  if (count === 0) return { from: -1, to: -1, progress: 1 };
  if (!loop && time < transition) {
    return { from: -1, to: 0, progress: time / transition };
  }
  const cursor = loop ? time : time - transition;
  const cycle = transition + hold;
  const index = Math.floor(cursor / cycle);
  if ((!loop && index >= count - 1) || (loop && count === 1)) {
    return { from: count - 1, to: count - 1, progress: 1 };
  }
  return {
    from: index % count,
    to: (index + 1) % count,
    progress: clamp(((cursor % cycle) - hold) / transition),
  };
}

interface PoseOptions {
  spread: number;
  rotation: number;
  morph: number;
}

export function getKineticMorphPose(
  pair: KineticMorphPair,
  index: number,
  count: number,
  progress: number,
  { spread, rotation, morph }: PoseOptions,
) {
  // A bounded stagger keeps long phrases within the same transition window.
  const delay = noise(index + 3) * 0.12;
  const p = clamp((progress - delay) / (1 - delay));
  const travel = ease(p);
  const motion = Math.sin(Math.PI * travel);
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
  const orbitX = Math.cos(angle) * spread * (0.7 + noise(index) * 0.4);
  const orbitY = Math.sin(angle) * spread * 0.72 - spread * 0.25;
  const fromX = pair.from?.x ?? orbitX * 1.2;
  const toX = pair.to?.x ?? orbitX * 1.2;
  const fromY = pair.from ? 0 : orbitY + spread * 0.65;
  const toY = pair.to ? 0 : orbitY - spread * 0.6;
  const x = mix(fromX, toX, travel) + orbitX * motion;
  const y = mix(fromY, toY, travel) + orbitY * motion;
  const turn = (noise(index + 9) * 2 - 1) * rotation;
  const rotate = pair.from
    ? pair.to
      ? turn * motion
      : turn * travel
    : turn * (1 - travel);
  const replacement = Boolean(
    pair.from && pair.to && pair.from.character !== pair.to.character,
  );
  const blend = replacement ? smooth((p - 0.36) / 0.28) : 0;
  const melt = replacement ? Math.sin(Math.PI * blend) * morph : 0;
  const opacity = pair.from
    ? pair.to
      ? 1
      : 1 - smooth((p - 0.35) / 0.5)
    : smooth(p / 0.36);
  return {
    x,
    y,
    rotate,
    scaleX: 1 - melt * 0.52 + motion * 0.08,
    scaleY: 1 + melt * 0.42 - motion * 0.06,
    blend,
    melt,
    opacity,
    motion,
  };
}

interface Layout {
  key: string;
  phrases: KineticMorphGlyph[][];
  size: number;
  baseline: number;
}

function useGlyphLayout(
  text: string,
  size: number,
  weight: number,
  width: number,
) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const key = JSON.stringify([text, size, weight, width]);

  useLayoutEffect(() => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const phrases = parseKineticMorphText(text).map((phrase) =>
      Array.from(segmenter.segment(phrase), ({ segment }) => segment),
    );
    context.font = `${weight} ${size}px ${FONT_FAMILY}`;
    context.fontKerning = "none";
    const advances = phrases.map((phrase) =>
      phrase.map((character) => context.measureText(character).width),
    );
    const widths = advances.map((row) =>
      row.reduce((sum, value) => sum + value, 0),
    );
    const fit = Math.min(1, (width * 0.82) / Math.max(1, ...widths));
    const metrics = context.measureText("Hg");
    setLayout({
      key,
      size: size * fit,
      baseline:
        ((metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) /
          2) *
        fit,
      phrases: phrases.map((phrase, row) => {
        let cursor = (-widths[row] * fit) / 2;
        return phrase.flatMap((character, column) => {
          const advance = advances[row][column] * fit;
          const x = cursor + advance / 2;
          cursor += advance;
          return character.trim() ? [{ character, x }] : [];
        });
      }),
    });
  }, [key, text, size, weight, width]);

  return layout?.key === key ? layout : null;
}

function MorphGlyph({
  pair,
  index,
  count,
  progress,
  options,
  size,
  baseline,
  color,
  trails,
  transitionFrames,
}: {
  pair: KineticMorphPair;
  index: number;
  count: number;
  progress: number;
  options: PoseOptions;
  size: number;
  baseline: number;
  color: string;
  trails: number;
  transitionFrames: number;
}) {
  const filterId = useId().replace(/:/g, "");
  const pose = getKineticMorphPose(pair, index, count, progress, options);
  const transform = (value: typeof pose) =>
    `translate(${value.x} ${value.y}) rotate(${value.rotate}) scale(${value.scaleX} ${value.scaleY})`;
  const replacement =
    pair.from && pair.to && pair.from.character !== pair.to.character;
  const character = pair.from?.character ?? pair.to?.character;

  return (
    <g>
      {trails > 0 && pose.motion > 0.001
        ? [3, 2, 1].map((sample) => {
            const echo = getKineticMorphPose(
              pair,
              index,
              count,
              Math.max(0, progress - (sample * 1.5) / transitionFrames),
              options,
            );
            return (
              <text
                key={sample}
                transform={transform(echo)}
                y={baseline}
                fill="none"
                stroke={color}
                strokeWidth={Math.max(0.7, size * 0.009)}
                opacity={echo.opacity * pose.motion * trails * (1 - sample / 4)}
              >
                {replacement && echo.blend > 0.5
                  ? pair.to?.character
                  : character}
              </text>
            );
          })
        : null}
      {replacement && pose.melt > 0.001 ? (
        <defs>
          <filter
            id={filterId}
            x="-70%"
            y="-70%"
            width="240%"
            height="240%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={pose.melt * size * 0.045} />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -4"
            />
          </filter>
        </defs>
      ) : null}
      <g transform={transform(pose)} opacity={pose.opacity}>
        <g
          filter={
            replacement && pose.melt > 0.001 ? `url(#${filterId})` : undefined
          }
          fill={color}
        >
          <text y={baseline} opacity={replacement ? 1 - pose.blend : 1}>
            {character}
          </text>
          {replacement ? (
            <text y={baseline} opacity={pose.blend}>
              {pair.to?.character}
            </text>
          ) : null}
        </g>
      </g>
    </g>
  );
}

export function KineticMorphText({
  text = kineticMorphTextDefaultText,
  fontSize = 100,
  fontWeight = 600,
  color = "#b4f4d9",
  backgroundColor = "#a800b7",
  spread = 180,
  rotation = 110,
  morph = 0.75,
  trails = 0.45,
  transitionFrames = TRANSITION,
  holdFrames = HOLD,
  loop = false,
  speed = 1,
  className,
}: KineticMorphTextProps) {
  const currentFrame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const frame = currentFrame * (30 / fps) * Math.max(0, finite(speed, 1));
  const size = Math.min(height * 0.28, Math.max(1, finite(fontSize, 100)));
  const weight = Math.min(900, Math.max(100, finite(Number(fontWeight), 600)));
  const layout = useGlyphLayout(text, size, weight, width);
  const transition = Math.max(1, finite(transitionFrames, TRANSITION));
  const timeline = getKineticMorphTimeline(
    frame,
    layout?.phrases.length ?? 0,
    transition,
    holdFrames,
    loop,
  );
  const pairs = useMemo(
    () =>
      matchKineticMorphGlyphs(
        layout?.phrases[timeline.from] ?? [],
        layout?.phrases[timeline.to] ?? [],
      ),
    [layout, timeline.from, timeline.to],
  );
  const options = {
    spread: Math.min(
      width * 0.24,
      height * 0.32,
      Math.max(0, finite(spread, 180)),
    ),
    rotation: Math.max(0, finite(rotation, 110)),
    morph: clamp(finite(morph, 0.75)),
  };

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={parseKineticMorphText(text).join(". ")}
        style={{
          display: "block",
          fontFamily: FONT_FAMILY,
          fontSize: layout?.size ?? size,
          fontWeight: weight,
          fontKerning: "none",
        }}
      >
        <g
          transform={`translate(${width / 2} ${height / 2})`}
          textAnchor="middle"
        >
          {layout
            ? pairs.map((pair, index) => (
                <MorphGlyph
                  key={`${timeline.from}:${timeline.to}:${index}`}
                  pair={pair}
                  index={index}
                  count={pairs.length}
                  progress={timeline.progress}
                  options={options}
                  size={layout.size}
                  baseline={layout.baseline}
                  color={color}
                  trails={clamp(finite(trails, 0.45))}
                  transitionFrames={transition}
                />
              ))
            : null}
        </g>
      </svg>
    </div>
  );
}
