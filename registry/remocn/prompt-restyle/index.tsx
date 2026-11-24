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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_HEADLINE,
  DEFAULT_HIGHLIGHT,
  instructionsOf,
  type PromptRestyleElementId,
  promptRestyleTimeline,
  type Token,
  TYPE_RATE,
  tokenize,
} from "./timeline";

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
  /** Frames between one instruction landing and the next one being typed. */
  stepGap?: number;
  accent?: string;
  /** Final headline color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the headline. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Italic typeface the highlight turns into. Load it yourself; Instrument Serif by default. */
  accentFont?: string;
  /** Size of the headline and prompt, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the headline's entry and each instruction's
   * prompt and apply, by the ids in `./timeline`. Frames on the scene
   * timeline, after `delay` and `speed`.
   */
  timing?: Timing<PromptRestyleElementId>;
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

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

function measureLayout(
  tokens: Token[],
  W: number,
  H: number,
  heroOn: boolean,
  sansFamily: string,
  serifFamily: string,
): Layout {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("prompt-restyle: no 2d context");
  const PX = 200;
  const sansW = (s: string) => {
    ctx.font = `500 ${PX}px "${sansFamily}"`;
    return ctx.measureText(s).width / PX + S2.track * Array.from(s).length;
  };
  const serifW = (s: string) => {
    ctx.font = `400 ${PX}px "${serifFamily}"`;
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
  ctx.font = `500 ${PX}px "${sansFamily}"`;
  const ms = ctx.measureText("Hg");
  ctx.font = `italic 400 ${PX}px "${serifFamily}"`;
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

function useLayout(
  tokens: Token[],
  W: number,
  H: number,
  heroOn: boolean,
  sansFamily: string,
  serifFamily: string,
) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("prompt-restyle: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      serif.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`500 100px "${sansFamily}"`),
      document.fonts.load(`italic 400 100px "${serifFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setLayout(measureLayout(tokens, W, H, heroOn, sansFamily, serifFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [tokens, W, H, heroOn, handle, sansFamily, serifFamily]);
  return layout;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

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

export function PromptRestyle(props: PromptRestyleProps) {
  const {
    headline = DEFAULT_HEADLINE,
    highlight = DEFAULT_HIGHLIGHT,
    instructions,
    accent = "#3B5BFD",
    ink: inkProp,
    background,
    fontFamily = geist.fontFamily,
    accentFont = serif.fontFamily,
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
    promptRestyleTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const bg = background ?? c.bg;

  const tokens = useMemo(
    () => tokenize(headline, highlight),
    [headline, highlight],
  );
  const heroOn = tokens.some((tk) => tk.hero);
  const layout = useLayout(tokens, W, H, heroOn, fontFamily, accentFont);

  const steps = useMemo(
    () =>
      instructionsOf(instructions, highlight, heroOn).map((text, i) => {
        const prompt = tl.get(`prompt:${i}`);
        const apply = tl.get(`apply:${i}`);
        return {
          text,
          start: prompt.start,
          show: prompt.beat("show"),
          enter: apply.start,
          applyEnd: apply.end,
          gone: apply.beat("gone"),
        };
      }),
    [instructions, highlight, heroOn, tl],
  );
  const enterEl = tl.get("enter");

  if (!layout) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const apply = (i: number) =>
    steps[i]
      ? interpolate(t, [steps[i].enter, steps[i].applyEnd], [0, 1], {
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
  // Layout would round every baseline of the growing headline to whole pixels
  // and the lines would click apart, and a block handed back to layout between
  // steps would jump by the rounding. So the block is laid out once, at the
  // style the last step lands on, and reaches the live size by `scale`; each
  // line takes the leading change as a translate. Both come to exactly nothing
  // once the last step has landed.
  const restyling = (k: number) => k > 0 && k < 1;
  const refSize = lerp(lerp(S0.size, S1.size, 1), S2.size, 1);
  const refLead = lerp(S0.lead, S2.lead, 1);
  const restyled = restyling(k1) || restyling(k2);
  const fit = st.size / refSize;
  const size = refSize * F;
  const ink = interpolateColors(k1, [0, 1], [c.draft, inkProp ?? c.ink]);
  const enterIn = interpolate(t, [enterEl.start, enterEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const lineH = size * refLead;
  const blockH = lineH * layout.lines.length;
  const lineShift = (li: number) =>
    size * (st.lead - refLead) * (li + 0.5 - layout.lines.length / 2);
  const centerY = H * 0.46;

  const sansStyle: React.CSSProperties = {
    fontFamily,
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
            transform: `translateY(${(-k3 * roll).toFixed(2)}px)${glide(midway(k3) && !restyled)}`,
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
            fontFamily: accentFont,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: sz,
            letterSpacing: `${SERIF_TRACK}em`,
            backgroundImage: c.hero(accent),
            backgroundSize: "100% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            transform: `translateY(${((1 - k3) * roll).toFixed(2)}px)${glide(midway(k3) && !restyled)}`,
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
    const gone = interpolate(
      t,
      [active.enter, active.enter + active.gone],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );
    const show = interpolate(
      t,
      [active.start, active.start + active.show],
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
          transform: `translateY(${(-gone * monoSize * 1.2).toFixed(2)}px)${glide(midway(gone))}`,
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
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: centerY - blockH / 2,
            opacity: enterIn,
            transform: `translateY(${((1 - enterIn) * F * 0.15).toFixed(2)}px) scale(${fit})${glide(restyled || (enterIn > 0 && enterIn < 1))}`,
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
                transform:
                  lineShift(li) !== 0
                    ? `translateY(${lineShift(li)}px)`
                    : undefined,
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
      </ScaleLayer>
    </AbsoluteFill>
  );
}
