"use client";

import { loadFont } from "@remotion/google-fonts/RedHatDisplay";
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

const redHat = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface NonstopProps {
  label?: string;
  from?: number;
  unit?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#B84A26", ink: "#FFF1E0", accent: "#8FD3FF" },
  light: { bg: "#FFF1E0", ink: "#B84A26", accent: "#1B4F72" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const FONT_PX = 200;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const IN = 4;
const FIRST_STEP = 34;
const STEP = 20;
const ROLL = 10;
const ZERO_HOLD = 26;
const SHRINK = 14;
const BOARD_GAP = 6;
const CLOSE_GAP = 26;
const CLOSE = 13;

type Token = { id: string; ch: string };

interface StateLayout {
  x: Record<string, number>;
  width: number;
}

interface Metrics {
  states: StateLayout[];
  adv: Record<string, number>;
  asc: number;
  desc: number;
  fig: number;
  xh: number;
}

function buildStates(from: number, unit: string): Token[][] {
  const stem = unit.endsWith("s") ? unit.slice(0, -1) : unit;
  const stemTokens = Array.from(stem).map((ch, i) => ({ id: `u${i}`, ch }));
  const states: Token[][] = [];
  for (let v = from; v >= 0; v--) {
    const row: Token[] = [
      { id: "d", ch: String(v) },
      { id: "sp", ch: " " },
      ...stemTokens,
    ];
    if (v !== 1) row.push({ id: "pl", ch: "s" });
    states.push(row);
  }
  states.push([
    { id: "N", ch: "N" },
    { id: "d", ch: "o" },
    { id: "sp", ch: " " },
    ...stemTokens,
    { id: "pl", ch: "s" },
  ]);
  states.push([
    { id: "N", ch: "N" },
    { id: "d", ch: "o" },
    { id: "n", ch: "n" },
    ...stemTokens,
    { id: "dot", ch: "." },
  ]);
  return states;
}

function measureStates(states: Token[][]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("nonstop: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${redHat.fontFamily}"`;
  const em = (s: string) =>
    ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  const adv: Record<string, number> = {};
  const layouts = states.map((row) => {
    const x: Record<string, number> = {};
    let prefix = "";
    for (const tk of row) {
      x[tk.id] = em(prefix);
      prefix += tk.ch;
      adv[tk.ch] = em(tk.ch);
    }
    return { x, width: em(prefix) };
  });
  const fm = ctx.measureText("Hxg");
  const zero = ctx.measureText("0");
  const o = ctx.measureText("o");
  return {
    states: layouts,
    adv,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    fig: zero.actualBoundingBoxAscent / FONT_PX,
    xh: o.actualBoundingBoxAscent / FONT_PX,
  };
}

function useMetrics(states: Token[][], label: string) {
  const key = `${label}\u0002${states.map((r) => r.map((tk) => `${tk.id}=${tk.ch}`).join("\u0001")).join("\u0003")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("nonstop: measuring"));
  const released = useRef(false);
  const statesRef = useRef(states);
  statesRef.current = states;
  useEffect(() => {
    let live = true;
    Promise.all([
      redHat.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${redHat.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureStates(statesRef.current) });
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

export function Nonstop({
  label = "From idea to export",
  from = 3,
  unit = "stops",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: NonstopProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const start = Math.max(1, Math.min(9, Math.round(from)));
  const states = buildStates(start, unit);
  const m = useMetrics(states, label);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const countSteps = start;
  const stepAt = (k: number) => FIRST_STEP + (k - 1) * STEP;
  const zeroAt = stepAt(countSteps);
  const shrinkAt = zeroAt + ROLL + ZERO_HOLD;
  const boardAt = shrinkAt + BOARD_GAP;
  const closeAt = boardAt + SHRINK + CLOSE_GAP;
  const changeAt = [
    ...Array.from({ length: countSteps }, (_, i) => stepAt(i + 1)),
    shrinkAt,
    closeAt,
  ];
  const durOf = (k: number) =>
    k < countSteps ? ROLL : k === countSteps ? SHRINK + 4 : CLOSE;

  let cur = 0;
  let mix = 0;
  for (let k = 0; k < changeAt.length; k++) {
    if (t >= changeAt[k]) {
      cur = k;
      mix = interpolate(t, [changeAt[k], changeAt[k] + durOf(k)], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
    }
  }
  const before = t < changeAt[0];
  const prevIdx = before ? 0 : cur;
  const nextIdx = before ? 0 : cur + 1;
  const p = before ? 0 : mix;

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.07);
  const measureW = W - marginX * 2;
  const widest = Math.max(...m.states.map((s) => s.width), 0.1);
  const F = Math.min(H * (portrait ? 0.16 : 0.37), measureW / widest);
  const right = W - marginX;
  const base = H * (portrait ? 0.56 : 0.66);
  const boxTop = base - ((1 - m.asc - m.desc) / 2 + m.asc) * F;
  const L = Math.max(16, F * 0.17);

  const lineIn = interpolate(t, [IN, IN + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const A = m.states[prevIdx];
  const B = m.states[nextIdx];
  const leftA = right - A.width * F;
  const leftB = right - B.width * F;
  const rowA = states[prevIdx];
  const rowB = states[nextIdx];
  const idsA = new Set(rowA.map((tk) => tk.id));
  const idsB = new Set(rowB.map((tk) => tk.id));
  const shrinking = prevIdx === countSteps;

  const glyph = (
    key: string,
    ch: string,
    x: number,
    dy: number,
    opacity: number,
    color: string,
    extra?: React.CSSProperties,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: boxTop,
        height: F,
        lineHeight: `${F}px`,
        whiteSpace: "pre",
        fontFamily: redHat.fontFamily,
        fontWeight: WGHT,
        fontSize: F,
        letterSpacing: `${TRACK}em`,
        color,
        opacity,
        transform: `translateY(${dy.toFixed(2)}px)`,
        ...extra,
      }}
    >
      {ch}
    </div>
  );

  const nodes: React.ReactNode[] = [];
  const rise = F * 1.3;
  const ids = new Set([...idsA, ...idsB]);
  for (const id of ids) {
    const ta = rowA.find((tk) => tk.id === id);
    const tb = rowB.find((tk) => tk.id === id);
    const color = id === "d" || id === "dot" ? hi : c.ink;
    if (ta && tb) {
      const xa = leftA + A.x[id] * F;
      const xb = leftB + B.x[id] * F;
      const x = xa + (xb - xa) * p;
      if (ta.ch === tb.ch) {
        if (id === "sp") continue;
        nodes.push(glyph(id, ta.ch, x, 0, 1, color));
      } else if (shrinking && id === "d") {
        const zeroW = m.adv[ta.ch];
        const oW = m.adv[tb.ch];
        const sy = 1 + (m.xh / m.fig - 1) * p;
        const sx = 1 + (oW / zeroW - 1) * p;
        const swap = interpolate(p, [0.82, 1], [0, 1], CLAMP);
        nodes.push(
          glyph(`${id}-a`, ta.ch, x, 0, 1 - swap, color, {
            transformOrigin: `${((zeroW * F) / 2).toFixed(2)}px ${(base - boxTop).toFixed(2)}px`,
            transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
          }),
        );
        if (swap > 0) nodes.push(glyph(`${id}-b`, tb.ch, x, 0, swap, color));
      } else {
        const out = interpolate(p, [0, 0.45], [0, 1], {
          ...CLAMP,
          easing: Easing.bezier(0.55, 0, 1, 0.45),
        });
        const inn = interpolate(p, [0.4, 1], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const travel = (m.fig + 0.12) * F;
        nodes.push(
          <div
            key={`${id}-clip`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: base - (m.fig + 0.05) * F,
              height: (m.fig + 0.1) * F,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                top: -(base - (m.fig + 0.05) * F),
              }}
            >
              {out < 1
                ? glyph(`${id}-a`, ta.ch, x, -travel * out, 1, color)
                : null}
              {inn > 0
                ? glyph(`${id}-b`, tb.ch, x, travel * (1 - inn), 1, color)
                : null}
            </div>
          </div>,
        );
      }
    } else if (ta) {
      if (ta.ch === " ") continue;
      const x = leftA + A.x[id] * F;
      nodes.push(glyph(`${id}-a`, ta.ch, x, -rise * p, 1 - p, color));
    } else if (tb) {
      if (tb.ch === " ") continue;
      const x = leftB + B.x[id] * F;
      let q = p;
      if (id === "N") {
        q = interpolate(t, [boardAt, boardAt + SHRINK], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
      }
      nodes.push(glyph(`${id}-b`, tb.ch, x, rise * (1 - q), q, color));
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          right: marginX,
          top: base - F * 0.98 - L * 1.5,
          fontFamily: redHat.fontFamily,
          fontWeight: 400,
          fontSize: L,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: c.ink,
          whiteSpace: "pre",
          opacity: lineIn,
          transform: `translateY(${((1 - lineIn) * L * 0.8).toFixed(2)}px)`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(${(base - F * 0.98).toFixed(1)}px 0 ${(H - base - F * 0.3).toFixed(1)}px 0)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${((1 - lineIn) * F * 1.3).toFixed(2)}px)`,
          }}
        >
          {nodes}
        </div>
      </div>
    </AbsoluteFill>
  );
}
