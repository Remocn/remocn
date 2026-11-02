"use client";

import { loadFont as loadZenKaku } from "@remotion/google-fonts/ZenKakuGothicNew";
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

const kaku = loadZenKaku("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface RubyPressProps {
  before?: string;
  words?: string[];
  after?: string;
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const VERMILION = "#E03C31";

const THEMES = {
  dark: { bg: "#111111", ink: "#F5F1EA" },
  light: { bg: "#F5F1EA", ink: "#111111" },
} as const;

const TRACK = -0.02;
const RUBY = 0.4;
const RUBY_GAP = 0.1;

const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 3;
const FIRST_GLOSS = 28;
const GLOSS_IN = 12;
const GLOSS_WAIT = 12;
const PRESS = 22;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_PRESS = Easing.bezier(0.6, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  tokens: number[];
  slots: number[];
  slotDesc: number[];
  space: number;
  cap: number;
  base: number;
}

function measure(tokens: string[], slots: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ruby-press: no 2d context");
  ctx.font = `500 100px "${kaku.fontFamily}"`;
  const w = (s: string) =>
    ctx.measureText(s).width / 100 + TRACK * Math.max(0, s.length - 1);
  const h = ctx.measureText("H");
  const asc = h.fontBoundingBoxAscent / 100;
  const desc = h.fontBoundingBoxDescent / 100;
  return {
    tokens: tokens.map(w),
    slots: slots.map(w),
    slotDesc: slots.map((s) =>
      Math.max(0, ctx.measureText(s).actualBoundingBoxDescent / 100),
    ),
    space: ctx.measureText(" ").width / 100,
    cap: h.actualBoundingBoxAscent / 100,
    base: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(tokens: string[], slots: string[]) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("ruby-press: measuring"));
  const released = useRef(false);
  const key = JSON.stringify([tokens, slots]);
  useEffect(() => {
    let live = true;
    Promise.all([
      kaku.waitUntilDone(),
      document.fonts.load(`500 100px "${kaku.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [tk, sl] = JSON.parse(key) as [string[], string[]];
        setMetrics(measure(tk, sl));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return metrics;
}

interface Item {
  text: string;
  w: number;
  slot: boolean;
  hug: boolean;
}

export function RubyPress({
  before = "Subtitles for every market in",
  words = ["a fortnight", "a morning", "one render"],
  after = ".",
  hold = 14,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: RubyPressProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const red = accent ?? VERMILION;

  const slots = words.length ? words : [""];
  const beforeTokens = useMemo(
    () => before.split(/\s+/).filter(Boolean),
    [before],
  );
  const afterTokens = useMemo(
    () => after.split(/\s+/).filter(Boolean),
    [after],
  );
  const tokens = useMemo(
    () => [...beforeTokens, ...afterTokens],
    [beforeTokens, afterTokens],
  );
  const m = useMetrics(tokens, slots);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const swaps = slots.length - 1;
  const swapAt = (i: number) =>
    FIRST_GLOSS + i * (GLOSS_IN + GLOSS_WAIT + PRESS + hold);
  const pressAt = (i: number) => swapAt(i) + GLOSS_IN + GLOSS_WAIT;
  const pressP = (i: number) =>
    interpolate(t, [pressAt(i), pressAt(i) + PRESS], [0, 1], {
      ...CLAMP,
      easing: EASE_PRESS,
    });
  let landed = 0;
  while (landed < swaps && pressP(landed) >= 1) landed++;
  const active = landed < swaps;
  const p = active ? pressP(landed) : 0;
  const slotW = active
    ? m.slots[landed] + (m.slots[landed + 1] - m.slots[landed]) * p
    : m.slots[landed];

  const items: Item[] = [
    ...beforeTokens.map((s, i) => ({
      text: s,
      w: m.tokens[i],
      slot: false,
      hug: false,
    })),
    { text: "", w: 0, slot: true, hug: false },
    ...afterTokens.map((s, i) => ({
      text: s,
      w: m.tokens[beforeTokens.length + i],
      slot: false,
      hug: i === 0 && /^[.,;:!?…’”)]/.test(s),
    })),
  ];

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const heroX = portrait ? marginX : W * 0.38;
  const heroW = W - marginX - heroX;
  const leadX = marginX;
  const leadW = portrait ? W * 0.62 : heroX - marginX - W * 0.05;
  const maxSlot = Math.max(...m.slots);
  const afterW = afterTokens.reduce(
    (acc, _s, i) =>
      acc +
      m.tokens[beforeTokens.length + i] +
      (i === 0 && /^[.,;:!?…’”)]/.test(afterTokens[0]) ? 0 : m.space),
    0,
  );

  const F = Math.min(heroW / (maxSlot + afterW), H * (portrait ? 0.1 : 0.22));
  const wrap = (f: number) => {
    const lines: number[][] = [];
    let x = 0;
    beforeTokens.forEach((_s, i) => {
      const w = m.tokens[i] * f;
      if (lines.length === 0 || (x > 0 && x + m.space * f + w > leadW)) {
        lines.push([i]);
        x = w;
      } else {
        lines[lines.length - 1].push(i);
        x += m.space * f + w;
      }
    });
    return lines;
  };
  let f = Math.min(F * 0.34, H * (portrait ? 0.034 : 0.056));
  let lead = wrap(f);
  for (let k = 0; k < 24 && lead.length > 5; k++) {
    f *= 0.93;
    lead = wrap(f);
  }

  const r0 = RUBY * F;
  const leadPitch = f * 1.3;
  const heroBase = portrait ? H * 0.58 : H * 0.64;
  const leadBase0 = portrait
    ? H * 0.1 + m.cap * f
    : heroBase - m.cap * F - (RUBY + RUBY_GAP) * F + m.cap * f;

  const placed: { it: Item; x: number; base: number; sz: number; o: number }[] =
    [];
  lead.forEach((idx, li) => {
    let x = leadX;
    idx.forEach((i, k) => {
      if (k > 0) x += m.space * f;
      placed.push({
        it: items[i],
        x,
        base: leadBase0 + li * leadPitch,
        sz: f,
        o: placed.length,
      });
      x += m.tokens[i] * f;
    });
  });
  const heroItems = items.slice(beforeTokens.length);
  const heroWs = heroItems.map((it) => (it.slot ? slotW : it.w) * F);
  let hx = heroX;
  heroItems.forEach((it, k) => {
    if (k > 0 && !it.hug) hx += m.space * F;
    placed.push({ it, x: hx, base: heroBase, sz: F, o: placed.length + 1 });
    hx += heroWs[k];
  });

  const riseOf = (i: number) =>
    interpolate(
      t,
      [RISE_AT + i * RISE_GAP, RISE_AT + i * RISE_GAP + RISE_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );

  const textStyle = (size: number): React.CSSProperties => ({
    position: "absolute",
    fontFamily: kaku.fontFamily,
    fontWeight: 500,
    fontSize: size,
    lineHeight: `${size}px`,
    height: size * 1.4,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre",
  });

  const nodes: React.ReactNode[] = [];
  const overlay: React.ReactNode[] = [];
  placed.forEach((pl, k) => {
    const sz = pl.sz;
    const rise = riseOf(pl.o);
    const maskPad = sz * 0.34;
    const lineTop = pl.base - m.cap * sz - maskPad;
    const maskH = m.cap * sz + maskPad * 2;
    const dy = (1 - rise) * maskH;
    if (!pl.it.slot) {
      nodes.push(
        <div
          key={`w${k}`}
          style={{
            position: "absolute",
            left: 0,
            top: lineTop,
            width: W,
            height: maskH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              ...textStyle(sz),
              left: pl.x,
              top: pl.base - lineTop - m.base * sz + dy,
              color: c.ink,
            }}
          >
            {pl.it.text}
          </div>
        </div>,
      );
      return;
    }

    const slotX = pl.x;
    const oldIdx = landed;
    const oldW = m.slots[oldIdx] * F;
    const glossIdx = oldIdx + 1;
    const hasGloss = active && t >= swapAt(landed);
    let flat = 1;
    if (hasGloss) {
      const size = r0 + (F - r0) * p;
      const topBase = pl.base - m.cap * F - RUBY_GAP * F;
      const gBase = topBase + (pl.base - topBase) * p;
      const gIn = interpolate(
        t,
        [swapAt(landed), swapAt(landed) + GLOSS_IN],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const gW = m.slots[glossIdx] * size;
      const bottom = gBase + m.slotDesc[glossIdx] * size + F * 0.02;
      flat = Math.max(0, Math.min(1, (pl.base - bottom) / (m.cap * F)));
      overlay.push(
        <div
          key="gloss"
          style={{
            ...textStyle(size),
            left: slotX + (slotW * F - gW) / 2,
            top: gBase - m.base * size + (1 - gIn) * r0 * 0.6,
            opacity: gIn,
            color: red,
          }}
        >
          {slots[glossIdx]}
        </div>,
      );
    }
    if (flat > 0.001) {
      nodes.push(
        <div
          key="slot"
          style={{
            position: "absolute",
            left: 0,
            top: lineTop,
            width: W,
            height: maskH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              ...textStyle(F),
              left: slotX + (slotW * F - oldW) / 2,
              top: pl.base - lineTop - m.base * F + dy,
              transform: `scaleY(${flat.toFixed(4)})`,
              transformOrigin: `50% ${(m.base * F).toFixed(2)}px`,
              opacity: interpolate(flat, [0, 0.12], [0, 1], CLAMP),
              color: oldIdx === 0 ? c.ink : red,
            }}
          >
            {slots[oldIdx]}
          </div>
        </div>,
      );
    }
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {nodes}
      {overlay}
    </AbsoluteFill>
  );
}
