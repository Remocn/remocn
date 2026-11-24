"use client";

import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Newsreader";
import type React from "react";
import { useId } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_HARMONICS,
  type FourierSumElementId,
  fourierSumTimeline,
} from "./timeline";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin", "greek"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadDisplay("italic", { weights: ["400"], subsets: ["latin"] });

// gradients.sh "aurora" palette: the summed signal is drawn in it.
const AURORA = ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"] as const;

export interface FourierSumProps {
  harmonics?: number[];
  title?: string;
  periods?: number;
  accent?: string;
  /** Frames between harmonics folding into the sum. */
  stagger?: number;
  /** Tinted area under the final wave. */
  waveFill?: boolean;
  /** Color of the title; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the title. Load it yourself; Newsreader by default. */
  fontFamily?: string;
  /** Size of the waves and copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Film grain over the scene. */
  grain?: boolean;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the rows drawing in, the sum's slot, each
   * merge, the final wave and the title, by the ids in `./timeline`. Frames
   * on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<FourierSumElementId>;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const DRAW = Easing.bezier(0.45, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(243,242,239,0.82)",
    base: "rgba(255,255,255,0.14)",
    wash: "rgba(255,255,255,0.045)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.78)",
    base: "rgba(18,18,20,0.14)",
    wash: "rgba(255,255,255,0.7)",
    grain: 0.045,
  },
} as const;

