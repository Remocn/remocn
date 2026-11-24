"use client";

import { loadVariableFont } from "@remotion/google-fonts/Archivo";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_FROM,
  DEFAULT_TAGLINE,
  DEFAULT_VALUE,
  type RomanEditionElementId,
  romanEditionTimeline,
  sequence,
  taglineWords,
} from "./timeline";

const archivo = loadVariableFont("normal", { subsets: ["latin"] });

export interface RomanEditionProps {
  value?: number;
  from?: number;
  eyebrow?: string;
  tagline?: string;
  showNumber?: boolean;
  accent?: string;
  /** Color of the eyebrow and tagline; overrides the theme ink. */
  ink?: string;
  /** Fill of the band behind the numeral; overrides the theme. */
  band?: string;
  background?: string;
  /** Typeface for the numeral and copy. Load it yourself; Archivo by default. */
  fontFamily?: string;
  /** Frames between tagline words rising in. */
  stagger?: number;
  /** Size of the band and copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the band, the intro, each step of the count
   * and the tagline words, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<RomanEditionElementId>;
}

const THEMES = {
  dark: {
    bg: "#0E4D4A",
    ink: "#F4E9D8",
    accent: "#FF6B4A",
    band: "#FFC93C",
    numeral: "#0E4D4A",
  },
  light: {
    bg: "#F4E9D8",
    ink: "#0E4D4A",
    accent: "#FF6B4A",
    band: "#0E4D4A",
    numeral: "#F4E9D8",
  },
} as const;

const FVS_NUMERAL = '"wdth" 125, "wght" 500';
const FVS_TEXT = '"wdth" 125, "wght" 420';

const NUMERALS: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function toRoman(n: number): string {
  let v = Math.max(1, Math.min(3999, Math.round(n)));
  let out = "";
  for (const [k, s] of NUMERALS) {
    while (v >= k) {
      out += s;
      v -= k;
    }
  }
  return out;
}

const TRACK = 0.02;
const FONT_PX = 200;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  adv: Record<string, number>;
  capTop: number;
  baseline: number;
}

function measure(fontFamily: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${fontFamily}"`,
    fontVariationSettings: FVS_NUMERAL,
    fontSize: `${FONT_PX}px`,
    lineHeight: "1",
  });
  document.body.appendChild(probe);
  const adv: Record<string, number> = {};
  for (const ch of "IVXLCDM") {
    probe.textContent = ch;
    adv[ch] = probe.getBoundingClientRect().width / FONT_PX + TRACK;
  }
  probe.remove();
  let capTop = 0.72;
  let baseline = 0.8;
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `500 ${FONT_PX}px "${fontFamily}"`;
    const box = ctx.measureText("IVXLCDM");
    const asc = box.fontBoundingBoxAscent / FONT_PX;
    const desc = box.fontBoundingBoxDescent / FONT_PX;
    capTop = box.actualBoundingBoxAscent / FONT_PX;
    baseline = (1 - (asc + desc)) / 2 + asc;
  }
  return { adv, capTop, baseline };
}

function useMetrics(fontFamily: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("roman-edition: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      archivo.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle, fontFamily]);
  return metrics;
}

interface Glyph {
  key: string;
  ch: string;
  x: number;
}

function layout(str: string, adv: Record<string, number>): Glyph[] {
  const seen: Record<string, number> = {};
  const chars = Array.from(str);
  const total = chars.reduce((s, ch) => s + (adv[ch] ?? 0.5), 0) - TRACK;
  let x = -total / 2;
  return chars.map((ch) => {
    const n = seen[ch] ?? 0;
    seen[ch] = n + 1;
    const g = { key: `${ch}${n}`, ch, x };
    x += adv[ch] ?? 0.5;
    return g;
  });
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

export function RomanEdition(props: RomanEditionProps) {
  const {
    value = DEFAULT_VALUE,
    from = DEFAULT_FROM,
    eyebrow = "Launch Week",
    tagline = DEFAULT_TAGLINE,
    showNumber = true,
    accent,
    ink,
    band,
    background,
    fontFamily = archivo.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    romanEditionTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const bg = background ?? c.bg;
  const m = useMetrics(fontFamily);

  const seq = useMemo(() => sequence(from, value), [from, value]);
  const romans = useMemo(() => seq.map(toRoman), [seq]);
  const steps = tl.lane("Numeral");

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const layouts = romans.map((r) => layout(r, m.adv));
  const widest = Math.max(
    ...romans.map(
      (r) => Array.from(r).reduce((s, ch) => s + (m.adv[ch] ?? 0.5), 0) - TRACK,
    ),
  );
  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * 0.075;
  const F = Math.min(
    (W * (portrait ? 0.84 : 0.72)) / widest,
    (H * (portrait ? 0.2 : 0.34)) / m.capTop,
  );

  let k = 0;
  for (let q = 1; q < steps.length; q++) if (t >= steps[q].start) k = q;

  const capPx = m.capTop * F;
  const bandH = capPx * 1.56;
  const bandTop = H / 2 - bandH / 2 - (portrait ? 0 : H * 0.02);
  const baseY = bandTop + bandH / 2 + capPx / 2;
  const lineTop = baseY - m.baseline * F;
  const bandEl = tl.get("band");
  const introEl = tl.get("intro");
  const bandP = interpolate(t, [bandEl.start, bandEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const intro = interpolate(t, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const smallSize = portrait ? W * 0.044 : H * 0.042;
  const tagSize = portrait ? W * 0.06 : H * 0.058;

  // A glyph rising in or out is laid out on the line and travels by a
  // transform: `top` rounds the baseline to whole pixels, so the rise came
  // out in uneven steps. The transform stays at rest, as `translateY(0px)`,
  // so the line is never handed back to layout.
  const glyphStyle = (x: number, y: number, opacity: number) => ({
    position: "absolute" as const,
    left: W / 2 + x * F,
    top: lineTop - bandTop,
    transform: `translateY(${y}px)${glide(y !== 0)}`,
    fontFamily,
    fontVariationSettings: FVS_NUMERAL,
    fontSize: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre" as const,
    color: c.numeral,
    opacity,
  });

  const nodes: React.ReactNode[] = [];
  const cur = layouts[k];
  if (k === 0) {
    for (const g of cur) {
      const y = (1 - intro) * bandH * 0.9;
      nodes.push(
        <div key={`c-${g.key}`} style={glyphStyle(g.x, y, 1)}>
          {g.ch}
        </div>,
      );
    }
  } else {
    const prev = layouts[k - 1];
    const step = steps[k];
    const T = step.start;
    const span = Math.min(step.beat("move"), step.length);
    const dOut = Math.max(1.5, span * 0.42);
    const inAt = T + span * 0.34;
    const pm = interpolate(t, [T, T + span], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    const pin = interpolate(t, [inAt, T + span], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const pout = interpolate(t, [T, T + dOut], [0, 1], {
      ...CLAMP,
      easing: EASE_IN,
    });
    const prevMap = new Map(prev.map((g) => [g.key, g]));
    const curMap = new Map(cur.map((g) => [g.key, g]));
    for (const g of cur) {
      const p = prevMap.get(g.key);
      if (p) {
        const x = p.x + (g.x - p.x) * pm;
        nodes.push(
          <div key={`c-${g.key}`} style={glyphStyle(x, 0, 1)}>
            {g.ch}
          </div>,
        );
      } else {
        const y = (1 - pin) * bandH * 0.7;
        nodes.push(
          <div
            key={`c-${g.key}`}
            style={glyphStyle(g.x, y, Math.min(1, pin * 1.6))}
          >
            {g.ch}
          </div>,
        );
      }
    }
    for (const g of prev) {
      if (curMap.has(g.key)) continue;
      if (pout >= 1) continue;
      const y = -pout * bandH * 0.6;
      nodes.push(
        <div key={`o-${g.key}`} style={glyphStyle(g.x, y, 1 - pout)}>
          {g.ch}
        </div>,
      );
    }
  }

  const arabic = seq[k];
  const digits = String(Math.round(value)).length;
  const numLabel = `No. ${String(arabic).padStart(Math.max(2, digits), "0")}`;
  const tagWords = taglineWords(tagline);
  const textBase = {
    fontFamily,
    fontVariationSettings: FVS_TEXT,
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
    whiteSpace: "pre" as const,
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: bandTop,
            width: W,
            height: bandH,
            background: band ?? c.band,
            overflow: "hidden",
            clipPath: `inset(0 ${((1 - bandP) * 50).toFixed(3)}% 0 ${((1 - bandP) * 50).toFixed(3)}%)`,
          }}
        >
          {nodes}
        </div>
        {eyebrow ? (
          <div
            style={{
              ...textBase,
              position: "absolute",
              left: M,
              top: bandTop - smallSize * 1.7,
              fontSize: smallSize,
              color: fg,
              opacity: intro,
              transform: `translateY(${((1 - intro) * smallSize * 0.6).toFixed(2)}px)${glide(midway(intro))}`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        {showNumber ? (
          <div
            style={{
              ...textBase,
              position: "absolute",
              right: M,
              top: bandTop - smallSize * 1.7,
              fontSize: smallSize,
              fontFeatureSettings: '"tnum" 1',
              color: spot,
              opacity: intro,
              transform: `translateY(${((1 - intro) * smallSize * 0.6).toFixed(2)}px)${glide(midway(intro))}`,
            }}
          >
            {numLabel}
          </div>
        ) : null}
        {tagWords.length > 0 ? (
          <div
            style={{
              ...textBase,
              position: "absolute",
              left: M,
              width: portrait ? W - M * 2 : W * 0.62,
              top: bandTop + bandH + tagSize * 0.7,
              fontSize: tagSize,
              whiteSpace: "normal",
              textWrap: "balance",
              color: fg,
            }}
          >
            {tagWords.map((w, i) => {
              const wordEl = tl.get(`word:${i}`);
              const p = interpolate(t, [wordEl.start, wordEl.end], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              return (
                <span key={`${w}-${i}`}>
                  <span
                    style={{
                      display: "inline-block",
                      opacity: p,
                      transform: `translateY(${((1 - p) * tagSize * 0.6).toFixed(2)}px)${glide(midway(p))}`,
                    }}
                  >
                    {w}
                  </span>
                  {i < tagWords.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
