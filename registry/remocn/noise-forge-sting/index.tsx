"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});
const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const COOL = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.45, 0, 0.55, 1);

const B = {
  spark: 0,
  seam: 4,
  seamLen: 18,
  forge: 12,
  ring: 6,
  glyphLen: 15,
  markLen: 18,
  seamOut: 30,
  seamOutLen: 18,
  lock: 48,
  cool: 54,
  coolLen: 18,
  tagline: 66,
  end: 126,
};

export const NOISE_FORGE_STING_DURATION = B.end;

const SLICES = 11;
const BARS = 6;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface NoiseForgeStingProps {
  theme?: "dark" | "light";
  accent?: string;
  ink?: string;
  hot?: string;
  tagline?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    ink: "#f3f4f7",
    sub: "rgba(226,230,242,0.66)",
    hot: "#ffffff",
    halo: "rgba(214,224,255,0.9)",
    accent: "#4a6bff",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "limb",
      colors: ["#e6ebff", "#7d93ff", "#2f4fe0", "#0a1038"],
      background: "#020308",
      speed: 1.4,
      loopSeconds: 14,
      warp: 0.45,
      grain: 0.12,
      seed: 3,
    } as Partial<GradientParams>,
    tallParams: {
      kind: "mist",
      colors: ["#e6ebff", "#7d93ff", "#2f4fe0", "#0a1038"],
      background: "#020308",
      speed: 0.9,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.7,
      grain: 0.12,
      seed: 4,
    } as Partial<GradientParams> | undefined,
    lift: 1.55,
  },
  light: {
    ink: "#15161b",
    sub: "rgba(28,30,40,0.6)",
    hot: "#ff5b1f",
    halo: "rgba(255,138,61,0.85)",
    accent: "#3B5BFD",
    ground: "paper-crease" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    tallParams: undefined as Partial<GradientParams> | undefined,
    lift: 1,
  },
};

type Glyph = { key: string; order: number; mark: boolean; char: string };

function glyphPlan(word: string): Glyph[] {
  const chars = Array.from(word);
  const n = chars.length;
  const centre = (n - 1) / 2;
  const letters = chars.map((c, i) => ({
    key: `${c}-${i.toString()}`,
    order: Math.floor(Math.abs(i - centre)),
    mark: false,
    char: c,
  }));
  const last = letters.reduce((m, g) => Math.max(m, g.order), 0);
  return [{ key: "mark", order: last + 1, mark: true, char: "" }, ...letters];
}

