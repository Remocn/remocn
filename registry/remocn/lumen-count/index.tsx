"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface LumenCountProps {
  value?: number;
  from?: number;
  suffix?: string;
  label?: string;
  eyebrow?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const THEMES = {
  dark: {
    bg: "#040406",
    off: "#15161C",
    on: "#DCE5FF",
    fill: (accent: string) =>
      `linear-gradient(180deg, ${BEAM[0]} 18%, ${BEAM[1]} 62%, ${accent} 100%)`,
    flare: "#FFFFFF",
    label: "#9A9AA3",
    eyebrow: "#C9CBD6",
    bloom: true,
    reflect: 0.24,
    pool: (b: number, accent: string) =>
      `radial-gradient(48% 24% at 50% 0%, rgba(157,180,255,${(0.32 * b).toFixed(3)}) 0%, color-mix(in oklab, ${accent} ${(30 * b).toFixed(1)}%, transparent) 38%, transparent 76%)`,
    haze: (b: number) =>
      `radial-gradient(60% 55% at 50% 46%, rgba(143,180,255,${(0.08 * b).toFixed(3)}) 0%, transparent 70%)`,
    floor: "linear-gradient(180deg, rgba(20,22,34,0.55) 0%, rgba(4,4,6,0) 70%)",
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    off: "#E7E4DD",
    on: "#15151A",
    fill: (accent: string) =>
      `linear-gradient(180deg, ${BEAM[3]} 10%, #2B2F8F 50%, ${accent} 100%)`,
    flare: "#5E7BFF",
    label: "#6E6C67",
    eyebrow: "#3F3E3A",
    bloom: false,
    reflect: 0.12,
    pool: (b: number, accent: string) =>
      `radial-gradient(48% 24% at 50% 0%, color-mix(in oklab, ${accent} ${(14 * b).toFixed(1)}%, transparent) 0%, transparent 72%)`,
    haze: (b: number) =>
      `radial-gradient(70% 60% at 50% 40%, rgba(255,255,255,${(0.7 * b).toFixed(3)}) 0%, transparent 70%)`,
    floor:
      "linear-gradient(180deg, rgba(222,217,207,0.6) 0%, rgba(245,244,240,0) 70%)",
    grain: 0.035,
  },
} as const;

const TRACK = -0.045;
const FONT_PX = 200;
const COUNT_AT = 6;
const COUNT_END = 58;
const FLARE_AT = 56;
const LABEL_AT = 68;
const SHIFT = 8;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.5, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  digit: number;
  width: (s: string) => number;
  label: (s: string) => number;
  baseline: number;
  capTop: number;
}

