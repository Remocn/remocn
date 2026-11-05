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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const instrument = loadInstrument("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface StemStretchProps {
  value?: string;
  label?: string;
  steps?: number;
  accent?: string;
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

function findCut(ctx: CanvasRenderingContext2D, text: string, cap: number) {
  const W = Math.ceil(ctx.measureText(text).width) + 40;
  const H = Math.ceil(FONT_PX * 1.4);
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.font = `500 ${FONT_PX}px "${instrument.fontFamily}"`;
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

function measure(text: string, label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("stem-stretch: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${instrument.fontFamily}"`;
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
  ctx.font = `400 ${FONT_PX}px "${instrument.fontFamily}"`;
  const lab = label ? ctx.measureText(label).width / FONT_PX : 0;
  const cut = findCut(ctx, text, cap);
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

function useMetrics(text: string, label: string) {
  const key = `${text}\u0000${label}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("stem-stretch: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [tx, lb] = key.split("\u0000");
    Promise.all([
      instrument.waitUntilDone(),
      document.fonts.load(`500 100px "${instrument.fontFamily}"`),
      document.fonts.load(`400 100px "${instrument.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(tx, lb) });
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
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: StemStretchProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const m = useMetrics(value, label);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const n = Math.max(1, Math.round(steps));
  const portrait = H > W;
  const F = Math.min(H * (portrait ? 0.2 : 0.3), (W * 0.84) / m.width);
  const capPx = m.cap * F;
  const gapMax = Math.max(capPx * 0.6, H * (portrait ? 0.42 : 0.62) - capPx);
  const block = gapMax / n;

  let snapped = 0;
  for (let k = 0; k < n; k++) {
    snapped += spring({
      frame: t - (SNAP_AT + k * SNAP_GAP),
      fps,
      config: { damping: 13, stiffness: 210, mass: 0.7 },
    });
  }
  const gap = block * snapped;

  const labelSize = Math.min(
    Math.max(F * 0.17, H * 0.044),
    H * 0.056,
    (W * 0.84) / Math.max(0.1, m.label),
  );
  const labelGap = label ? Math.max(F * 0.2, H * 0.04) : 0;
  const groupH = capPx + gap + (label ? labelGap + labelSize : 0);
  const capTop = (H - groupH) / 2;
  const baseY = capTop + capPx + gap;
  const lineTop0 = capTop + capPx - m.baseline * F;
  const cutY0 = capTop + capPx - m.cut * F;
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
            transform: `translateY(${((1 - p) * F * 0.9).toFixed(2)}px)`,
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
    fontFamily: instrument.fontFamily,
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
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: GLOW[theme],
          transform: `translateY(${(Math.sin(drift * 0.3) * H * 0.01).toFixed(2)}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop,
          height: cutY0 - maskTop,
          overflow: "hidden",
        }}
      >
        <div style={{ ...lineStyle, top: lineTop0 - maskTop, color: c.ink }}>
          {glyphs("top", {})}
        </div>
      </div>
      {gap > 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: cutY0,
            height: gap,
            overflow: "hidden",
            isolation: "isolate",
            background: groupBg,
            mixBlendMode: theme === "dark" ? "screen" : "multiply",
          }}
        >
          <div
            style={{
              ...lineStyle,
              top: -cutLocal,
              transformOrigin: `0 ${cutLocal}px`,
              transform: `scaleY(${k.toFixed(3)})`,
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
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: cutY0 + gap,
          height: baseY + (m.desc + 0.02) * F - (cutY0 + gap),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...lineStyle,
            top: -cutLocal,
            color: c.ink,
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
            top: baseY + labelGap,
            textAlign: "center",
            fontFamily: instrument.fontFamily,
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
              [LABEL_AT + i * 3, LABEL_AT + i * 3 + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${i}`}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${((1 - p) * labelSize * 0.6).toFixed(2)}px)`,
                }}
              >
                {w}
                {i < labelWords.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
