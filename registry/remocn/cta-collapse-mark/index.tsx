"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  random,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  CTA_COLLAPSE_LENGTH,
  CTA_MARK_WORD,
  type CtaCollapseMarkElementId,
  ctaCollapseMarkTimeline,
  DEFAULT_CTA,
} from "./timeline";

const manrope = loadManrope("normal", {
  weights: ["300", "400", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;
const COLS = 12;
const BIG = 1.7;
const ROWS = 13;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const LETTER = { mass: 0.6, damping: 14, stiffness: 180 };

export const CTA_COLLAPSE_MARK_DURATION = CTA_COLLAPSE_LENGTH;

const MEASURE_PX = 100;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

interface Face {
  width: (s: string) => number;
  asc: number;
  desc: number;
}

interface Metrics {
  cta: Face;
  logo: Face;
}

function face(
  ctx: CanvasRenderingContext2D | null,
  weight: number,
  fallback: number,
  family: string,
): Face {
  const font = `${weight} ${MEASURE_PX}px "${family}"`;
  const cache: Record<string, number> = {};
  let asc = 1.02;
  let desc = 0.28;
  if (ctx) {
    ctx.font = font;
    const mm = ctx.measureText("Hg");
    if (mm.fontBoundingBoxAscent) asc = mm.fontBoundingBoxAscent / MEASURE_PX;
    if (mm.fontBoundingBoxDescent)
      desc = mm.fontBoundingBoxDescent / MEASURE_PX;
  }
  return {
    width: (s: string) => {
      if (cache[s] === undefined) {
        if (!ctx) return s.length * fallback;
        ctx.font = font;
        cache[s] = ctx.measureText(s).width / MEASURE_PX;
      }
      return cache[s];
    },
    asc,
    desc,
  };
}

function buildMetrics(_version: number, family: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  return {
    cta: face(ctx, 400, 0.55, family),
    logo: face(ctx, 600, 0.6, manrope.fontFamily),
  };
}

function useMetrics(family: string) {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("cta-collapse-mark: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      manrope.waitUntilDone(),
      document.fonts.load(`400 ${MEASURE_PX}px "${manrope.fontFamily}"`),
      document.fonts.load(`600 ${MEASURE_PX}px "${manrope.fontFamily}"`),
      document.fonts.load(`300 ${MEASURE_PX}px "${family}"`),
      document.fonts.load(`400 ${MEASURE_PX}px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle, family]);
  return useMemo(() => buildMetrics(version, family), [version, family]);
}

function computeCells(): { c: number; r: number }[] {
  const ctx = document.createElement("canvas").getContext("2d");
  const out: { c: number; r: number }[] = [];
  if (!ctx) return out;
  const path = new Path2D(REMOCN_R_PATH);
  const cw = R_W / COLS;
  const ch = R_H / ROWS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let hits = 0;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const x = (c + (sx + 0.5) / 3) * cw;
          const y = (r + (sy + 0.5) / 3) * ch;
          if (ctx.isPointInPath(path, x, y)) hits++;
        }
      }
      if (hits >= 4) out.push({ c, r });
    }
  }
  return out;
}

function splitLines(words: string[], w: (s: string) => number, two: boolean) {
  if (!two || words.length < 2) return [words.join(" ")];
  let best = 1;
  let bestW = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = w(words.slice(0, i).join(" "));
    const b = w(words.slice(i).join(" "));
    const mx = Math.max(a, b);
    if (mx < bestW) {
      bestW = mx;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

type Glyph = {
  ch: string;
  x: number;
  base: number;
  adv: number;
  size: number;
  word: number;
  url: boolean;
};

export interface CtaCollapseMarkProps {
  theme?: "dark" | "light";
  accent?: string;
  cta?: string;
  url?: string;
  /** Text color of the call to action and wordmark; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the call to action and URL. Load it yourself; Manrope by default. */
  fontFamily?: string;
  /** Frames between words as the call to action comes in. */
  stagger?: number;
  /** Replaces the remocn lockup the letters collapse into. */
  logo?: React.ReactNode;
  /** Size of the copy and lockup, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Playback multiplier. */
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches single words of the call to action, the URL,
   * the shed, the merge, the snap, the reveal, single letters of the
   * wordmark and the camera push, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<CtaCollapseMarkElementId>;
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function CtaCollapseMark(props: CtaCollapseMarkProps) {
  const {
    theme = "dark",
    accent = "#3B5BFD",
    cta = DEFAULT_CTA,
    url = "remocn.dev",
    ink: inkProp,
    background,
    fontFamily = manrope.fontFamily,
    logo,
    scale = 1,
    delay = 0,
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    ctaCollapseMarkTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const pushEl = tl.get("push");
  const urlEl = tl.get("url");
  const shed = tl.get("shed");
  const mergeEl = tl.get("merge");
  const snapEl = tl.get("snap");
  const revealEl = tl.get("reveal");
  const m = useMetrics(fontFamily);
  const cells = useMemo(() => computeCells(), []);
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const ink = inkProp ?? (dark ? "#f2f3f8" : "#14161c");
  const markColor = dark
    ? interpolateColors(0.16, [0, 1], [accent, "#ffffff"])
    : accent;
  const urlColor = dark
    ? interpolateColors(0.4, [0, 1], [accent, "#ffffff"])
    : accent;

  const cx = stageW / 2;
  const cy = portrait ? stageH * 0.48 : stageH * 0.5;
  const F = portrait ? 108 : 72;
  const U = F * (portrait ? 0.42 : 0.46);
  const lineGap = F * 1.12;

  const words = cta.split(" ");
  const lines = splitLines(words, (s) => m.cta.width(s) * F, portrait);
  const ctaBlockH = (lines.length - 1) * lineGap + F * 0.72 + U * 1.9;
  const firstBase = cy - ctaBlockH / 2 + F * 0.72;
  const glyphs: Glyph[] = [];
  let wordIdx = 0;
  lines.forEach((line, li) => {
    const lw = m.cta.width(line) * F;
    const x0 = cx - lw / 2;
    const base = firstBase + li * lineGap;
    const chars = Array.from(line);
    chars.forEach((ch, i) => {
      if (ch === " ") {
        wordIdx++;
        return;
      }
      const px = m.cta.width(chars.slice(0, i).join("")) * F;
      const adv = m.cta.width(ch) * F;
      glyphs.push({
        ch,
        x: x0 + px,
        base,
        adv,
        size: F,
        word: wordIdx,
        url: false,
      });
    });
    wordIdx++;
  });
  const urlBase = firstBase + (lines.length - 1) * lineGap + U * 1.9;
  const urlW = m.cta.width(url) * U;
  Array.from(url).forEach((ch, i, arr) => {
    glyphs.push({
      ch,
      x: cx - urlW / 2 + m.cta.width(arr.slice(0, i).join("")) * U,
      base: urlBase,
      adv: m.cta.width(ch) * U,
      size: U,
      word: wordIdx,
      url: true,
    });
  });

  const maxDist = Math.max(
    1,
    ...glyphs.map((g) => Math.abs(g.x + g.adv / 2 - cx)),
  );
  const shedAt = (g: Glyph) =>
    shed.start +
    Math.round(
      (1 - Math.abs(g.x + g.adv / 2 - cx) / maxDist) * shed.beat("spread") +
        (g.url ? 2 : 0),
    );

  const L = portrait ? 196 : 176;
  const Rh = L * 0.76;
  const Rw = (Rh * R_W) / R_H;
  const baseY = cy + Rh / 2;
  const word = CTA_MARK_WORD;
  const wChars = Array.from(word);
  const wPrefix = wChars.map(
    (_, i) => m.logo.width(wChars.slice(0, i).join("")) * L,
  );
  const wordW = m.logo.width(word) * L;
  const settle = spring({
    frame: frame - revealEl.start - revealEl.beat("settleAt"),
    fps,
    config: HEAVY,
    durationInFrames: revealEl.beat("settle"),
  });
  const extra = L * 0.16 * (1 - settle);
  const reveal = spring({
    frame: frame - revealEl.start,
    fps,
    config: HEAVY,
    durationInFrames: revealEl.length,
  });
  const rs = mix(BIG, 1, reveal);
  const RwS = Rw * rs;
  const RhS = Rh * rs;
  const rTop = cy - RhS / 2;
  const tail = L * 0.04 + wordW - L * 0.025 * 4 + extra * 4;
  const lockW = RwS + reveal * tail;
  const lockL = cx - lockW / 2;
  // Where the mark settles once the wordmark is out; the ride there is a
  // transform, since layout would round its box to whole pixels on the way.
  const lockLRest = cx - (Rw + L * 0.04 + wordW - L * 0.025 * 4) / 2;
  const rTopRest = cy - Rh / 2;
  const markDx = lockL - lockLRest;
  const markDy = rTop - rTopRest;
  const letterX = (i: number) =>
    lockL + RwS + L * 0.04 + wPrefix[i] - L * 0.025 * i + extra * i;

  const cellW = RwS / COLS;
  const cellH = RhS / ROWS;
  const sq = Math.min(cellW, cellH);
  const sortedCells = cells
    .map((c, i) => ({ ...c, k: i, j: random(`ccm-cell-${i}`) }))
    .sort((a, b) => a.c + a.j * 0.6 - (b.c + b.j * 0.6));
  const srcGlyphs = glyphs
    .map((g, i) => ({ g, i }))
    .sort((a, b) => a.g.x - b.g.x);
  const N = sortedCells.length;
  const G = srcGlyphs.length;

  const merge = ramp(frame, mergeEl.start, mergeEl.length, MOVE);
  const snap = ramp(frame, snapEl.start, snapEl.length, LIGHT);
  const pushAt = (f: number) =>
    (1 + 0.03 * ramp(f, pushEl.start, pushEl.length, SWAY)) *
    interpolate(
      f,
      [
        snapEl.start,
        snapEl.start + snapEl.beat("peak"),
        snapEl.start + snapEl.beat("punch"),
      ],
      [1, 1.05, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: SWAY,
      },
    );
  // The slow push carries every glyph and the wordmark, so its tilt covers
  // them all; it is on for as long as the push still moves.
  const pushMoving =
    Math.abs(pushAt(frame + 1) - pushAt(frame)) > 1e-6 ||
    Math.abs(pushAt(frame) - pushAt(frame - 1)) > 1e-6;

  const ctaFace = manrope.fontFamily;
  const baseOff = (size: number) =>
    (size - (m.cta.asc + m.cta.desc) * size) / 2 + m.cta.asc * size;
  const logoOff = (L - (m.logo.asc + m.logo.desc) * L) / 2 + m.logo.asc * L;

  const resolvedGround: GshPresetId | undefined =
    ground ?? (dark ? "earthshine" : undefined);
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (!dark && !ground
      ? {
          kind: "mist",
          colors: ["#ffffff", "#c9d2ff", "#8a9cff", "#ece8e0"],
          background: "#f2f1ed",
          speed: 0.7,
          loopSeconds: 18,
          scale: 0.9,
          warp: 0.35,
          blur: 0.8,
          grain: 0.06,
          seed: 5,
        }
      : undefined);

  return (
    <AbsoluteFill style={{ fontFamily: ctaFace, overflow: "hidden" }}>
      {background !== undefined ? (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: gshParams(resolvedGround, resolvedParams).background,
          }}
        >
          <AbsoluteFill
            style={{
              transform:
                dark && !ground && !groundParams
                  ? `translateY(${portrait ? 16 : 22}%)`
                  : undefined,
            }}
          >
            <GshGround
              preset={resolvedGround}
              params={resolvedParams}
              timeOffset={5}
              timeScale={0.4}
            />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: stageW,
            height: stageH,
            transform: `scale(${sc})`,
            transformOrigin: "0 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${pushAt(frame)})${glide(pushMoving)}`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
          >
            {glyphs.map((g, i) => {
              const enter = g.url ? urlEl : tl.get(`word:${g.word}`);
              const inK = ramp(frame, enter.start, enter.length, LIGHT);
              const s0 = shedAt(g);
              const out = ramp(frame, s0, shed.beat("fade"), EXIT);
              if (out >= 1) return null;
              const jx = (random(`ccm-gx-${i}`) - 0.5) * g.size * 0.12;
              const jy = -random(`ccm-gy-${i}`) * g.size * 0.1;
              return (
                <span
                  key={`g${i.toString()}`}
                  style={{
                    position: "absolute",
                    left: g.x,
                    top: g.base - baseOff(g.size),
                    fontFamily,
                    fontSize: g.size,
                    lineHeight: `${g.size}px`,
                    fontWeight: g.url ? 400 : 300,
                    letterSpacing: 0,
                    whiteSpace: "pre",
                    color: g.url ? urlColor : ink,
                    opacity: inK * (1 - out),
                    filter:
                      inK < 0.99 || out > 0.01
                        ? `blur(${(1 - inK) * 8 + out * 9}px)`
                        : undefined,
                    transform: `translate(${jx * out}px, ${(1 - inK) * g.size * 0.32 + jy * out}px) scale(${1 - 0.12 * out})`,
                  }}
                >
                  {g.ch}
                </span>
              );
            })}

            {sortedCells.map((cell, k) => {
              const src = srcGlyphs[Math.min(G - 1, Math.floor((k * G) / N))];
              if (!src) return null;
              const g = src.g;
              const s0 = shedAt(g) + (k % 3);
              if (frame < s0) return null;
              const r1 = random(`ccm-a-${k}`);
              const r2 = random(`ccm-b-${k}`);
              const r3 = random(`ccm-c-${k}`);
              const ox = g.x + r1 * g.adv;
              const oy = g.base - r2 * g.size * 0.62;
              const dx = (r3 - 0.5) * g.size * 0.7;
              const dy = -(0.2 + r2 * 0.5) * g.size * 0.5;
              const dr = ramp(frame, s0, shed.beat("drift"), ENTER);
              const startT = s0 + shed.beat("travelAt");
              const tr = ramp(
                frame,
                startT,
                shed.beat("travel") + Math.round(r1 * 4),
                MOVE,
              );
              const tx = lockL + (cell.c + 0.5) * cellW;
              const ty = rTop + (cell.r + 0.5) * cellH;
              const sx = ox + dx * dr;
              const sy = oy + dy * dr;
              const arc = Math.sin(Math.PI * tr) * (r3 - 0.5) * g.size * 1.2;
              const x = mix(sx, tx, tr) + arc * 0.4;
              const y = mix(sy, ty, tr) - Math.abs(arc) * 0.3;
              const size = mix(sq * 0.5, sq * mix(0.84, 1.04, merge), tr);
              const color = interpolateColors(
                tr,
                [0, 0.6, 1],
                [g.url ? urlColor : ink, markColor, markColor],
              );
              const vis =
                ramp(frame, s0, shed.beat("show"), LIGHT) * (1 - snap);
              const speed = tr > 0.05 && tr < 0.95 ? 1 : 0;
              return (
                <div
                  key={`f${cell.k.toString()}`}
                  style={{
                    position: "absolute",
                    // The flight is a transform, not `left`/`top`: layout
                    // rounds a box edge to whole pixels, so a cell eased by
                    // position steps along pixel by pixel.
                    left: 0,
                    top: 0,
                    transform: `translate(${x - size / 2}px, ${y - size / 2}px)`,
                    width: size,
                    height: size,
                    borderRadius: size * 0.12,
                    background: color,
                    opacity: vis,
                    filter: speed ? "blur(0.6px)" : undefined,
                  }}
                />
              );
            })}

            {logo ? (
              <div
                style={{
                  position: "absolute",
                  left: cx,
                  top: cy,
                  transform: "translate(-50%, -50%)",
                  opacity: snap,
                }}
              >
                {logo}
              </div>
            ) : null}
            {logo ? null : (
              <svg
                viewBox={`0 0 ${R_W} ${R_H}`}
                width={RwS}
                height={RhS}
                style={{
                  position: "absolute",
                  left: lockLRest,
                  top: rTopRest,
                  transform:
                    Math.abs(markDx) > 1e-3 || Math.abs(markDy) > 1e-3
                      ? `translate(${markDx}px, ${markDy}px)`
                      : undefined,
                  opacity: snap,
                }}
                aria-hidden
              >
                <path fill={markColor} d={REMOCN_R_PATH} />
              </svg>
            )}

            {(logo ? [] : wChars).map((ch, i) => {
              const letter = tl.get(`letter:${i}`);
              const p = spring({
                frame: frame - letter.start,
                fps,
                config: LETTER,
              });
              const vis = Math.min(1, ramp(frame, letter.start, letter.length));
              return (
                <span
                  key={`w${i.toString()}`}
                  style={{
                    position: "absolute",
                    left: letterX(i),
                    top: baseY - logoOff,
                    fontSize: L,
                    lineHeight: `${L}px`,
                    fontWeight: 600,
                    color: ink,
                    whiteSpace: "pre",
                    opacity: vis,
                    transform: `translateY(${(1 - p) * L * 0.18}px) scale(${mix(0.82, 1, p)})`,
                    transformOrigin: "50% 80%",
                    filter: vis < 0.99 ? `blur(${(1 - vis) * 6}px)` : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default CtaCollapseMark;
