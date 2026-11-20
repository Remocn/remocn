"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const { fontFamily: serif } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface EllipsisResolveProps {
  /** The word the ellipsis resolves into. A period is always appended. */
  word?: string;
  accent?: string;
  /** Solid color for the word and dots, in place of the silk sheen. */
  ink?: string;
  background?: string;
  /** Typeface for the word. Load it yourself; Instrument Serif by default. */
  fontFamily?: string;
  /** Frame the typing dots stop pulsing and stretch toward the word. */
  resolveAt?: number;
  /** Frames the bar takes to sweep across and reveal the word. */
  sweepFrames?: number;
  /** Size of the word, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
}

// Instrument Serif 400 advance widths (1/1000 em) for ASCII 32–126.
const SERIF_400 = [
  170, 237, 371, 635, 417, 590, 579, 233, 340, 340, 444, 531, 217, 430, 213,
  258, 460, 249, 404, 371, 393, 382, 404, 364, 433, 402, 213, 217, 531, 531,
  531, 317, 660, 457, 478, 480, 530, 453, 408, 521, 546, 249, 249, 496, 413,
  665, 540, 540, 466, 540, 513, 407, 461, 536, 457, 651, 546, 477, 427, 325,
  258, 325, 433, 376, 354, 399, 443, 339, 457, 355, 288, 402, 470, 223, 215,
  451, 220, 704, 470, 408, 444, 442, 318, 308, 259, 454, 393, 597, 385, 401,
  353, 318, 252, 318, 531,
];
const TRACK = -0.012;
const CAP = 0.72;
const BASELINE = 0.94; // baseline offset inside a lineHeight 1.2 box (asc 990, desc 310)
const PERIOD = 0.213; // advance of "."
const DOT = 0.105; // period diameter
const DOT_LSB = 0.054; // period left side bearing

// Beats (frames at 30fps).
const PULSE_A = 2;
const PULSE_B = 20;
const BUMP = 11;
const BUMP_STEP = 4;
const STRETCH = 40;
const STRETCH_LEN = 20;
const SWEEP = 58;
const SWEEP_LEN = 26;
const RISE = 13;
const SETTLE = 10;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SWEEP = Easing.bezier(0.55, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "silk" palette (#3b3fd8, #f3d6c0, #8a7bff on #030308): a
// sheen across the resolved word, plus a faint haze of it on the stage.
const THEMES = {
  dark: {
    bg: "#030308",
    fg: "#F4F1EE",
    muted: "#46464F",
    ink: ["#F3D6C0", "#F6EEE9", "#B4A9FF", "#8A7BFF"],
    haze: "rgba(138,123,255,0.16)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#BBBAB4",
    ink: ["#14163F", "#2A2DA8", "#3B3FD8", "#8A7BFF"],
    haze: "rgba(243,214,192,0.55)",
    grain: 0.045,
  },
} as const;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? SERIF_400[code - 32] : 620) / 1000;
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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export const ellipsisResolveDuration = SWEEP + SWEEP_LEN + RISE + 34;

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

export function EllipsisResolve({
  word = "Shipped",
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = serif,
  resolveAt = STRETCH,
  sweepFrames = SWEEP_LEN,
  scale = 1,
  delay = 0,
  grain = true,
  theme = "dark",
  speed = 1,
}: EllipsisResolveProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const sweepAt = SWEEP + (resolveAt - STRETCH);
  const u = H / 720;

  const layout = useMemo(() => {
    const chars = Array.from(word);
    const adv = chars.map((ch) => advance(ch) + TRACK);
    const total = adv.reduce((s, a) => s + a, 0) + PERIOD;
    const F = Math.min(250 * u, (W * 0.72) / total);
    const left = W / 2 - (total * F) / 2;
    let x = left;
    const letters = chars.map((ch, i) => {
      const box = { ch, x, w: adv[i] * F };
      x += adv[i] * F;
      return box;
    });
    const periodCx = x + (DOT_LSB + DOT / 2) * F;
    return { F, left, letters, periodCx, wordW: x - left };
  }, [word, W, u]);
  const { F, left, letters, periodCx, wordW } = layout;

  const d = DOT * F;
  const baseline = H / 2 + (CAP * F) / 2;
  const restY = baseline - d / 2;
  const pitch = 1.95 * d;

  // Camera: starts close on the typing indicator, eases out to the word.
  const zoomAt = (tt: number) =>
    interpolate(tt, [resolveAt - 6, resolveAt + STRETCH_LEN + 6], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const zoom = zoomAt(t);
  const cam = lerp(1.75, 1, zoom);

  // Dots begin centered in frame, then settle onto the word's baseline.
  const dropAt = (tt: number) =>
    EASE_IO(
      interpolate(tt, [resolveAt, resolveAt + STRETCH_LEN], [0, 1], CLAMP),
    );

  const bump = (tt: number, k: number) => {
    let b = 0;
    for (const start of [PULSE_A, PULSE_B]) {
      const local = (tt - start - k * BUMP_STEP) / BUMP;
      if (local > 0 && local < 1) b = Math.max(b, Math.sin(Math.PI * local));
    }
    return b;
  };

  // Stretch: dot 3 travels to the period, dots 1 and 2 pull into one bar.
  const st = (tt: number, k: number) =>
    EASE_IO(
      interpolate(
        tt,
        [resolveAt + (2 - k) * 2, resolveAt + (2 - k) * 2 + STRETCH_LEN - 4],
        [0, 1],
        CLAMP,
      ),
    );
  const barRight = periodCx - d / 2 - 0.55 * d;
  const mid = (left + barRight) / 2;
  const startCx = (k: number) => W / 2 + (k - 1) * pitch;

  // Each letter starts rising the frame the bar's edge clears its middle.
  const crossAt = useMemo(
    () =>
      letters.map((l) => {
        const target = l.x + l.w * 0.45;
        for (let f = 0; f <= sweepFrames; f += 0.25) {
          const x = lerp(left, periodCx - d / 2, EASE_SWEEP(f / sweepFrames));
          if (x >= target) return sweepAt + f;
        }
        return sweepAt + sweepFrames;
      }),
    [letters, left, periodCx, d, sweepAt, sweepFrames],
  );

  const accentIn = EASE_OUT(
    interpolate(t, [resolveAt + 4, resolveAt + STRETCH_LEN], [0, 1], CLAMP),
  );
  const landAt = sweepAt + sweepFrames;
  const settle = interpolate(t, [landAt - 2, landAt + SETTLE], [0, 1], CLAMP);
  const pop = 1 + 0.14 * Math.sin(Math.PI * EASE_OUT(settle));
  const pushAt = (tt: number) =>
    interpolate(tt, [landAt, landAt + 40], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const push = pushAt(t);
  // The push eases out over 40 frames, so its tail is tested frame to frame
  // on the camera's scale itself rather than on a progress.
  const camAt = (tt: number) =>
    lerp(1.75, 1, zoomAt(tt)) * (1 + 0.02 * pushAt(tt));
  const camMoving =
    Math.abs(camAt(t + speed) - camAt(t)) > 1e-6 ||
    Math.abs(camAt(t) - camAt(t - speed)) > 1e-6;

  // The silk sheen drifts a few degrees while the word holds.
  const sheen =
    ink === undefined
      ? `linear-gradient(${96 + 10 * push}deg, ${c.ink[0]} 0%, ${c.ink[1]} 34%, ${c.ink[2]} 72%, ${c.ink[3]} 100%)`
      : `linear-gradient(${ink}, ${ink})`;

  // Every dot and bar on frame `tt`, keyed so a frame can be compared with
  // its neighbours. `at` is the fixed spot it is laid out at while it moves.
  type Dot = {
    key: string;
    l: number;
    r: number;
    y: number;
    color: string;
    at: [number, number];
  };
  const dotsAt = (tt: number): Dot[] => {
    const dotY = lerp(H / 2, restY, dropAt(tt));
    const atStart = (k: number): [number, number] => [
      startCx(k) - d / 2,
      H / 2,
    ];
    const accentAt = EASE_OUT(
      interpolate(tt, [resolveAt + 4, resolveAt + STRETCH_LEN], [0, 1], CLAMP),
    );
    const dot3Cx = lerp(startCx(2), periodCx, st(tt, 2));
    const dot3: Dot = {
      key: "c",
      l: dot3Cx - d / 2,
      r: dot3Cx + d / 2,
      y: dotY - bump(tt, 2) * 0.05 * F * (1 - st(tt, 2)),
      color: interpolateColors(
        accentAt,
        [0, 1],
        [interpolateColors(bump(tt, 2), [0, 1], [c.muted, fg]), accent],
      ),
      at: atStart(2),
    };
    // Sweep: the bar's left edge chases right and folds into the period.
    if (tt >= sweepAt) {
      const sweep = EASE_SWEEP(
        interpolate(tt, [sweepAt, sweepAt + sweepFrames], [0, 1], CLAMP),
      );
      const closeGap = EASE_IO(
        interpolate(tt, [sweepAt, sweepAt + 10], [0, 1], CLAMP),
      );
      const bar: Dot = {
        key: "bar",
        l: lerp(left, periodCx - d / 2, sweep),
        r: lerp(barRight, periodCx + d / 2, closeGap),
        y: dotY,
        color: fg,
        at: [left, restY],
      };
      return [bar, dot3];
    }
    const segs = [0, 1].map((k): Dot => {
      const s = st(tt, k);
      const cx = startCx(k);
      const l0 = cx - d / 2;
      const r0 = cx + d / 2;
      return {
        key: k === 0 ? "a" : "b",
        l: k === 0 ? lerp(l0, left, s) : lerp(l0, mid - d / 2, s),
        r: k === 0 ? lerp(r0, mid + d / 2, s) : lerp(r0, barRight, s),
        y: dotY - bump(tt, k) * 0.05 * F * (1 - s),
        color: interpolateColors(
          Math.max(bump(tt, k), Math.min(1, s * 3)),
          [0, 1],
          [c.muted, fg],
        ),
        at: atStart(k),
      };
    });
    // Once the two capsules overlap they are one bar: draw it once so
    // the rounded ends never leave an antialiased seam.
    if (segs[1].l < segs[0].r) {
      const bar: Dot = {
        key: "ab",
        l: segs[0].l,
        r: segs[1].r,
        y: dotY,
        color: fg,
        at: [left, restY],
      };
      return [bar, dot3];
    }
    return [...segs, dot3];
  };

  // Layout rounds a box's edges to whole pixels, so a dot eased by `left`
  // and `top` steps unevenly under the camera's zoom. While a dot moves it
  // is laid out at its fixed spot and the travel is a translate; at rest it
  // keeps the plain layout it always had.
  const before = dotsAt(t - speed);
  const after = dotsAt(t + speed);
  const shifts = (g: Dot, list: Dot[]) => {
    const o = list.find((x) => x.key === g.key);
    return !o || Math.abs(g.l - o.l) > 1e-3 || Math.abs(g.y - o.y) > 1e-3;
  };
  const dotStyle = (g: Dot, extra = ""): React.CSSProperties => {
    const moving = shifts(g, before) || shifts(g, after);
    const [ax, ay] = moving ? g.at : [g.l, g.y];
    const move = moving ? `translate(${g.l - ax}px, ${g.y - ay}px) ` : "";
    return {
      position: "absolute",
      left: ax,
      top: ay - d / 2,
      width: Math.max(d, g.r - g.l),
      height: d,
      borderRadius: d / 2,
      background: g.color,
      transform: `${move}${extra}`.trim() || undefined,
    };
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: 0.4 + 0.6 * accentIn,
          background: `radial-gradient(60% 42% at ${46 + 4 * push}% 50%, ${c.haze} 0%, transparent 70%)`,
        }}
      />
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${cam * (1 + 0.02 * push)})${glide(camMoving)}`,
            transformOrigin: `${W / 2}px ${lerp(H / 2, baseline - 0.3 * F, zoom)}px`,
          }}
        >
          {letters.map((l, i) => {
            const p = EASE_OUT(
              interpolate(t, [crossAt[i], crossAt[i] + RISE], [0, 1], CLAMP),
            );
            if (p <= 0) return null;
            return (
              <div
                key={`${i}-${l.ch}`}
                style={{
                  position: "absolute",
                  left: l.x,
                  top: baseline - BASELINE * F,
                  fontFamily,
                  fontWeight: 400,
                  fontSize: F,
                  lineHeight: 1.2,
                  whiteSpace: "pre",
                  color: "transparent",
                  backgroundImage: sheen,
                  backgroundSize: `${wordW}px ${1.2 * F}px`,
                  backgroundPosition: `${left - l.x}px 0`,
                  backgroundRepeat: "no-repeat",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  opacity: Math.min(1, p * 1.6),
                  transform: `translateY(${(1 - p) * 0.16 * F}px)${glide(midway(p) && !camMoving)}`,
                }}
              >
                {l.ch}
              </div>
            );
          })}

          {dotsAt(t).map((g) => (
            <div
              key={g.key}
              style={dotStyle(g, g.key === "c" ? `scale(${pop})` : "")}
            />
          ))}
        </AbsoluteFill>
      </ScaleLayer>
      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
