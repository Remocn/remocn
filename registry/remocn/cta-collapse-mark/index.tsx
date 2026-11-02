"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

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

const B = {
  cta: 0,
  wordStep: 2,
  url: 12,
  shed: 36,
  shedSpread: 12,
  drift: 7,
  travel: 18,
  merge: 74,
  snap: 78,
  word: 84,
  letterStep: 4,
  end: 138,
};

export const CTA_COLLAPSE_MARK_DURATION = B.end;

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
): Face {
  const font = `${weight} ${MEASURE_PX}px "${manrope.fontFamily}"`;
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

function buildMetrics(_version: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  return { cta: face(ctx, 400, 0.55), logo: face(ctx, 600, 0.6) };
}

function useMetrics() {
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
  }, [handle]);
  return useMemo(() => buildMetrics(version), [version]);
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
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function CtaCollapseMark({
  theme = "dark",
  accent = "#3B5BFD",
  cta = "Ship your first launch film",
  url = "remocn.dev",
  ground,
  groundParams,
}: CtaCollapseMarkProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const m = useMetrics();
  const cells = useMemo(() => computeCells(), []);
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const ink = dark ? "#f2f3f8" : "#14161c";
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
    B.shed +
    Math.round(
      (1 - Math.abs(g.x + g.adv / 2 - cx) / maxDist) * B.shedSpread +
        (g.url ? 2 : 0),
    );

  const L = portrait ? 196 : 176;
  const Rh = L * 0.76;
  const Rw = (Rh * R_W) / R_H;
  const baseY = cy + Rh / 2;
  const word = "emocn";
  const wChars = Array.from(word);
  const wPrefix = wChars.map(
    (_, i) => m.logo.width(wChars.slice(0, i).join("")) * L,
  );
  const wordW = m.logo.width(word) * L;
  const settle = spring({
    frame: frame - B.word - 6,
    fps,
    config: HEAVY,
    durationInFrames: 30,
  });
  const extra = L * 0.16 * (1 - settle);
  const reveal = spring({
    frame: frame - B.word,
    fps,
    config: HEAVY,
    durationInFrames: 26,
  });
  const rs = mix(BIG, 1, reveal);
  const RwS = Rw * rs;
  const RhS = Rh * rs;
  const rTop = cy - RhS / 2;
  const tail = L * 0.04 + wordW - L * 0.025 * 4 + extra * 4;
  const lockW = RwS + reveal * tail;
  const lockL = cx - lockW / 2;
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

  const merge = ramp(frame, B.merge, 4, MOVE);
  const snap = ramp(frame, B.snap, 5, LIGHT);
  const punch = interpolate(
    frame,
    [B.snap, B.snap + 2, B.snap + 9],
    [1, 1.05, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SWAY },
  );
  const push = 1 + 0.03 * ramp(frame, 0, B.end, SWAY);

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
            transform: `scale(${push * punch})`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          {glyphs.map((g, i) => {
            const enterAt = g.url ? B.url : B.cta + g.word * B.wordStep;
            const inK = ramp(frame, enterAt, 12, LIGHT);
            const s0 = shedAt(g);
            const out = ramp(frame, s0, 10, EXIT);
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
            const dr = ramp(frame, s0, B.drift, ENTER);
            const startT = s0 + 5;
            const tr = ramp(frame, startT, B.travel + Math.round(r1 * 4), MOVE);
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
            const vis = ramp(frame, s0, 3, LIGHT) * (1 - snap);
            const speed = tr > 0.05 && tr < 0.95 ? 1 : 0;
            return (
              <div
                key={`f${cell.k.toString()}`}
                style={{
                  position: "absolute",
                  left: x - size / 2,
                  top: y - size / 2,
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

          <svg
            viewBox={`0 0 ${R_W} ${R_H}`}
            width={RwS}
            height={RhS}
            style={{
              position: "absolute",
              left: lockL,
              top: rTop,
              opacity: snap,
            }}
            aria-hidden
          >
            <path fill={markColor} d={REMOCN_R_PATH} />
          </svg>

          {wChars.map((ch, i) => {
            const p = spring({
              frame: frame - B.word - 6 - i * B.letterStep,
              fps,
              config: LETTER,
            });
            const vis = Math.min(
              1,
              ramp(frame, B.word + 6 + i * B.letterStep, 6),
            );
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
    </AbsoluteFill>
  );
}

export default CtaCollapseMark;
