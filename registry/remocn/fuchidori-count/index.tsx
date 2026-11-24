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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  countRange,
  easeCount,
  type FuchidoriCountElementId,
  fuchidoriCountTimeline,
} from "./timeline";

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
  /** Color of the figure and its ink rings; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Zen Kaku Gothic New by default. */
  fontFamily?: string;
  /** Weight of the figure. */
  fontWeight?: number;
  /** Frames the count takes to reach the value. */
  countLength?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the rise, the label, the count and single
   * rings, by the ids in `./timeline`. Frames on the scene timeline, after
   * `delay` and `speed`.
   */
  timing?: Timing<FuchidoriCountElementId>;
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

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

function measure(
  chars: string[],
  label: string,
  fontFamily: string,
  weight: number,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("fuchidori-count: no 2d context");
  ctx.font = `${weight} 100px "${fontFamily}"`;
  let digit = 0;
  for (const d of "0123456789") {
    digit = Math.max(digit, ctx.measureText(d).width / 100);
  }
  const adv: Record<string, number> = {};
  for (const ch of chars) adv[ch] = ctx.measureText(ch).width / 100;
  const cap = ctx.measureText("0").actualBoundingBoxAscent / 100;
  ctx.font = `400 100px "${fontFamily}"`;
  return {
    adv,
    digit,
    cap,
    label: label ? ctx.measureText(label).width / 100 : 0,
  };
}

function useMetrics(
  chars: string[],
  label: string,
  fontFamily: string,
  fontWeight: number,
) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("fuchidori-count: measuring"));
  const released = useRef(false);
  const key = chars.join("");
  useEffect(() => {
    let live = true;
    Promise.all([
      kaku.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(Array.from(key), label, fontFamily, fontWeight));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, label, handle, fontFamily, fontWeight]);
  return metrics;
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

export function FuchidoriCount(props: FuchidoriCountProps) {
  const {
    value = 4096,
    from = 1,
    prefix = "",
    suffix = "",
    label = "captions styled without opening an editor",
    maxBorders = 4,
    colors,
    accent,
    ink,
    background,
    fontFamily = kaku.fontFamily,
    fontWeight = 500,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    fuchidoriCountTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const bg = background ?? c.bg;
  const stage = bg === "transparent" ? c.bg : bg;
  const red = accent ?? VERMILION;

  const { end, lo, hi, shown } = countRange(value, from, maxBorders);
  const finalText = `${prefix}${group(end)}${suffix}`;
  const chars = useMemo(
    () => Array.from(new Set(Array.from(`${finalText}0123456789,`))),
    [finalText],
  );
  const m = useMetrics(chars, label, fontFamily, fontWeight);

  const N = shown.length;
  const riseEl = tl.get("rise");
  const labelEl = tl.get("label");
  const countEl = tl.get("count");
  const ringEls = shown.map((_, j) => tl.get(`ring:${j}`));

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const countP = interpolate(t, [countEl.start, countEl.end], [0, 1], {
    ...CLAMP,
    easing: easeCount,
  });
  const logV = lo + (hi - lo) * countP;
  const current = countP >= 1 ? end : Math.min(end, Math.floor(10 ** logV));
  const text = `${prefix}${group(current)}${suffix}`;

  const grows = ringEls.map((e) =>
    spring({
      frame: t - e.start,
      fps,
      durationInFrames: e.length,
      config: { damping: 14, stiffness: 170, mass: 0.7 },
    }),
  );
  const press = ringEls.reduce((acc, e) => {
    const d = t - e.start;
    const len = e.beat("press");
    if (d < 0 || d > len) return acc;
    return (
      acc + Math.sin((d / len) * Math.PI) * 0.03 * (1 - d / e.beat("pressFade"))
    );
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

  const riseAt = (f: number) =>
    (
      (1 -
        interpolate(f, [riseEl.start, riseEl.end], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        })) *
      F *
      0.7
    ).toFixed(2);
  const riseY = riseAt(t);
  // The rise is drawn to 1/100 px: it still moves on the frames where its
  // progress is already within a hair of 1, so it is compared as drawn.
  const rising = riseAt(t - speed) !== riseY || riseAt(t + speed) !== riseY;

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
            fontFamily,
            fontWeight,
            fontSize: F,
          }}
        >
          {p.ch}
        </text>
      ))}
    </g>
  );

  const rings = colors?.length ? colors : [red, fg];
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
  layers.push(layer("fill", null, 0, fg));

  const clipTop = top - F * 0.1;
  const clipH = (m.cap + 2 * R) * F + F * 0.4;
  const labelP = interpolate(t, [labelEl.start, labelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const pressX = W - marginX - R * F - (curW * F) / 2;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
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
                fontFamily,
                fontWeight: 400,
                fontSize: labelSize,
                lineHeight: `${labelSize * 1.4}px`,
                color: red,
                whiteSpace: "pre",
                transform: `translateY(${(-(1 - labelP) * (H - marginY * 2) * 0.25).toFixed(2)}px)${glide(midway(labelP))}`,
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
              transform: `translateY(${riseY}px) scale(${(1 + press).toFixed(4)})${glide(press > 0 || rising)}`,
              transformOrigin: `${pressX.toFixed(1)}px ${baseY - (m.cap * F) / 2}px`,
              overflow: "visible",
            }}
            aria-hidden
          >
            {layers}
          </svg>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
