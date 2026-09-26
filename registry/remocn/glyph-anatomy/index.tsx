"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import { type Font, parse } from "opentype.js";
import { useEffect, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface GlyphAnatomyProps {
  text?: string;
  fontUrl?: string;
  fontSize?: number;
  color?: string;
  guideColor?: string;
  guides?: boolean;
  keepPoints?: boolean;
  speed?: number;
  className?: string;
}

/** Static Inter ExtraBold (800) from Google Fonts. */
export const interExtraBoldTtf =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf";

export const glyphAnatomyDefaults = {
  text: "Glyph",
  fontUrl: interExtraBoldTtf,
  fontSize: 200,
  color: "#fafafa",
  guideColor: "#0d99ff",
  guides: true,
  keepPoints: false,
  speed: 1,
} satisfies Required<Omit<GlyphAnatomyProps, "className">>;

/** Beats on the 30 fps clock. Letter beats shift by `letterStagger × i`. */
export const glyphAnatomyTiming = {
  guideStart: 0,
  guideStagger: 3,
  guideDraw: 10,
  anchors: [8, 22],
  anchorPop: 4,
  pull: [18, 40],
  pullDuration: 8,
  fill: [40, 50],
  fade: [46, 58],
  letterStagger: 2,
} as const;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOutCubic = Easing.out(Easing.cubic);
const easeInOutCubic = Easing.inOut(Easing.cubic);
const popEase = Easing.out(Easing.back(1.7));
const pullEase = Easing.out(Easing.back(1.6));

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getGlyphAnatomyTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

export interface Point {
  x: number;
  y: number;
}

export interface AnatomySegment {
  from: Point;
  to: Point;
  /** Cubic handles; absent on straight segments. */
  c1?: Point;
  c2?: Point;
}

export interface PathCommand {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

const lerp = (a: Point, b: Point, k: number): Point => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
});

/**
 * Turns glyph path commands into contours of explicit segments. Quadratic
 * curves become cubics (handles at ⅔ toward the control point), so every
 * curve shows one handle on each end, as in Figma or Glyphs.
 */
export function getAnatomyContours(
  commands: readonly PathCommand[],
): AnatomySegment[][] {
  const contours: AnatomySegment[][] = [];
  let segments: AnatomySegment[] = [];
  let start: Point | null = null;
  let at: Point | null = null;
  const close = () => {
    if (start && at && (at.x !== start.x || at.y !== start.y)) {
      segments.push({ from: at, to: start });
    }
    if (segments.length > 0) contours.push(segments);
    segments = [];
    start = null;
    at = null;
  };
  for (const c of commands) {
    const to = { x: c.x ?? 0, y: c.y ?? 0 };
    if (c.type === "M") {
      close();
      start = to;
      at = to;
    } else if (!at) {
    } else if (c.type === "L") {
      segments.push({ from: at, to });
      at = to;
    } else if (c.type === "Q") {
      const q = { x: c.x1 ?? 0, y: c.y1 ?? 0 };
      segments.push({
        from: at,
        to,
        c1: lerp(at, q, 2 / 3),
        c2: lerp(to, q, 2 / 3),
      });
      at = to;
    } else if (c.type === "C") {
      segments.push({
        from: at,
        to,
        c1: { x: c.x1 ?? 0, y: c.y1 ?? 0 },
        c2: { x: c.x2 ?? 0, y: c.y2 ?? 0 },
      });
      at = to;
    } else if (c.type === "Z") {
      close();
    }
  }
  close();
  return contours;
}

/**
 * How far each handle has travelled from its anchor to its place, 0 → 1 with
 * overshoot. At 0 the curve is its chord.
 */
export function getGlyphAnatomyPull(t: number, order: number, total: number) {
  const { pull, pullDuration } = glyphAnatomyTiming;
  const span = pull[1] - pull[0] - pullDuration;
  const start = pull[0] + (total > 1 ? (span * order) / (total - 1) : 0);
  return interpolate(t, [start, start + pullDuration], [0, 1], {
    ...CLAMP,
    easing: pullEase,
  });
}

/** Scale of anchor `order` of `total` popping in along the letter's path. */
export function getGlyphAnatomyAnchor(t: number, order: number, total: number) {
  const { anchors, anchorPop } = glyphAnatomyTiming;
  const span = anchors[1] - anchors[0] - anchorPop;
  const start = anchors[0] + (total > 1 ? (span * order) / (total - 1) : 0);
  return Math.max(
    0,
    interpolate(t, [start, start + anchorPop], [0, 1], {
      ...CLAMP,
      easing: popEase,
    }),
  );
}

