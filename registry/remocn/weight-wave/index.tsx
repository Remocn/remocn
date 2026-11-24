"use client";

import { loadVariableFont } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_TEXT,
  type WeightWaveElementId,
  weightWaveTimeline,
} from "./timeline";

const { fontFamily: sans } = loadVariableFont("normal", {
  subsets: ["latin"],
});

export interface WeightWaveProps {
  text?: string;
  highlight?: string;
  from?: number;
  peak?: number;
  settle?: number;
  waves?: number;
  /** Frames for one wave to cross the line. */
  waveLength?: number;
  /** Frames between letters as they settle. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the line; needs a variable weight axis. Geist by default. */
  fontFamily?: string;
  /** Size of the line, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the fade-in, single waves, the haze and the
   * settle, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<WeightWaveElementId>;
}

/** Geist 500 advance widths (per 1000 em) for ASCII 32–126 (widest weight used). */
const GEIST_500 = [
  243, 228, 361, 515, 643, 810, 649, 186, 290, 290, 427, 562, 213, 418, 213,
  494, 673, 406, 630, 625, 629, 641, 604, 531, 624, 606, 302, 302, 546, 544,
  546, 570, 925, 689, 688, 713, 701, 609, 595, 713, 716, 280, 607, 656, 583,
  890, 745, 751, 657, 745, 680, 654, 568, 694, 688, 968, 633, 594, 561, 361,
  470, 361, 438, 558, 258, 565, 608, 563, 608, 576, 412, 607, 591, 256, 284,
  609, 282, 885, 591, 588, 608, 608, 394, 537, 410, 586, 560, 829, 607, 553,
  552, 395, 274, 395, 523,
];
/** The wght axis is kept inside this range (brand rule: display type at most 500). */
const WGHT_MIN = 100;
const WGHT_MAX = 500;
const TRACK = -0.035;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_TRAVEL = Easing.bezier(0.42, 0, 0.58, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam": the settled hero word takes a clip-text beam fill, and a faint
// beam haze sits low behind the line.
const THEMES = {
  dark: {
    bg: "#02030A",
    fg: "#F2F3F8",
    fgClear: "rgba(242,243,248,0)",
    grain: 0.07,
    beam: ["#F4F7FF", "#8FB4FF", "#3D5BFF"],
    haze: "rgba(61,91,255,0.16)",
  },
  light: {
    bg: "#F4F5F8",
    fg: "#12131A",
    fgClear: "rgba(18,19,26,0)",
    grain: 0.045,
    beam: ["#3D5BFF", "#2A3BD0", "#1A1660"],
    haze: "rgba(143,180,255,0.24)",
  },
} as const;

function em(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    w += (code >= 32 && code < 127 ? GEIST_500[code - 32] : 600) / 1000;
    w += TRACK;
  }
  return w;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function WeightWave(props: WeightWaveProps) {
  const {
    text = DEFAULT_TEXT,
    highlight,
    from = 100,
    peak = 500,
    settle = 460,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = sans,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    weightWaveTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  // interpolateColors needs a parseable pair, so a custom ink fades via color-mix.
  const inkAt = (tint: number) =>
    ink === undefined
      ? interpolateColors(tint, [0, 1], [c.fg, c.fgClear])
      : `color-mix(in srgb, ${ink} ${((1 - tint) * 100).toFixed(2)}%, transparent)`;

  const chars = useMemo(() => Array.from(text), [text]);
  const n = chars.length;

  const accentRange = useMemo(() => {
    const target = highlight ?? text.trim().split(/\s+/).pop() ?? "";
    const at = target ? text.lastIndexOf(target) : -1;
    return at < 0 ? [n, n] : [at, at + Array.from(target).length];
  }, [highlight, text, n]);

  const F = Math.min(H * 0.32, (W * 0.8) / em(text));
  const clampW = (w: number) => Math.min(WGHT_MAX, Math.max(WGHT_MIN, w));
  const lo = clampW(from);
  const hi = clampW(peak);
  const rest = clampW(settle);

  const settling = tl.get("settle");
  const settleStart = settling.start;
  const waveEls = tl.lane("Waves");
  const enter = tl.get("enter");
  const haze = tl.get("haze");
  const sigma = 0.12;
  const push = interpolate(
    t,
    [0, settleStart + settling.beat("push")],
    [0, 1],
    CLAMP,
  );

  const tintAt = settleStart + settling.beat("sheen");
  const sheen = interpolate(
    t,
    [tintAt, tintAt + settling.beat("sheenLen")],
    [0, 1],
    CLAMP,
  );
  // The deep end of the beam is the brand accent (dark), or its first stop (light).
  const beam =
    theme === "light"
      ? [accent, c.beam[1], c.beam[2]]
      : [c.beam[0], c.beam[1], accent];
  const beamFill = `linear-gradient(${96 + sheen * 10}deg, ${beam[0]} ${-10 + sheen * 8}%, ${beam[1]} ${44 + sheen * 6}%, ${beam[2]} 100%)`;
  const hazeIn = interpolate(t, [haze.start, haze.end], [0.35, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const group = (nodes: React.ReactNode[]) => {
    const [a, b] = accentRange;
    if (a >= b) return nodes;
    return [
      ...nodes.slice(0, a),
      <span
        key="accent"
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          padding: "0.12em 0.06em 0.22em",
          margin: "-0.12em -0.06em -0.22em",
          color: "transparent",
          backgroundImage: t >= tintAt ? beamFill : "none",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {nodes.slice(a, b)}
      </span>,
      ...nodes.slice(b),
    ];
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(48% 34% at 50% 60%, ${c.haze} 0%, transparent 72%)`,
          opacity: hazeIn,
        }}
      />
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + push * 0.025})${glide(midway(push))}`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              whiteSpace: "pre",
              fontFamily,
              fontSize: F,
              lineHeight: 1,
              letterSpacing: `${TRACK}em`,
              fontKerning: "normal",
            }}
          >
            {group(
              chars.map((ch, i) => {
                const p = n > 1 ? i / (n - 1) : 0.5;
                let bump = 0;
                for (const w of waveEls) {
                  const s = w.start;
                  const waveLength = w.length;
                  const crest = interpolate(
                    t,
                    [s, s + waveLength],
                    [-0.3, 1.3],
                    {
                      ...CLAMP,
                      easing: EASE_TRAVEL,
                    },
                  );
                  const live = t > s && t < s + waveLength ? 1 : 0;
                  bump = Math.max(
                    bump,
                    live * Math.exp(-(((p - crest) / sigma) ** 2)),
                  );
                }
                const wave = lo + (hi - lo) * bump;
                const sp = spring({
                  frame: t - settleStart - i * settling.beat("stagger"),
                  fps,
                  config: { damping: 15, stiffness: 120, mass: 0.9 },
                });
                const weight = clampW(wave + (rest - wave) * sp);
                const isAccent = i >= accentRange[0] && i < accentRange[1];
                const tint = isAccent
                  ? interpolate(
                      t,
                      [
                        settleStart +
                          settling.beat("tint") +
                          (i - accentRange[0]) * settling.beat("tintStagger"),
                        settleStart +
                          (settling.beat("tint") + settling.beat("tintLen")) +
                          (i - accentRange[0]) * settling.beat("tintStagger"),
                      ],
                      [0, 1],
                      CLAMP,
                    )
                  : 0;
                const fadeAt = enter.start + i * enter.beat("stagger");
                const o = interpolate(
                  t,
                  [fadeAt, fadeAt + enter.beat("letter")],
                  [0, 1],
                  {
                    ...CLAMP,
                    easing: EASE_OUT,
                  },
                );
                return (
                  <span
                    key={`${i}-${ch}`}
                    style={{
                      display: "inline-block",
                      fontWeight: weight,
                      color: inkAt(tint),
                      opacity: o,
                    }}
                  >
                    {ch}
                  </span>
                );
              }),
            )}
          </div>
        </AbsoluteFill>
      </ScaleLayer>
      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