function useMetrics() {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("lumen-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      document.fonts.load(`400 100px "${geist.fontFamily}"`),
      document.fonts.load(`300 100px "${geist.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("lumen-count: no 2d context");
        ctx.font = `400 ${FONT_PX}px "${geist.fontFamily}"`;
        const fm = ctx.measureText("0");
        const asc = fm.fontBoundingBoxAscent / FONT_PX;
        const desc = fm.fontBoundingBoxDescent / FONT_PX;
        const digit = Math.max(
          ..."0123456789".split("").map((d) => ctx.measureText(d).width),
        );
        const adv = (ch: string) =>
          (/[0-9]/.test(ch) ? digit : ctx.measureText(ch).width) / FONT_PX +
          TRACK;
        const width = (s: string) =>
          Array.from(s).reduce((a, ch) => a + adv(ch), 0) - TRACK;
        const capTop = fm.actualBoundingBoxAscent / FONT_PX;
        const label = (s: string) => {
          ctx.font = `400 ${FONT_PX}px "${geist.fontFamily}"`;
          return ctx.measureText(s).width / FONT_PX;
        };
        setM({
          digit: digit / FONT_PX,
          width,
          label,
          baseline: (1 - (asc + desc)) / 2 + asc,
          capTop,
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return m;
}

function fmt(v: number) {
  return Math.round(v).toLocaleString("en-US");
}

function Grain({ opacity }: { opacity: number }) {
  const id = `lc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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

function mixHex(a: string, b: string, t: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (p: number, sh: number) => (p >> sh) & 255;
  const m = (sh: number) =>
    Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * t);
  return `rgb(${m(16)}, ${m(8)}, ${m(0)})`;
}

export function LumenCount({
  value = 200,
  from = 1,
  suffix = "",
  label = "components, ready to light up your launch video",
  eyebrow = "",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: LumenCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const m = useMetrics();

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const lo = Math.max(1, Math.min(from, value));
  const hi = Math.max(lo + 1, value);
  const valueAt = (u: number) => lo * (hi / lo) ** u;
  const uAt = (tt: number) =>
    EASE_COUNT(interpolate(tt, [COUNT_AT, COUNT_END], [0, 1], CLAMP));
  const u = uAt(t);
  const v = u >= 1 ? value : valueAt(u);
  const text = `${fmt(v)}${suffix}`;
  const finalText = `${fmt(value)}${suffix}`;

  const b0 = Math.log(v / lo) / Math.log(hi / lo);
  const flare =
    interpolate(t, [FLARE_AT, FLARE_AT + 5], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    }) *
    interpolate(t, [FLARE_AT + 6, FLARE_AT + 24], [1, 0], {
      ...CLAMP,
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    });
  const b = Math.max(0.04, b0);

  const F = Math.min(H * 0.46, (W * 0.84) / m.width(finalText));
  let wEff = m.width(`${fmt(lo)}${suffix}`);
  {
    let prev = wEff;
    for (let s = COUNT_AT; s <= COUNT_END + 1; s += 0.5) {
      const uu = uAt(s);
      const w = m.width(`${fmt(uu >= 1 ? value : valueAt(uu))}${suffix}`);
      if (w !== prev) {
        wEff +=
          (w - prev) *
          interpolate(t, [s, s + SHIFT], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
        prev = w;
      }
    }
  }
  const lineW = wEff * F;
  const capH = m.capTop * F;
  const hasLabel = label.length > 0;
  const labSize = Math.min(H * 0.042, Math.max(H * 0.03, F * 0.13));
  const labLines = Math.ceil((m.label(label) * labSize) / (W * 0.8));
  const blockH =
    capH + (hasLabel ? F * 0.36 + labSize * 1.25 * labLines : F * 0.2);
  const capY = (H - blockH) / 2 + (eyebrow ? H * 0.03 : 0);
  const baseY = capY + capH;
  const floorY = baseY + F * 0.035;
  const left = (W - lineW) / 2;
  const top = baseY - m.baseline * F;

  const chars = Array.from(text);
  const finalChars = Array.from(finalText);
  const lead = finalChars.length - chars.length;

  const glyphs = (key: string, color: string, extra?: React.CSSProperties) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left,
        top,
        height: F,
        display: "flex",
        fontFamily: geist.fontFamily,
        fontWeight: 400,
        fontSize: F,
        lineHeight: `${F}px`,
        color,
        whiteSpace: "pre",
        ...extra,
      }}
    >
      {chars.map((ch, i) => {
        const isDigit = /[0-9]/.test(ch);
        const w = ((isDigit ? m.digit : m.width(ch)) + TRACK) * F;
        let dy = 0;
        let op = 1;
        if (i === 0 && lead >= 0 && t > COUNT_AT) {
          let since = 99;
          for (let s = t; s > t - SHIFT && s >= COUNT_AT; s -= 0.5) {
            const uu = uAt(s - 0.5);
            const before = fmt(uu >= 1 ? value : valueAt(uu)).length;
            if (before < fmt(v).length) {
              since = t - s;
              break;
            }
          }
          if (since < SHIFT) {
            const p = EASE_OUT(since / SHIFT);
            dy = (1 - p) * F * 0.18;
            op = p;
          }
        }
        return (
          <span
            key={`${i}-${ch}`}
            style={{
              display: "inline-block",
              width: i === chars.length - 1 ? w - TRACK * F : w,
              textAlign: isDigit ? "center" : "left",
              transform: dy ? `translateY(${dy.toFixed(2)}px)` : undefined,
              opacity: op,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );

  const baseCol = mixHex(c.off, c.on, Math.min(1, b));
  const fillOn = Math.min(1, Math.max(0, (b - 0.35) / 0.65)) * (1 - flare);
  const flareCol = flare;
  const glowB = Math.min(1.6, b + flare * 0.6);
  const labP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const eyeP = interpolate(t, [COUNT_END - 10, COUNT_END + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const reflMask = `linear-gradient(0deg, black ${(H - floorY).toFixed(1)}px, transparent ${(H - floorY + capH * 0.6).toFixed(1)}px)`;
  const sunFlash = theme === "light" ? flare * 0.55 : 0;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: floorY,
          bottom: 0,
          background: c.floor,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: floorY,
          height: H - floorY,
          background: c.pool(Math.min(1.3, glowB), accent),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.haze(Math.min(1.3, glowB)),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `50% ${floorY.toFixed(2)}px`,
          transform: "scaleY(-1)",
          opacity: c.reflect * Math.min(1, glowB),
          filter: `blur(${(F * 0.012).toFixed(2)}px)`,
          WebkitMaskImage: reflMask,
          maskImage: reflMask,
        }}
      >
        {glyphs("refl", theme === "dark" ? "#AFC3FF" : "#2B2F8F")}
      </div>
      {c.bloom ? (
        <>
          {glyphs("bloom2", accent, {
            filter: `blur(${(F * 0.16).toFixed(2)}px)`,
            opacity: 0.45 * glowB ** 3,
          })}
          {glyphs("bloom1", BEAM[1], {
            filter: `blur(${(F * 0.045).toFixed(2)}px)`,
            opacity: Math.min(1, 0.6 * glowB ** 2),
          })}
        </>
      ) : (
        glyphs("shade", accent, {
          filter: `blur(${(F * 0.05).toFixed(2)}px)`,
          opacity: 0.16 * b,
          transform: `translateY(${(F * 0.02).toFixed(2)}px)`,
        })
      )}
      {glyphs("base", baseCol)}
      {glyphs("fill", "transparent", {
        backgroundImage: c.fill(accent),
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        opacity: fillOn,
      })}
      {flareCol > 0.001
        ? glyphs("flare", c.flare, { opacity: flareCol })
        : null}
      {eyebrow ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: capY - H * 0.075,
            textAlign: "center",
            fontFamily: geist.fontFamily,
            fontWeight: 400,
            fontSize: Math.max(H * 0.026, labSize * 0.72),
            letterSpacing: "0.02em",
            color: c.eyebrow,
            opacity: eyeP,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      {hasLabel ? (
        <div
          style={{
            position: "absolute",
            left: W * 0.1,
            width: W * 0.8,
            top: floorY + F * 0.36,
            textAlign: "center",
            textWrap: "balance",
            lineHeight: 1.25,
            fontFamily: geist.fontFamily,
            fontWeight: 300,
            fontSize: labSize,
            letterSpacing: "-0.01em",
            color: c.label,
            opacity: labP,
            transform: `translateY(${((1 - labP) * labSize * 0.7).toFixed(2)}px)`,
          }}
        >
          {label}
        </div>
      ) : null}
      {sunFlash > 0.001 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(80% 70% at 50% 35%, #ffffff 0%, rgba(255,255,255,0) 75%)",
            opacity: sunFlash,
          }}
        />
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
