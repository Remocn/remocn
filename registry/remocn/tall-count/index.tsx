"use client";

import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";
import { loadVariableFont } from "@remotion/google-fonts/RobotoFlex";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type TallCountElementId, tallCountTimeline } from "./timeline";

const flex = loadVariableFont("oblique 0deg 10deg", { subsets: ["latin"] });
const instrument = loadInstrument("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface TallCountProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  /** Color of the label; overrides the theme. */
  ink?: string;
  background?: string;
  /** Typeface for the label. Load it yourself; Instrument Sans by default. The figure keeps Roboto Flex, whose width axis it animates. */
  fontFamily?: string;
  /** Frames the figure takes to count up and grow. */
  growDuration?: number;
  /** How much taller the figure springs once it lands; 0 keeps it still. */
  stretch?: number;
  /** Size of the figure and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the fade-in, the label, the grow and the lift,
   * by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<TallCountElementId>;
}

const RISE = ["#fff1e2", "#ff8a3d", "#a3301a", "#2a0d0a"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#9A999F",
    fill: [RISE[2], "#e0703b", RISE[1], RISE[0], RISE[0]],
    glow: (a: string) =>
      [
        `radial-gradient(70% 48% at 30% 108%, color-mix(in oklab, ${RISE[2]} 40%, transparent) 0%, color-mix(in oklab, ${RISE[3]} 60%, transparent) 46%, transparent 78%)`,
        `radial-gradient(40% 30% at 86% 110%, color-mix(in oklab, ${a} 16%, transparent) 0%, transparent 80%)`,
      ].join(", "),
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#5E5C57",
    fill: [RISE[3], "#5a1a10", RISE[2], "#d9541f", "#f07a35"],
    glow: (a: string) =>
      [
        `radial-gradient(70% 46% at 30% 110%, color-mix(in oklab, ${RISE[1]} 22%, transparent) 0%, transparent 76%)`,
        `radial-gradient(40% 30% at 86% 112%, color-mix(in oklab, ${a} 10%, transparent) 0%, transparent 80%)`,
      ].join(", "),
    grain: 0.035,
  },
} as const;

const WDTH = [25, 151] as const;
const SAMPLES = [25, 35, 50, 70, 90, 110, 130, 151];
const WGHT = 460;
const TRACK = -0.01;
const YTFI = [738, 788] as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GROW = Easing.bezier(0.33, 0, 0.16, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const fvs = (wdth: number, ytfi: number) =>
  `"wdth" ${wdth.toFixed(2)}, "wght" ${WGHT}, "YTFI" ${ytfi.toFixed(1)}, "opsz" 144, "slnt" 0`;

type Curve = number[];

interface Metrics {
  digit: Curve;
  comma: Curve;
  dot: Curve;
  prefix: Curve;
  suffix: Curve;
  baseline: number;
  figTop: [number, number];
}

function widthAt(curve: Curve, wdth: number) {
  const w = Math.min(WDTH[1], Math.max(WDTH[0], wdth));
  for (let i = 0; i < SAMPLES.length - 1; i++) {
    if (w <= SAMPLES[i + 1]) {
      const k = (w - SAMPLES[i]) / (SAMPLES[i + 1] - SAMPLES[i]);
      return curve[i] + (curve[i + 1] - curve[i]) * k;
    }
  }
  return curve[curve.length - 1];
}

function solveWdth(curve: Curve, target: number) {
  if (target <= curve[0]) return WDTH[0];
  for (let i = 0; i < SAMPLES.length - 1; i++) {
    if (target <= curve[i + 1]) {
      const k = (target - curve[i]) / Math.max(1e-6, curve[i + 1] - curve[i]);
      return SAMPLES[i] + (SAMPLES[i + 1] - SAMPLES[i]) * k;
    }
  }
  return WDTH[1];
}

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function measure(prefix: string, suffix: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${flex.fontFamily}"`,
    fontStyle: "normal",
    fontSize: "100px",
    lineHeight: "1",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: `${TRACK}em`,
  });
  document.body.appendChild(probe);
  const curve = (s: string): Curve =>
    SAMPLES.map((wd) => {
      if (!s) return 0;
      probe.style.fontVariationSettings = fvs(wd, YTFI[0]);
      probe.textContent = s;
      return probe.getBoundingClientRect().width / 100;
    });
  const m = {
    digit: curve("0"),
    comma: curve(","),
    dot: curve("."),
    prefix: curve(prefix),
    suffix: curve(suffix),
  };
  probe.remove();

  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let baseline = 0.78;
  const figTop: [number, number] = [0.71, 0.76];
  if (ctx) {
    ctx.font = `${WGHT} 200px "${flex.fontFamily}"`;
    const fm = ctx.measureText("0");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    figTop[0] = fm.actualBoundingBoxAscent / 200;
    figTop[1] = figTop[0] * (YTFI[1] / YTFI[0]);
  }
  return { ...m, baseline, figTop };
}

function useMetrics(prefix: string, suffix: string) {
  const key = `${prefix}\u0001${suffix}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("tall-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [p, s] = key.split("\u0001");
    Promise.all([
      flex.waitUntilDone(),
      instrument.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${flex.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(p, s) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `tc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

// Chrome parks a glyph raster on a whole pixel vertically for as long as the
// matrix is axis-aligned, so text under a slow transform clicks along pixel by
// pixel. The transforms that carry text are marked, so it leans off that grid
// while they move.
const midway = (p: number) => p > 0 && p < 1;

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

export function TallCount(props: TallCountProps) {
  const {
    value = 240,
    from = 0,
    decimals = 0,
    prefix = "+",
    suffix = "%",
    label = "more watch time on launch posts that move",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = instrument.fontFamily,
    stretch = 0.16,
    scale = 1,
    delay = 0,
    grain = true,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    tallCountTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const m = useMetrics(prefix, suffix);
  const finalText = useMemo(() => format(value, decimals), [value, decimals]);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);

  const curveOf = (text: string): Curve =>
    SAMPLES.map((_, i) => {
      let w = m.prefix[i] + m.suffix[i];
      for (const ch of text) {
        if (ch === ",") w += m.comma[i];
        else if (ch === ".") w += m.dot[i];
        else w += m.digit[i];
      }
      return w;
    });

  const marginX = W * (portrait ? 0.07 : 0.075);
  const measureFrame = portrait ? W - marginX * 2 : W * 0.54;
  const labelGap = W * 0.035;
  const labelW = W - marginX * 2;
  const labelFs = (portrait ? 48 : 38) * s;
  const baseY = portrait ? H * 0.6 : H * 0.84;

  const STRETCH = stretch;
  const growEl = tl.get("grow");
  const liftEl = tl.get("lift");
  const enterEl = tl.get("enter");
  const labelEl = tl.get("label");
  const growEnd = growEl.end;
  const maxInk = portrait ? H * 0.36 : H * 0.7;
  const finalCurve = curveOf(finalText);
  const F1 = Math.min(
    measureFrame / Math.max(0.1, finalCurve[0] * 1.08),
    maxInk / (m.figTop[1] * (1 + STRETCH)),
  );
  const measureW = Math.min(measureFrame, F1 * finalCurve[0] * 1.08);
  const F0 = F1 * 0.3;
  const finalW = widthAt(finalCurve, solveWdth(finalCurve, measureW / F1)) * F1;

  const g = interpolate(t, [growEl.start, growEnd], [0, 1], {
    ...CLAMP,
    easing: EASE_GROW,
  });
  const count = from + (value - from) * g;
  const text = format(
    Math.round(count * 10 ** decimals) / 10 ** decimals,
    decimals,
  );
  const curve = curveOf(text);
  const F = F0 + (F1 - F0) * g;
  const wdth = Math.min(WDTH[1], solveWdth(curve, measureW / F));
  const ytfi = YTFI[0] + (YTFI[1] - YTFI[0]) * g * g;
  const syAt = (f: number) =>
    (
      1 +
      STRETCH *
        spring({
          frame: f - liftEl.start,
          fps,
          config: { damping: 11, stiffness: 110, mass: 0.9 },
        })
    ).toFixed(4);
  const sy = syAt(t);
  // The lift overshoots, so it moves for as long as the stretch it renders
  // differs from a neighbouring frame.
  const lifting = sy !== syAt(t - 1) || sy !== syAt(t + 1);
  // The number is laid out once at its full size and grows by transform:
  // layout rounds a baseline to whole pixels, so a figure eased by `top` and
  // `fontSize` clicks up pixel by pixel. Blur and the fill are drawn in the
  // scaled space, so they're divided back by `k`.
  const k = g === 1 ? 1 : F / F1;
  const numW = widthAt(curve, wdth) * F;

  const enter = interpolate(t, [enterEl.start, enterEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const numLeft = portrait ? (W - numW) / 2 : marginX;
  const boxTop = baseY - m.baseline * F;
  const restTop = baseY - m.baseline * F1;
  const fill = `linear-gradient(0deg, ${c.fill[0]} ${(100 - (baseY / H) * 100).toFixed(1)}%, ${c.fill[1]} ${(100 - ((baseY - maxInk * 0.35) / H) * 100).toFixed(1)}%, ${c.fill[2]} ${(100 - ((baseY - maxInk * 0.7) / H) * 100).toFixed(1)}%, ${c.fill[3]} ${(100 - ((baseY - maxInk * 1.02) / H) * 100).toFixed(1)}%, ${c.fill[4]} 100%)`;

  const labelP = interpolate(t, [labelEl.start, labelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelTop = portrait ? baseY + labelFs * 1.2 : undefined;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {transparent ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: c.glow(accent),
            opacity: interpolate(t, [growEl.start, growEnd], [0.35, 1], CLAMP),
          }}
        />
      )}

      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: numLeft,
            top: restTop,
            height: F1,
            lineHeight: `${F1}px`,
            whiteSpace: "pre",
            fontFamily: flex.fontFamily,
            fontStyle: "normal",
            fontSize: F1,
            fontVariantNumeric: "tabular-nums",
            fontVariationSettings: fvs(wdth, ytfi),
            letterSpacing: `${TRACK}em`,
            transformOrigin: `0 ${(m.baseline * F1).toFixed(2)}px`,
            transform: `${k === 1 ? "" : `scale(${k}) `}scaleY(${sy})${glide(midway(g) || lifting)}`,
            opacity: enter,
            filter:
              enter < 1
                ? `blur(${(((1 - enter) * 10 * s) / k).toFixed(2)}px)`
                : undefined,
            backgroundImage: fill,
            backgroundSize: `${W / k}px ${H / k}px`,
            backgroundPosition: `${-numLeft / k}px ${-boxTop / k}px`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {prefix}
          {text}
          {suffix}
        </div>

        {label ? (
          <div
            style={{
              position: "absolute",
              left: portrait ? marginX : marginX + finalW + labelGap,
              width: portrait
                ? labelW
                : Math.min(W * 0.32, W - marginX * 2 - finalW - labelGap),
              ...(portrait
                ? { top: labelTop, textAlign: "center" as const }
                : { bottom: H - baseY - labelFs * 0.22 }),
              fontFamily,
              fontWeight: 400,
              fontSize: labelFs,
              lineHeight: 1.22,
              letterSpacing: "-0.012em",
              textWrap: "balance",
              color: ink ?? c.muted,
              opacity: labelP,
              transform: `translateY(${((1 - labelP) * labelFs * 0.6).toFixed(2)}px)${glide(midway(labelP))}`,
            }}
          >
            {label}
          </div>
        ) : null}
      </ScaleLayer>

      {transparent || !grain ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
