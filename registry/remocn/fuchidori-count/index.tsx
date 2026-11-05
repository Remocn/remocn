"use client";

import { loadFont as loadZenKaku } from "@remotion/google-fonts/ZenKakuGothicNew";
import type React from "react";
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

const kaku = loadZenKaku("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface FuchidoriCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  maxBorders?: number;
  colors?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const VERMILION = "#E03C31";

const THEMES = {
  dark: { bg: "#111111", ink: "#F5F1EA" },
  light: { bg: "#F5F1EA", ink: "#111111" },
} as const;

const GAP = 0.024;
const RING = 0.04;
const STEP = GAP + RING;
const TRACK = 0.02;

const RISE_AT = 0;
const RISE_LEN = 14;
const LABEL_AT = 6;
const COUNT_AT = 8;
const COUNT_LEN = 68;
const RING_LEN = 12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.3, 0.1, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function group(n: number) {
  const s = String(Math.max(0, Math.floor(n)));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ",";
    out += s[i];
  }
  return out;
}

interface Metrics {
  adv: Record<string, number>;
  digit: number;
  cap: number;
  label: number;
}

function measure(chars: string[], label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("fuchidori-count: no 2d context");
  ctx.font = `500 100px "${kaku.fontFamily}"`;
  let digit = 0;
  for (const d of "0123456789") {
    digit = Math.max(digit, ctx.measureText(d).width / 100);
  }
  const adv: Record<string, number> = {};
  for (const ch of chars) adv[ch] = ctx.measureText(ch).width / 100;
  const cap = ctx.measureText("0").actualBoundingBoxAscent / 100;
  ctx.font = `400 100px "${kaku.fontFamily}"`;
  return {
    adv,
    digit,
    cap,
    label: label ? ctx.measureText(label).width / 100 : 0,
  };
}

