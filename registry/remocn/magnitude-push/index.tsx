"use client";

import { loadFont as loadSchibsted } from "@remotion/google-fonts/SchibstedGrotesk";
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
import {
  DEFAULT_LABEL,
  DEFAULT_VALUE,
  type MagnitudePushElementId,
  magnitudePushTimeline,
} from "./timeline";

const schibsted = loadSchibsted("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface MagnitudePushProps {
  value?: string;
  suffix?: string;
  label?: string;
  /** Frames between one digit pushing in and the next. */
  pushGap?: number;
  /** Frames between label words as they rise. */
  stagger?: number;
  accent?: string;
  /** Text color of the first digit, suffix and label; overrides the theme. */
  ink?: string;
  background?: string;
  /** Typeface for the figure and label. Load it yourself; Schibsted Grotesk by default. */
  fontFamily?: string;
  grain?: boolean;
  /** Size of the figure and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the first rise, each digit's push, the settle
   * and the label words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<MagnitudePushElementId>;
}

const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#8E8D94",
    digit: (a: string) =>
      `linear-gradient(180deg, ${BEAM[0]} 8%, ${BEAM[1]} 46%, ${a} 92%)`,
    ground: 0.55,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#6E6C67",
    digit: (a: string) =>
      `linear-gradient(180deg, ${BEAM[3]} 6%, ${a} 58%, #7f9bff 98%)`,
    ground: 0.22,
    grain: 0.035,
  },
} as const;

const TRACK = -0.035;
const LABEL_TRACK = -0.012;
const FIT_W = 0.86;
const CAP_H = 0.7;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: number[];
  suffix: number;
  label: number;
  inkTop: number;
  inkBot: number;
  baseline: number;
}

const FONT_PX = 400;

function measure(
  chars: string[],
  suffix: string,
  label: string,
  fontFamily: string,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("magnitude-push: no 2d context");
  const fam = `"${fontFamily}"`;
  ctx.font = `500 ${FONT_PX}px ${fam}`;
  const adv = chars.map((ch) => ctx.measureText(ch).width / FONT_PX + TRACK);
  const suf = suffix
    ? ctx.measureText(suffix).width / FONT_PX +
      TRACK * Array.from(suffix).length
    : 0;
  const digits = ctx.measureText("0123456789");
  const box = ctx.measureText("0");
  const asc = box.fontBoundingBoxAscent / FONT_PX;
  const desc = box.fontBoundingBoxDescent / FONT_PX;
  ctx.font = `400 ${FONT_PX}px ${fam}`;
  const lab = label
    ? ctx.measureText(label).width / FONT_PX +
      LABEL_TRACK * Array.from(label).length
    : 0;
  return {
    adv,
    suffix: suf,
    label: lab,
    inkTop: -digits.actualBoundingBoxAscent / FONT_PX,
    inkBot: digits.actualBoundingBoxDescent / FONT_PX,
    baseline: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(
  chars: string[],
  suffix: string,
  label: string,
  fontFamily: string,
) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("magnitude-push: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      schibsted.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, suffix, label, fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, suffix, label, fontFamily, handle]);
  return metrics;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `mp${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={11}
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

export function MagnitudePush(props: MagnitudePushProps) {
  const {
    value = DEFAULT_VALUE,
    suffix = "×",
    label = DEFAULT_LABEL,
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = schibsted.fontFamily,
    grain = true,
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
    magnitudePushTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const bg = background ?? c.bg;
  const clear = bg === "transparent";

  const chars = useMemo(() => Array.from(value), [value]);
  const m = useMetrics(chars, suffix, label, fontFamily);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const pushes = chars.length - 1;
  const inkH = m.inkBot - m.inkTop;
  const sufGap = suffix ? 0.02 : 0;
  const widthAt = (k: number) =>
    m.adv.slice(0, k + 1).reduce((s, a) => s + a, 0) +
    sufGap +
    m.suffix -
    (suffix ? 0 : TRACK);
  const maxF = (H * CAP_H) / inkH;
  const fitAt = (k: number) => Math.min(maxF, (W * FIT_W) / widthAt(k));

  const open = chars.map((_, i) =>
    i === 0
      ? 1
      : spring({
          frame: t - tl.get(`digit:${i}`).start,
          fps,
          config: { damping: 15, stiffness: 120, mass: 0.9 },
        }),
  );

  const fontAt = (f: number) => {
    let F = fitAt(0);
    for (let i = 1; i <= pushes; i++) {
      const e = tl.get(`digit:${i}`);
      const at = e.start + e.beat("cam");
      const k = interpolate(f, [at, at + e.beat("camLen")], [0, 1], {
        ...CLAMP,
        easing: EASE_IN_OUT,
      });
      F = F + (fitAt(i) - F) * k;
    }
    return F;
  };
  const F = fontAt(t);

  const settleEl = tl.get("settle");
  const rest = fitAt(pushes);
  const labelSize = Math.min(
    Math.max(rest * 0.2, H * 0.05),
    H * 0.076,
    (W * 0.86) / Math.max(0.1, m.label),
  );
  const labelGap = Math.max(rest * 0.16, H * 0.045);
  const blockH = inkH * rest + (label ? labelGap + labelSize * 1.2 : 0);
  const midYAt = (f: number) => {
    const settle = interpolate(f, [settleEl.start, settleEl.end], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    return H / 2 + (label ? (-blockH / 2 + (inkH * rest) / 2) * settle : 0);
  };
  const midY = midYAt(t);

  // The figure grows by font size and the block slides up by `top`; layout
  // rounds a baseline and a box to whole pixels, so both clicked along, and
  // jumped where layout took over from a transform. The figure is laid out
  // once at its final size and place and reaches the live ones by a
  // transform all its life.
  const reach = (W * FIT_W) / 2;
  const stepAt = (f: number) =>
    Math.abs(fontAt(f) - F) * (reach / F) > 1e-3 ||
    Math.abs(midYAt(f) - midY) > 1e-3;
  const moving = stepAt(t + speed) || stepAt(t - speed);
  const midYRest = midYAt(settleEl.end);
  const FL = rest;
  const midYL = midYRest;
  const grow = Math.abs(F / FL - 1) > 1e-9 ? F / FL : 1;
  const dy = Math.abs(midY - midYL) > 1e-3 ? midY - midYL : 0;

  const baseY = midYL - ((m.inkTop + m.inkBot) / 2) * FL;

  const totalW =
    chars.reduce((s, _, i) => s + m.adv[i] * open[i], 0) +
    sufGap +
    m.suffix -
    (suffix ? 0 : TRACK);
  let x = W / 2 - (totalW * FL) / 2;
  const lineTop = baseY - m.baseline * FL;
  const maskTop = baseY + m.inkTop * FL - FL * 0.08;
  const maskBot = baseY + m.inkBot * FL + FL * 0.06;
  const maskH = maskBot - maskTop;
  const carry = `translateY(${dy}px) scale(${grow})${glide(moving)}`;

  const riseAt = (at: number, len: number, f: number) =>
    interpolate(f, [at, at + len], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  // A glyph rising out of the mask: its offset, and whether it still moves
  // on this frame or a neighbour.
  const lift = (at: number, len: number, amp: number) => {
    const d = (f: number) => (1 - riseAt(at, len, f)) * amp;
    const now = d(t);
    const live = d(t + speed) !== now || now !== d(t - speed);
    return `translateY(${now}px)${glide(live)}`;
  };

  // Where each digit's slot sits once every push has opened. The slot is laid
  // out there and slides to its live place by a transform: its clipping edge
  // eased by `left` clicked along pixel by pixel.
  const restW =
    chars.reduce((s, _, i) => s + m.adv[i], 0) +
    sufGap +
    m.suffix -
    (suffix ? 0 : TRACK);
  const slotRest: number[] = [];
  let xr = W / 2 - (restW * FL) / 2;
  for (let i = 0; i < chars.length; i++) {
    slotRest.push(xr);
    xr += m.adv[i] * FL;
  }

  const glyphBase = {
    position: "absolute" as const,
    top: lineTop - maskTop,
    fontFamily,
    fontWeight: 500,
    fontSize: FL,
    lineHeight: `${FL}px`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  };

  const riseEl = tl.get("rise");
  const nodes = chars.map((ch, i) => {
    const gx = x;
    const w = m.adv[i] * open[i] * FL;
    x += w;
    if (i === 0) {
      return (
        <div
          key={`g-${i}`}
          style={{
            ...glyphBase,
            left: gx,
            color: fg,
            transform: lift(riseEl.start, riseEl.beat("rise"), maskH * 1.05),
          }}
        >
          {ch}
        </div>
      );
    }
    const digitEl = tl.get(`digit:${i}`);
    const slot = Math.max(0, w);
    if (slot < 1) return null;
    const slide = gx - slotRest[i];
    // The glyph stays centred in its opening slot, by a transform for the
    // same reason as the slot.
    const centre = (slot - m.adv[i] * FL) / 2;
    return (
      <div
        key={`g-${i}`}
        style={{
          position: "absolute",
          left: slotRest[i],
          top: 0,
          transform:
            Math.abs(slide) < 1e-3 ? undefined : `translateX(${slide}px)`,
          width: slot,
          height: maskH,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...glyphBase,
            left: 0,
            backgroundImage: c.digit(accent),
            backgroundSize: `100% ${maskH}px`,
            backgroundPosition: `0 ${-(lineTop - maskTop)}px`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            transform: `${Math.abs(centre) < 1e-3 ? "" : `translateX(${centre}px) `}${lift(digitEl.start + digitEl.beat("digit"), digitEl.beat("rise"), maskH * 1.1)}`,
          }}
        >
          {ch}
        </div>
      </div>
    );
  });

  const sufNode = suffix ? (
    <div
      key="suffix"
      style={{
        ...glyphBase,
        left: x + sufGap * FL,
        color: fg,
        transform: lift(
          riseEl.start + riseEl.beat("suffix"),
          riseEl.beat("rise"),
          maskH * 1.05,
        ),
      }}
    >
      {suffix}
    </div>
  ) : null;

  const lit =
    pushes > 0 ? open.slice(1).reduce((s, o) => s + o, 0) / pushes : 1;
  const glow = c.ground * (0.25 + 0.75 * Math.min(1, lit));
  const drift = Math.sin(t / 40) * 3;
  const ground = `radial-gradient(${70 + 18 * lit}% ${46 + 22 * lit}% at ${50 + drift}% 112%, color-mix(in oklab, ${accent} 70%, ${BEAM[1]}) 0%, color-mix(in oklab, ${BEAM[2]} 55%, transparent) 38%, transparent 72%)`;

  const words = label.split(" ");

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {clear ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: ground,
            opacity: glow,
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
            overflow: "visible",
            transform: carry,
            transformOrigin: `${W / 2}px ${midYL - maskTop}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: maskH,
              overflow: "hidden",
            }}
          >
            {nodes}
            {sufNode}
          </div>
        </div>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: midYL + (inkH * rest) / 2 + labelGap,
              transform: `translateY(${dy}px)${glide(moving)}`,
              display: "flex",
              justifyContent: "center",
              fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: 1.2,
              letterSpacing: `${LABEL_TRACK}em`,
              color: fg,
              whiteSpace: "pre",
            }}
          >
            {words.map((w, k) => {
              const wordEl = tl.get(`word:${k}`);
              const p = interpolate(t, [wordEl.start, wordEl.end], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <span
                  key={`${w}-${k}`}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${((1 - p) * labelSize * 0.7).toFixed(2)}px)${glide(p > 0 && p < 1)}`,
                  }}
                >
                  {w}
                  {k < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ) : null}
      </ScaleLayer>
      {clear || !grain ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