/** Letter-level fades: outline in, fill in, scaffolding out. */
export function getGlyphAnatomyLetter(t: number) {
  const { anchors, fill, fade } = glyphAnatomyTiming;
  return {
    outline: interpolate(t, [anchors[0], anchors[0] + 4], [0, 1], CLAMP),
    fill: interpolate(t, [...fill], [0, 1], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
    scaffold: interpolate(t, [...fade], [1, 0], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
  };
}

/** Draw progress of guide `index`, 0..1. */
export function getGlyphAnatomyGuide(t: number, index: number) {
  const { guideStart, guideStagger, guideDraw } = glyphAnatomyTiming;
  const start = guideStart + guideStagger * index;
  return interpolate(t, [start, start + guideDraw], [0, 1], {
    ...CLAMP,
    easing: easeOutCubic,
  });
}

/** Frame where the scaffolding of the last of `count` letters has faded. */
export function getGlyphAnatomyLength(count: number) {
  const { fade, letterStagger } = glyphAnatomyTiming;
  return fade[1] + letterStagger * Math.max(0, count - 1);
}

/** Path data for a contour with each handle pulled `k(segment)` of the way. */
export function getAnatomyPath(
  segments: readonly AnatomySegment[],
  pullOf: (index: number) => number,
) {
  if (segments.length === 0) return "";
  const f = (p: Point) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  let d = `M${f(segments[0].from)}`;
  segments.forEach((s, i) => {
    if (s.c1 && s.c2) {
      const k = pullOf(i);
      d += `C${f(lerp(s.from, s.c1, k))} ${f(lerp(s.to, s.c2, k))} ${f(s.to)}`;
    } else {
      d += `L${f(s.to)}`;
    }
  });
  return `${d}Z`;
}

interface AnatomyLetter {
  contours: AnatomySegment[][];
}

function layout(font: Font, text: string, fontSize: number) {
  const scale = fontSize / font.unitsPerEm;
  // Per-character lookup: full shaping runs GSUB lookups that opentype.js
  // does not support in every font.
  const glyphs = Array.from(text).map((char) => font.charToGlyph(char));
  let x = 0;
  const letters: AnatomyLetter[] = glyphs.map((glyph, i) => {
    if (i > 0) x += font.getKerningValue(glyphs[i - 1], glyph) * scale;
    const contours = getAnatomyContours(glyph.getPath(x, 0, fontSize).commands);
    x += (glyph.advanceWidth ?? 0) * scale;
    return { contours };
  });
  const os2 = font.tables.os2 as
    | { sCapHeight?: number; sxHeight?: number }
    | undefined;
  const em = (v: number | undefined, fallback: number) =>
    ((v ?? fallback * font.unitsPerEm) * fontSize) / font.unitsPerEm;
  return {
    letters,
    width: x,
    capHeight: em(os2?.sCapHeight, 0.7),
    xHeight: em(os2?.sxHeight, 0.5),
    descender: (-font.descender * fontSize) / font.unitsPerEm,
  };
}

const fontCache = new Map<string, Promise<Font>>();

function loadAnatomyFont(url: string) {
  let pending = fontCache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => parse(buffer));
    fontCache.set(url, pending);
    pending.catch(() => fontCache.delete(url));
  }
  return pending;
}

function useAnatomyFont(url: string) {
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    const handle = delayRender(`glyph-anatomy: loading ${url}`);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    loadAnatomyFont(url).then((parsed) => {
      if (!released) setFont(parsed);
      release();
    }, release);
    return release;
  }, [url]);

  return font;
}

