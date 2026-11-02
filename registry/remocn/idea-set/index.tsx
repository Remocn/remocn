"use client";

import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
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

const sans = loadPlexSans("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const sansItalic = loadPlexSans("italic", {
  weights: ["300"],
  subsets: ["latin"],
});
const mono = loadPlexMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface IdeaSetProps {
  lines?: string[];
  highlight?: string;
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0F1B2D",
    ink: "#F3F5F8",
    rule: "rgba(243, 245, 248, 0.22)",
    accent: "#FF9900",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0F1B2D",
    rule: "rgba(15, 27, 45, 0.2)",
    accent: "#C76A00",
  },
} as const;

interface Face {
  family: string;
  style: "normal" | "italic";
  weight: number;
}
const FACES: Face[] = [
  { family: sansItalic.fontFamily, style: "italic", weight: 300 },
  { family: mono.fontFamily, style: "normal", weight: 400 },
  { family: sans.fontFamily, style: "normal", weight: 500 },
];
const TRACK = [0.012, 0, -0.03];
const LINE = 1.34;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Advances = Record<string, [number, number, number]>;
interface Metrics {
  adv: Advances;
  asc: [number, number, number];
  desc: [number, number, number];
}

function measure(chars: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("idea-set: no 2d context");
  const fonts = FACES.map((f) => `${f.style} ${f.weight} 100px "${f.family}"`);
  const adv: Advances = {};
  for (const ch of chars) {
    adv[ch] = fonts.map((font) => {
      ctx.font = font;
      return ctx.measureText(ch).width / 100;
    }) as [number, number, number];
  }
  const asc = fonts.map((font) => {
    ctx.font = font;
    return ctx.measureText("Hg").fontBoundingBoxAscent / 100;
  }) as [number, number, number];
  const desc = fonts.map((font) => {
    ctx.font = font;
    return ctx.measureText("Hg").fontBoundingBoxDescent / 100;
  }) as [number, number, number];
  return { adv, asc, desc };
}

function useMetrics(chars: string[]) {
  const key = chars.join("");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("idea-set: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      sans.waitUntilDone(),
      sansItalic.waitUntilDone(),
      mono.waitUntilDone(),
      ...FACES.map((f) =>
        document.fonts.load(`${f.style} ${f.weight} 100px "${f.family}"`),
      ),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(Array.from(key)) });
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

export function IdeaSet({
  lines = ["Napkin sketch.", "Keynote opener."],
  highlight = "Keynote opener.",
  hold = 18,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: IdeaSetProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const portrait = H > W * 1.1;
  const rows = useMemo(() => {
    const r = lines.map((l) => l.trim()).filter((l) => l.length > 0);
    const base = r.length > 0 ? r : ["remocn"];
    return portrait ? base.flatMap((l) => l.split(/\s+/)) : base;
  }, [lines, portrait]);
  const chars = useMemo(
    () => Array.from(new Set(Array.from(rows.join("")))).sort(),
    [rows],
  );
  const m = useMetrics(chars);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const ENTER = 18;
  const W1 = ENTER + hold;
  const WAVE = 26;
  const W2 = W1 + WAVE + hold;
  const TURN = 10;

  const joined = rows.join("\n");
  const hlStart = highlight ? rows.join(" ").indexOf(highlight) : -1;
  const hlEnd = hlStart >= 0 ? hlStart + highlight.length : -1;

  const total = Array.from(joined).filter((ch) => ch !== "\n").length;
  const stagger = Math.min(1.4, (WAVE - TURN) / Math.max(1, total - 1));

  const widthIn = (row: string, s: number) => {
    const g = Array.from(row);
    let w = 0;
    for (const ch of g) w += m.adv[ch][s];
    return w + TRACK[s] * Math.max(0, g.length - 1);
  };
  const widest = Math.max(
    ...rows.flatMap((r) => [widthIn(r, 0), widthIn(r, 1), widthIn(r, 2)]),
  );
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.09);
  const F = Math.min(
    (W - margin * 2) / widest,
    (H * (portrait ? 0.62 : 0.66)) / (rows.length * LINE),
    H * 0.2,
  );
  const lineH = F * LINE;
  const baseIn = lineH * 0.78;
  const visH = (rows.length - 1) * lineH + F * 1.02;
  const top = (H - visH) / 2 - (baseIn - F * 0.72);

  const stateOf = (i: number) => {
    const a = interpolate(
      t,
      [W1 + i * stagger, W1 + i * stagger + TURN],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
    const b = interpolate(
      t,
      [W2 + i * stagger, W2 + i * stagger + TURN],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
    return { a, b };
  };

  const faceOf = (a: number, b: number) => (b >= 0.5 ? 2 : a >= 0.5 ? 1 : 0);
  const advOf = (ch: string, a: number, b: number) => {
    const A = m.adv[ch];
    return b > 0 ? A[1] + (A[2] - A[1]) * b : A[0] + (A[1] - A[0]) * a;
  };
  const trackOf = (a: number, b: number) =>
    b > 0
      ? TRACK[1] + (TRACK[2] - TRACK[1]) * b
      : TRACK[0] + (TRACK[1] - TRACK[0]) * a;

  const els: React.ReactNode[] = [];
  let gi = 0;
  let ci = 0;
  rows.forEach((row, r) => {
    const g = Array.from(row);
    const enter = interpolate(t, [r * 4, r * 4 + ENTER], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const ruleP = interpolate(t, [r * 3, r * 3 + ENTER + 4], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const baseY = top + r * lineH + baseIn;
    let x = 0;
    const rowGlyphs: React.ReactNode[] = [];
    g.forEach((ch, k) => {
      const { a, b } = stateOf(gi + k);
      const fi = faceOf(a, b);
      const face = FACES[fi];
      const lift = Math.sin(Math.PI * a) + Math.sin(Math.PI * b);
      const inHl = hlStart >= 0 && ci >= hlStart && ci < hlEnd;
      const color = inHl && fi === 2 ? (accent ?? c.accent) : c.ink;
      rowGlyphs.push(
        <span
          key={`g${r}-${k}`}
          style={{
            position: "absolute",
            left: margin + x * F,
            top: baseIn - m.asc[fi] * F,
            lineHeight: 1,
            height: (m.asc[fi] + m.desc[fi]) * F,
            whiteSpace: "pre",
            fontFamily: face.family,
            fontStyle: face.style,
            fontWeight: face.weight,
            fontSize: F,
            color,
            transform: `translateY(${(-lift * F * 0.08).toFixed(2)}px)`,
          }}
        >
          {ch}
        </span>,
      );
      x += advOf(ch, a, b) + trackOf(a, b);
      ci++;
    });
    gi += g.length;
    ci++;
    els.push(
      <div
        key={`rule${r}`}
        style={{
          position: "absolute",
          left: margin,
          top: baseY + F * 0.3,
          width: (W - margin * 2) * ruleP,
          height: Math.max(1, F * 0.012),
          background: c.rule,
        }}
      />,
    );
    els.push(
      <div
        key={`row${r}`}
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: top + r * lineH,
          height: baseIn + F * 0.28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: (1 - enter) * lineH,
            width: W,
            height: lineH,
          }}
        >
          {rowGlyphs}
        </div>
      </div>,
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {els}
    </AbsoluteFill>
  );
}
