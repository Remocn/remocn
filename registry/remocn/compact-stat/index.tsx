"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
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

const hanken = loadHanken("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CompactStatProps {
  value?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  label?: string;
  accent?: string;
  /** Text color of the figure; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the figure and label. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Weight of the figure. */
  fontWeight?: number;
  /** Frames between characters as the full number rises in. */
  stagger?: number;
  /** Size of the figure and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Film grain over the scene. */
  grain?: boolean;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#8E8D94",
    fill: (a: string) =>
      `linear-gradient(170deg, #f4f7ff 6%, #8fb4ff 38%, ${a} 72%, #1a1660 118%)`,
    ground: (a: string) =>
      `radial-gradient(60% 46% at 50% 112%, color-mix(in oklab, ${a} 34%, transparent) 0%, color-mix(in oklab, #1a1660 40%, transparent) 48%, transparent 80%)`,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#6E6C67",
    fill: (a: string) =>
      `linear-gradient(170deg, #1a1660 0%, ${a} 48%, #8fb4ff 112%)`,
    ground: (a: string) =>
      `radial-gradient(60% 46% at 50% 114%, color-mix(in oklab, ${a} 16%, transparent) 0%, transparent 78%)`,
    grain: 0.035,
  },
} as const;

const TRACK = -0.025;
const FONT_PX = 400;

