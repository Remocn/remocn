"use client";

import { loadFont } from "@remotion/google-fonts/Gabarito";
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

const gabarito = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface TheyAreYouProps {
  facts?: string[];
  from?: string;
  to?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#3B1E6E", ink: "#FFFFFF", accent: "#FF7A6B" },
  light: { bg: "#EDE7FB", ink: "#3B1E6E", accent: "#D9483A" },
} as const;

const REST_W = 400;
const PRO_W = 500;
const TRACK = -0.025;
const FONT_PX = 200;
const LH = 1.16;
const FACT_GAP = 0.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Parsed {
  hasPro: boolean;
  rest: string;
}

function parse(fact: string, from: string): Parsed {
  if (from && fact.startsWith(from)) {
    const next = fact.charAt(from.length);
    if (!/[A-Za-z]/.test(next)) {
      return { hasPro: true, rest: fact.slice(from.length) };
    }
  }
  return { hasPro: false, rest: fact };
}

interface Metrics {
  from: number;
  to: number;
  width: (s: string) => number;
  asc: number;
  desc: number;
}

function measure(texts: string[], from: string, to: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("they-are-you: no 2d context");
  ctx.font = `${PRO_W} ${FONT_PX}px "${gabarito.fontFamily}"`;
  const em = (s: string) =>
    ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  const wFrom = em(from);
  const wTo = em(to);
  ctx.font = `${REST_W} ${FONT_PX}px "${gabarito.fontFamily}"`;
  const cache: Record<string, number> = {};
  for (const s of texts) cache[s] = em(s);
  const fm = ctx.measureText("Hxg");
  return {
    from: wFrom,
    to: wTo,
    width: (s: string) => {
      if (cache[s] === undefined) cache[s] = em(s);
      return cache[s];
    },
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(facts: string[], from: string, to: string) {
  const key = [from, to, ...facts].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("they-are-you: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      gabarito.waitUntilDone(),
      document.fonts.load(`${REST_W} 100px "${gabarito.fontFamily}"`),
      document.fonts.load(`${PRO_W} 100px "${gabarito.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [f, tt, ...rest] = key.split("\u0001");
        setState({ key, m: measure(rest, f, tt) });
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

function wrap(
  rest: string,
  indent: number,
  room: number,
  width: (s: string) => number,
): string[] {
  const words = rest.split(" ");
  const lines: string[] = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const cand = `${cur} ${words[i]}`;
    const avail = lines.length === 0 ? room - indent : room;
    if (cur.trim() !== "" && width(cand) > avail) {
      lines.push(cur);
      cur = words[i];
    } else {
      cur = cand;
    }
  }
  lines.push(cur);
  return lines;
}

export function TheyAreYou({
  facts = [
    "They write React for a living.",
    "They have a launch on Monday.",
    "They’ve never touched a timeline.",
  ],
  from = "They",
  to = "You",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: TheyAreYouProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const t = frame * speed;
  const D = Math.max(100, durationInFrames);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const list = facts.length > 0 ? facts : [`${from} build things.`];
  const parsed = list.map((f) => parse(f, from));
  const m = useMetrics(
    parsed.map((p) => p.rest),
    from,
    to,
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.075);
  const room = W - marginX * 2;
  const proW = Math.max(m.from, m.to);
  const single = parsed.map((p) =>
    p.hasPro ? proW + m.width(p.rest) : m.width(p.rest),
  );
  const widest = Math.max(0.1, ...single);
  const fMax = portrait ? W * 0.13 : H * 0.115;
  const fMin = portrait ? W * 0.12 : H * 0.075;
  let F = Math.max(fMin, Math.min(fMax, room / widest));
  let layout: string[][] = [];
  for (let pass = 0; pass < 6; pass++) {
    layout = parsed.map((p) =>
      wrap(p.rest, p.hasPro ? proW : 0, room / F, m.width),
    );
    const rows = layout.reduce((s, l) => s + l.length, 0);
    const total = (rows * LH + (layout.length - 1) * FACT_GAP) * F;
    if (total <= H * 0.8) break;
    F *= (H * 0.8) / total;
  }

  const rows = layout.reduce((s, l) => s + l.length, 0);
  const total = (rows * LH + (layout.length - 1) * FACT_GAP) * F;
  const blockTop = (H - total) / 2;
  const lineBox = F * LH;
  const textTop = (lineBox - F) / 2;

  const inStart = 4;
  const gapIn = Math.min(22, Math.max(12, (D * 0.3) / list.length));
  const lastIn = inStart + (list.length - 1) * gapIn;
  const flipStart = Math.max(lastIn + 26, D * 0.44);
  const flipStagger = 6;
  const flipLen = 11;

  const base: React.CSSProperties = {
    position: "absolute",
    height: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre",
    fontFamily: gabarito.fontFamily,
    fontSize: F,
    letterSpacing: `${TRACK}em`,
  };

  let shift = 0;
  layout.forEach((lines, k) => {
    if (k === 0) return;
    const e = interpolate(
      t,
      [inStart + k * gapIn - 2, inStart + k * gapIn + 12],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_IO,
      },
    );
    shift += ((1 - e) * (lines.length * LH + FACT_GAP) * F) / 2;
  });

  const nodes: React.ReactNode[] = [];
  let y = blockTop + shift;
  layout.forEach((lines, k) => {
    const p = parsed[k];
    const appear = inStart + k * gapIn;
    const flip = interpolate(
      t,
      [flipStart + k * flipStagger, flipStart + k * flipStagger + flipLen],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
    const out = interpolate(flip, [0, 0.48], [0, 1], CLAMP);
    const inn = interpolate(flip, [0.52, 1], [0, 1], CLAMP);
    const proNow = p.hasPro ? m.from + (m.to - m.from) * flip : 0;
    lines.forEach((ln, j) => {
      const rise = interpolate(
        t,
        [appear + j * 3, appear + j * 3 + 16],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_OUT,
        },
      );
      const offset = (1 - rise) * lineBox;
      const lineX = marginX + (j === 0 ? proNow * F : 0);
      nodes.push(
        <div
          key={`l${k}-${j}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: y,
            height: lineBox,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              ...base,
              left: lineX,
              top: textTop + offset,
              fontWeight: REST_W,
              color: c.ink,
            }}
          >
            {ln}
          </div>
          {j === 0 && p.hasPro && flip <= 0 ? (
            <div
              style={{
                ...base,
                left: marginX,
                top: textTop + offset,
                fontWeight: PRO_W,
                color: c.ink,
              }}
            >
              {from}
            </div>
          ) : null}
        </div>,
      );
      if (j === 0 && p.hasPro && flip > 0) {
        nodes.push(
          <div
            key={`p${k}-from`}
            style={{
              ...base,
              left: marginX,
              top: y + textTop - out * F * 0.32,
              fontWeight: PRO_W,
              color: c.ink,
              opacity: 1 - out,
            }}
          >
            {from}
          </div>,
          <div
            key={`p${k}-to`}
            style={{
              ...base,
              left: marginX,
              top: y + textTop + (1 - inn) * F * 0.32,
              fontWeight: PRO_W,
              color: hi,
              opacity: inn,
            }}
          >
            {to}
          </div>,
        );
      }
      y += lineBox;
    });
    y += FACT_GAP * F;
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
