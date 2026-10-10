"use client";

import { type Font, parse } from "opentype.js";
import { useEffect, useId, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface OutlineTraceProps {
  text?: string;
  fontUrl?: string;
  fontSize?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  stagger?: number;
  fill?: boolean;
  keepStroke?: boolean;
  speed?: number;
  className?: string;
}

/** Static Inter ExtraBold (800) from Google Fonts. */
export const interExtraBoldTtf =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf";

export const outlineTraceDefaults = {
  text: "Outline",
  fontUrl: interExtraBoldTtf,
  fontSize: 150,
  color: "#fafafa",
  strokeColor: "",
  strokeWidth: 2.5,
  stagger: 3,
  fill: true,
  keepStroke: false,
  speed: 1,
} satisfies Required<Omit<OutlineTraceProps, "className">>;

/** Per-letter beats on the 30 fps clock, relative to the letter's start. */
export const outlineTraceTiming = {
  outer: [0, 18],
  counter: [4, 18],
  fill: [14, 26],
} as const;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeInOutCubic = Easing.inOut(Easing.cubic);
const easeOutCubic = Easing.out(Easing.cubic);

function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Maps a composition frame onto the 30 fps timeline, scaled by `speed`. */
export function getOutlineTraceTime(
  frame: number,
  options: { fps?: number; speed?: number } = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, 1));
  return (Math.max(0, finite(frame, 0)) * 30 * speed) / fps;
}

export interface OutlineTraceLetterState {
  /** Trim progress of the outer contours, 0..1. */
  outer: number;
  /** Trim progress of the counters, 0..1. */
  counter: number;
  /** Share of the glyph box the fill has risen through, 0..1. */
  fill: number;
}

