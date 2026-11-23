"use client";

import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const instrument = loadInstrument("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface StemStretchProps {
  value?: string;
  label?: string;
  steps?: number;
  /** Frames between the stretch's snaps. */
  snapGap?: number;
  /** Frames between label words. */
  stagger?: number;
  accent?: string;
  /** Text color of the figure; overrides the theme ink. */
  ink?: string;
  /** Background fill in place of the theme ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Instrument Sans by default. */
  fontFamily?: string;
  /** Film grain over the scene. */
  grain?: boolean;
  /** Size of the figure and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0A0A0B", ink: "#F4F3F0", muted: "#8E8D94", grain: 0.05 },
  light: { bg: "#F5F4F0", ink: "#121214", muted: "#6E6C67", grain: 0.035 },
};

const STRETCH = {
  dark: (accent: string) =>
    `linear-gradient(180deg, #F4F3F0 0%, #FFF1E2 8%, #FF8A3D 34%, #C2452A 58%, ${accent} 92%, #F4F3F0 100%)`,
  light: (accent: string) =>
    `linear-gradient(180deg, #121214 0%, #3A1A14 6%, #F2552C 34%, #E889B5 62%, ${accent} 92%, #121214 100%)`,
};
const GLOW = {
  dark: "radial-gradient(60% 50% at 50% 50%, color-mix(in oklab, #ff8a3d 10%, transparent) 0%, transparent 70%), radial-gradient(80% 50% at 50% 115%, color-mix(in oklab, #a3301a 30%, transparent) 0%, transparent 70%)",
  light:
    "radial-gradient(60% 50% at 50% 50%, color-mix(in oklab, #f7b23b 12%, transparent) 0%, transparent 70%), radial-gradient(80% 50% at 50% 115%, color-mix(in oklab, #f2552c 12%, transparent) 0%, transparent 70%)",
};

const TRACK = -0.035;
const RISE_LEN = 18;
const RISE_GAP = 3;
const SNAP_AT = 26;
const SNAP_GAP = 12;
const LABEL_AT = 66;
const SLICE = 0.5;
const BLEED = 2;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const FONT_PX = 400;

interface Metrics {
  width: number;
  label: number;
  adv: number[];
  baseline: number;
  cap: number;
  cut: number;
  desc: number;
}

function findCut(
  ctx: CanvasRenderingContext2D,
  text: string,
  cap: number,
  font: string,
) {
  const W = Math.ceil(ctx.measureText(text).width) + 40;
  const H = Math.ceil(FONT_PX * 1.4);
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.font = `500 ${FONT_PX}px "${font}"`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  const base = Math.round(FONT_PX * 1.1);
  ctx.fillText(text, 20, base);
  const data = ctx.getImageData(0, 0, W, H).data;
  const a = (x: number, y: number) => data[(y * W + x) * 4 + 3];
  const capPx = cap * FONT_PX;
  let best = 0.45;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let f = 0.3; f <= 0.66; f += 0.01) {
    const y = Math.round(base - capPx * f);
    let diff = 0;
    let ink = 0;
    for (let x = 0; x < W; x++) {
      const v = a(x, y);
      ink += v;
      diff += Math.abs(v - a(x, y - 3)) + Math.abs(v - a(x, y + 3));
    }
    if (ink === 0) continue;
    const score = diff / ink + Math.abs(f - 0.48) * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best * cap;
}

function measure(text: string, label: string, font: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("stem-stretch: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${font}"`;
  const chars = Array.from(text);
  const adv = chars.map((ch) => ctx.measureText(ch).width / FONT_PX + TRACK);
  const width =
    ctx.measureText(text).width / FONT_PX +
    TRACK * Math.max(0, chars.length - 1);
  const fm = ctx.measureText("H");
  const asc = fm.fontBoundingBoxAscent / FONT_PX;
  const desc = fm.fontBoundingBoxDescent / FONT_PX;
  const cap = fm.actualBoundingBoxAscent / FONT_PX;
  const inkDesc = Math.max(
    0,
    ctx.measureText(text).actualBoundingBoxDescent / FONT_PX,
  );
  ctx.font = `400 ${FONT_PX}px "${font}"`;
  const lab = label ? ctx.measureText(label).width / FONT_PX : 0;
  const cut = findCut(ctx, text, cap, font);
  return {
    width,
    label: lab,
    adv,
    baseline: (1 - (asc + desc)) / 2 + asc,
    cap,
    cut,
    desc: inkDesc,
  };
}

function useMetrics(text: string, label: string, font: string) {
  const key = `${text}\u0000${label}\u0000${font}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("stem-stretch: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [tx, lb, ff] = key.split("\u0000");
    Promise.all([
      instrument.waitUntilDone(),
      document.fonts.load(`500 100px "${ff}"`),
      document.fonts.load(`400 100px "${ff}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(tx, lb, ff) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state?.m ?? null;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `ss${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={3}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function StemStretch({
  value = "4 hours",
  label = "back, every week",
  steps = 4,
  snapGap = SNAP_GAP,
  stagger = 3,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = instrument.fontFamily,
  grain = true,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: StemStretchProps) {
  const glide = useGlide();
  const frame = useSceneFrame();
  const t = Math.max(0, frame - delay) * speed;
  const { width: W, height: H, fps } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const bg = background ?? c.bg;
  const m = useMetrics(value, label, fontFamily);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const n = Math.max(1, Math.round(steps));
  const portrait = H > W;
  // Scaled through the layout, not a transformed layer: a transform would
  // isolate the stretch band's blend modes from the background.
  const F = Math.min(H * (portrait ? 0.2 : 0.3), (W * 0.84) / m.width) * scale;
  const capPx = m.cap * F;
  const gapMax = Math.max(
    capPx * 0.6,
    H * (portrait ? 0.42 : 0.62) * scale - capPx,
  );
  const block = gapMax / n;

  const gapAt = (f: number) => {
    const tt = Math.max(0, f - delay) * speed;
    let snapped = 0;
    for (let k = 0; k < n; k++) {
      snapped += spring({
        frame: tt - (SNAP_AT + k * snapGap),
        fps,
        config: { damping: 13, stiffness: 210, mass: 0.7 },
      });
    }
    return block * snapped;
  };
  const gap = gapAt(frame);
  // The snaps overshoot and never quite settle, so motion is read off the
  // neighbouring frames rather than a progress.
  const snapping =
    Math.abs(gapAt(frame + 1) - gap) > 1e-3 ||
    Math.abs(gap - gapAt(frame - 1)) > 1e-3;

  const labelSize = Math.min(
    Math.max(F * 0.17, H * 0.044 * scale),
    H * 0.056 * scale,
    (W * 0.84 * scale) / Math.max(0.1, m.label),
  );
  const labelGap = label ? Math.max(F * 0.2, H * 0.04 * scale) : 0;
  const capTopAt = (g: number) =>
    (H - (capPx + g + (label ? labelGap + labelSize : 0))) / 2;
  const capTop = capTopAt(gap);
  const baseY = capTop + capPx + gap;
  const lineTop0 = capTop + capPx - m.baseline * F;
  const cutY0 = capTop + capPx - m.cut * F;
  // The group recentres as the gap opens. Each piece is laid out where the
  // open gap leaves it and rides there by a transform: layout rounds a box
  // and a baseline to whole pixels, so pieces eased by `top` click along
  // pixel by pixel, each on its own frame.
  const gapRest = block * n;
  const shift = capTop - capTopAt(gapRest);
  const lower = shift + gap - gapRest;
  const ride = (dy: number, tilt = true) =>
    Math.abs(dy) < 1e-3 && !snapping
      ? undefined
      : `translateY(${dy}px)${glide(snapping && tilt)}`;
  const left = (W - m.width * F) / 2;

  const chars = Array.from(value);
  const glyphs = (keyPrefix: string, style: React.CSSProperties) => {
    let x = 0;
    return chars.map((ch, i) => {
      const gx = x;
      x += m.adv[i] * F;
      const p = interpolate(
        t,
        [i * RISE_GAP - 2, i * RISE_GAP - 2 + RISE_LEN],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      return (
        <span
          key={`${keyPrefix}-${i}-${ch}`}
          style={{
            position: "absolute",
            left: gx,
            top: 0,
            transform: `translateY(${((1 - p) * F * 0.9).toFixed(2)}px)${glide(p > 0 && p < 1 && !snapping)}`,
            ...style,
          }}
        >
          {ch}
        </span>
      );
    });
  };

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left,
    width: m.width * F + F,
    height: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre",
    fontFamily,
    fontWeight: 500,
    fontSize: F,
    fontFeatureSettings: '"tnum" 1',
  };

  const k = gap / SLICE;
  const cutLocal = cutY0 - lineTop0;
  const drift = (t / 30) * 2;
  const stretchFill = STRETCH[theme](accent);
  const groupBg = theme === "dark" ? "#000" : "#fff";
  const groupInk = theme === "dark" ? "#fff" : "#000";

  const maskTop = capTop - F * 0.3;

  const labelWords = label ? label.split(" ") : [];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {background === undefined ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: GLOW[theme],
            transform: `translateY(${(Math.sin(drift * 0.3) * H * 0.01).toFixed(2)}px)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop - shift,
          height: cutY0 - maskTop,
          overflow: "hidden",
          transform: ride(shift),
        }}
      >
        <div style={{ ...lineStyle, top: lineTop0 - maskTop, color: fg }}>
          {glyphs("top", {})}
        </div>
      </div>
      {gap > 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            // The band rides by a transform too, so its edges land between
            // pixels. Where the fill only half covers an edge pixel it leaks
            // through the blend as a hairline across the frame, so the
            // group's neutral ground bleeds past the clip and every edge
            // pixel of the fill sits on solid ground. For the same reason the
            // band takes no tilt; the stretched glyphs inside carry it.
            top: cutY0 - shift - BLEED,
            height: gap + 2 * BLEED,
            isolation: "isolate",
            transform: ride(shift, false),
            background: groupBg,
            mixBlendMode: theme === "dark" ? "screen" : "multiply",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: BLEED,
              width: W,
              height: gap,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...lineStyle,
                top: -cutLocal,
                transformOrigin: `0 ${cutLocal}px`,
                transform: `scaleY(${k.toFixed(3)})${glide(snapping)}`,
                color: groupInk,
              }}
            >
              {glyphs("mid", {})}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: stretchFill,
                backgroundSize: "100% 114%",
                backgroundPosition: `0 ${(50 + Math.sin(drift * 0.5) * 45).toFixed(2)}%`,
                mixBlendMode: theme === "dark" ? "multiply" : "screen",
              }}
            />
            {Array.from({ length: n - 1 }, (_, j) => {
              const y = (j + 1) * block;
              if (y >= gap - 1) return null;
              return (
                <div
                  key={`tick-${j}`}
                  style={{
                    position: "absolute",
                    left: left - F * 0.04,
                    width: m.width * F + F * 0.08,
                    top: y - Math.max(1, F * 0.016),
                    height: Math.max(2, F * 0.032),
                    background: groupBg,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: cutY0 + gap - lower,
          height: baseY + (m.desc + 0.02) * F - (cutY0 + gap),
          overflow: "hidden",
          transform: ride(lower),
        }}
      >
        <div
          style={{
            ...lineStyle,
            top: -cutLocal,
            color: fg,
          }}
        >
          {glyphs("bot", {})}
        </div>
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: baseY + labelGap - lower,
            transform: ride(lower),
            textAlign: "center",
            fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            letterSpacing: "-0.01em",
            color: c.muted,
            whiteSpace: "pre",
            lineHeight: 1,
          }}
        >
          {labelWords.map((w, i) => {
            const p = interpolate(
              t,
              [LABEL_AT + i * stagger, LABEL_AT + i * stagger + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${i}`}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${((1 - p) * labelSize * 0.6).toFixed(2)}px)${glide(p > 0 && p < 1 && !snapping)}`,
                }}
              >
                {w}
                {i < labelWords.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
