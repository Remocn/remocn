"use client";

import { loadFont } from "@remotion/google-fonts/Nunito";
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

const nunito = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CarryCountProps {
  value?: number;
  from?: number;
  steps?: number;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#133A24",
    ink: "#EAF7EC",
    accent: "#FFD23F",
    carryInk: "#133A24",
  },
  light: {
    bg: "#FFD23F",
    ink: "#133A24",
    accent: "#FFFFFF",
    carryInk: "#133A24",
  },
} as const;

const FONT_PX = 200;
const TRACK = -0.02;
const LABEL_TRACK = -0.01;
const START = 16;
const STEP_LENS = [26, 20, 16, 14, 13, 12, 12, 12];
const COL_GAP = 5;
const NEW_COL_GAP = 3;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.9, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  slot: number;
  digit: number[];
  comma: number;
  cap: number;
  labelW: number[];
  labelCap: number;
  labelDesc: number;
  asc: number;
  desc: number;
}

function measure(lines: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("carry-count: no 2d context");
  const fam = `"${nunito.fontFamily}"`;
  ctx.font = `500 ${FONT_PX}px ${fam}`;
  const digit: number[] = [];
  for (let d = 0; d < 10; d++) {
    digit.push(ctx.measureText(String(d)).width / FONT_PX);
  }
  const slot = Math.max(...digit) + TRACK;
  const comma = ctx.measureText(",").width / FONT_PX + TRACK;
  const cap = ctx.measureText("0").actualBoundingBoxAscent / FONT_PX;
  ctx.font = `500 ${FONT_PX}px ${fam}`;
  const labelW = lines.map(
    (l) =>
      ctx.measureText(l).width / FONT_PX +
      LABEL_TRACK * Math.max(0, l.length - 1),
  );
  const lm = ctx.measureText("Hg");
  return {
    asc: lm.fontBoundingBoxAscent / FONT_PX,
    desc: lm.fontBoundingBoxDescent / FONT_PX,
    slot,
    digit,
    comma,
    cap,
    labelW,
    labelCap: ctx.measureText("H").actualBoundingBoxAscent / FONT_PX,
    labelDesc: lm.actualBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(lines: string[]) {
  const key = lines.join("\n");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("carry-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      nunito.waitUntilDone(),
      document.fonts.load(`500 100px "${nunito.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(key.split("\n")));
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

function digitsOf(n: number) {
  return Array.from(String(Math.max(0, Math.round(n))))
    .reverse()
    .map(Number);
}

interface Change {
  col: number;
  at: number;
  digit: number;
}

interface Carry {
  col: number;
  at: number;
  land: number;
}

function plan(from: number, value: number, steps: number) {
  const n = Math.max(1, Math.round(steps));
  const changes: Change[] = [];
  const carries: Carry[] = [];
  let cur = digitsOf(from);
  let at = START;
  for (let s = 0; s < n; s++) {
    const target = Math.round(from + ((value - from) * (s + 1)) / n);
    const prev = Math.round(from + ((value - from) * s) / n);
    const add = digitsOf(Math.max(0, target - prev));
    const next: number[] = [];
    let carry = 0;
    let time = at;
    const len = Math.max(cur.length, add.length);
    for (let i = 0; i < len || carry > 0; i++) {
      const sum = (cur[i] ?? 0) + (add[i] ?? 0) + carry;
      const d = sum % 10;
      next.push(d);
      if (d !== cur[i] || i >= cur.length) {
        changes.push({ col: i, at: time, digit: d });
      }
      carry = sum >= 10 ? 1 : 0;
      const gap = i + 1 >= len ? NEW_COL_GAP : COL_GAP;
      if (carry) carries.push({ col: i, at: time, land: time + gap });
      time += gap;
    }
    cur = next;
    at += STEP_LENS[Math.min(s, STEP_LENS.length - 1)];
  }
  const end = changes.reduce((m, c) => Math.max(m, c.at), START);
  return { start: digitsOf(from), changes, carries, cols: cur.length, end };
}

function impact(u: number) {
  if (u < 0) return 0;
  return Math.exp(-u / 3.2) * Math.cos(u * 0.62);
}

export function CarryCount({
  value = 13580,
  from = 2855,
  steps = 5,
  label = "scenes students\nbuilt in week one",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: CarryCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const disc = accent ?? c.accent;
  const lines = useMemo(
    () =>
      label
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [label],
  );
  const m = useMetrics(lines);
  const p = useMemo(
    () => plan(Math.min(from, value), Math.max(from, value), steps),
    [from, value, steps],
  );

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const cols = p.cols;
  const commaAfter = (i: number) => i > 0 && i % 3 === 0;
  const offsets: number[] = [];
  let run = 0;
  for (let i = 0; i < cols; i++) {
    if (commaAfter(i)) run += m.comma;
    run += m.slot;
    offsets.push(run);
  }
  const numW = run;
  const labelW = Math.max(0, ...m.labelW);
  const portrait = H > W;
  const LR = 0.25;
  const lead = 1.12;
  const labelBlock =
    lines.length > 0 ? (lines.length - 1) * lead + m.labelCap : 0;

  let F: number;
  let numLeft: number;
  let base: number;
  let labelLeft: number;
  let labelBase: number;
  if (portrait) {
    F = Math.min((W * 0.86) / numW, H * 0.2);
    const L = F * LR * 1.25;
    const gapV = F * 0.34;
    const blockH = F * m.cap * 1.5 + gapV + labelBlock * L;
    const top = (H - blockH) / 2 + F * m.cap * 0.5;
    base = top + F * m.cap;
    numLeft = (W - numW * F) / 2;
    labelLeft = numLeft;
    labelBase = base + gapV + m.labelCap * L;
  } else {
    const gapH = 0.12;
    F = Math.min((W * 0.86) / (numW + gapH + labelW * LR), H * 0.4);
    const total = (numW + (lines.length ? gapH + labelW * LR : 0)) * F;
    numLeft = (W - total) / 2;
    base = H / 2 + (F * m.cap * 1.42) / 2;
    labelLeft = numLeft + (numW + gapH) * F;
    labelBase = base - (lines.length - 1) * lead * F * LR;
  }
  const L = portrait ? F * LR * 1.25 : F * LR;
  const right = numLeft + numW * F;
  const colX = (i: number) => right - offsets[i] * F;
  const capTop = base - m.cap * F;
  const bo = (size: number, lh: number) =>
    (lh - (m.asc + m.desc) * size) / 2 + m.asc * size;
  const digitTop = base - bo(F, F);

  const digitAt = (i: number) => {
    let d: number | null = i < p.start.length ? p.start[i] : null;
    let last = -1e9;
    for (const ch of p.changes) {
      if (ch.col === i && ch.at <= t) {
        d = ch.digit;
        last = ch.at;
      }
    }
    return { d, last };
  };

  const intro = interpolate(t, [0, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const glyphs: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    const { d, last } = digitAt(i);
    if (d === null) continue;
    const born = i >= p.start.length ? last : -1e9;
    const grow =
      born > -1e8
        ? interpolate(t - born, [0, 7], [0.55, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          })
        : 1;
    const q = impact(t - last);
    const sy = (1 - 0.16 * q) * grow;
    const sx = (1 + 0.1 * q) * grow;
    const x = colX(i);
    const w = m.digit[d] * F;
    glyphs.push(
      <div
        key={`d${i}`}
        style={{
          position: "absolute",
          left: x + (m.slot * F - w) / 2,
          top: digitTop,
          height: F,
          fontSize: F,
          lineHeight: `${F}px`,
          fontFamily: nunito.fontFamily,
          fontWeight: 500,
          color: c.ink,
          whiteSpace: "pre",
          transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
          transformOrigin: `50% ${bo(F, F).toFixed(1)}px`,
          opacity: intro,
        }}
      >
        {d}
      </div>,
    );
    if (commaAfter(i) && i < cols) {
      const cx = colX(i) + m.slot * F;
      glyphs.push(
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            left: cx,
            top: digitTop,
            height: F,
            fontSize: F,
            lineHeight: `${F}px`,
            fontFamily: nunito.fontFamily,
            fontWeight: 500,
            color: c.ink,
            whiteSpace: "pre",
            opacity: intro * grow,
          }}
        >
          ,
        </div>,
      );
    }
  }

  const D = F * 0.34;
  const carryNodes: React.ReactNode[] = [];
  for (const k of p.carries) {
    const span = k.land - k.at;
    const u = ((t - k.at) / span) * COL_GAP;
    if (u < 0 || u > COL_GAP + 1) continue;
    const x0 = colX(k.col) + (m.slot * F) / 2;
    const x1 = colX(k.col + 1) + (m.slot * F) / 2;
    const hoverY = capTop - D * 0.95;
    const startY = capTop + D * 0.2;
    const a = interpolate(u, [0, COL_GAP * 0.52], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const dropP = interpolate(u, [COL_GAP * 0.68, COL_GAP], [0, 1], {
      ...CLAMP,
      easing: EASE_IN,
    });
    const x = x0 + (x1 - x0) * a;
    const lift = Math.sin(a * Math.PI) * D * 0.55;
    const y =
      startY +
      (hoverY - startY) * a -
      lift +
      (capTop + D * 0.15 - hoverY) * dropP;
    const s =
      interpolate(u, [0, 1.6], [0.5, 1], { ...CLAMP, easing: EASE_OUT }) *
      (1 - 0.35 * dropP);
    const o = interpolate(u, [COL_GAP - 0.4, COL_GAP + 0.6], [1, 0], CLAMP);
    carryNodes.push(
      <div
        key={`k${k.col}-${k.at}`}
        style={{
          position: "absolute",
          left: x - D / 2,
          top: y - D / 2,
          width: D,
          height: D,
          borderRadius: D,
          background: disc,
          color: c.carryInk,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: nunito.fontFamily,
          fontWeight: 500,
          fontSize: D * 0.72,
          lineHeight: 1,
          transform: `scale(${s.toFixed(3)})`,
          opacity: o,
        }}
      >
        <span style={{ transform: `translateY(${(-D * 0.02).toFixed(2)}px)` }}>
          1
        </span>
      </div>,
    );
  }

  const labelNodes = lines.map((line, k) => {
    const lp = interpolate(t, [6 + k * 4, 26 + k * 4], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const yb = labelBase + k * lead * L;
    return (
      <div
        key={`l${k}`}
        style={{
          position: "absolute",
          left: labelLeft,
          top: yb - bo(L, L * 1.45),
          height: L * 1.45,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: nunito.fontFamily,
            fontWeight: 500,
            fontSize: L,
            lineHeight: `${L * 1.45}px`,
            letterSpacing: `${LABEL_TRACK}em`,
            color: c.ink,
            whiteSpace: "pre",
            transform: `translateY(${((1 - lp) * L * 1.3).toFixed(2)}px)`,
          }}
        >
          {line}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {glyphs}
      {carryNodes}
      {labelNodes}
    </AbsoluteFill>
  );
}
