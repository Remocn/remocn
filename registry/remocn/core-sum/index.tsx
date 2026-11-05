"use client";

import { loadFont as loadSaira } from "@remotion/google-fonts/Saira";
import type React from "react";
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

const saira = loadSaira("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CoreSumProps {
  value?: number;
  parts?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  partLabel?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#F2F4EE",
    small: "#9A9D94",
    rule: "rgba(255,255,255,0.18)",
    accent: "#76B900",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0B0D08",
    small: "#5E6158",
    rule: "rgba(0,0,0,0.18)",
    accent: "#4C7A00",
  },
} as const;

const FONT_PX = 200;
const TRACK = -0.02;

const COUNT_LEN = 36;
const STAGGER = 2;
const FIRST_MERGE = 48;
const MERGE_GAP = 16;
const MERGE_LEN = 15;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_MERGE = Easing.bezier(0.6, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const WEIGHTS = [
  0.142, 0.118, 0.131, 0.109, 0.127, 0.121, 0.138, 0.114, 0.126, 0.133, 0.112,
  0.129, 0.117, 0.136, 0.11, 0.124,
];

function format(v: number) {
  const r = Math.round(Math.abs(v));
  return `${v < 0 ? "−" : ""}${String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Metrics {
  digit: number;
  chars: Record<string, number>;
  cap: number;
  base: number;
}

function measure(extra: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("core-sum: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${saira.fontFamily}"`;
  ctx.fontKerning = "none";
  const digit = ctx.measureText("0").width / FONT_PX;
  const chars: Record<string, number> = {};
  for (const ch of Array.from(`,.−${extra}`)) {
    chars[ch] = ctx.measureText(ch).width / FONT_PX;
  }
  const m = ctx.measureText("0123456789");
  const asc = m.fontBoundingBoxAscent / FONT_PX;
  const desc = m.fontBoundingBoxDescent / FONT_PX;
  return {
    digit,
    chars,
    cap: m.actualBoundingBoxAscent / FONT_PX,
    base: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(extra: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("core-sum: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      saira.waitUntilDone(),
      document.fonts.load(`500 100px "${saira.fontFamily}"`),
      document.fonts.load(`400 100px "${saira.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(extra));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [extra, handle]);
  return metrics;
}

function widthOf(m: Metrics, s: string) {
  const chars = Array.from(s);
  let w = 0;
  for (const ch of chars) {
    w += ch >= "0" && ch <= "9" ? m.digit : (m.chars[ch] ?? m.digit * 0.6);
  }
  return w + TRACK * Math.max(0, chars.length - 1);
}

export function CoreSum({
  value = 2097152,
  parts = 8,
  prefix = "",
  suffix = "",
  label = "frames per night, every core busy",
  partLabel = "core",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: CoreSumProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const hue = accent ?? c.accent;

  const count = useMemo(() => {
    const p = Math.round(Math.log2(Math.max(2, parts)));
    return 2 ** Math.max(1, Math.min(4, p));
  }, [parts]);
  const levels = Math.round(Math.log2(count));

  const leaves = useMemo(() => {
    const w = WEIGHTS.slice(0, count);
    const sum = w.reduce((a, b) => a + b, 0);
    const round = Math.abs(value) >= 1000 ? 1000 : 1;
    const out = w.map((x) => Math.round((value * x) / sum / round) * round);
    out[0] += value - out.reduce((a, b) => a + b, 0);
    return out;
  }, [count, value]);

  const m = useMetrics(`${prefix}${suffix}`);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const str = (v: number) => `${prefix}${format(v)}${suffix}`;
  const portrait = W < H;
  const margin = Math.round(Math.min(W, H) * 0.075);
  const top = portrait ? H * 0.2 : margin;
  const regionH = portrait ? H * 0.6 : H - margin * 2;
  const colX = margin + W * (portrait ? 0.3 : 0.27);
  const valX = colX + Math.min(W, H) * 0.04;
  const valW = W - margin - valX;

  const sums: number[][] = [leaves];
  for (let l = 1; l <= levels; l++) {
    const prev = sums[l - 1];
    const next: number[] = [];
    for (let i = 0; i < prev.length; i += 2) next.push(prev[i] + prev[i + 1]);
    sums.push(next);
  }

  const sizeAt = (l: number) => {
    const n = count / 2 ** l;
    const pitch = regionH / n;
    const widest = Math.max(...sums[l].map((v) => widthOf(m, str(v))));
    return Math.min(
      pitch * (l === levels ? 0.5 : 0.52),
      (valW * 0.96) / widest,
      l === levels ? H * 0.34 : H * 0.2,
    );
  };
  const rowY = (l: number, i: number) => {
    const pitch = regionH / (count / 2 ** l);
    return top + (i + 0.5) * pitch;
  };

  const mergeAt = (l: number) => FIRST_MERGE + (l - 1) * MERGE_GAP;
  const mergeP = (l: number) =>
    interpolate(t, [mergeAt(l), mergeAt(l) + MERGE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_MERGE,
    });
  let level = 0;
  for (let l = 1; l <= levels; l++) if (t >= mergeAt(l)) level = l;
  const lActive = Math.max(1, level === 0 ? 1 : level);
  const p = level === 0 ? 0 : mergeP(lActive);

  const fillP = interpolate(
    t,
    [mergeAt(levels) + 4, mergeAt(levels) + MERGE_LEN + 10],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );

  const glyphs = (
    s: string,
    x: number,
    cy: number,
    F: number,
    key: string,
    style: React.CSSProperties,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: cy - m.base * F + (m.cap * F) / 2,
        height: F,
        fontFamily: saira.fontFamily,
        fontWeight: 500,
        fontSize: F,
        lineHeight: `${F}px`,
        letterSpacing: `${TRACK}em`,
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
        fontKerning: "none",
        whiteSpace: "pre",
        ...style,
      }}
    >
      {s}
    </div>
  );

  const rowLabel = (l: number, i: number) => {
    if (l === levels) return label;
    const span = 2 ** l;
    const a = i * span + 1;
    const b = (i + 1) * span;
    return span === 1
      ? `${partLabel} ${pad(a)}`
      : `${partLabel}s ${pad(a)}–${pad(b)}`;
  };
  const labelSizeAt = (l: number) =>
    l === levels
      ? Math.max(16, Math.min(H * 0.04, W * 0.036))
      : Math.max(15, Math.min(sizeAt(l) * 0.46, H * 0.032));

  const nodes: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  const pushLabel = (l: number, i: number, opacity: number, key: string) => {
    if (opacity <= 0.001) return;
    const F = sizeAt(l);
    const size = labelSizeAt(l);
    const capTop = rowY(l, i) - (m.cap * F) / 2;
    labels.push(
      <div
        key={key}
        style={{
          position: "absolute",
          left: margin,
          top: capTop - size * 0.28,
          width: colX - margin - Math.min(W, H) * 0.03,
          fontFamily: saira.fontFamily,
          fontWeight: 400,
          fontSize: size,
          lineHeight: `${size * 1.25}px`,
          color: l === levels ? c.ink : c.small,
          opacity,
          textWrap: "balance",
        }}
      >
        {rowLabel(l, i)}
      </div>,
    );
  };

  if (level === 0) {
    const F = sizeAt(0);
    leaves.forEach((v, i) => {
      const start = i * STAGGER;
      const cp = interpolate(t, [start, start + COUNT_LEN], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const rise = interpolate(t, [start, start + 14], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const y = rowY(0, i);
      const capH = m.cap * F;
      nodes.push(
        <div
          key={`l0-${i}`}
          style={{
            position: "absolute",
            left: 0,
            top: y - capH / 2 - F * 0.1,
            width: W,
            height: capH + F * 0.22,
            overflow: "hidden",
          }}
        >
          {glyphs(
            str(v * cp),
            valX,
            capH / 2 + F * 0.1 + (1 - rise) * (capH + F * 0.3),
            F,
            "g",
            { color: c.small },
          )}
        </div>,
      );
      pushLabel(0, i, rise, `lb0-${i}`);
    });
  } else {
    const l = lActive;
    const F0 = sizeAt(l - 1);
    const F1 = sizeAt(l);
    const F = F0 + (F1 - F0) * p;
    const isFinal = l === levels;
    const k = Math.min(1, (l - 1 + p) / Math.max(1, levels - 1));
    const color = `color-mix(in oklab, ${c.ink} ${(k * 100).toFixed(1)}%, ${c.small})`;
    sums[l].forEach((_, i) => {
      const va = sums[l - 1][2 * i];
      const vb = sums[l - 1][2 * i + 1];
      const ay = rowY(l - 1, 2 * i) + (rowY(l, i) - rowY(l - 1, 2 * i)) * p;
      const byStart = rowY(l - 1, 2 * i + 1);
      const by = byStart + (ay - byStart) * p;
      const capH = m.cap * F;
      const edge = ay + capH / 2 + F * 0.32;
      if (p < 1) {
        nodes.push(
          <div
            key={`b${l}-${i}`}
            style={{
              position: "absolute",
              overflow: "hidden",
              left: 0,
              top: edge,
              width: W,
              height: Math.max(0, H - edge),
              opacity: interpolate(p, [0.3, 0.6], [1, 0], CLAMP),
            }}
          >
            {glyphs(str(vb), valX, by - edge, F, "g", { color })}
          </div>,
        );
      }
      const sa = str(va + vb * p);
      if (isFinal) {
        nodes.push(
          glyphs(sa, valX, ay, F, `a${l}-${i}`, {
            color: `color-mix(in oklab, ${hue} ${(fillP * 100).toFixed(1)}%, ${c.ink})`,
          }),
        );
      } else {
        nodes.push(glyphs(sa, valX, ay, F, `a${l}-${i}`, { color }));
      }
      pushLabel(
        l - 1,
        2 * i,
        interpolate(p, [0, 0.4], [1, 0], CLAMP),
        `lo${l}-${2 * i}`,
      );
      pushLabel(
        l - 1,
        2 * i + 1,
        interpolate(p, [0, 0.4], [1, 0], CLAMP),
        `lo${l}-${2 * i + 1}`,
      );
      pushLabel(
        l,
        i,
        interpolate(p, [0.55, 1], [0, 1], { ...CLAMP, easing: EASE_OUT }),
        `ln${l}-${i}`,
      );
    });
  }

  const shownLevel = level;
  const rows = count / 2 ** shownLevel;
  const pitch = regionH / rows;
  const rules: React.ReactNode[] = [];
  const drawIn = interpolate(t, [0, 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  for (let j = 0; j <= rows; j++) {
    rules.push(
      <line
        key={`r${shownLevel}-${j}`}
        x1={margin}
        x2={margin + (W - margin * 2) * drawIn}
        y1={top + j * pitch}
        y2={top + j * pitch}
        stroke={c.rule}
        strokeWidth={1}
      />,
    );
  }
  if (level > 0 && p < 1) {
    const prevPitch = pitch / 2;
    for (let j = 1; j < rows * 2; j += 2) {
      rules.push(
        <line
          key={`ro${level}-${j}`}
          x1={margin}
          x2={W - margin}
          y1={top + j * prevPitch}
          y2={top + j * prevPitch}
          stroke={c.rule}
          strokeWidth={1}
          opacity={interpolate(p, [0, 0.6], [1, 0], CLAMP)}
        />,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {rules}
        <line
          x1={colX}
          x2={colX}
          y1={top}
          y2={top + regionH * drawIn}
          stroke={c.rule}
          strokeWidth={1}
        />
      </svg>
      {labels}
      {nodes}
    </AbsoluteFill>
  );
}
