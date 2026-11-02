"use client";

import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";
import { loadVariableFont } from "@remotion/google-fonts/RobotoFlex";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const GROW_AT = 8;
const GROW_END = 66;
const LIFT_AT = 54;
const LABEL_AT = 2;

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

export function TallCount({
  value = 240,
  from = 0,
  decimals = 0,
  prefix = "+",
  suffix = "%",
  label = "more watch time on launch posts that move",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: TallCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
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

  const STRETCH = 0.16;
  const maxInk = portrait ? H * 0.36 : H * 0.7;
  const finalCurve = curveOf(finalText);
  const F1 = Math.min(
    measureFrame / Math.max(0.1, finalCurve[0] * 1.08),
    maxInk / (m.figTop[1] * (1 + STRETCH)),
  );
  const measureW = Math.min(measureFrame, F1 * finalCurve[0] * 1.08);
  const F0 = F1 * 0.3;
  const finalW = widthAt(finalCurve, solveWdth(finalCurve, measureW / F1)) * F1;

  const g = interpolate(t, [GROW_AT, GROW_END], [0, 1], {
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
  const lift = spring({
    frame: t - LIFT_AT,
    fps,
    config: { damping: 11, stiffness: 110, mass: 0.9 },
  });
  const sy = 1 + STRETCH * lift;
  const numW = widthAt(curve, wdth) * F;

  const enter = interpolate(t, [0, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const numLeft = portrait ? (W - numW) / 2 : marginX;
  const boxTop = baseY - m.baseline * F;
  const fill = `linear-gradient(0deg, ${c.fill[0]} ${(100 - (baseY / H) * 100).toFixed(1)}%, ${c.fill[1]} ${(100 - ((baseY - maxInk * 0.35) / H) * 100).toFixed(1)}%, ${c.fill[2]} ${(100 - ((baseY - maxInk * 0.7) / H) * 100).toFixed(1)}%, ${c.fill[3]} ${(100 - ((baseY - maxInk * 1.02) / H) * 100).toFixed(1)}%, ${c.fill[4]} 100%)`;

  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
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
            opacity: interpolate(t, [GROW_AT, GROW_END], [0.35, 1], CLAMP),
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: numLeft,
          top: boxTop,
          height: F,
          lineHeight: `${F}px`,
          whiteSpace: "pre",
          fontFamily: flex.fontFamily,
          fontStyle: "normal",
          fontSize: F,
          fontVariantNumeric: "tabular-nums",
          fontVariationSettings: fvs(wdth, ytfi),
          letterSpacing: `${TRACK}em`,
          transformOrigin: `0 ${(m.baseline * F).toFixed(2)}px`,
          transform: `scaleY(${sy.toFixed(4)})`,
          opacity: enter,
          filter:
            enter < 1
              ? `blur(${((1 - enter) * 10 * s).toFixed(2)}px)`
              : undefined,
          backgroundImage: fill,
          backgroundSize: `${W}px ${H}px`,
          backgroundPosition: `${-numLeft}px ${-boxTop}px`,
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
            fontFamily: instrument.fontFamily,
            fontWeight: 400,
            fontSize: labelFs,
            lineHeight: 1.22,
            letterSpacing: "-0.012em",
            textWrap: "balance",
            color: c.muted,
            opacity: labelP,
            transform: `translateY(${((1 - labelP) * labelFs * 0.6).toFixed(2)}px)`,
          }}
        >
          {label}
        </div>
      ) : null}

      {transparent ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
