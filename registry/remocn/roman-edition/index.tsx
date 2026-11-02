"use client";

import { loadVariableFont } from "@remotion/google-fonts/Archivo";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const archivo = loadVariableFont("normal", { subsets: ["latin"] });

export interface RomanEditionProps {
  value?: number;
  from?: number;
  eyebrow?: string;
  tagline?: string;
  showNumber?: boolean;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

function sequence(from: number, to: number): number[] {
  const a = Math.max(1, Math.round(Math.min(from, to)));
  const b = Math.max(1, Math.round(to));
  if (b - a <= 15) {
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  const out: number[] = [];
  for (let v = a; v <= Math.min(b, a + 4); v++) out.push(v);
  const steps = [5, 10, 50, 100, 500, 1000];
  const unit = steps.find((u) => (b - a) / u <= 9) ?? 1000;
  let v = Math.ceil((out[out.length - 1] + 1) / unit) * unit;
  while (v < b) {
    out.push(v);
    v += unit;
  }
  out.push(b);
  return out;
}

const TRACK = 0.02;
const FONT_PX = 200;

const START = 16;
const SLOW = 8;
const FAST = 3.5;
const MOVE = 10;

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

function measure(): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${archivo.fontFamily}"`,
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
    ctx.font = `500 ${FONT_PX}px "${archivo.fontFamily}"`;
    const box = ctx.measureText("IVXLCDM");
    const asc = box.fontBoundingBoxAscent / FONT_PX;
    const desc = box.fontBoundingBoxDescent / FONT_PX;
    capTop = box.actualBoundingBoxAscent / FONT_PX;
    baseline = (1 - (asc + desc)) / 2 + asc;
  }
  return { adv, capTop, baseline };
}

function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("roman-edition: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      archivo.waitUntilDone(),
      document.fonts.load(`500 100px "${archivo.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure());
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
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

export function RomanEdition({
  value = 14,
  from = 1,
  eyebrow = "Launch Week",
  tagline = "Five days of new scenes, one every morning.",
  showNumber = true,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: RomanEditionProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.accent;
  const bg = background ?? c.bg;
  const m = useMetrics();

  const seq = useMemo(() => sequence(from, value), [from, value]);
  const romans = useMemo(() => seq.map(toRoman), [seq]);
  const times = useMemo(() => {
    const out: number[] = [];
    let at = START;
    const n = seq.length;
    for (let k = 0; k < n; k++) {
      out.push(at);
      const p = n > 1 ? k / (n - 1) : 1;
      const u = Math.abs(p - 0.5) * 2;
      const gap = k < 3 ? SLOW + 1 : FAST + (SLOW - FAST) * u ** 2.2;
      at += gap;
    }
    return out;
  }, [seq]);

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
  for (let q = 1; q < times.length; q++) if (t >= times[q]) k = q;
  const lastAt = times[times.length - 1];

  const capPx = m.capTop * F;
  const bandH = capPx * 1.56;
  const bandTop = H / 2 - bandH / 2 - (portrait ? 0 : H * 0.02);
  const baseY = bandTop + bandH / 2 + capPx / 2;
  const lineTop = baseY - m.baseline * F;
  const bandP = interpolate(t, [0, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const intro = interpolate(t, [START - 8, START + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const smallSize = portrait ? W * 0.044 : H * 0.042;
  const tagSize = portrait ? W * 0.06 : H * 0.058;
  const tagAt = lastAt + 8;

  const glyphStyle = (x: number, y: number, opacity: number) => ({
    position: "absolute" as const,
    left: W / 2 + x * F,
    top: lineTop - bandTop + y,
    fontFamily: archivo.fontFamily,
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
    const T = times[k];
    const room = k < times.length - 1 ? times[k + 1] - T : MOVE + 4;
    const span = Math.min(MOVE, room);
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
  const tagWords = tagline ? tagline.split(" ") : [];
  const textBase = {
    fontFamily: archivo.fontFamily,
    fontVariationSettings: FVS_TEXT,
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
    whiteSpace: "pre" as const,
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: bandTop,
          width: W,
          height: bandH,
          background: c.band,
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
            color: c.ink,
            opacity: intro,
            transform: `translateY(${((1 - intro) * smallSize * 0.6).toFixed(2)}px)`,
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
            transform: `translateY(${((1 - intro) * smallSize * 0.6).toFixed(2)}px)`,
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
            color: c.ink,
          }}
        >
          {tagWords.map((w, i) => {
            const p = interpolate(
              t,
              [tagAt + i * 3, tagAt + i * 3 + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span key={`${w}-${i}`}>
                <span
                  style={{
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${((1 - p) * tagSize * 0.6).toFixed(2)}px)`,
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
    </AbsoluteFill>
  );
}