function Slice({
  index,
  frame,
  start,
  lockAt,
  amp,
  seed,
  children,
}: {
  index: number;
  frame: number;
  start: number;
  lockAt: number;
  amp: number;
  seed: string;
  children: ReactNode;
}) {
  const tick = Math.floor(frame / 2);
  const appear = start + Math.floor(random(`${seed}-a-${index}`) * 4);
  if (frame < appear) return null;
  const p = clamp01((frame - start) / Math.max(1, lockAt - start));
  const r = random(`${seed}-x-${index}-${tick}`) * 2 - 1;
  const left = (1 - p) ** 1.6;
  const dx = r * amp * left;
  const sx = 1 + left * random(`${seed}-s-${index}-${tick}`) * 1.4;
  const flicker = p < 0.8 && random(`${seed}-f-${index}-${tick}`) < 0.28;
  if (flicker) return null;
  const top = (index / SLICES) * 100;
  const bottom = 100 - ((index + 1) / SLICES) * 100;
  return (
    <span
      style={{
        position: "absolute",
        inset: 0,
        clipPath: `inset(${top}% -60% ${bottom}% -60%)`,
        transform: `translateX(${dx}em) scaleX(${sx})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </span>
  );
}

function Bars({
  frame,
  start,
  len,
  seed,
  color,
}: {
  frame: number;
  start: number;
  len: number;
  seed: string;
  color: string;
}) {
  const p = (frame - start) / len;
  if (p < 0 || p > 0.5) return null;
  const tick = Math.floor(frame / 2);
  const fade = 1 - p / 0.5;
  return (
    <>
      {Array.from({ length: BARS }, (_, i) => {
        const k = `${seed}-b-${i}-${tick}`;
        if (random(`${k}-on`) < 0.3) return null;
        const row = Math.floor(random(`${k}-y`) * SLICES);
        const w = 30 + random(`${k}-w`) * 110;
        const x = -40 + random(`${k}-p`) * 110;
        return (
          <span
            key={`bar-${i.toString()}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${(row / SLICES) * 100}%`,
              width: `${w}%`,
              height: `${(0.55 / SLICES) * 100}%`,
              background: color,
              opacity: fade * (0.55 + random(`${k}-o`) * 0.45),
            }}
          />
        );
      })}
    </>
  );
}

function MarkSvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 124.06 134.26"
      style={{ height: "0.76em", width: "auto", display: "block" }}
      aria-hidden
    >
      <path fill={color} d={REMOCN_R_PATH} />
    </svg>
  );
}

function ForgedGlyph({
  glyph,
  frame,
  color,
  hot,
}: {
  glyph: Glyph;
  frame: number;
  color: string;
  hot: string;
}) {
  const start = B.forge + glyph.order * B.ring;
  const len = glyph.mark ? B.markLen : B.glyphLen;
  const seed = `nf-${glyph.key}`;
  const content = glyph.mark ? <MarkSvg color={color} /> : glyph.char;
  const locked = frame >= start + len;
  const box = {
    position: "relative" as const,
    display: "inline-block",
    marginLeft: glyph.mark ? 0 : glyph.key.endsWith("-0") ? "0.04em" : 0,
  };
  if (locked) {
    return <span style={{ ...box, color }}>{content}</span>;
  }
  const amp = glyph.mark ? 0.5 : 0.36;
  return (
    <span style={{ ...box, color }}>
      <span style={{ visibility: "hidden", display: "inline-block" }}>
        {content}
      </span>
      {frame >= start &&
        Array.from({ length: SLICES }, (_, i) => {
          const lockAt =
            start + len * (0.4 + 0.6 * random(`${seed}-l-${i.toString()}`));
          return (
            <Slice
              key={`s-${i.toString()}`}
              index={i}
              frame={frame}
              start={start}
              lockAt={lockAt}
              amp={amp}
              seed={seed}
            >
              {content}
            </Slice>
          );
        })}
      <Bars frame={frame} start={start} len={len} seed={seed} color={hot} />
    </span>
  );
}

export function NoiseForgeSting({
  theme = "dark",
  accent,
  ink,
  hot,
  tagline = "Launch videos, built from parts.",
  ground,
  groundParams,
}: NoiseForgeStingProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const markC = accent ?? c.accent;
  const hotC = hot ?? c.hot;
  const portrait = H > W * 1.1;
  const custom = Boolean(ground || groundParams);
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams =
    groundParams ??
    (ground
      ? undefined
      : portrait && c.tallParams
        ? c.tallParams
        : c.groundParams);
  const lift = custom || (portrait && c.tallParams) ? 1 : c.lift;

  const fontSize = portrait ? W * 0.205 : W * 0.172;
  const glyphs = glyphPlan("emocn");

  const cool = ramp(frame, B.cool, B.coolLen, COOL);
  const heat = 1 - cool;
  const letterC = interpolateColors(cool, [0, 1], [hotC, inkC]);
  const markColor = interpolateColors(cool, [0, 1], [hotC, markC]);

  const sparkIn = ramp(frame, B.spark - 3, 6, LIGHT);
  const seamGrow = ramp(frame, B.seam, B.seamLen, ENTER);
  const seamOut = ramp(frame, B.seamOut, B.seamOutLen, COOL);
  const seamW = interpolate(seamGrow, [0, 1], [0.05, 4.4]);
  const seamH = interpolate(seamOut, [0, 1], [1, 0.3]);

  const punch = interpolate(
    frame,
    [B.lock, B.lock + 2, B.lock + 8],
    [1, 1.028, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: CAMERA,
    },
  );
  const push = interpolate(frame, [0, B.end], [1.04, 1], {
    easing: CAMERA,
    extrapolateRight: "clamp",
  });

  const glowA = (fontSize * 0.05 + 2) * heat;
  const glowB = fontSize * 0.22 * heat;
  const glow =
    heat > 0.01
      ? `drop-shadow(0 0 ${glowA}px ${c.halo}) drop-shadow(0 0 ${glowB}px ${c.halo})`
      : undefined;

  const tagSize = fontSize * (portrait ? 0.36 : 0.25);
  const words = tagline.split(" ");
  const groundFade = interpolate(frame, [0, 18], [0.35, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: gshParams(preset, gParams).background,
      }}
    >
      <AbsoluteFill
        style={{
          opacity: groundFade,
          transform: lift !== 1 ? `scale(${lift})` : undefined,
          transformOrigin: "50% 0%",
        }}
      >
        <GshGround
          preset={preset}
          params={gParams}
          timeOffset={4}
          timeScale={0.5}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${push * punch})`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: fontSize * (portrait ? 0.34 : 0.26),
            marginTop: portrait ? -H * 0.04 : 0,
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "baseline",
              fontFamily: manrope.fontFamily,
              fontWeight: 600,
              fontSize,
              letterSpacing: "-0.025em",
              lineHeight: 1,
              filter: glow,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "52%",
                width: `${seamW}em`,
                height: Math.max(2, fontSize * 0.018) * seamH,
                transform: "translate(-50%, -50%)",
                borderRadius: 999,
                background: hotC,
                opacity: sparkIn * (1 - seamOut),
              }}
            />
            {glyphs.map((g) => (
              <ForgedGlyph
                key={g.key}
                glyph={g}
                frame={frame}
                color={g.mark ? markColor : letterC}
                hot={hotC}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: portrait ? W * 0.8 : W * 0.8,
              rowGap: tagSize * 0.1,
              fontFamily: geist.fontFamily,
              fontWeight: 300,
              fontSize: tagSize,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              color: c.sub,
            }}
          >
            {words.map((w, i) => {
              const p = ramp(frame, B.tagline + i * 2, 14);
              return (
                <span
                  key={`${w}-${i.toString()}`}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    paddingBottom: tagSize * 0.14,
                    marginBottom: -tagSize * 0.14,
                    marginRight: i < words.length - 1 ? tagSize * 0.26 : 0,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: `translateY(${(1 - p) * 105}%)`,
                      filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
                    }}
                  >
                    {w}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