export function GlyphAnatomy({
  text = glyphAnatomyDefaults.text,
  fontUrl = glyphAnatomyDefaults.fontUrl,
  fontSize = glyphAnatomyDefaults.fontSize,
  color = glyphAnatomyDefaults.color,
  guideColor = glyphAnatomyDefaults.guideColor,
  guides = glyphAnatomyDefaults.guides,
  keepPoints = glyphAnatomyDefaults.keepPoints,
  speed = glyphAnatomyDefaults.speed,
  className,
}: GlyphAnatomyProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const font = useAnatomyFont(fontUrl);
  if (!font) return null;

  const unit = height / 720;
  const t = getGlyphAnatomyTime(frame, { fps, speed });
  const word = layout(font, text, fontSize);
  const originX = (width - word.width * unit) / 2;
  const baseline = (height + word.capHeight * unit) / 2;
  const hair = 1.25;
  const anchorSize = 6;
  const handleRadius = 2.6;
  const margin = 0.3 * fontSize;
  // Guides fade with the last letter's scaffolding.
  const lastStart =
    glyphAnatomyTiming.letterStagger * Math.max(0, word.letters.length - 1);
  const scaffoldAll = keepPoints
    ? 1
    : getGlyphAnatomyLetter(t - lastStart).scaffold;

  const guideLines = [
    { label: "Cap height", y: -word.capHeight },
    { label: "x-height", y: -word.xHeight },
    { label: "Baseline", y: 0 },
    { label: "Descender", y: word.descender },
  ];

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block" }}
      >
        <g transform={`translate(${originX} ${baseline}) scale(${unit})`}>
          {guides
            ? guideLines.map((guide, i) => {
                const draw = getGlyphAnatomyGuide(t, i);
                if (draw <= 0) return null;
                const length = word.width + 2 * margin;
                return (
                  <g key={guide.label} opacity={0.7 * scaffoldAll}>
                    <line
                      x1={-margin}
                      x2={-margin + length * draw}
                      y1={guide.y}
                      y2={guide.y}
                      stroke={guideColor}
                      strokeWidth={hair * 0.8}
                    />
                    <text
                      x={-margin}
                      y={guide.y - 5}
                      fill={guideColor}
                      fontFamily={INTER}
                      fontSize={11}
                      fontWeight={500}
                      opacity={draw}
                    >
                      {guide.label}
                    </text>
                  </g>
                );
              })
            : null}
          {word.letters.map((letter, i) => {
            const lt = t - glyphAnatomyTiming.letterStagger * i;
            const state = getGlyphAnatomyLetter(lt);
            const scaffold = keepPoints ? 1 : state.scaffold;
            const curves = letter.contours.flatMap((segments, c) =>
              segments.flatMap((s, k) => (s.c1 ? [`${c}:${k}`] : [])),
            );
            const curveOrder = new Map(curves.map((key, n) => [key, n]));
            const anchors = letter.contours.flatMap((segments) =>
              segments.map((s) => s.from),
            );
            const pullOf = (c: number) => (k: number) =>
              getGlyphAnatomyPull(
                lt,
                curveOrder.get(`${c}:${k}`) ?? 0,
                curves.length,
              );
            const paths = letter.contours.map((segments, c) =>
              getAnatomyPath(segments, pullOf(c)),
            );
            let anchorIndex = 0;
            return (
              <g key={i}>
                {state.fill > 0 ? (
                  <path d={paths.join("")} fill={color} opacity={state.fill} />
                ) : null}
                {state.outline > 0 && scaffold > 0 ? (
                  <g opacity={scaffold}>
                    {paths.map((d, c) => (
                      <path
                        key={c}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth={hair}
                        opacity={state.outline}
                      />
                    ))}
                    {letter.contours.map((segments, c) =>
                      segments.map((s, k) => {
                        if (!s.c1 || !s.c2) return null;
                        const pull = pullOf(c)(k);
                        if (pull <= 0) return null;
                        const h1 = lerp(s.from, s.c1, pull);
                        const h2 = lerp(s.to, s.c2, pull);
                        return (
                          <g key={`${c}-${k}`}>
                            <line
                              x1={s.from.x}
                              y1={s.from.y}
                              x2={h1.x}
                              y2={h1.y}
                              stroke={guideColor}
                              strokeWidth={hair * 0.8}
                            />
                            <line
                              x1={s.to.x}
                              y1={s.to.y}
                              x2={h2.x}
                              y2={h2.y}
                              stroke={guideColor}
                              strokeWidth={hair * 0.8}
                            />
                            <circle
                              cx={h1.x}
                              cy={h1.y}
                              r={handleRadius}
                              fill={guideColor}
                            />
                            <circle
                              cx={h2.x}
                              cy={h2.y}
                              r={handleRadius}
                              fill={guideColor}
                            />
                          </g>
                        );
                      }),
                    )}
                    {letter.contours.map((segments, c) =>
                      segments.map((s, k) => {
                        const scale = getGlyphAnatomyAnchor(
                          lt,
                          anchorIndex++,
                          anchors.length,
                        );
                        if (scale <= 0) return null;
                        const size = anchorSize * scale;
                        return (
                          <rect
                            key={`${c}-${k}`}
                            x={s.from.x - size / 2}
                            y={s.from.y - size / 2}
                            width={size}
                            height={size}
                            fill="#ffffff"
                            stroke={guideColor}
                            strokeWidth={hair}
                          />
                        );
                      }),
                    )}
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
