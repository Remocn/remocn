"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const geist = loadGeist("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export interface PromptRestyleProps {
  headline?: string;
  highlight?: string;
  instructions?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;
const RIBBON = ["#ff3d9a", "#ff8a3d", "#ffc83d", "#7a5cff"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    draft: "#6E6D73",
    muted: "#8E8D94",
    hero: (a: string) =>
      `linear-gradient(100deg, ${HALO[1]} 0%, ${HALO[2]} 48%, ${a} 100%)`,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    draft: "#A3A19B",
    muted: "#6E6C67",
    hero: (a: string) =>
      `linear-gradient(100deg, ${RIBBON[1]} 0%, ${RIBBON[0]} 46%, ${a} 100%)`,
  },
} as const;

const SERIF_SCALE = 1.22;
const SERIF_TRACK = -0.02;

interface Style {
  size: number;
  wght: number;
  track: number;
  lead: number;
}
const S0: Style = { size: 0.42, wght: 300, track: 0.01, lead: 1.3 };
const S1: Style = { size: 0.8, wght: 500, track: 0.01, lead: 1.3 };
const S2: Style = { size: 1, wght: 500, track: -0.04, lead: 1.02 };

const TYPE_RATE = 1.6;
const ENTER_PAUSE = 6;
const APPLY = 24;
const NEXT_GAP = 20;
const FIRST_AT = 16;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Token {
  text: string;
  hero: boolean;
}

interface Layout {
  lines: Token[][];
  F: number;
  heroSans: number;
  heroSerif: number;
  sansAsc: number;
  sansDesc: number;
  serifAsc: number;
  serifDesc: number;
}

function tokenize(headline: string, highlight: string): Token[] {
  const words = headline.split(/\s+/).filter(Boolean);
  const hw = highlight.split(/\s+/).filter(Boolean);
  if (hw.length > 0) {
    for (let i = 0; i + hw.length <= words.length; i++) {
      const slice = words.slice(i, i + hw.length);
      const ok = slice.every((w, k) =>
        k === hw.length - 1
          ? w.replace(/[.,!?;:]+$/, "") === hw[k]
          : w === hw[k],
      );
      if (!ok) continue;
      const last = slice[slice.length - 1];
      const tail = last.slice(hw[hw.length - 1].length);
      const out: Token[] = words
        .slice(0, i)
        .map((text) => ({ text, hero: false }));
      out.push({ text: hw.join(" "), hero: true });
      if (tail) out.push({ text: tail, hero: false });
      for (const text of words.slice(i + hw.length))
        out.push({ text, hero: false });
      return out;
    }
  }
  return words.map((text) => ({ text, hero: false }));
}

function measureLayout(
  tokens: Token[],
  W: number,
  H: number,
  heroOn: boolean,
): Layout {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("prompt-restyle: no 2d context");
  const PX = 200;
  const sansW = (s: string) => {
    ctx.font = `500 ${PX}px "${geist.fontFamily}"`;
    return ctx.measureText(s).width / PX + S2.track * Array.from(s).length;
  };
  const serifW = (s: string) => {
    ctx.font = `400 ${PX}px "${serif.fontFamily}"`;
    return (
      (ctx.measureText(s).width / PX + SERIF_TRACK * Array.from(s).length) *
      SERIF_SCALE
    );
  };
  const space = sansW(" ");
  const tokW = tokens.map((t) =>
    t.hero && heroOn ? serifW(t.text) : sansW(t.text),
  );
  const glue = tokens.map((t) => /^[.,!?;:]+$/.test(t.text));

  const lineWidth = (a: number, b: number) => {
    let w = 0;
    for (let i = a; i < b; i++) w += tokW[i] + (i > a && !glue[i] ? space : 0);
    return w;
  };
  const breaks = tokens.map((_, i) => i > 0 && !glue[i]);

  let best: { lines: number[]; F: number } | null = null;
  const n = tokens.length;
  for (let L = 1; L <= Math.min(4, n); L++) {
    let bestCut: number[] | null = null;
    let bestMax = Number.POSITIVE_INFINITY;
    const cut = (start: number, left: number, acc: number[], max: number) => {
      if (max >= bestMax) return;
      if (left === 1) {
        const m = Math.max(max, lineWidth(start, n));
        if (m < bestMax) {
          bestMax = m;
          bestCut = [...acc];
        }
        return;
      }
      for (let i = start + 1; i <= n - left + 1; i++) {
        if (!breaks[i]) continue;
        cut(i, left - 1, [...acc, i], Math.max(max, lineWidth(start, i)));
      }
    };
    cut(0, L, [], 0);
    if (!bestCut) continue;
    const F = Math.min(
      (W * 0.84) / bestMax,
      (H * 0.52) / (L * S2.lead),
      H * 0.2,
    );
    if (!best || F > best.F * 1.12) best = { lines: bestCut, F };
  }
  const cuts = best ? best.lines : [];
  const lines: Token[][] = [];
  let s = 0;
  for (const c of [...cuts, n]) {
    lines.push(tokens.slice(s, c));
    s = c;
  }
  const hero = tokens.find((t) => t.hero);
  ctx.font = `500 ${PX}px "${geist.fontFamily}"`;
  const ms = ctx.measureText("Hg");
  ctx.font = `italic 400 ${PX}px "${serif.fontFamily}"`;
  const mr = ctx.measureText("Hg");
  return {
    sansAsc: ms.fontBoundingBoxAscent / PX,
    sansDesc: ms.fontBoundingBoxDescent / PX,
    serifAsc: mr.fontBoundingBoxAscent / PX,
    serifDesc: mr.fontBoundingBoxDescent / PX,
    lines,
    F: best ? best.F : H * 0.1,
    heroSans: hero ? sansW(hero.text) : 0,
    heroSerif: hero ? serifW(hero.text) : 0,
  };
}

