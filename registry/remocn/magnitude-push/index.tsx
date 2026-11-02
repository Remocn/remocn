"use client";

import { loadFont as loadSchibsted } from "@remotion/google-fonts/SchibstedGrotesk";
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

const schibsted = loadSchibsted("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface MagnitudePushProps {
  value?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const RISE_AT = 2;
const RISE_LEN = 16;
const PUSH_AT = 30;
const PUSH_GAP = 15;
const CAM_LAG = 5;
const CAM_LEN = 16;
const LABEL_GAP = 4;

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

function measure(chars: string[], suffix: string, label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("magnitude-push: no 2d context");
  const fam = `"${schibsted.fontFamily}"`;
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

function useMetrics(chars: string[], suffix: string, label: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("magnitude-push: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      schibsted.waitUntilDone(),
      document.fonts.load(`500 100px "${schibsted.fontFamily}"`),
      document.fonts.load(`400 100px "${schibsted.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, suffix, label));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, suffix, label, handle]);
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

export function MagnitudePush({
  value = "1000",
  suffix = "×",
  label = "fewer keyframes to set by hand",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: MagnitudePushProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const clear = bg === "transparent";

  const chars = useMemo(() => Array.from(value), [value]);
  const m = useMetrics(chars, suffix, label);

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
          frame: t - (PUSH_AT + (i - 1) * PUSH_GAP),
          fps,
          config: { damping: 15, stiffness: 120, mass: 0.9 },
        }),
  );

  let F = fitAt(0);
  for (let i = 1; i <= pushes; i++) {
    const at = PUSH_AT + (i - 1) * PUSH_GAP + CAM_LAG;
    const k = interpolate(t, [at, at + CAM_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    F = F + (fitAt(i) - F) * k;
  }

  const endAt = PUSH_AT + Math.max(0, pushes - 1) * PUSH_GAP;
  const labelAt = endAt + (pushes > 0 ? 18 : 6);
  const rest = fitAt(pushes);
  const labelSize = Math.min(
    Math.max(rest * 0.2, H * 0.05),
    H * 0.076,
    (W * 0.86) / Math.max(0.1, m.label),
  );
  const labelGap = Math.max(rest * 0.16, H * 0.045);
  const blockH = inkH * rest + (label ? labelGap + labelSize * 1.2 : 0);
  const settle = interpolate(t, [labelAt - 6, labelAt + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const midY = H / 2 + (label ? (-blockH / 2 + (inkH * rest) / 2) * settle : 0);
  const baseY = midY - ((m.inkTop + m.inkBot) / 2) * F;

  const totalW =
    chars.reduce((s, _, i) => s + m.adv[i] * open[i], 0) +
    sufGap +
    m.suffix -
    (suffix ? 0 : TRACK);
  let x = W / 2 - (totalW * F) / 2;
  const lineTop = baseY - m.baseline * F;
  const maskTop = baseY + m.inkTop * F - F * 0.08;
  const maskBot = baseY + m.inkBot * F + F * 0.06;
  const maskH = maskBot - maskTop;

  const rise = (at: number) =>
    interpolate(t, [at, at + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const glyphBase = {
    position: "absolute" as const,
    top: lineTop - maskTop,
    fontFamily: schibsted.fontFamily,
    fontWeight: 500,
    fontSize: F,
    lineHeight: `${F}px`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  };

  const nodes = chars.map((ch, i) => {
    const gx = x;
    const w = m.adv[i] * open[i] * F;
    x += w;
    if (i === 0) {
      const p = rise(RISE_AT);
      return (
        <div
          key={`g-${i}`}
          style={{
            ...glyphBase,
            left: gx,
            color: c.ink,
            transform: `translateY(${((1 - p) * maskH * 1.05).toFixed(2)}px)`,
          }}
        >
          {ch}
        </div>
      );
    }
    const at = PUSH_AT + (i - 1) * PUSH_GAP;
    const p = rise(at + 3);
    const slot = Math.max(0, w);
    if (slot < 1) return null;
    return (
      <div
        key={`g-${i}`}
        style={{
          position: "absolute",
          left: gx,
          top: 0,
          width: slot,
          height: maskH,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            ...glyphBase,
            left: (slot - m.adv[i] * F) / 2,
            backgroundImage: c.digit(accent),
            backgroundSize: `100% ${maskH}px`,
            backgroundPosition: `0 ${-(lineTop - maskTop)}px`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            transform: `translateY(${((1 - p) * maskH * 1.1).toFixed(2)}px)`,
          }}
        >
          {ch}
        </div>
      </div>
    );
  });

  const sufP = rise(RISE_AT + 3);
  const sufNode = suffix ? (
    <div
      key="suffix"
      style={{
        ...glyphBase,
        left: x + sufGap * F,
        color: c.ink,
        transform: `translateY(${((1 - sufP) * maskH * 1.05).toFixed(2)}px)`,
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
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop,
          height: maskH,
          overflow: "visible",
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
            top: midY + (inkH * rest) / 2 + labelGap,
            display: "flex",
            justifyContent: "center",
            fontFamily: schibsted.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            lineHeight: 1.2,
            letterSpacing: `${LABEL_TRACK}em`,
            color: c.ink,
            whiteSpace: "pre",
          }}
        >
          {words.map((w, k) => {
            const p = interpolate(
              t,
              [labelAt + k * LABEL_GAP, labelAt + k * LABEL_GAP + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${((1 - p) * labelSize * 0.7).toFixed(2)}px)`,
                }}
              >
                {w}
                {k < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
      {clear ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
