"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { useEffect, useMemo, useRef, useState } from "react";
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

const WEIGHTS = ["100", "200", "300", "400", "500"] as const;
const barlow = loadFont("normal", {
  weights: [...WEIGHTS],
  subsets: ["latin"],
});

export interface WeightCutProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  eyebrow?: string;
  label?: string;
  lightWeight?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#FFFFFF",
    accent: "#D4FF00",
  },
  light: {
    bg: "#D4FF00",
    ink: "#000000",
    accent: "#000000",
  },
} as const;

const TRACK = 0.01;
const SUFFIX_SCALE = 0.3;

const ENTER_END = 14;
const COUNT_AT = 20;
const COUNT_END = 78;
const LABEL_AT = 64;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.3, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: Record<string, number>;
  slot: number;
  stemLight: number;
  stemHeavy: number;
  baseline: number;
  figTop: number;
}

function snapWeight(w: number) {
  const v = Math.min(500, Math.max(100, w));
  return Math.round(v / 100) * 100;
}

function measure(chars: string[], light: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const adv: Record<string, number> = {};
  let slot = 0.45;
  let stemLight = 0.02;
  let stemHeavy = 0.1;
  let baseline = 0.8;
  let figTop = 0.7;
  if (!ctx) {
    for (const ch of chars) adv[ch] = 0.45;
    return { adv, slot, stemLight, stemHeavy, baseline, figTop };
  }
  const ink = (w: number) => {
    ctx.font = `${w} 200px "${barlow.fontFamily}"`;
    const mm = ctx.measureText("I");
    return (mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight) / 200;
  };
  stemHeavy = ink(500);
  stemLight = ink(light);
  ctx.font = `${light} 200px "${barlow.fontFamily}"`;
  for (const ch of chars) adv[ch] = ctx.measureText(ch).width / 200;
  slot = Math.max(
    ...Array.from({ length: 10 }, (_, d) => adv[String(d)] ?? 0.4),
  );
  const fm = ctx.measureText("0");
  const asc = fm.fontBoundingBoxAscent / 200;
  const desc = fm.fontBoundingBoxDescent / 200;
  baseline = (1 - (asc + desc)) / 2 + asc;
  figTop = fm.actualBoundingBoxAscent / 200;
  return { adv, slot, stemLight, stemHeavy, baseline, figTop };
}