export function getOutlineTraceLetter(
  t: number,
  index: number,
  stagger = outlineTraceDefaults.stagger,
): OutlineTraceLetterState {
  const u = t - index * Math.max(0, finite(stagger, 3));
  const { outer, counter, fill } = outlineTraceTiming;
  return {
    outer: interpolate(u, [...outer], [0, 1], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
    counter: interpolate(u, [...counter], [0, 1], {
      ...CLAMP,
      easing: easeInOutCubic,
    }),
    fill: interpolate(u, [...fill], [0, 1], { ...CLAMP, easing: easeOutCubic }),
  };
}

/** Frame where the last of `count` letters has filled. */
export function getOutlineTraceLength(
  count: number,
  stagger = outlineTraceDefaults.stagger,
) {
  const last = Math.max(0, count - 1) * Math.max(0, finite(stagger, 3));
  return Math.ceil(last + outlineTraceTiming.fill[1]);
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

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OutlineContour {
  d: string;
  box: Box;
  /** True for a hole inside another contour of the same glyph. */
  counter: boolean;
}

const fmt = (n: number) => Number(n.toFixed(2));

/**
 * Splits glyph path commands into closed contours and marks the counters:
 * contours whose box lies inside another contour's box.
 */
export function getOutlineContours(commands: readonly PathCommand[]) {
  const raw: { d: string; box: Box }[] = [];
  let d = "";
  let box: Box | null = null;
  const grow = (x = 0, y = 0) => {
    if (!box) box = { x0: x, y0: y, x1: x, y1: y };
    else {
      box.x0 = Math.min(box.x0, x);
      box.y0 = Math.min(box.y0, y);
      box.x1 = Math.max(box.x1, x);
      box.y1 = Math.max(box.y1, y);
    }
  };
  const close = () => {
    if (d && box) raw.push({ d: `${d}Z`, box });
    d = "";
    box = null;
  };
  for (const c of commands) {
    if (c.type === "M") {
      close();
      d = `M${fmt(c.x ?? 0)} ${fmt(c.y ?? 0)}`;
      grow(c.x, c.y);
    } else if (c.type === "L") {
      d += `L${fmt(c.x ?? 0)} ${fmt(c.y ?? 0)}`;
      grow(c.x, c.y);
    } else if (c.type === "Q") {
      d += `Q${fmt(c.x1 ?? 0)} ${fmt(c.y1 ?? 0)} ${fmt(c.x ?? 0)} ${fmt(c.y ?? 0)}`;
      grow(c.x1, c.y1);
      grow(c.x, c.y);
    } else if (c.type === "C") {
      d += `C${fmt(c.x1 ?? 0)} ${fmt(c.y1 ?? 0)} ${fmt(c.x2 ?? 0)} ${fmt(c.y2 ?? 0)} ${fmt(c.x ?? 0)} ${fmt(c.y ?? 0)}`;
      grow(c.x1, c.y1);
      grow(c.x2, c.y2);
      grow(c.x, c.y);
    } else if (c.type === "Z") {
      close();
    }
  }
  close();
  const inside = (a: Box, b: Box) =>
    a !== b && a.x0 >= b.x0 && a.y0 >= b.y0 && a.x1 <= b.x1 && a.y1 <= b.y1;
  return raw.map(
    (c): OutlineContour => ({
      ...c,
      counter: raw.some((other) => inside(c.box, other.box)),
    }),
  );
}

export interface OutlineGlyph {
  contours: OutlineContour[];
  box: Box | null;
}

/**
 * Lays out `text` in reference px with the baseline at y = 0. Glyphs are
 * looked up per character: full shaping runs GSUB lookups that opentype.js
 * does not support in every font.
 */
export function layoutOutlineGlyphs(
  font: Font,
  text: string,
  fontSize: number,
) {
  const scale = fontSize / font.unitsPerEm;
  const glyphs = Array.from(text).map((char) => font.charToGlyph(char));
  let x = 0;
  const letters: OutlineGlyph[] = glyphs.map((glyph, i) => {
    if (i > 0) x += font.getKerningValue(glyphs[i - 1], glyph) * scale;
    const contours = getOutlineContours(glyph.getPath(x, 0, fontSize).commands);
    x += (glyph.advanceWidth ?? 0) * scale;
    const box = contours.reduce<Box | null>(
      (acc, c) =>
        acc
          ? {
              x0: Math.min(acc.x0, c.box.x0),
              y0: Math.min(acc.y0, c.box.y0),
              x1: Math.max(acc.x1, c.box.x1),
              y1: Math.max(acc.y1, c.box.y1),
            }
          : { ...c.box },
      null,
    );
    return { contours, box };
  });
  const os2 = font.tables.os2 as { sCapHeight?: number } | undefined;
  const capHeight =
    ((os2?.sCapHeight ?? font.unitsPerEm * 0.7) * fontSize) / font.unitsPerEm;
  return { letters, width: x, capHeight };
}

const fontCache = new Map<string, Promise<Font>>();

function loadOutlineFont(url: string) {
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

function useOutlineFont(url: string) {
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    const handle = delayRender(`outline-trace: loading ${url}`);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    loadOutlineFont(url).then((parsed) => {
      if (!released) setFont(parsed);
      release();
    }, release);
    return release;
  }, [url]);

  return font;
}

export function OutlineTrace({
  text = outlineTraceDefaults.text,
  fontUrl = outlineTraceDefaults.fontUrl,
  fontSize = outlineTraceDefaults.fontSize,
  color = outlineTraceDefaults.color,
  strokeColor = outlineTraceDefaults.strokeColor,
  strokeWidth = outlineTraceDefaults.strokeWidth,
  stagger = outlineTraceDefaults.stagger,
  fill = outlineTraceDefaults.fill,
  keepStroke = outlineTraceDefaults.keepStroke,
  speed = outlineTraceDefaults.speed,
  className,
}: OutlineTraceProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const id = `outline-trace-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const font = useOutlineFont(fontUrl);
  if (!font) return null;

  const unit = height / 720;
  const t = getOutlineTraceTime(frame, { fps, speed });
  const layout = layoutOutlineGlyphs(font, text, fontSize);
  const originX = (width - layout.width * unit) / 2;
  const baseline = (height + layout.capHeight * unit) / 2;
  const stroke = strokeColor || color;

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
          <filter id={`${id}-erode`}>
            <feMorphology operator="erode" radius={strokeWidth / 2} />
          </filter>
          {layout.letters.map((letter, i) => {
            if (!letter.box) return null;
            const state = getOutlineTraceLetter(t, i, stagger);
            const box = letter.box;
            const tall = box.y1 - box.y0 + 2 * strokeWidth;
            const rise = tall * (fill ? state.fill : 0);
            const strokeOpacity = fill && !keepStroke ? 1 - state.fill : 1;
            const whole = letter.contours.map((c) => c.d).join("");
            const margin = 4 * strokeWidth;
            return (
              <g key={i}>
                {/* Static instances of variable fonts keep overlapping
                    contours (the bar of a t crosses its stem). The mask hides
                    stroke that runs inside the glyph's filled silhouette. */}
                <mask
                  id={`${id}-mask-${i}`}
                  maskUnits="userSpaceOnUse"
                  x={box.x0 - margin}
                  y={box.y0 - margin}
                  width={box.x1 - box.x0 + 2 * margin}
                  height={box.y1 - box.y0 + 2 * margin}
                >
                  <rect
                    x={box.x0 - margin}
                    y={box.y0 - margin}
                    width={box.x1 - box.x0 + 2 * margin}
                    height={box.y1 - box.y0 + 2 * margin}
                    fill="#ffffff"
                  />
                  <path d={whole} fill="#000000" filter={`url(#${id}-erode)`} />
                </mask>
                {fill && state.fill > 0 ? (
                  <>
                    <clipPath id={`${id}-${i}`}>
                      <rect
                        x={box.x0 - strokeWidth}
                        y={box.y1 + strokeWidth - rise}
                        width={box.x1 - box.x0 + 2 * strokeWidth}
                        height={rise}
                      />
                    </clipPath>
                    <path
                      d={whole}
                      fill={color}
                      clipPath={`url(#${id}-${i})`}
                    />
                  </>
                ) : null}
                {strokeOpacity > 0 ? (
                  <g mask={`url(#${id}-mask-${i})`}>
                    {letter.contours.map((contour, k) => {
                      const progress = contour.counter
                        ? state.counter
                        : state.outer;
                      if (progress <= 0) return null;
                      return (
                        <path
                          key={k}
                          d={contour.d}
                          pathLength={1}
                          fill="none"
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - progress}
                          opacity={strokeOpacity}
                        />
                      );
                    })}
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