function useLayout(tokens: Token[], W: number, H: number, heroOn: boolean) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("prompt-restyle: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      serif.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`500 100px "${geist.fontFamily}"`),
      document.fonts.load(`italic 400 100px "${serif.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setLayout(measureLayout(tokens, W, H, heroOn));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [tokens, W, H, heroOn, handle]);
  return layout;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function PromptRestyle({
  headline = "Launch videos from parts you own.",
  highlight = "you own",
  instructions,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: PromptRestyleProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;

  const tokens = useMemo(
    () => tokenize(headline, highlight),
    [headline, highlight],
  );
  const heroOn = tokens.some((tk) => tk.hero);
  const layout = useLayout(tokens, W, H, heroOn);

  const steps = useMemo(() => {
    const d = [
      "make it bigger",
      "tighten it up",
      `set “${highlight}” in serif`,
    ];
    const list = (instructions ?? d).slice(0, heroOn ? 3 : 2);
    const out: { text: string; start: number; enter: number }[] = [];
    let at = FIRST_AT;
    for (const text of list) {
      const enter = at + Math.ceil(text.length / TYPE_RATE) + ENTER_PAUSE;
      out.push({ text, start: at, enter });
      at = enter + NEXT_GAP;
    }
    return out;
  }, [instructions, highlight, heroOn]);

  if (!layout) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const apply = (i: number) =>
    steps[i]
      ? interpolate(t, [steps[i].enter, steps[i].enter + APPLY], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        })
      : 0;
  const k1 = apply(0);
  const k2 = apply(1);
  const k3 = apply(2);

  const st: Style = {
    size: lerp(lerp(S0.size, S1.size, k1), S2.size, k2),
    wght: lerp(S0.wght, S1.wght, k1),
    track: lerp(S0.track, S2.track, k2),
    lead: lerp(S0.lead, S2.lead, k2),
  };
  const F = layout.F;
  const size = st.size * F;
  const ink = interpolateColors(k1, [0, 1], [c.draft, c.ink]);
  const enterIn = interpolate(t, [0, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const lineH = size * st.lead;
  const blockH = lineH * layout.lines.length;
  const centerY = H * 0.46;

  const sansStyle: React.CSSProperties = {
    fontFamily: geist.fontFamily,
    fontWeight: 400,
    fontVariationSettings: `"wght" ${st.wght.toFixed(1)}`,
    letterSpacing: `${st.track}em`,
    color: ink,
  };

  const heroNode = (text: string) => {
    if (k3 <= 0) return <span style={sansStyle}>{text}</span>;
    const wSans = layout.heroSans * size;
    const wSerif = layout.heroSerif * size;
    const w = lerp(wSans, wSerif + size * 0.17, k3);
    const roll = lineH * 1.1;
    const sz = size * SERIF_SCALE;
    const baseSans =
      (lineH - (layout.sansAsc + layout.sansDesc) * size) / 2 +
      layout.sansAsc * size;
    const baseSerif =
      (lineH - (layout.serifAsc + layout.serifDesc) * sz) / 2 +
      layout.serifAsc * sz;
    const dy = baseSans - baseSerif;
    return (
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: w,
          height: lineH,
          verticalAlign: "top",
          clipPath: `inset(0 ${-size * 0.4}px)`,
        }}
      >
        <span
          style={{
            ...sansStyle,
            position: "absolute",
            left: (w - wSans) / 2,
            top: 0,
            lineHeight: `${lineH}px`,
            whiteSpace: "pre",
            opacity: 1 - k3,
            transform: `translateY(${(-k3 * roll).toFixed(2)}px)`,
          }}
        >
          {text}
        </span>
        <span
          style={{
            position: "absolute",
            left: (w - wSerif - size * 0.17) / 2,
            top: dy,
            width: wSerif + size * 0.3,
            paddingRight: size * 0.1,
            lineHeight: `${lineH}px`,
            whiteSpace: "pre",
            fontFamily: serif.fontFamily,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: sz,
            letterSpacing: `${SERIF_TRACK}em`,
            backgroundImage: c.hero(accent),
            backgroundSize: "100% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            transform: `translateY(${((1 - k3) * roll).toFixed(2)}px)`,
          }}
        >
          {text}
        </span>
      </span>
    );
  };

  let active: (typeof steps)[number] | undefined;
  for (const s of steps) if (t >= s.start) active = s;
  let instruction: React.ReactNode = null;
  if (active) {
    const typed = Math.min(
      active.text.length,
      Math.floor((t - active.start) * TYPE_RATE),
    );
    const gone = interpolate(t, [active.enter, active.enter + 10], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const show = interpolate(
      t,
      [active.start, active.start + 5],
      [0, 1],
      CLAMP,
    );
    const monoSize = Math.max(16, Math.min(W, H) * 0.04);
    const blink = t < active.enter && Math.floor((t - active.start) / 8) % 2;
    instruction = (
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: H * 0.84 - monoSize / 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: monoSize * 0.6,
          fontFamily: mono.fontFamily,
          fontWeight: 400,
          fontSize: monoSize,
          lineHeight: 1,
          color: c.muted,
          whiteSpace: "pre",
          opacity: show * (1 - gone),
          transform: `translateY(${(-gone * monoSize * 1.2).toFixed(2)}px)`,
        }}
      >
        <span style={{ color: accent }}>›</span>
        <span style={{ position: "relative" }}>
          <span style={{ visibility: "hidden" }}>{active.text}</span>
          <span style={{ position: "absolute", left: 0, top: 0 }}>
            {active.text.slice(0, typed)}
            <span
              style={{
                display: "inline-block",
                width: Math.max(2, monoSize * 0.08),
                height: monoSize * 1.1,
                marginLeft: 2,
                verticalAlign: "-0.2em",
                background: accent,
                opacity: blink ? 0 : 1,
              }}
            />
          </span>
        </span>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: centerY - blockH / 2,
          opacity: enterIn,
          transform: `translateY(${((1 - enterIn) * F * 0.15).toFixed(2)}px)`,
          fontSize: size,
          lineHeight: `${lineH}px`,
        }}
      >
        {layout.lines.map((line, li) => (
          <div
            key={`line-${li}-${line.map((tk) => tk.text).join("_")}`}
            style={{
              display: "flex",
              justifyContent: "center",
              height: lineH,
              whiteSpace: "pre",
            }}
          >
            {line.map((tk, ti) => {
              const glued = /^[.,!?;:]+$/.test(tk.text);
              const lead = ti > 0 && !glued ? " " : "";
              return (
                <span key={`${tk.text}-${ti}`} style={{ display: "flex" }}>
                  {lead ? <span style={sansStyle}>{lead}</span> : null}
                  {tk.hero && heroOn ? (
                    heroNode(tk.text)
                  ) : (
                    <span style={sansStyle}>{tk.text}</span>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {instruction}
    </AbsoluteFill>
  );
}
