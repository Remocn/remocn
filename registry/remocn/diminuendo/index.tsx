"use client";

import { loadFont as loadArimo } from "@remotion/google-fonts/Arimo";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const arimo = loadArimo("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface DiminuendoProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  ratio?: number;
  separator?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const tone = (ink: string, field: string, k: number) =>
  `color-mix(in oklab, ${ink} ${k}%, ${field})`;

const THEMES = {
  dark: {
    bg: (_a: string) => "#000000",
    label: (a: string) => a,
    ramp: (a: string) => [
      a,
      tone(a, "#000", 74),
      tone(a, "#000", 54),
      tone(a, "#000", 40),
    ],
    spin: (_a: string) => "#000000",
  },
  light: {
    bg: (a: string) => a,
    label: (_a: string) => "#000000",
    ramp: (a: string) => [
      "#000000",
      tone("#000", a, 76),
      tone("#000", a, 56),
      tone("#000", a, 42),
    ],
    spin: (a: string) => a,
  },
} as const;

const WEIGHT = 500;
const HEAD = 1.06;
const TRACK = -0.02;

const INTRO_LEN = 14;
const COUNT_AT = 8;
const COUNT_LEN = 64;
const BIRTH_LEN = 10;
const ROLL_LEN = 6;
const LABEL_AT = 4;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.33, 0.05, 0.2, 1);
const EASE_ROLL = Easing.bezier(0.3, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  digit: number;
  sep: number;
  prefix: number;
  suffix: number;
  baseline: number;
  figTop: number;
}

function measure(sep: string, prefix: string, suffix: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${arimo.fontFamily}"`,
    fontSize: "100px",
    lineHeight: "1",
    fontWeight: WEIGHT,
    fontFeatureSettings: '"tnum" 1',
  });
  document.body.appendChild(probe);
  const w = (s: string) => {
    if (!s) return 0;
    probe.textContent = s;
    return probe.getBoundingClientRect().width / 100;
  };
  let digit = 0;
  for (let d = 0; d < 10; d++) digit = Math.max(digit, w(String(d)));
  const m = { digit, sep: w(sep), prefix: w(prefix), suffix: w(suffix) };
  probe.remove();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let baseline = 0.8;
  let figTop = 0.7;
  if (ctx) {
    ctx.font = `${WEIGHT} 200px "${arimo.fontFamily}"`;
    const fm = ctx.measureText("0123456789");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    figTop = fm.actualBoundingBoxAscent / 200;
  }
  return { ...m, baseline, figTop };
}

