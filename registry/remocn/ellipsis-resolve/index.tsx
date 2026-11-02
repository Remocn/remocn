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

const { fontFamily: serif } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface EllipsisResolveProps {
  /** The word the ellipsis resolves into. A period is always appended. */
  word?: string;
  accent?: string;
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

export const ellipsisResolveDuration = SWEEP + SWEEP_LEN + RISE + 34;

export function EllipsisResolve({
  word = "Shipped",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: EllipsisResolveProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
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
  const zoom = interpolate(
    t,
    [STRETCH - 6, STRETCH + STRETCH_LEN + 6],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_IO,
    },
  );
  const cam = lerp(1.75, 1, zoom);

  // Dots begin centered in frame, then settle onto the word's baseline.
  const drop = EASE_IO(
    interpolate(t, [STRETCH, STRETCH + STRETCH_LEN], [0, 1], CLAMP),
  );
  const dotY = lerp(H / 2, restY, drop);

  const bump = (k: number) => {
    let b = 0;
    for (const start of [PULSE_A, PULSE_B]) {
      const local = (t - start - k * BUMP_STEP) / BUMP;
      if (local > 0 && local < 1) b = Math.max(b, Math.sin(Math.PI * local));
    }
    return b;
  };

  // Stretch: dot 3 travels to the period, dots 1 and 2 pull into one bar.
  const st = (k: number) =>
    EASE_IO(
      interpolate(
        t,
        [STRETCH + (2 - k) * 2, STRETCH + (2 - k) * 2 + STRETCH_LEN - 4],
        [0, 1],
        CLAMP,
      ),
    );
  const barRight = periodCx - d / 2 - 0.55 * d;
  const mid = (left + barRight) / 2;
  const startCx = (k: number) => W / 2 + (k - 1) * pitch;

  // Sweep: the bar's left edge chases right and folds into the period.
  const sweepRaw = interpolate(t, [SWEEP, SWEEP + SWEEP_LEN], [0, 1], CLAMP);
  const sweep = EASE_SWEEP(sweepRaw);
  const closeGap = EASE_IO(interpolate(t, [SWEEP, SWEEP + 10], [0, 1], CLAMP));
  const barL = lerp(left, periodCx - d / 2, sweep);
  const barR = lerp(barRight, periodCx + d / 2, closeGap);
  const sweeping = t >= SWEEP;

  // Each letter starts rising the frame the bar's edge clears its middle.
  const crossAt = useMemo(
    () =>
      letters.map((l) => {
        const target = l.x + l.w * 0.45;
        for (let f = 0; f <= SWEEP_LEN; f += 0.25) {
          const x = lerp(left, periodCx - d / 2, EASE_SWEEP(f / SWEEP_LEN));
          if (x >= target) return SWEEP + f;
        }
        return SWEEP + SWEEP_LEN;
      }),
    [letters, left, periodCx, d],
  );

  const accentIn = EASE_OUT(
    interpolate(t, [STRETCH + 4, STRETCH + STRETCH_LEN], [0, 1], CLAMP),
  );
  const landAt = SWEEP + SWEEP_LEN;
  const settle = interpolate(t, [landAt - 2, landAt + SETTLE], [0, 1], CLAMP);
  const pop = 1 + 0.14 * Math.sin(Math.PI * EASE_OUT(settle));
  const push = interpolate(t, [landAt, landAt + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // The silk sheen drifts a few degrees while the word holds.
  const sheen = `linear-gradient(${96 + 10 * push}deg, ${c.ink[0]} 0%, ${c.ink[1]} 34%, ${c.ink[2]} 72%, ${c.ink[3]} 100%)`;

  const dotStyle = (
    l: number,
    r: number,
    y: number,
    color: string,
  ): React.CSSProperties => ({
    position: "absolute",
    left: l,
    top: y - d / 2,
    width: Math.max(d, r - l),
    height: d,
    borderRadius: d / 2,
    background: color,
  });

  const dot3Cx = lerp(startCx(2), periodCx, st(2));
  const dot3Color = interpolateColors(
    accentIn,
    [0, 1],
    [interpolateColors(bump(2), [0, 1], [c.muted, c.fg]), accent],
  );

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: 0.4 + 0.6 * accentIn,
          background: `radial-gradient(60% 42% at ${46 + 4 * push}% 50%, ${c.haze} 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${cam * (1 + 0.02 * push)})`,
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
                fontFamily: serif,
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
                transform: `translateY(${(1 - p) * 0.16 * F}px)`,
              }}
            >
              {l.ch}
            </div>
          );
        })}

        {(() => {
          if (sweeping) return <div style={dotStyle(barL, barR, dotY, c.fg)} />;
          const segs = [0, 1].map((k) => {
            const s = st(k);
            const cx = startCx(k);
            const l0 = cx - d / 2;
            const r0 = cx + d / 2;
            return {
              l: k === 0 ? lerp(l0, left, s) : lerp(l0, mid - d / 2, s),
              r: k === 0 ? lerp(r0, mid + d / 2, s) : lerp(r0, barRight, s),
              lift: bump(k) * 0.05 * F * (1 - s),
              color: interpolateColors(
                Math.max(bump(k), Math.min(1, s * 3)),
                [0, 1],
                [c.muted, c.fg],
              ),
            };
          });
          // Once the two capsules overlap they are one bar: draw it once so
          // the rounded ends never leave an antialiased seam.
          if (segs[1].l < segs[0].r) {
            return <div style={dotStyle(segs[0].l, segs[1].r, dotY, c.fg)} />;
          }
          return segs.map((g, k) => (
            <div
              key={k === 0 ? "a" : "b"}
              style={dotStyle(g.l, g.r, dotY - g.lift, g.color)}
            />
          ));
        })()}

        <div
          style={{
            ...dotStyle(
              dot3Cx - d / 2,
              dot3Cx + d / 2,
              dotY - bump(2) * 0.05 * F * (1 - st(2)),
              dot3Color,
            ),
            transform: `scale(${pop})`,
          }}
        />
      </AbsoluteFill>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
