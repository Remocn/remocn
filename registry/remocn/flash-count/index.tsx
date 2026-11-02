"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const hanken = loadHanken("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export interface FlashCountProps {
  value?: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  eyebrow?: string;
  flashAt?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#1A1918",
    ambient: "#131211",
    pop: "#D9D6D0",
    dim: "#57534E",
    ink: "#D9D6D0",
    muted: "#8F8A83",
    shadow: "#0B0A0A",
  },
  light: {
    bg: "#D9D6D0",
    ambient: "#C4C0B9",
    pop: "#F6F4F0",
    dim: "#9C978F",
    ink: "#111111",
    muted: "#57534E",
    shadow: "rgba(17,17,17,0.2)",
  },
} as const;

const RED = "#E2001A";
const TRACK = -0.04;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: Record<string, number>;
  digit: number;
  cap: number;
  label: number;
  eyebrow: number;
}

function measure(chars: string[], label: string, eyebrow: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("flash-count: no 2d context");
  ctx.font = `300 100px "${hanken.fontFamily}"`;
  const adv: Record<string, number> = {};
  for (const ch of chars) adv[ch] = ctx.measureText(ch).width / 100;
  let digit = 0;
  for (const d of "0123456789") digit = Math.max(digit, adv[d] ?? 0);
  const cap = ctx.measureText("8").actualBoundingBoxAscent / 100;
  ctx.font = `400 100px "${hanken.fontFamily}"`;
  const lw = label ? ctx.measureText(label).width / 100 : 0;
  ctx.font = `500 100px "${hanken.fontFamily}"`;
  const ew = eyebrow ? ctx.measureText(eyebrow).width / 100 : 0;
  return { adv, digit, cap, label: lw, eyebrow: ew };
}