function useMetrics(sep: string, prefix: string, suffix: string) {
  const key = [sep, prefix, suffix].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("diminuendo: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [a, b, c] = key.split("\u0001");
    Promise.all([
      arimo.waitUntilDone(),
      document.fonts.load(`${WEIGHT} 100px "${arimo.fontFamily}"`),
      document.fonts.load(`400 100px "${arimo.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(a, b, c) });
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

function rampAt(ramp: readonly string[], u: number) {
  const s = Math.min(Math.max(u, 0), 1) * (ramp.length - 1);
  const i = Math.min(Math.floor(s), ramp.length - 2);
  const f = s - i;
  return `color-mix(in oklab, ${ramp[i]} ${((1 - f) * 100).toFixed(1)}%, ${ramp[i + 1]})`;
}

function placesOf(v: number) {
  return Math.max(1, Math.floor(Math.log10(Math.max(1, v))) + 1);
}

export function Diminuendo({
  value = 860000,
  from = 0,
  prefix = "",
  suffix = "",
  label = "frames rendered from the registry last month",
  ratio = 0.8,
  separator = ",",
  accent = "#8ACE00",
  background,
  speed = 1,
  theme = "dark",
}: DiminuendoProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg(accent);
  const ramp = c.ramp(accent);
  const m = useMetrics(separator, prefix, suffix);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const lo = Math.max(0, Math.round(Math.min(from, value)));
  const hi = Math.max(0, Math.round(value));
  const g = 1 / Math.min(0.95, Math.max(0.5, ratio));
  const logLo = Math.log10(lo + 1);
  const logHi = Math.log10(hi + 1);
  const valueAt = (f: number) => {
    const p = EASE_COUNT(Math.min(1, Math.max(0, (f - COUNT_AT) / COUNT_LEN)));
    if (p >= 1) return hi;
    return Math.round(10 ** (logLo + (logHi - logLo) * p) - 1);
  };

  const nFinal = placesOf(hi);
  const birthOf = (p: number) => {
    if (p === 0 || placesOf(lo) > p) return Number.NEGATIVE_INFINITY;
    for (let f = COUNT_AT; f <= COUNT_AT + COUNT_LEN; f += 0.5) {
      if (valueAt(f) >= 10 ** p) return f;
    }
    return COUNT_AT + COUNT_LEN;
  };
  const presence = Array.from({ length: nFinal }, (_, p) => {
    const b = birthOf(p);
    if (!Number.isFinite(b)) return 1;
    return interpolate(t, [b, b + BIRTH_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  });
  const leadEff = presence.reduce((s, a, p) => (p > 0 ? s + a : s), 0);

  const sizeAt = (p: number) => g ** p;
  const slot = (p: number) => (m.digit + TRACK) * sizeAt(p);
  const hasSep = separator.length > 0;
  const sepAfter = (p: number) => hasSep && p >= 3 && p % 3 === 0;
  const sepW = (p: number) => (m.sep + TRACK) * sizeAt(p);
  const prefixW = (lead: number) => (m.prefix + TRACK) * sizeAt(lead);
  const suffixW = m.suffix * sizeAt(-1);

  const widthWith = (a: number[]) => {
    let w = 0;
    for (let p = 0; p < a.length; p++) {
      if (a[p] <= 0) continue;
      w += slot(p) * (0.62 + 0.38 * a[p]);
      if (sepAfter(p)) w += sepW(p) * a[p];
    }
    const leadSize = a.reduce((s, x, p) => (p > 0 ? s + x : s), 0);
    return w + prefixW(leadSize) + suffixW;
  };
  const widthFinal = widthWith(Array.from({ length: nFinal }, () => 1));
  const widthNow = widthWith(presence);

  const vertical = H > W;
  const M = Math.min(W, H) * 0.08;
  const maxW = W - 2 * M;
  const capMax = H * (vertical ? 0.24 : 0.54);
  const S0 = Math.min(
    maxW / widthFinal,
    capMax / (m.figTop * sizeAt(nFinal - 1)),
  );
  const tallest = presence.reduce(
    (best, a, p) =>
      a > 0 ? Math.max(best, sizeAt(p) * (0.62 + 0.38 * a)) : best,
    sizeAt(0),
  );
  const K = Math.min(
    maxW / (widthNow * S0),
    capMax / (m.figTop * S0 * Math.max(tallest, g ** leadEff)),
  );
  const unit = S0 * K;

  const v = valueAt(t);
  const intro = interpolate(t, [0, INTRO_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const baseY = H - M;

  const left = M;

  const spinning = (p: number) => {
    const cur = Math.floor(v / 10 ** p);
    const before = Math.floor(valueAt(t - 3) / 10 ** p);
    return cur !== before;
  };
  const rollOf = (p: number) => {
    const cur = Math.floor(v / 10 ** p) % 10;
    for (let k = 1; k <= ROLL_LEN; k++) {
      const prev = Math.floor(valueAt(t - k) / 10 ** p) % 10;
      if (prev !== cur) {
        const earlier = Math.floor(valueAt(t - k - 1) / 10 ** p) % 10;
        if (earlier !== prev) return { from: prev, p: 1 };
        return { from: prev, p: EASE_ROLL(k / ROLL_LEN) };
      }
    }
    return { from: cur, p: 1 };
  };

  const items: React.ReactNode[] = [];
  let x = left;
  let leadNow = 0;
  presence.forEach((a, p) => {
    if (a > 0) leadNow = p;
  });
  const colorFor = (p: number) =>
    rampAt(ramp, leadEff <= 0 ? 0 : (leadEff - p) / Math.max(1, leadEff));

  if (prefix) {
    const size = sizeAt(leadEff) * unit;
    items.push(
      <Glyph
        key="prefix"
        text={prefix}
        x={x}
        baseY={baseY}
        size={size}
        m={m}
        color={colorFor(leadEff)}
        rise={1 - intro}
      />,
    );
    x += prefixW(leadEff) * unit;
  }

  for (let p = nFinal - 1; p >= 0; p--) {
    const a = presence[p];
    if (a <= 0) continue;
    const size = sizeAt(p) * unit;
    const scale = 0.62 + 0.38 * a;
    const w = slot(p) * unit * scale;
    const digit = Math.floor(v / 10 ** p) % 10;
    const roll = p >= leadNow - 1 ? { from: digit, p: 1 } : rollOf(p);
    const spin = spinning(p) && t < COUNT_AT + COUNT_LEN;
    const base = colorFor(p);
    const color = spin
      ? `color-mix(in oklab, ${base} 72%, ${c.spin(accent)})`
      : base;
    items.push(
      <div
        key={`d${p}`}
        style={{
          position: "absolute",
          left: x + (w - slot(p) * unit * scale) / 2,
          top: baseY - size * m.figTop * HEAD * scale,
          width: slot(p) * unit * scale,
          height: size * (m.figTop * HEAD + 0.06) * scale,
          overflow: "hidden",
          opacity: Math.min(1, a * 1.6),
        }}
      >
        <RollDigit
          digit={digit}
          prev={roll.from}
          p={roll.p}
          size={size * scale}
          m={m}
          color={color}
          rise={p === leadNow && leadNow === 0 ? 1 - intro : 0}
        />
      </div>,
    );
    x += w;
    if (sepAfter(p)) {
      const sw = sepW(p) * unit * a;
      items.push(
        <Glyph
          key={`s${p}`}
          text={separator}
          x={x - sepW(p) * unit * 0.12}
          baseY={baseY}
          size={sizeAt(p) * unit}
          m={m}
          color={colorFor(p)}
          opacity={a}
        />,
      );
      x += sw;
    }
  }

  if (suffix) {
    items.push(
      <Glyph
        key="suffix"
        text={suffix}
        x={x + 0.04 * unit}
        baseY={baseY}
        size={sizeAt(-1) * unit}
        m={m}
        color={colorFor(-1)}
        rise={1 - intro}
      />,
    );
  }

  const labelIn = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelSize = vertical ? W * 0.068 : H * 0.058;
  const labelBox: React.CSSProperties = {
    left: M,
    width: Math.min(W - 2 * M, labelSize * 15),
    top: M - labelSize * 0.18,
    textAlign: "left",
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {items}
      {label ? (
        <div
          style={{
            position: "absolute",
            ...labelBox,
            fontFamily: arimo.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: c.label(accent),
            textWrap: "balance",
            opacity: labelIn,
            transform: `translateY(${((1 - labelIn) * labelSize * 0.6).toFixed(2)}px)`,
          }}
        >
          {label.toLowerCase()}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function Glyph({
  text,
  x,
  baseY,
  size,
  m,
  color,
  rise = 0,
  opacity = 1,
}: {
  text: string;
  x: number;
  baseY: number;
  size: number;
  m: Metrics;
  color: string;
  rise?: number;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: baseY - m.baseline * size,
        fontFamily: arimo.fontFamily,
        fontWeight: WEIGHT,
        fontFeatureSettings: '"tnum" 1',
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "pre",
        letterSpacing: `${TRACK}em`,
        color,
        opacity: opacity * (1 - rise),
        transform: `translateY(${(rise * size * 0.4).toFixed(2)}px)`,
      }}
    >
      {text}
    </div>
  );
}

function RollDigit({
  digit,
  prev,
  p,
  size,
  m,
  color,
  rise,
}: {
  digit: number;
  prev: number;
  p: number;
  size: number;
  m: Metrics;
  color: string;
  rise: number;
}) {
  const pitch = size * 1.2;
  const top = size * m.figTop * HEAD - m.baseline * size;
  const style = (dy: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    right: 0,
    top: top + dy,
    textAlign: "center",
    fontFamily: arimo.fontFamily,
    fontWeight: WEIGHT,
    fontFeatureSettings: '"tnum" 1',
    fontSize: size,
    lineHeight: 1,
    color,
  });
  const lift = rise * pitch;
  return (
    <>
      {p < 1 ? <div style={style(-p * pitch)}>{prev}</div> : null}
      <div style={style((1 - p) * pitch + lift)}>{digit}</div>
    </>
  );
}