function useMetrics(chars: string[], light: number) {
  const key = `${light}\u0002${chars.join("\u0001")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("weight-cut: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [lw, list] = key.split("\u0002");
    Promise.all([
      barlow.waitUntilDone(),
      ...WEIGHTS.map((w) =>
        document.fonts.load(`${w} 100px "${barlow.fontFamily}"`),
      ),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(list.split("\u0001"), Number(lw)) });
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

function format(v: number, decimals: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function intDigits(v: number, decimals: number) {
  const shown = Math.round(Math.abs(v) * 10 ** decimals) / 10 ** decimals;
  return Math.max(1, Math.floor(shown).toString().length);
}

export function WeightCut({
  value = 6.8,
  from = 94,
  decimals = 1,
  prefix = "",
  suffix = "KB",
  eyebrow = "Per scene, gzipped",
  label = "Lighter than your logo file.",
  lightWeight = 100,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: WeightCutProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const light = snapWeight(lightWeight);
  const chars = useMemo(
    () =>
      Array.from(
        new Set(["0123456789.,", prefix, suffix.toUpperCase()].join("")),
      ),
    [prefix, suffix],
  );
  const m = useMetrics(chars, light);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const drops = useMemo(() => {
    const out: { at: number }[] = [];
    let prev = intDigits(from, decimals);
    for (let f = COUNT_AT; f <= COUNT_END; f += 0.25) {
      const g = EASE_COUNT((f - COUNT_AT) / (COUNT_END - COUNT_AT));
      const d = intDigits(from + (value - from) * g, decimals);
      if (d < prev) {
        for (let k = prev; k > d; k--) out.push({ at: f });
        prev = d;
      }
    }
    return out;
  }, [from, value, decimals]);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);

  const g = interpolate(t, [COUNT_AT, COUNT_END], [0, 1], {
    ...CLAMP,
    easing: EASE_COUNT,
  });
  const raw = from + (value - from) * g;
  const shown = Math.round(raw * 10 ** decimals) / 10 ** decimals;
  const text = `${prefix}${format(shown, decimals)}`;
  const span = from - value;
  const heavy = span === 0 ? 0 : Math.min(1, Math.max(0, (raw - value) / span));

  const enter = interpolate(t, [-5, ENTER_END], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const relax = spring({
    frame: t - (COUNT_END - 10),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
  });
  const closing = drops
    .filter((d) => t >= d.at)
    .map((d) =>
      spring({
        frame: t - d.at,
        fps,
        config: { damping: 16, stiffness: 140, mass: 0.8 },
      }),
    )
    .filter((k) => k < 0.999);

  const sufText = suffix.toUpperCase();
  const advOf = (ch: string) => m.adv[ch] ?? m.slot;
  const startText = `${prefix}${format(from, decimals)}`;
  const startEm =
    Array.from(startText).reduce(
      (a, ch) => a + (/[0-9]/.test(ch) ? m.slot : advOf(ch)) + TRACK,
      0,
    ) +
    m.stemHeavy +
    (sufText
      ? 0.03 +
        Array.from(sufText).reduce((a, ch) => a + advOf(ch), 0) * SUFFIX_SCALE +
        m.stemHeavy * SUFFIX_SCALE
      : 0);

  const margin = portrait ? W * 0.07 : W * 0.05;
  const colW = portrait ? 0 : W * 0.28;
  const roomW = W - margin * 2 - colW;
  const F = Math.min(
    roomW / Math.max(0.2, startEm),
    (H * (portrait ? 0.3 : 0.76)) / m.figTop,
  );
  const stroke = Math.max(0, m.stemHeavy - m.stemLight) * F * heavy;
  const baseY = portrait ? H * 0.62 : H - margin;
  const boxTop = baseY - m.baseline * F;

  const glyphs: { ch: string; x: number; w: number }[] = [];
  let x = margin + stroke / 2;
  for (const k of closing) x += m.slot * F * (1 - k);
  for (const ch of Array.from(text)) {
    const natural = advOf(ch);
    const w =
      (/[0-9]/.test(ch) ? m.slot + (natural - m.slot) * relax : natural) * F +
      TRACK * F +
      stroke;
    glyphs.push({ ch, x, w });
    x += w;
  }
  const numRight = x;
  const sufF = F * SUFFIX_SCALE;

  const eyebrowFs = (portrait ? 40 : 26) * s;
  const labelFs = (portrait ? 72 : 52) * s;
  const eyebrowP = interpolate(t, [2, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const figure = {
    position: "absolute" as const,
    whiteSpace: "pre" as const,
    fontFamily: barlow.fontFamily,
    fontWeight: light,
    color: c.ink,
    WebkitTextStroke:
      stroke > 0.05 ? `${stroke.toFixed(2)}px ${c.ink}` : undefined,
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: enter,
          transform: `translateY(${((1 - enter) * F * 0.06).toFixed(2)}px)`,
        }}
      >
        {glyphs.map((gl, i) => (
          <div
            key={i}
            style={{
              ...figure,
              left: gl.x,
              width: gl.w,
              top: boxTop,
              height: F,
              lineHeight: `${F}px`,
              textAlign: "center",
              fontSize: F,
            }}
          >
            {gl.ch}
          </div>
        ))}
        {sufText ? (
          <div
            style={{
              ...figure,
              left: numRight + F * 0.03,
              top: baseY - m.baseline * sufF,
              height: sufF,
              lineHeight: `${sufF}px`,
              fontSize: sufF,
              WebkitTextStroke:
                stroke > 0.05
                  ? `${(stroke * SUFFIX_SCALE).toFixed(2)}px ${c.ink}`
                  : undefined,
            }}
          >
            {sufText}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          ...(portrait
            ? { left: margin, right: margin, top: margin * 1.6 }
            : { right: margin, width: colW - margin * 0.5, top: margin }),
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: eyebrowFs * 0.7,
          fontFamily: barlow.fontFamily,
          textTransform: "uppercase",
        }}
      >
        {eyebrow ? (
          <div
            style={{
              fontWeight: 500,
              fontSize: eyebrowFs,
              lineHeight: 1,
              color: spot,
              opacity: eyebrowP,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        {label ? (
          <div
            style={{
              fontWeight: 500,
              fontSize: labelFs,
              lineHeight: 0.94,
              color: c.ink,
              textWrap: "balance",
              opacity: labelP,
              transform: `translateY(${((1 - labelP) * labelFs * 0.4).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