function useMetrics(chars: string, label: string, eyebrow: string) {
  const key = `${chars}\u0001${label}\u0001${eyebrow}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("flash-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      hanken.waitUntilDone(),
      document.fonts.load(`300 100px "${hanken.fontFamily}"`),
      document.fonts.load(`400 100px "${hanken.fontFamily}"`),
      document.fonts.load(`500 100px "${hanken.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [c, l, e] = key.split("\u0001");
        setState({ key, m: measure(Array.from(c), l, e) });
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

function format(n: number, decimals: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const isDigit = (ch: string) => ch >= "0" && ch <= "9";

export function FlashCount({
  value = 3600,
  from = 120,
  decimals = 0,
  prefix = "",
  suffix = "",
  label = "frames in a two\u2011minute launch film",
  eyebrow = "f/8  ·  1/250 s",
  flashAt = 54,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: FlashCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const dot = accent ?? RED;
  const transparent = background === "transparent";

  const finalText = `${prefix}${format(value, decimals)}${suffix}`;
  const chars = Array.from(
    new Set(Array.from(`${finalText}0123456789,.-`)),
  ).join("");
  const m = useMetrics(chars, label, eyebrow);

  const F_ = flashAt;
  const lit = t >= F_;
  const pop = lit
    ? interpolate(t, [F_, F_ + 1, F_ + 12], [1, 0.85, 0], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : 0;
  const pre = interpolate(t, [F_ - 8, F_ - 7, F_ - 5], [0, 1, 0], CLAMP);
  const field = lit
    ? interpolateColors(pop, [0, 1], [c.bg, c.pop])
    : interpolateColors(pre * 0.25, [0, 1], [c.ambient, c.pop]);
  const stage = transparent ? "transparent" : (background ?? field);

  if (!m) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: transparent ? "transparent" : (background ?? c.ambient),
        }}
      />
    );
  }

  const countP = interpolate(t, [4, F_], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.3, 0.6, 0.4, 1),
  });
  const n = lit ? value : from + (value - from) * countP;
  const shown = `${prefix}${format(
    lit ? value : Number(n.toFixed(decimals)),
    decimals,
  )}${suffix}`;

  const widthOf = (s: string) => {
    let w = 0;
    const list = Array.from(s);
    for (const ch of list) w += isDigit(ch) ? m.digit : (m.adv[ch] ?? m.digit);
    return w + TRACK * Math.max(0, list.length - 1);
  };

  const portrait = H > W * 1.1;
  const minDim = Math.min(W, H);
  const marginX = W * (portrait ? 0.09 : 0.08);
  const marginY = H * (portrait ? 0.07 : 0.12);
  const F = Math.min(
    (H * (portrait ? 0.15 : 0.34)) / m.cap,
    (W * (portrait ? 0.82 : 0.56)) / widthOf(finalText),
  );
  const capPx = m.cap * F;
  const smallFs = Math.max(minDim * 0.026, Math.min(minDim * 0.032, 24));

  const baseline = H - marginY;
  const right = W - marginX;

  const driftP = Math.min(1, t / F_);
  const drift = 1 - driftP;
  const dx = drift * -W * 0.05;
  const ds = 1 - drift * 0.06;

  const shadowDx = F * 0.03;
  const shadowDy = F * 0.045;

  const textW = widthOf(shown) * F;
  const left = right - textW;
  const labelW = portrait
    ? W - marginX * 2
    : Math.max(W * 0.2, right - widthOf(finalText) * F - marginX - W * 0.04);

  const glyphs = (key: string) => {
    let x = 0;
    return Array.from(shown).map((ch, i) => {
      const cell = isDigit(ch) ? m.digit : (m.adv[ch] ?? m.digit);
      const own = m.adv[ch] ?? cell;
      const at = x + (cell - own) / 2;
      x += cell + TRACK;
      return (
        <span
          key={`${key}${i}`}
          style={{ position: "absolute", left: at * F, top: 0 }}
        >
          {ch}
        </span>
      );
    });
  };

  const numberBox = (style: React.CSSProperties, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left,
        top: baseline - F,
        width: textW + F * 0.1,
        height: F * 1.3,
        lineHeight: `${F * 1.2}px`,
        fontFamily: hanken.fontFamily,
        fontWeight: 300,
        fontSize: F,
        whiteSpace: "pre",
        ...style,
      }}
    >
      {glyphs(key)}
    </div>
  );

  const labelP = interpolate(t, [F_ + 4, F_ + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const cx = right;
  const cy = baseline - capPx / 2;
  const subject = `translate(${dx.toFixed(2)}px, 0px) translate(${cx}px, ${cy}px) scale(${ds.toFixed(4)}) translate(${-cx}px, ${-cy}px)`;
  const dotR = smallFs * 0.32;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: marginX,
          top: marginY,
          display: "flex",
          alignItems: "center",
          gap: smallFs * 0.6,
          fontFamily: hanken.fontFamily,
          fontWeight: 500,
          fontSize: smallFs,
          lineHeight: 1,
          whiteSpace: "pre",
          color: lit ? c.ink : c.dim,
        }}
      >
        <div
          style={{
            width: dotR * 2,
            height: dotR * 2,
            borderRadius: "50%",
            background: dot,
            opacity: lit ? 1 : 0.35 + pre * 0.65,
            flexShrink: 0,
          }}
        />
        {eyebrow}
      </div>

      <div style={{ position: "absolute", inset: 0, transform: subject }}>
        {lit
          ? numberBox(
              {
                transform: `translate(${shadowDx}px, ${shadowDy}px)`,
                color: c.shadow,
              },
              "s",
            )
          : null}
        {numberBox({ color: lit ? c.ink : c.dim }, "n")}
      </div>

      {label ? (
        <div
          style={{
            position: "absolute",
            left: marginX,
            width: labelW,
            ...(portrait
              ? { top: baseline - capPx - smallFs * 4.2 }
              : { bottom: H - baseline }),
            fontFamily: hanken.fontFamily,
            fontWeight: 400,
            fontSize: smallFs,
            lineHeight: 1.3,
            color: c.muted,
            textWrap: "balance",
            opacity: labelP,
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
