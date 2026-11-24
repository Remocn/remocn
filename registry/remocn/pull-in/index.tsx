"use client";

import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
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
  BRAKE,
  DEFAULT_PLACES,
  type PullInElementId,
  placesOf,
  pullInTimeline,
  SETTLE,
} from "./timeline";

const jakarta = loadJakarta("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PullInProps {
  lead?: string;
  places?: string[];
  hold?: number;
  /** Frames between letters of a word pulling in, like carriages of a train. */
  stagger?: number;
  /** Frames a word takes to brake from the right edge to its stop. */
  brake?: number;
  accent?: string;
  /** Text color of the passing words; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the copy. Load it yourself; Plus Jakarta Sans by default. */
  fontFamily?: string;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the lead and single places, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PullInElementId>;
}

const THEMES = {
  dark: {
    bg: "#0B1F33",
    ink: "#E8EEF2",
    muted: "#7F93A6",
    teal: "#00BFA5",
  },
  light: {
    bg: "#E8EEF2",
    ink: "#0B1F33",
    muted: "#5C7083",
    teal: "#00A08A",
  },
} as const;

const WGHT = 500;
const LEAD_WGHT = 400;
const TRACK = -0.028;
const WORD = 0.14;
const FONT_PX = 200;

const NOSE = 0.045;
const BUNCH = 0.93;
const FOLLOW = 1.3;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface WordMetrics {
  x: number[];
  adv: number[];
  width: number;
}

interface Metrics {
  places: WordMetrics[];
  lead: number;
  asc: number;
  desc: number;
  capTop: number;
}

const spaces = (s: string) => s.split(" ").length - 1;

function measureWord(ctx: CanvasRenderingContext2D, s: string): WordMetrics {
  const chars = Array.from(s);
  const x: number[] = [];
  let prefix = "";
  for (let i = 0; i < chars.length; i++) {
    x.push(
      ctx.measureText(prefix).width / FONT_PX +
        TRACK * i +
        WORD * spaces(prefix),
    );
    prefix += chars[i];
  }
  const width =
    ctx.measureText(s).width / FONT_PX +
    TRACK * Math.max(0, chars.length - 1) +
    WORD * spaces(s);
  const adv = chars.map(
    (_, i) => (i + 1 < chars.length ? x[i + 1] : width) - x[i],
  );
  return { x, adv, width };
}

