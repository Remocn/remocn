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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type CarryCountElementId,
  COL_GAP,
  carryCountTimeline,
  carryPlan,
  DEFAULT_FROM,
  DEFAULT_LABEL,
  DEFAULT_VALUE,
  labelLines,
} from "./timeline";

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
  /** Text color of the number and label; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the number and label. Load it yourself; Nunito by default. */
  fontFamily?: string;
  /** Weight of the number and label. */
  fontWeight?: number;
  /** Thousands separator in the number. */
  separator?: string;
  /** Size of the number and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the fade-in, the label lines and each
   * addition step, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<CarryCountElementId>;
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

function measure(
  lines: string[],
  fontFamily: string,
  fontWeight: number,
  separator: string,
): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("carry-count: no 2d context");
  const fam = `"${fontFamily}"`;
  ctx.font = `${fontWeight} ${FONT_PX}px ${fam}`;
  const digit: number[] = [];
  for (let d = 0; d < 10; d++) {
    digit.push(ctx.measureText(String(d)).width / FONT_PX);
  }
  const slot = Math.max(...digit) + TRACK;
  const comma = ctx.measureText(separator).width / FONT_PX + TRACK;
  const cap = ctx.measureText("0").actualBoundingBoxAscent / FONT_PX;
  ctx.font = `${fontWeight} ${FONT_PX}px ${fam}`;
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

function useMetrics(
  lines: string[],
  fontFamily: string,
  fontWeight: number,
  separator: string,
) {
  const key = lines.join("\n");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("carry-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      nunito.waitUntilDone(),
      document.fonts.load(`${fontWeight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(key.split("\n"), fontFamily, fontWeight, separator));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily, fontWeight, separator]);
  return metrics;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

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

function impact(u: number) {
  if (u < 0) return 0;
  return Math.exp(-u / 3.2) * Math.cos(u * 0.62);
}

export function CarryCount(props: CarryCountProps) {
  const {
    value = DEFAULT_VALUE,
    from = DEFAULT_FROM,
    steps = 5,
    label = DEFAULT_LABEL,
    accent,
    ink,
    background,
    fontFamily = nunito.fontFamily,
    fontWeight = 500,
    separator = ",",
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const tAt = (f: number) => Math.max(0, f - delay) * speed;
  const t = tAt(frame);
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    carryCountTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const introEl = tl.get("intro");
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const disc = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const lines = useMemo(() => labelLines(label), [label]);
  const m = useMetrics(lines, fontFamily, fontWeight, separator);
  const p = useMemo(() => {
    const plan = carryPlan(Math.min(from, value), Math.max(from, value), steps);
    // A step stretched by `timing` ripples through its columns as much
    // slower; without it the pace is exactly 1.
    const stepEls = plan.stepAt.map((_, s) => tl.get(`step:${s}`));
    const atOf = (step: number, off: number) =>
      stepEls[step].start + off * (stepEls[step].beat("ripple") / COL_GAP);
    return {
      start: plan.start,
      cols: plan.cols,
      changes: plan.changes.map((ch) => ({
        col: ch.col,
        at: atOf(ch.step, ch.off),
        digit: ch.digit,
      })),
      carries: plan.carries.map((k) => {
        const at = atOf(k.step, k.off);
        return { col: k.col, at, land: atOf(k.step, k.off + k.gap) };
      }),
    };
  }, [from, value, steps, tl]);

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

  const digitAt = (i: number, tt = t) => {
    let d: number | null = i < p.start.length ? p.start[i] : null;
    let last = -1e9;
    for (const ch of p.changes) {
      if (ch.col === i && ch.at <= tt) {
        d = ch.digit;
        last = ch.at;
      }
    }
    return { d, last };
  };

  const intro = interpolate(t, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  /** A digit's squash at time `tt`, as the string it is rendered with. */
  const squashAt = (i: number, tt: number) => {
    const { last } = digitAt(i, tt);
    const born = i >= p.start.length ? last : -1e9;
    const grow =
      born > -1e8
        ? interpolate(tt - born, [0, 7], [0.55, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          })
        : 1;
    const q = impact(tt - last);
    const sy = (1 - 0.16 * q) * grow;
    const sx = (1 + 0.1 * q) * grow;
    return { grow, str: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})` };
  };

  const glyphs: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    const { d } = digitAt(i);
    if (d === null) continue;
    const { grow, str } = squashAt(i, t);
    // The impact rings out slowly; it moves for as long as the rendered
    // squash differs from a neighbouring frame's.
    const ringing =
      squashAt(i, tAt(frame - 1)).str !== str ||
      squashAt(i, tAt(frame + 1)).str !== str;
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
          fontFamily,
          fontWeight,
          color: fg,
          whiteSpace: "pre",
          transform: `${str}${glide(ringing)}`,
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
            fontFamily,
            fontWeight,
            color: fg,
            whiteSpace: "pre",
            opacity: intro * grow,
          }}
        >
          {separator}
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
    // Laid out where the disc lands; the flight there is a transform, since
    // layout rounds a box and its "1" to whole pixels and they'd click along.
    const yLand = capTop + D * 0.15;
    carryNodes.push(
      <div
        key={`k${k.col}-${k.at}`}
        style={{
          position: "absolute",
          left: x1 - D / 2,
          top: yLand - D / 2,
          width: D,
          height: D,
          borderRadius: D,
          background: disc,
          color: c.carryInk,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily,
          fontWeight,
          fontSize: D * 0.72,
          lineHeight: 1,
          transform: `translate(${(x1 - x0) * (a - 1)}px, ${y - yLand}px) scale(${s.toFixed(3)})${glide(true)}`,
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
    const lineEl = tl.get(`line:${k}`);
    const lp = interpolate(t, [lineEl.start, lineEl.end], [0, 1], {
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
            fontFamily,
            fontWeight,
            fontSize: L,
            lineHeight: `${L * 1.45}px`,
            letterSpacing: `${LABEL_TRACK}em`,
            color: fg,
            whiteSpace: "pre",
            transform: `translateY(${((1 - lp) * L * 1.3).toFixed(2)}px)${glide(midway(lp))}`,
          }}
        >
          {line}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {glyphs}
        {carryNodes}
        {labelNodes}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