const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 2;
const LABEL_AT = 12;
const RETRACT_AT = 40;
const RETRACT_LEN = 18;
const SUFFIX_AT = 52;
const GROW_AT = 58;
const GROW_LEN = 28;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_REEL = Easing.bezier(0.55, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const SCALES = ["", "K", "M", "B", "T"];

interface Plan {
  full: string[];
  short: string[];
  keep: number[];
  sep: number;
  mag: number;
}

function plan(
  value: number,
  decimals: number,
  suffix: string | undefined,
  prefix: string,
): Plan {
  const v = Math.max(0, Math.floor(Math.abs(value)));
  const digits = String(v);
  const tier = Math.min(
    SCALES.length - 1,
    Math.max(0, Math.floor((digits.length - 1) / 3)),
  );
  const intLen = digits.length - tier * 3;
  let dec = digits.slice(intLen, intLen + Math.max(0, Math.min(2, decimals)));
  dec = dec.replace(/0+$/, "");
  const grouped: string[] = [];
  for (let i = 0; i < digits.length; i++) {
    const fromEnd = digits.length - i;
    if (i > 0 && fromEnd % 3 === 0) grouped.push(",");
    grouped.push(digits[i]);
  }
  const pre = Array.from(prefix);
  const full = [...pre, ...grouped];
  const mag = suffix ?? SCALES[tier];
  const short = [
    ...pre,
    ...Array.from(digits.slice(0, intLen)),
    ...(dec ? [".", ...Array.from(dec)] : []),
    ...Array.from(mag),
  ];
  const keep = full.map(() => -1);
  let j = 0;
  for (let i = 0; i < pre.length; i++) keep[i] = j++;
  let seen = 0;
  let sep = -1;
  const keptDigits = intLen + dec.length;
  for (let i = pre.length; i < full.length; i++) {
    const ch = full[i];
    if (ch === ",") {
      if (seen === intLen && dec.length > 0 && tier > 0) {
        keep[i] = j++;
        sep = i;
      }
      continue;
    }
    if (seen < keptDigits) keep[i] = j++;
    seen++;
  }
  return {
    full,
    short,
    keep,
    sep,
    mag: tier > 0 || suffix ? j : -1,
  };
}

interface Metrics {
  xf: number[];
  wf: number[];
  xs: number[];
  ws: number[];
  fullW: number;
  shortW: number;
  cap: number;
  base: number;
  label: number;
}

function layout(ctx: CanvasRenderingContext2D, chars: string[]) {
  const x: number[] = [];
  const w: number[] = [];
  let prefix = "";
  for (let i = 0; i < chars.length; i++) {
    const a = ctx.measureText(prefix).width / FONT_PX + TRACK * i;
    prefix += chars[i];
    const b = ctx.measureText(prefix).width / FONT_PX + TRACK * (i + 1);
    x.push(a);
    w.push(b - a);
  }
  const total =
    ctx.measureText(chars.join("")).width / FONT_PX +
    TRACK * Math.max(0, chars.length - 1);
  return { x, w, total };
}

function measure(
  p: Plan,
  label: string,
  fontFamily: string,
  fontWeight: number,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("compact-stat: no 2d context");
  ctx.font = `${fontWeight} ${FONT_PX}px "${fontFamily}"`;
  const f = layout(ctx, p.full);
  const s = layout(ctx, p.short);
  const zm = ctx.measureText("0");
  const cap = zm.actualBoundingBoxAscent / FONT_PX;
  const asc = zm.fontBoundingBoxAscent / FONT_PX;
  const desc = zm.fontBoundingBoxDescent / FONT_PX;
  ctx.font = `400 ${FONT_PX}px "${fontFamily}"`;
  return {
    xf: f.x,
    wf: f.w,
    xs: s.x,
    ws: s.w,
    fullW: f.total,
    shortW: s.total,
    cap,
    base: (1 - (asc + desc)) / 2 + asc,
    label: label ? ctx.measureText(label).width / FONT_PX : 0,
  };
}

function useMetrics(
  p: Plan,
  label: string,
  fontFamily: string,
  fontWeight: number,
) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("compact-stat: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      hanken.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(p, label, fontFamily, fontWeight));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [p, label, fontFamily, fontWeight, handle]);
  return metrics;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `cs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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

export function CompactStat({
  value = 1200000,
  decimals = 1,
  suffix,
  prefix = "",
  label = "frames rendered with remocn",
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = hanken.fontFamily,
  fontWeight = 500,
  stagger = RISE_GAP,
  scale = 1,
  delay = 0,
  grain = true,
  speed = 1,
  theme = "dark",
}: CompactStatProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const bg = background ?? c.bg;

  const p = useMemo(
    () => plan(value, decimals, suffix, prefix),
    [value, decimals, suffix, prefix],
  );
  const m = useMetrics(p, label, fontFamily, fontWeight);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const F1 = Math.min(H * 0.3, (W * 0.86) / m.fullW);
  const F2 = Math.min(H * 0.48, (W * 0.8) / m.shortW, F1 * 2.6);
  const grow = interpolate(t, [GROW_AT, GROW_AT + GROW_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const F = grow === 1 ? F2 : F1 + (F2 - F1) * grow;
  // The figure is laid out once at its settled size and scaled to the current
  // one, all its life: an animated font size reflows every glyph, and layout
  // rounds each baseline and box to whole pixels, so the figure would shake as
  // it grows, and jump where the layout took over from the scale.
  const growing = grow > 0 && grow < 1;
  const L = F2;

  const reel = interpolate(t, [RETRACT_AT, RETRACT_AT + RETRACT_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_REEL,
  });
  const magP = spring({
    frame: t - SUFFIX_AT,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
  });

  const keptX = (i: number) => {
    const j = p.keep[i];
    return m.xf[i] + (m.xs[j] - m.xf[i]) * reel;
  };
  const lastKept = p.keep.reduce((acc, j, i) => (j >= 0 ? i : acc), -1);
  const slotEm =
    lastKept >= 0
      ? keptX(lastKept) +
        m.wf[lastKept] +
        (m.ws[p.keep[lastKept]] - m.wf[lastKept]) * reel
      : 0;
  const tailStart = lastKept + 1;
  const tailFrom = tailStart < p.full.length ? m.xf[tailStart] : slotEm;
  const tailEnd = m.fullW;
  const tailShift = (tailEnd - tailFrom + 0.04) * reel + (tailFrom - slotEm);

  const hasMag = p.mag >= 0;
  const magW = hasMag
    ? m.xs[p.short.length - 1] + m.ws[p.short.length - 1] - m.xs[p.mag]
    : 0;
  const magX = hasMag
    ? slotEm - magW + (m.xs[p.mag] - slotEm + magW) * magP
    : slotEm;

  const width = Math.max(slotEm, tailEnd - tailShift, magX + magW);
  const left = (W - width * L) / 2;

  const labelSize = label
    ? Math.min(Math.max(F2 * 0.12, H * 0.044), H * 0.056, (W * 0.84) / m.label)
    : 0;
  const gapAt = (f: number) => Math.max(f * 0.28, H * 0.05);
  const baseAt = (f: number) =>
    (H - (m.cap * f + (label ? gapAt(f) + labelSize : 0))) / 2 + m.cap * f;
  const labelTopAt = (f: number) => baseAt(f) + gapAt(f) - labelSize * 0.2;
  const baseY = baseAt(L);

  const maskTop = baseY - m.cap * L - L * 0.08;
  const maskH = m.cap * L + L * 0.3;
  const growK = F / L;
  const growDY = baseAt(F) - baseY;

  const glyph = (
    ch: string,
    x: number,
    key: string,
    i: number,
    extra?: React.CSSProperties,
  ) => {
    // The rise is a transform on a glyph laid out where it lands: moved by
    // `top`, its baseline would step down the mask a pixel at a time.
    const lift = i < 0 ? 0 : (1 - riseAt(i, t)) * maskH * 1.05;
    const moving =
      i >= 0 &&
      (Math.abs(riseAt(i, t + speed) - riseAt(i, t)) * maskH > 1e-3 ||
        Math.abs(riseAt(i, t) - riseAt(i, t - speed)) * maskH > 1e-3);
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: x,
          top: baseY - maskTop - m.base * L,
          height: L,
          fontFamily,
          fontWeight,
          fontSize: L,
          lineHeight: `${L}px`,
          color: fg,
          whiteSpace: "pre",
          fontFeatureSettings: '"lnum" 1',
          transform: `translateY(${lift}px)${glide(moving && !growing)}`,
          ...extra,
        }}
      >
        {ch}
      </div>
    );
  };

  const riseAt = (i: number, tt: number) =>
    interpolate(
      tt,
      [RISE_AT + i * stagger, RISE_AT + i * stagger + RISE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );

  const slotPx = left + slotEm * L;
  // The suffix is still settling while the figure grows, which slides the
  // tail's clip box; during the grow it is laid out where the suffix lands
  // and slides by transform, so its edge doesn't step a pixel at a time.
  const settledW = Math.max(
    slotEm,
    tailEnd - tailShift,
    hasMag ? m.xs[p.mag] + magW : slotEm,
  );
  const slotBox = growing ? (W - settledW * L) / 2 + slotEm * L : slotPx;
  const kept: React.ReactNode[] = [];
  const tail: React.ReactNode[] = [];
  p.full.forEach((ch, i) => {
    if (p.keep[i] >= 0) {
      if (i === p.sep) {
        const swap = interpolate(reel, [0.25, 0.6], [0, 1], CLAMP);
        const x = left + keptX(i) * L;
        kept.push(
          glyph(ch, x, `k${i}`, i, {
            opacity: 1 - swap,
            clipPath: `inset(0 0 ${(swap * 22).toFixed(1)}% 0)`,
          }),
          glyph(".", x, `k${i}p`, i, { opacity: swap }),
        );
        return;
      }
      kept.push(glyph(ch, left + keptX(i) * L, `k${i}`, i));
      return;
    }
    const x = left + (m.xf[i] - tailShift) * L - slotPx;
    tail.push(glyph(ch, x, `t${i}`, i));
  });

  // The suffix is laid out where it lands and slides in by transform: its
  // painted box would otherwise step a pixel at a time.
  const magSlide = hasMag ? (slotEm - magW - m.xs[p.mag]) * (1 - magP) * L : 0;
  const magGlyphs = hasMag
    ? p.short.slice(p.mag).map((ch, k) =>
        glyph(ch, left + m.xs[p.mag + k] * L - slotPx, `m${k}`, -1, {
          transform:
            Math.abs(magSlide) > 1e-3 ? `translateX(${magSlide}px)` : undefined,
          backgroundImage: c.fill(accent),
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }),
      )
    : [];

  const labelAt = (tt: number) =>
    interpolate(tt, [LABEL_AT, LABEL_AT + 18], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const labelP = labelAt(t);
  const labelMoving =
    Math.abs(labelAt(t + speed) - labelP) * labelSize > 1e-3 ||
    Math.abs(labelP - labelAt(t - speed)) * labelSize > 1e-3;
  const groundP = interpolate(t, [GROW_AT, GROW_AT + GROW_LEN + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {bg === "transparent" ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: c.ground(accent),
            opacity: groundP,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: maskTop,
            height: maskH,
            // Only the rise is masked: scaled down before the grow, a box the
            // width of the frame would cut the long figure at both ends.
            overflowX: "visible",
            overflowY: "clip",
            transform: `translateY(${growDY}px) scale(${growK})${glide(growing)}`,
            transformOrigin: `${W / 2}px ${baseY - maskTop}px`,
          }}
        >
          {kept}
          <div
            style={{
              position: "absolute",
              left: slotBox,
              top: 0,
              // Reaches the frame's right edge at any scale of the figure.
              width: Math.max(0, W / 2 / growK + W / 2 - slotBox),
              height: maskH,
              overflow: "hidden",
              transform: growing
                ? `translateX(${slotPx - slotBox}px)`
                : undefined,
            }}
          >
            {tail}
            {magGlyphs}
          </div>
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: labelTopAt(L),
              height: labelSize * 1.4,
              overflow: "hidden",
              textAlign: "center",
              fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: `${labelSize * 1.2}px`,
              letterSpacing: "-0.01em",
              color: c.muted,
              whiteSpace: "pre",
              transform: `translateY(${labelTopAt(F) - labelTopAt(L)}px)${glide(growing)}`,
            }}
          >
            <div
              style={{
                transform: `translateY(${(1 - labelP) * labelSize * 1.3}px)${glide(labelMoving && !growing)}`,
              }}
            >
              {label}
            </div>
          </div>
        ) : null}
      </ScaleLayer>
      {bg === "transparent" || !grain ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