function measure(places: string[], lead: string, family: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("pull-in: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${family}"`;
  const m = places.map((p) => measureWord(ctx, p));
  const fm = ctx.measureText("Hxg");
  const cap = ctx.measureText("H");
  ctx.font = `${LEAD_WGHT} ${FONT_PX}px "${family}"`;
  const leadW = lead
    ? ctx.measureText(lead).width / FONT_PX + WORD * spaces(lead)
    : 0;
  return {
    places: m,
    lead: leadW,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    capTop: cap.actualBoundingBoxAscent / FONT_PX,
  };
}

function useMetrics(places: string[], lead: string, family: string) {
  const key = [family, lead, ...places].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("pull-in: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [, l, ...p] = key.split("\u0001");
    Promise.all([
      jakarta.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(p, l, family) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, family]);
  return state && state.key === key ? state.m : null;
}

function arrival(tau: number, x0: number, nose: number, brake = BRAKE) {
  const v0 = (2 * x0) / brake;
  if (tau <= 0) return x0 - v0 * tau;
  if (tau < brake) {
    const u = 1 - tau / brake;
    return x0 * u * u - nose * Math.sin((Math.PI / 2) * (1 - u)) ** 3;
  }
  const k = (tau - brake) / SETTLE;
  if (k >= 1) return 0;
  return -nose * Math.cos((Math.PI / 2) * k) * (1 - k) ** 0.5;
}

function departure(tau: number) {
  if (tau <= 0) return 0;
  return 1.4 * tau * tau + 0.04 * tau * tau * tau;
}

const midway = (p: number) => p > 0 && p < 1;

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

export function PullIn(props: PullInProps) {
  const {
    lead = "Now in",
    places = DEFAULT_PLACES,
    accent,
    ink,
    background,
    fontFamily = jakarta.fontFamily,
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
    pullInTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const hi = accent ?? c.teal;
  const fg = ink ?? c.ink;
  const list = useMemo(() => placesOf(places), [places]);
  const m = useMetrics(list, lead, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.085);
  const measureW = W - marginX * 2;
  const widest = Math.max(...m.places.map((p) => p.width), 0.1);
  const F = Math.min(H * (portrait ? 0.16 : 0.34), measureW / widest);
  const L = lead
    ? Math.min(F * 0.5, (measureW * 0.9) / Math.max(0.1, m.lead))
    : 0;
  const leadGap = lead ? F * 0.16 : 0;

  const placeCap = m.capTop * F;
  const leadCap = m.capTop * L;
  const blockH = (lead ? leadCap + leadGap + F * 0.42 : 0) + placeCap;
  const blockTop = H / 2 - blockH / 2 - F * 0.04;
  const placeBase = blockTop + blockH;
  const leadBase = blockTop + leadCap;

  const x0 = W - marginX + F * 0.6;

  interface Glyph {
    k: number;
    i: number;
    ch: string;
    x: number;
  }
  const glyphs: Glyph[] = [];
  list.forEach((word, k) => {
    const chars = Array.from(word);
    const e = tl.get(`place:${k}`);
    const start = e.start;
    const stagger = e.beat("stagger");
    const brake = e.beat("brake");
    const leave = k === list.length - 1 ? null : e.end - e.beat("gap");
    if (t < start - chars.length * stagger - 30) return;
    if (leave !== null && t > leave + 40 + chars.length * stagger) return;
    chars.forEach((ch, i) => {
      let dx = arrival(t - start - i * stagger, x0, NOSE * F, brake);
      if (leave !== null) dx -= departure(t - leave - i * stagger);
      glyphs.push({ k, i, ch, x: marginX + m.places[k].x[i] * F + dx });
    });
  });
  for (let g = 1; g < glyphs.length; g++) {
    const prev = glyphs[g - 1];
    const cur = glyphs[g];
    const advPrev = m.places[prev.k].adv[prev.i] * F;
    const floor =
      prev.k === cur.k
        ? prev.x + advPrev * BUNCH
        : prev.x + advPrev + FOLLOW * F;
    if (cur.x < floor) cur.x = floor;
  }

  const letters: React.ReactNode[] = [];
  for (const { k, i, ch, x } of glyphs) {
    const wm = m.places[k];
    if (x > W + F || x + wm.adv[i] * F < -F) continue;
    const last = k === list.length - 1;
    letters.push(
      <div
        key={`p${k}-${i}`}
        style={{
          position: "absolute",
          left: x,
          top: placeBase - (m.asc + (1 - m.asc - m.desc) / 2) * F,
          height: F,
          lineHeight: `${F}px`,
          whiteSpace: "pre",
          fontFamily,
          fontWeight: WGHT,
          fontSize: F,
          color: last ? hi : fg,
        }}
      >
        {ch}
      </div>,
    );
  }

  const leadEl = tl.get("lead");
  const leadP = interpolate(t, [leadEl.start, leadEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
      }}
    >
      <ScaleLayer scale={scale}>
        {lead ? (
          <div
            style={{
              position: "absolute",
              left: marginX,
              top: leadBase - ((1.4 - m.asc - m.desc) / 2 + m.asc) * L,
              height: L * 1.4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: LEAD_WGHT,
                fontSize: L,
                lineHeight: `${L * 1.4}px`,
                height: L * 1.4,
                letterSpacing: "-0.02em",
                wordSpacing: `${WORD}em`,
                whiteSpace: "pre",
                color: c.muted,
                // Rounding the rise to 0.01px would add its own steps while it
                // moves; at rest it keeps the old `translateY(0.00px)`.
                transform: `translateY(${midway(leadP) ? (1 - leadP) * L * 1.2 : ((1 - leadP) * L * 1.2).toFixed(2)}px)${glide(midway(leadP))}`,
              }}
            >
              {lead}
            </div>
          </div>
        ) : null}
        {letters}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