function useMetrics(chars: string[], label: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("fuchidori-count: measuring"));
  const released = useRef(false);
  const key = chars.join("");
  useEffect(() => {
    let live = true;
    Promise.all([
      kaku.waitUntilDone(),
      document.fonts.load(`500 100px "${kaku.fontFamily}"`),
      document.fonts.load(`400 100px "${kaku.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(Array.from(key), label));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, label, handle]);
  return metrics;
}

export function FuchidoriCount({
  value = 4096,
  from = 1,
  prefix = "",
  suffix = "",
  label = "captions styled without opening an editor",
  maxBorders = 4,
  colors,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: FuchidoriCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const stage = bg === "transparent" ? c.bg : bg;
  const red = accent ?? VERMILION;

  const end = Math.max(1, Math.floor(value));
  const start = Math.min(end, Math.max(1, Math.floor(from)));
  const finalText = `${prefix}${group(end)}${suffix}`;
  const chars = useMemo(
    () => Array.from(new Set(Array.from(`${finalText}0123456789,`))),
    [finalText],
  );
  const m = useMetrics(chars, label);

  const lo = Math.log10(start);
  const hi = Math.log10(end);
  const powers: number[] = [];
  for (let k = Math.floor(lo) + 1; k <= Math.floor(hi); k++) powers.push(k);
  const shown = powers.slice(-Math.max(0, Math.floor(maxBorders)));
  const N = shown.length;

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const countP = interpolate(t, [COUNT_AT, COUNT_AT + COUNT_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_COUNT,
  });
  const logV = lo + (hi - lo) * countP;
  const current = countP >= 1 ? end : Math.min(end, Math.floor(10 ** logV));
  const text = `${prefix}${group(current)}${suffix}`;

  const crossAt = (k: number) => {
    const target = hi === lo ? 1 : (k - lo) / (hi - lo);
    let a = 0;
    let b = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (a + b) / 2;
      if (EASE_COUNT(mid) < target) a = mid;
      else b = mid;
    }
    return COUNT_AT + b * COUNT_LEN;
  };
  const grows = shown.map((k) =>
    spring({
      frame: t - crossAt(k),
      fps,
      durationInFrames: RING_LEN,
      config: { damping: 14, stiffness: 170, mass: 0.7 },
    }),
  );
  const press = shown.reduce((acc, k) => {
    const d = t - crossAt(k);
    if (d < 0 || d > 10) return acc;
    return acc + Math.sin((d / 10) * Math.PI) * 0.03 * (1 - d / 14);
  }, 0);

  const advOf = (ch: string) => (/[0-9]/.test(ch) ? m.digit : m.adv[ch]);
  const widthOf = (s: string) => {
    const a = Array.from(s);
    return (
      a.reduce((acc, ch) => acc + (advOf(ch) ?? m.digit), 0) +
      TRACK * Math.max(0, a.length - 1)
    );
  };
  const R = N * STEP;
  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginY = H * (portrait ? 0.07 : 0.1);
  const labelSize = label
    ? Math.min(Math.min(W, H) * 0.046, (H - marginY * 2) / (m.label * 1.06))
    : 0;
  const labelCol = label ? labelSize * 2.2 : 0;
  const finalW = widthOf(finalText) + 2 * R;
  const F = Math.min(
    (W - marginX * 2 - labelCol) / finalW,
    (H * (portrait ? 0.34 : 0.6)) / (m.cap + 2 * R),
    H * 0.42,
  );
  const baseY = H - marginY - R * F;
  const top = baseY - (R + m.cap) * F;

  const glyphs = Array.from(text);
  const curW = widthOf(text);
  let pen = W - marginX - R * F - curW * F;
  const placed = glyphs.map((ch, i) => {
    const a = advOf(ch) ?? m.digit;
    const cx = pen + (a * F) / 2;
    pen += (a + TRACK) * F;
    return { ch, cx, i };
  });

  const rise = interpolate(t, [RISE_AT, RISE_AT + RISE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const riseY = (1 - rise) * F * 0.7;

  const layer = (
    key: string,
    stroke: string | null,
    sw: number,
    fill: string,
  ) => (
    <g key={key}>
      {placed.map((p) => (
        <text
          key={p.i}
          x={p.cx}
          y={baseY}
          textAnchor="middle"
          strokeWidth={stroke ? sw : 0}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            fill,
            stroke: stroke ?? "none",
            fontFamily: kaku.fontFamily,
            fontWeight: 500,
            fontSize: F,
          }}
        >
          {p.ch}
        </text>
      ))}
    </g>
  );

  const rings = colors?.length ? colors : [red, c.ink];
  const layers: React.ReactNode[] = [];
  for (let i = N - 1; i >= 0; i--) {
    const g = grows[i];
    if (g <= 0.001) continue;
    const inner = i * STEP + GAP;
    const outer = inner + RING * g;
    const col = rings[i % rings.length];
    layers.push(layer(`r${i}`, col, 2 * outer * F, col));
    layers.push(layer(`g${i}`, stage, 2 * inner * F, stage));
  }
  layers.push(layer("fill", null, 0, c.ink));

  const clipTop = top - F * 0.1;
  const clipH = (m.cap + 2 * R) * F + F * 0.4;
  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const pressX = W - marginX - R * F - (curW * F) / 2;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: marginX,
            top: marginY,
            width: labelSize * 1.4,
            height: H - marginY * 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              writingMode: "vertical-rl",
              fontFamily: kaku.fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: `${labelSize * 1.4}px`,
              color: red,
              whiteSpace: "pre",
              transform: `translateY(${(-(1 - labelP) * (H - marginY * 2) * 0.25).toFixed(2)}px)`,
              opacity: labelP,
            }}
          >
            {label}
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: clipTop,
          width: W,
          height: clipH,
          overflow: "hidden",
        }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: "absolute",
            left: 0,
            top: -clipTop,
            transform: `translateY(${riseY.toFixed(2)}px) scale(${(1 + press).toFixed(4)})`,
            transformOrigin: `${pressX.toFixed(1)}px ${baseY - (m.cap * F) / 2}px`,
            overflow: "visible",
          }}
          aria-hidden
        >
          {layers}
        </svg>
      </div>
    </AbsoluteFill>
  );
}
