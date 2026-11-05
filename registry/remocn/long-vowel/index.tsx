"use client";

import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
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

const fraunces = loadFraunces("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadFraunces("italic", { weights: ["400"], subsets: ["latin"] });

export interface LongVowelProps {
  word?: string;
  letter?: string;
  repeat?: number;
  rest?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#B4B2B9",
    ramp: (a: string) => ["#F4F3F0", "#fff4ec", "#ffb36b", "#e2457a", a],
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#5F5D58",
    ramp: (a: string) => ["#111113", "#2a2f8f", a, "#d93d73", "#e0702c"],
    grain: 0.035,
  },
} as const;

const TRACK = -0.035;
const REST_TRACK = -0.01;
const FONT_PX = 400;

const RISE_AT = 0;
const RISE_LEN = 16;
const RISE_GAP = 2;
const DRAWL_AT = 28;
const DRAWL_GAP = 4;
const REST_GAP_AFTER = 4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  x: number[];
  width: number;
  rest: number;
  asc: number;
  desc: number;
  capTop: number;
  restAsc: number;
  restDesc: number;
}

function measure(drawn: string, rest: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("long-vowel: no 2d context");
  const fam = `"${fraunces.fontFamily}"`;
  ctx.font = `400 ${FONT_PX}px ${fam}`;
  const chars = Array.from(drawn);
  const x: number[] = [];
  let prefix = "";
  for (let i = 0; i < chars.length; i++) {
    x.push(ctx.measureText(prefix).width / FONT_PX + TRACK * i);
    prefix += chars[i];
  }
  const width =
    ctx.measureText(drawn).width / FONT_PX + TRACK * (chars.length - 1);
  const fm = ctx.measureText(drawn);
  const capTop = fm.actualBoundingBoxAscent / FONT_PX;
  const asc = fm.fontBoundingBoxAscent / FONT_PX;
  const desc = fm.fontBoundingBoxDescent / FONT_PX;
  ctx.font = `italic 400 ${FONT_PX}px ${fam}`;
  const rm = ctx.measureText(rest || " ");
  return {
    x,
    width,
    rest:
      rest.length > 0
        ? rm.width / FONT_PX + REST_TRACK * Array.from(rest).length
        : 0,
    asc,
    desc,
    capTop,
    restAsc: rm.actualBoundingBoxAscent / FONT_PX,
    restDesc: rm.actualBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(drawn: string, rest: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("long-vowel: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      fraunces.waitUntilDone(),
      document.fonts.load(`400 100px "${fraunces.fontFamily}"`),
      document.fonts.load(`italic 400 100px "${fraunces.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(drawn, rest));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [drawn, rest, handle]);
  return metrics;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `lv${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
          seed={5}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function rampAt(ramp: readonly string[], u: number) {
  const s = Math.min(Math.max(u, 0), 1) * (ramp.length - 1);
  const i = Math.min(Math.floor(s), ramp.length - 2);
  const f = s - i;
  return `color-mix(in oklab, ${ramp[i]} ${((1 - f) * 100).toFixed(1)}%, ${ramp[i + 1]})`;
}

export function LongVowel({
  word = "Way",
  letter,
  repeat = 5,
  rest = "less keyframing.",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: LongVowelProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const ramp = c.ramp(accent);

  const chars = useMemo(() => Array.from(word), [word]);
  const hold = useMemo(() => {
    if (letter) {
      const i = chars.indexOf(letter);
      if (i >= 0) return i;
    }
    const v = chars.findIndex((ch) => /[aeiouyAEIOUY]/.test(ch));
    return v >= 0 ? v : Math.max(0, Math.floor((chars.length - 1) / 2));
  }, [chars, letter]);
  const copies = Math.max(1, Math.round(repeat));
  const drawn = useMemo(
    () =>
      [
        ...chars.slice(0, hold + 1),
        ...Array.from({ length: copies }, () => chars[hold]),
        ...chars.slice(hold + 1),
      ].join(""),
    [chars, hold, copies],
  );
  const m = useMetrics(drawn, rest);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const F = Math.min(H * 0.4, (W * 0.88) / m.width);
  const R = rest
    ? Math.min(F * 0.36, (W * 0.84) / Math.max(0.1, m.rest), H * 0.1)
    : 0;
  const gap = rest ? F * 0.3 : 0;
  const blockTop = m.capTop * F;
  const blockBot = rest ? gap + (m.restAsc + m.restDesc) * R : 0;
  const baseY = H / 2 + (blockTop - blockBot) / 2;
  const restBase = baseY + gap + m.restAsc * R;

  const prog = Array.from({ length: copies }, (_, k) =>
    spring({
      frame: t - DRAWL_AT - k * DRAWL_GAP,
      fps,
      config: { damping: 15, stiffness: 140, mass: 0.8 },
    }),
  );
  const vel = prog.map((_, k) => {
    const a = spring({
      frame: t - DRAWL_AT - k * DRAWL_GAP - 1,
      fps,
      config: { damping: 15, stiffness: 140, mass: 0.8 },
    });
    return prog[k] - a;
  });

  const n = chars.length + copies;
  const fx = m.x;
  const step = (i: number) => (i + 1 < n ? fx[i + 1] - fx[i] : 0);
  const xs: number[] = [];
  let shrink = 0;
  for (let i = 0; i < n; i++) {
    if (i > hold && i <= hold + copies) {
      const k = i - hold - 1;
      shrink += (1 - prog[k]) * step(i - 1);
    }
    xs.push(fx[i] - shrink);
  }
  const curW = m.width - shrink;
  const left = (W - curW * F) / 2;

  const maskTop = baseY - m.asc * F;
  const maskH = (m.asc + m.desc) * F;
  const lineTop = baseY - (m.asc + (1 - m.asc - m.desc) / 2) * F;

  const drawnChars = Array.from(drawn);
  const glyphs: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ch = drawnChars[i];
    const isCopy = i > hold && i <= hold + copies;
    const k = isCopy ? i - hold - 1 : -1;
    const ri = i <= hold ? i : isCopy ? hold : i - copies;
    const rp = interpolate(
      t,
      [RISE_AT + ri * RISE_GAP, RISE_AT + ri * RISE_GAP + RISE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const dy = (1 - rp) * maskH * 1.05;
    let color: string = c.ink;
    let opacity = 1;
    let skew = 0;
    if (isCopy) {
      const u0 = (k + 1) / copies;
      const u1 = Math.min(1, (k + 1.6) / copies);
      color = rampAt(ramp, u0);
      opacity = interpolate(prog[k], [0, 0.25], [0, 1], CLAMP);
      skew = Math.max(-14, Math.min(14, -vel[k] * 90));
      glyphs.push(
        <div
          key={`g${i}`}
          style={{
            position: "absolute",
            left: left + xs[i] * F,
            top: lineTop - maskTop + dy,
            fontFamily: fraunces.fontFamily,
            fontWeight: 400,
            fontSize: F,
            lineHeight: `${F}px`,
            whiteSpace: "pre",
            opacity,
            transform: `skewX(${skew.toFixed(2)}deg)`,
            transformOrigin: `0 ${(m.asc * F).toFixed(1)}px`,
            backgroundImage: `linear-gradient(90deg, ${color}, ${rampAt(ramp, u1)})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {ch}
        </div>,
      );
      continue;
    }
    glyphs.push(
      <div
        key={`g${i}`}
        style={{
          position: "absolute",
          left: left + xs[i] * F,
          top: lineTop - maskTop + dy,
          fontFamily: fraunces.fontFamily,
          fontWeight: 400,
          fontSize: F,
          lineHeight: `${F}px`,
          whiteSpace: "pre",
          color,
        }}
      >
        {ch}
      </div>,
    );
  }

  const restAt = DRAWL_AT + (copies - 1) * DRAWL_GAP + 14 + REST_GAP_AFTER;
  const restWords = rest ? rest.split(" ") : [];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
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
        {glyphs}
      </div>
      {rest ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: restBase - R,
            height: R * 1.3,
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            fontFamily: fraunces.fontFamily,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: R,
            lineHeight: `${R}px`,
            letterSpacing: `${REST_TRACK}em`,
            color: c.muted,
            whiteSpace: "pre",
          }}
        >
          {restWords.map((w, k) => {
            const p = interpolate(
              t,
              [restAt + k * 3, restAt + k * 3 + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  transform: `translateY(${((1 - p) * R * 1.2).toFixed(2)}px)`,
                }}
              >
                {w}
                {k < restWords.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ) : null}
      {bg === "transparent" ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
