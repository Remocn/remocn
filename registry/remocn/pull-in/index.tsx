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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const jakarta = loadJakarta("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PullInProps {
  lead?: string;
  places?: string[];
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const HEADWAY = 1.25;
const BRAKE = 20;
const NOSE = 0.045;
const SETTLE = 12;
const BUNCH = 0.93;
const FOLLOW = 1.3;
const ARRIVE = BRAKE + SETTLE;
const DEPART_GAP = 9;
const LEAD_AT = 0;
const FIRST_AT = 4;

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

function measure(places: string[], lead: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("pull-in: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${jakarta.fontFamily}"`;
  const m = places.map((p) => measureWord(ctx, p));
  const fm = ctx.measureText("Hxg");
  const cap = ctx.measureText("H");
  ctx.font = `${LEAD_WGHT} ${FONT_PX}px "${jakarta.fontFamily}"`;
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

function useMetrics(places: string[], lead: string) {
  const key = [lead, ...places].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("pull-in: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [l, ...p] = key.split("\u0001");
    Promise.all([
      jakarta.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${jakarta.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(p, l) });
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

function arrival(tau: number, x0: number, nose: number) {
  const v0 = (2 * x0) / BRAKE;
  if (tau <= 0) return x0 - v0 * tau;
  if (tau < BRAKE) {
    const u = 1 - tau / BRAKE;
    return x0 * u * u - nose * Math.sin((Math.PI / 2) * (1 - u)) ** 3;
  }
  const k = (tau - BRAKE) / SETTLE;
  if (k >= 1) return 0;
  return -nose * Math.cos((Math.PI / 2) * k) * (1 - k) ** 0.5;
}

function departure(tau: number) {
  if (tau <= 0) return 0;
  return 1.4 * tau * tau + 0.04 * tau * tau * tau;
}

export function PullIn({
  lead = "Now in",
  places = ["vertical.", "4K.", "your codebase."],
  hold = 24,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PullInProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.teal;
  const list = useMemo(
    () => (places.length > 0 ? places : ["your codebase."]),
    [places],
  );
  const m = useMetrics(list, lead);

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

  const STEP = ARRIVE + Math.max(8, hold) + DEPART_GAP;
  const arriveAt = (k: number) => FIRST_AT + k * STEP;
  const departAt = (k: number) => arriveAt(k + 1) - DEPART_GAP;
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
    const start = arriveAt(k);
    const leave = k === list.length - 1 ? null : departAt(k);
    if (t < start - chars.length * HEADWAY - 30) return;
    if (leave !== null && t > leave + 40 + chars.length * HEADWAY) return;
    chars.forEach((ch, i) => {
      let dx = arrival(t - start - i * HEADWAY, x0, NOSE * F);
      if (leave !== null) dx -= departure(t - leave - i * HEADWAY);
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
          fontFamily: jakarta.fontFamily,
          fontWeight: WGHT,
          fontSize: F,
          color: last ? hi : c.ink,
        }}
      >
        {ch}
      </div>,
    );
  }

  const leadP = interpolate(t, [LEAD_AT, LEAD_AT + 16], [0, 1], {
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
              fontFamily: jakarta.fontFamily,
              fontWeight: LEAD_WGHT,
              fontSize: L,
              lineHeight: `${L * 1.4}px`,
              height: L * 1.4,
              letterSpacing: "-0.02em",
              wordSpacing: `${WORD}em`,
              whiteSpace: "pre",
              color: c.muted,
              transform: `translateY(${((1 - leadP) * L * 1.2).toFixed(2)}px)`,
            }}
          >
            {lead}
          </div>
        </div>
      ) : null}
      {letters}
    </AbsoluteFill>
  );
}