const PHASE = Math.PI / 2;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function wavePath(
  x0: number,
  w: number,
  yc: number,
  amp: number,
  fn: (theta: number) => number,
  periods: number,
  prog: number,
  samples: number,
) {
  const n = Math.max(2, Math.ceil(samples * prog));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const k = (prog * i) / n;
    const x = x0 + w * k;
    const y = yc - amp * fn(k * periods * Math.PI * 2);
    d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
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

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function FourierSum(props: FourierSumProps) {
  const {
    harmonics = DEFAULT_HARMONICS,
    title = "Many parts. One signal.",
    periods = 2,
    accent = "#3B5BFD",
    waveFill = true,
    ink,
    background,
    fontFamily = display,
    scale = 1,
    delay = 0,
    grain = true,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    fourierSumTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const rows = harmonics.map((_, i) => tl.get(`row:${i}`));
  const merges = harmonics.map((_, i) => tl.get(`merge:${i}`));
  const slotEl = tl.get("slot");
  const finalEl = tl.get("final");
  const titleEl = tl.get("title");
  const u = H / 720;
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const bg =
    background === "transparent" ? "transparent" : (background ?? p.bg);
  const count = harmonics.length;
  const maxN = Math.max(...harmonics);
  const samples = Math.max(240, Math.ceil(maxN * periods * 14));

  const labelCol = 58 * u;
  const waveW = W * 0.7;
  const blockX = (W - labelCol - waveW) / 2;
  const waveX = blockX + labelCol;
  const gap = Math.min(80 * u, (H * 0.6) / Math.max(1, count));
  const amp = Math.min(34 * u, gap * 0.42);
  const midY = H * 0.5;

  const merge = merges.map((m) =>
    interpolate(t, [m.start, m.end], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    }),
  );
  const merged = merge.reduce((a, b) => a + b, 0);
  const remaining = count - merged;
  const slotIndexY = (idx: number) => midY + (idx - remaining / 2) * gap;
  const rowIndex = (i: number) => 1 + i - merged;
  // The stack recentres as rows merge away. The labels ride that by a
  // transform from where they stood before the merge: layout rounds a
  // baseline to whole pixels, so a label eased by `top` clicks along.
  const lift = (merged * gap) / 2;
  const merging = merge.some(midway);

  const weights = merges.map((m) =>
    interpolate(t, [m.start + m.beat("weigh"), m.end], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    }),
  );
  const sumFn = (th: number) =>
    harmonics.reduce(
      (s, n, i) => s + (weights[i] * Math.sin(n * (th + PHASE))) / n,
      0,
    );

  const slotY = slotIndexY(0);
  const fin = interpolate(t, [finalEl.start, finalEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const finW = W * 0.74;
  const finY = H * 0.43;
  const sumX = lerp(waveX, (W - finW) / 2, fin);
  const sumW = lerp(waveW, finW, fin);
  const sumY = lerp(slotY, finY, fin);
  const sumAmp = lerp(amp, 108 * u, fin);
  const sumStroke = lerp(2.6, 5.5, fin) * u;
  const sumO = Math.min(1, weights[0] * 2.5);

  const slotIn = interpolate(t, [slotEl.start, slotEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const slotO = slotIn * (1 - fin);
  const titleA = interpolate(t, [titleEl.start, titleEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // The caption rides the stack while it recentres and then rises to the
  // title. Layout rounds a baseline to whole pixels, so it is laid out where
  // it ends and travels there by a transform, all its life: handing it to
  // layout on the frame it lands would move it by that rounding.
  const capRest = finY - 158 * u;
  const capRide = (slotY - amp - 40 * u - capRest) * (1 - fin);
  const capMoving = merging || midway(fin);
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const isDark = theme === "dark";
  const drift = interpolate(t, [0, 180], [0, 1], { ...CLAMP, easing: EASE_IO });
  const stops = isDark
    ? [AURORA[0], AURORA[1], AURORA[2], AURORA[3]]
    : [AURORA[1], AURORA[2], AURORA[3]];
  const gx1 = sumX - sumW * 0.12 * drift;
  const gx2 = sumX + sumW * (1.04 - 0.12 * drift);
  const fillO = (waveFill ? fin : 0) * (isDark ? 0.34 : 0.26);
  const sentence = title.match(/^(.*?[.!?\u2026])\s+(.+)$/);
  const inkText = {
    backgroundImage: `linear-gradient(90deg, ${stops.join(", ")})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  } as const;
  const capSlide = (waveX - W / 2) * (1 - fin);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${W * 0.5}px ${H * 0.45}px at 50% 46%, ${p.wash}, transparent 100%)`,
        }}
      />
      <ScaleLayer scale={scale}>
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${gid}s`}
              gradientUnits="userSpaceOnUse"
              x1={gx1}
              x2={gx2}
              y1={0}
              y2={0}
            >
              {stops.map((c, i) => (
                <stop key={c} offset={i / (stops.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
            <linearGradient
              id={`${gid}f`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              x2={0}
              y1={sumY - sumAmp * 1.25}
              y2={sumY + sumAmp * 1.25}
            >
              <stop offset={0} stopColor="#fff" stopOpacity={1} />
              <stop offset={0.5} stopColor="#fff" stopOpacity={0.05} />
              <stop offset={1} stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`${gid}m`} maskUnits="userSpaceOnUse">
              <rect width={W} height={H} fill={`url(#${gid}f)`} />
            </mask>
          </defs>
          <line
            x1={waveX}
            x2={waveX + waveW * slotIn}
            y1={slotY}
            y2={slotY}
            stroke={p.base}
            strokeWidth={Math.max(1, u)}
            opacity={slotO}
          />
          {harmonics.map((n, i) => {
            const row = rows[i];
            const prog = interpolate(t, [row.start, row.end], [0, 1], {
              ...CLAMP,
              easing: DRAW,
            });
            if (prog <= 0) return null;
            const o = interpolate(
              t,
              [merges[i].start + merges[i].beat("fade"), merges[i].end],
              [1, 0],
              CLAMP,
            );
            if (o <= 0) return null;
            return (
              <path
                key={n}
                d={wavePath(
                  waveX,
                  waveW,
                  slotIndexY(rowIndex(i)),
                  amp,
                  (th) => Math.sin(n * (th + PHASE)) / n,
                  periods,
                  prog,
                  samples,
                )}
                fill="none"
                stroke={p.hair}
                strokeWidth={1.4 * u}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={o}
              />
            );
          })}
          {fillO > 0 && (
            <path
              d={`${wavePath(sumX, sumW, sumY, sumAmp, sumFn, periods, 1, samples)}L${(sumX + sumW).toFixed(2)} ${sumY.toFixed(2)}L${sumX.toFixed(2)} ${sumY.toFixed(2)}Z`}
              fill={`url(#${gid}s)`}
              opacity={fillO}
              mask={`url(#${gid}m)`}
            />
          )}
          {sumO > 0 && (
            <path
              d={wavePath(sumX, sumW, sumY, sumAmp, sumFn, periods, 1, samples)}
              fill="none"
              stroke={`url(#${gid}s)`}
              strokeWidth={sumStroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={sumO}
            />
          )}
        </svg>

        {harmonics.map((n, i) => {
          const row = rows[i];
          const m = merges[i];
          const a = interpolate(
            t,
            [row.start + row.beat("labelAt"), row.start + row.beat("labelEnd")],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const out = interpolate(
            t,
            [m.start, m.start + m.beat("labelOut")],
            [1, 0],
            CLAMP,
          );
          return (
            <div
              key={n}
              style={{
                position: "absolute",
                left: blockX,
                top: midY + (1 + i - count / 2) * gap - 12 * u,
                width: labelCol - 14 * u,
                textAlign: "right",
                fontFamily: sans,
                fontWeight: 400,
                fontSize: 15 * u,
                lineHeight: `${24 * u}px`,
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
                opacity: a * out,
                transform: `translate(${(1 - a) * -8 * u}px, ${-lift}px)${glide(merging)}`,
              }}
            >
              {n}×
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: blockX,
            top: midY - (count / 2) * gap - 16 * u,
            width: labelCol - 14 * u,
            textAlign: "right",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 22 * u,
            lineHeight: `${32 * u}px`,
            color: accent,
            opacity: slotO,
            transform: `translate(${(1 - slotIn) * 10 * u}px, ${lift}px)${glide(merging)}`,
          }}
        >
          Σ
        </div>

        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: capRest,
            transform: `translate(${capSlide}px, ${capRide}px) translateX(${-50 * fin}%)${glide(capMoving)}`,
            display: "flex",
            whiteSpace: "nowrap",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 15 * u,
            lineHeight: `${24 * u}px`,
            color: p.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {harmonics.map((n, i) => {
            const a = interpolate(
              t,
              [
                merges[i].start + merges[i].beat("fade"),
                merges[i].end + merges[i].beat("termTail"),
              ],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={n}
                style={{
                  opacity: a,
                  transform: `translateY(${(1 - a) * 6 * u}px)${glide(midway(a) && !capMoving)}`,
                  display: "inline-block",
                }}
              >
                {i ? <span style={{ padding: `0 ${8 * u}px` }}>+</span> : null}
                {n}×
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: finY + 162 * u,
            textAlign: "center",
            fontFamily,
            fontWeight: 400,
            fontSize: 60 * u,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: fg,
            textWrap: "balance",
            opacity: titleA,
            transform: `translateY(${(1 - titleA) * 18 * u}px)${glide(midway(titleA))}`,
          }}
        >
          {sentence ? (
            <>
              {sentence[1]}{" "}
              <span
                style={{
                  ...inkText,
                  fontStyle: "italic",
                  paddingRight: "0.08em",
                }}
              >
                {sentence[2]}
              </span>
            </>
          ) : (
            title
          )}
        </div>
      </ScaleLayer>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${bg} 100%)`,
          opacity: 0.6,
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
