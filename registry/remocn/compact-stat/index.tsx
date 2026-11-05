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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
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

function measure(p: Plan, label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("compact-stat: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${hanken.fontFamily}"`;
  const f = layout(ctx, p.full);
  const s = layout(ctx, p.short);
  const zm = ctx.measureText("0");
  const cap = zm.actualBoundingBoxAscent / FONT_PX;
  const asc = zm.fontBoundingBoxAscent / FONT_PX;
  const desc = zm.fontBoundingBoxDescent / FONT_PX;
  ctx.font = `400 ${FONT_PX}px "${hanken.fontFamily}"`;
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

function useMetrics(p: Plan, label: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("compact-stat: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      hanken.waitUntilDone(),
      document.fonts.load(`500 100px "${hanken.fontFamily}"`),
      document.fonts.load(`400 100px "${hanken.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(p, label));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [p, label, handle]);
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

export function CompactStat({
  value = 1200000,
  decimals = 1,
  suffix,
  prefix = "",
  label = "frames rendered with remocn",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: CompactStatProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;

  const p = useMemo(
    () => plan(value, decimals, suffix, prefix),
    [value, decimals, suffix, prefix],
  );
  const m = useMetrics(p, label);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const F1 = Math.min(H * 0.3, (W * 0.86) / m.fullW);
  const F2 = Math.min(H * 0.48, (W * 0.8) / m.shortW, F1 * 2.6);
  const grow = interpolate(t, [GROW_AT, GROW_AT + GROW_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const F = F1 + (F2 - F1) * grow;

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
  const left = (W - width * F) / 2;

  const labelSize = label
    ? Math.min(Math.max(F2 * 0.12, H * 0.044), H * 0.056, (W * 0.84) / m.label)
    : 0;
  const gap = Math.max(F * 0.28, H * 0.05);
  const blockH = m.cap * F + (label ? gap + labelSize : 0);
  const baseY = (H - blockH) / 2 + m.cap * F;

  const maskTop = baseY - m.cap * F - F * 0.08;
  const maskH = m.cap * F + F * 0.3;

  const glyph = (
    ch: string,
    x: number,
    key: string,
    rise: number,
    extra?: React.CSSProperties,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: baseY - maskTop - m.base * F + (1 - rise) * maskH * 1.05,
        height: F,
        fontFamily: hanken.fontFamily,
        fontWeight: 500,
        fontSize: F,
        lineHeight: `${F}px`,
        color: c.ink,
        whiteSpace: "pre",
        fontFeatureSettings: '"lnum" 1',
        ...extra,
      }}
    >
      {ch}
    </div>
  );

  const riseOf = (i: number) =>
    interpolate(
      t,
      [RISE_AT + i * RISE_GAP, RISE_AT + i * RISE_GAP + RISE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );

  const slotPx = left + slotEm * F;
  const kept: React.ReactNode[] = [];
  const tail: React.ReactNode[] = [];
  p.full.forEach((ch, i) => {
    const r = riseOf(i);
    if (p.keep[i] >= 0) {
      if (i === p.sep) {
        const swap = interpolate(reel, [0.25, 0.6], [0, 1], CLAMP);
        const x = left + keptX(i) * F;
        kept.push(
          glyph(ch, x, `k${i}`, r, {
            opacity: 1 - swap,
            clipPath: `inset(0 0 ${(swap * 22).toFixed(1)}% 0)`,
          }),
          glyph(".", x, `k${i}p`, r, { opacity: swap }),
        );
        return;
      }
      kept.push(glyph(ch, left + keptX(i) * F, `k${i}`, r));
      return;
    }
    const x = left + (m.xf[i] - tailShift) * F - slotPx;
    tail.push(glyph(ch, x, `t${i}`, r));
  });

  const magGlyphs = hasMag
    ? p.short.slice(p.mag).map((ch, k) =>
        glyph(
          ch,
          left + (magX + m.xs[p.mag + k] - m.xs[p.mag]) * F - slotPx,
          `m${k}`,
          1,
          {
            backgroundImage: c.fill(accent),
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          },
        ),
      )
    : [];

  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
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
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop,
          height: maskH,
          overflow: "hidden",
        }}
      >
        {kept}
        <div
          style={{
            position: "absolute",
            left: slotPx,
            top: 0,
            width: Math.max(0, W - slotPx),
            height: maskH,
            overflow: "hidden",
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
            top: baseY + gap - labelSize * 0.2,
            height: labelSize * 1.4,
            overflow: "hidden",
            textAlign: "center",
            fontFamily: hanken.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            lineHeight: `${labelSize * 1.2}px`,
            letterSpacing: "-0.01em",
            color: c.muted,
            whiteSpace: "pre",
          }}
        >
          <div
            style={{
              transform: `translateY(${((1 - labelP) * labelSize * 1.3).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        </div>
      ) : null}
      {bg === "transparent" ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
