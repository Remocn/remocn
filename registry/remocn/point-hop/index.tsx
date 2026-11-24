"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  DEFAULT_PREFIXES,
  DEFAULT_UNIT,
  DEFAULT_VALUE,
  type Plan,
  type PointHopElementId,
  plan,
  pointHopTimeline,
  prefixesOf,
} from "./timeline";

const geist = loadGeist("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PointHopProps {
  value?: number;
  unit?: string;
  prefixes?: string[];
  label?: string;
  accent?: string;
  /** Color of the digits; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the digits and unit. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Frames for the point to hop over one digit. */
  hop?: number;
  /** Frames the number rests between prefix steps. */
  rest?: number;
  /** Size of the number and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches each digit's rise, the point, the unit, the
   * label and each prefix step, by the ids in `./timeline`. Frames on the
   * scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PointHopElementId>;
}

const THEMES = {
  dark: {
    pink: "#F472B6",
    bg: "#14151A",
    ink: "#FBF0DF",
    soft: "rgba(251,240,223,0.62)",
  },
  light: {
    pink: "#C2185B",
    bg: "#FBF0DF",
    ink: "#14151A",
    soft: "rgba(20,21,26,0.62)",
  },
} as const;

const TRACK = -0.02;
const UNIT_SCALE = 0.46;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const midway = (p: number) => p > 0 && p < 1;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  digit: number;
  point: number;
  cap: number;
  base: number;
  units: number[];
  label: number;
}

function measure(units: string[], label: string, fontFamily: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("point-hop: no 2d context");
  ctx.font = `500 100px "${fontFamily}"`;
  const w = (s: string) => ctx.measureText(s).width / 100;
  const digit = w("0000000000") / 10;
  const point = w(".");
  const unitW = units.map((u) => w(u) + TRACK * Math.max(0, u.length - 1));
  const m0 = ctx.measureText("0");
  const asc = m0.fontBoundingBoxAscent / 100;
  const desc = m0.fontBoundingBoxDescent / 100;
  ctx.font = `400 100px "${geistMono.fontFamily}"`;
  return {
    digit,
    point,
    cap: m0.actualBoundingBoxAscent / 100,
    base: (1 - (asc + desc)) / 2 + asc,
    units: unitW,
    label: label ? w(label) : 0,
  };
}

function useMetrics(units: string[], label: string, fontFamily: string) {
  const key = [...units, label, fontFamily].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("point-hop: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      geistMono.waitUntilDone(),
      document.fonts.load(`500 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${geistMono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const parts = key.split("\u0001");
        setState({
          key,
          m: measure(parts.slice(0, -2), parts.at(-2) ?? "", fontFamily),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.m : null;
}

type Step = ResolvedElement<PointHopElementId>;

const hopAt = (st: Step, h: number) => st.start + h * st.beat("hopEvery");

function stateAt(t: number, p: Plan, m: Metrics, steps: Step[]) {
  let q = p.start;
  let arc = 0;
  let land = 0;
  for (let k = 1; k <= p.steps; k++) {
    const st = steps[k - 1];
    for (let h = 0; h < 3; h++) {
      const a = hopAt(st, h);
      const raw = interpolate(t, [a, a + st.beat("hop")], [0, 1], CLAMP);
      const e = EASE_IO(raw);
      q += e;
      if (raw > 0 && raw < 1) arc = Math.sin(Math.PI * e);
      const after = t - (a + st.beat("hop"));
      if (after >= 0 && after < 5) land = Math.sin((after / 5) * Math.PI);
    }
  }
  const fold = p.digits.map((_, i) => {
    const k = p.foldAfter[i];
    if (k < 0) return 1;
    const st = steps[k - 1];
    const foldAt = st.start + st.beat("foldAt");
    return (
      1 -
      interpolate(t, [foldAt, foldAt + st.beat("fold")], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      })
    );
  });
  const last = steps[p.steps - 1];
  const lastFold = last ? last.start + last.beat("foldAt") : 0;
  const pointAlive =
    p.pointLeaves && last
      ? 1 -
        interpolate(t, [lastFold, lastFold + last.beat("fold")], [0, 1], {
          ...CLAMP,
          easing: EASE_IO,
        })
      : 1;
  let unitIdx = 0;
  let swap = 1;
  for (let k = 1; k <= p.steps; k++) {
    const st = steps[k - 1];
    const swapAt = st.start + st.beat("swapAt");
    const s = interpolate(t, [swapAt, swapAt + st.beat("swap")], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    if (s > 0) {
      unitIdx = k;
      swap = s;
    }
  }
  const Pw = (m.point + TRACK * 2) * pointAlive;
  const D = m.digit + TRACK;
  const prev = m.units[Math.max(0, unitIdx - 1)];
  const unitW = prev + (m.units[unitIdx] - prev) * swap;
  const xs: number[] = [];
  let run = 0;
  for (let i = 0; i < p.digits.length; i++) {
    const gap = Pw * interpolate(i - q + 1, [0, 1], [0, 1], CLAMP);
    xs.push(run + gap);
    run += D * fold[i];
  }
  const digitsW = run + Pw;
  const unitGap = 0.06;
  const totalEm = digitsW + unitGap + unitW * UNIT_SCALE;
  const qi = Math.min(Math.floor(q), p.digits.length);
  let pointX = 0;
  for (let i = 0; i < qi; i++) pointX += D * fold[i];
  if (qi < p.digits.length) pointX += D * fold[qi] * (q - qi);
  return {
    arc,
    land,
    fold,
    pointAlive,
    unitIdx,
    swap,
    xs,
    digitsW,
    unitGap,
    totalEm,
    pointX,
  };
}

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

export function PointHop(props: PointHopProps) {
  const {
    value = DEFAULT_VALUE,
    unit = DEFAULT_UNIT,
    prefixes = DEFAULT_PREFIXES,
    label = "scene refresh after a prop change",
    accent,
    ink,
    background,
    fontFamily = geist.fontFamily,
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
    pointHopTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const spot = accent ?? c.pink;
  const fg = ink ?? c.ink;
  const pre = prefixesOf(prefixes);
  const p = useMemo(() => plan(value, pre.length - 1), [value, pre.length]);
  const units = useMemo(
    () => pre.slice(0, p.steps + 1).map((x) => x + unit),
    [pre, p.steps, unit],
  );
  const m = useMetrics(units, label, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);
  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.085);
  const measureW = W - 2 * margin;
  const steps = tl.lane("Steps");
  const at = (tt: number) => stateAt(tt, p, m, steps);
  const s = at(t);
  const sPrev = at(t - speed);
  const sNext = at(t + speed);
  const fin = at(1e6);

  const maxF = H * (portrait ? 0.2 : 0.42);
  const fitF = (em: number) => Math.min(maxF, measureW / em);
  const F = fitF(s.totalEm);
  const Fend = fitF(fin.totalEm);

  const labelSize = label
    ? Math.min(H * (portrait ? 0.022 : 0.036), measureW / m.label)
    : 0;
  const capTop = margin + (label ? labelSize * 1.2 + Fend * 0.5 : Fend * 0.3);

  // The number refits its font size as digits fold away, and layout rounds
  // every baseline of a size that moves, so the whole row stepped unevenly.
  // The row is laid out once, at its final size, and scaled to the live one
  // about the cap line's left end, where every position below is anchored.
  // It stays that way at rest too: a row handed back to plain layout at `F`
  // would jump by the rounding. Once settled the scale is exactly 1.
  const refit =
    Math.max(
      Math.abs(fitF(sNext.totalEm) - F),
      Math.abs(F - fitF(sPrev.totalEm)),
    ) *
      s.totalEm >
    1e-3;
  const Fl = Fend;
  const fitK = Math.abs(F / Fl - 1) < 1e-9 ? 1 : F / Fl;

  const baseY = capTop + m.cap * Fl;
  const left = margin;

  const arcH = (m.cap + 0.3) * Fl;
  const maskTop = baseY - m.cap * Fl - arcH - Fl * 0.2;
  const maskBottom = baseY + Fl * 0.24;
  const glyphTop = (lift: number) => baseY - maskTop - m.base * Fl + lift;

  const riseAt = (e: Step, tt: number) =>
    interpolate(tt, [e.start, e.end], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const digitRise = (i: number) => tl.get(`digit:${i}`);
  const rise = (i: number) => riseAt(digitRise(i), t);
  const drop = (r: number) => (1 - r) * (maskBottom - maskTop);
  // Layout rounds a baseline to whole pixels, so the rises, the hops and the
  // unit swap travel by a transform from the resting `top`; the tilt rides on
  // it while it moves, unless the refit above already carries one.
  const moves = (f: (tt: number) => number) =>
    Math.abs(f(t + speed) - f(t)) > 1e-3 ||
    Math.abs(f(t) - f(t - speed)) > 1e-3;
  const lift = (dy: number, rest?: string, moving = false) => {
    const parts = [
      Math.abs(dy) < 1e-3 ? "" : `translateY(${dy}px)`,
      rest ?? "",
    ].filter(Boolean);
    const tilt = glide(moving && !refit);
    return parts.length || tilt ? `${parts.join(" ")}${tilt}` : undefined;
  };

  const text = {
    position: "absolute" as const,
    whiteSpace: "pre" as const,
    fontFamily,
    fontWeight: 500,
    fontFeatureSettings: '"tnum" 1, "lnum" 1',
  };

  const digitEls = p.digits.map((d, i) => {
    const f = s.fold[i];
    if (f <= 0.001) return null;
    return (
      <div
        key={`d${i}`}
        style={{
          ...text,
          left: left + s.xs[i] * Fl,
          top: glyphTop(0),
          fontSize: Fl,
          lineHeight: `${Fl}px`,
          color: fg,
          opacity: interpolate(f, [0, 0.7], [0, 1], CLAMP),
          transform: lift(
            drop(rise(i)),
            f < 1 ? `scaleX(${f.toFixed(4)})` : undefined,
            moves((tt) => drop(riseAt(digitRise(i), tt))),
          ),
          transformOrigin: "0% 50%",
        }}
      >
        {d}
      </div>
    );
  });

  // The point's drop, hop and squash as one function of time, so its tilt
  // can tell from the neighbouring frames whether anything of it moves.
  const pointAt = (tt: number, st: ReturnType<typeof stateAt>) => {
    const squash = 1 - 0.18 * st.land;
    return {
      dy: drop(riseAt(tl.get("point"), tt)) - st.arc * arcH,
      sx: 1 / squash,
      sy: squash,
      k: 0.5 + 0.5 * st.pointAlive,
    };
  };
  const pt = pointAt(t, s);
  const pointMoves = [
    pointAt(t - speed, sPrev),
    pointAt(t + speed, sNext),
  ].some(
    (o) =>
      Math.abs(o.dy - pt.dy) > 1e-3 ||
      Math.max(
        Math.abs(o.sx * o.k - pt.sx * pt.k),
        Math.abs(o.sy * o.k - pt.sy * pt.k),
      ) *
        Fl >
        1e-3,
  );
  const pointEl =
    s.pointAlive > 0.001 ? (
      <div
        style={{
          ...text,
          left: left + (s.pointX + TRACK * 0.5) * Fl,
          top: glyphTop(0),
          fontSize: Fl,
          lineHeight: `${Fl}px`,
          color: spot,
          opacity: s.pointAlive,
          // Rounded scales stepped the dot by a third of a pixel at a time;
          // they are exact while it moves and the same "1" at rest.
          transform: lift(
            pt.dy,
            pointMoves
              ? `scale(${pt.sx}, ${pt.sy}) scale(${pt.k})`
              : `scale(${pt.sx.toFixed(3)}, ${pt.sy.toFixed(3)}) scale(${pt.k.toFixed(3)})`,
            pointMoves,
          ),
          transformOrigin: `${(m.point * 50).toFixed(0)}% ${(m.base * 100).toFixed(0)}%`,
        }}
      >
        .
      </div>
    ) : null;

  const U = Fl * UNIT_SCALE;
  const unitLeft = left + (s.digitsW + s.unitGap) * Fl;
  const unitRiseAt = (tt: number) => riseAt(tl.get("unit"), tt);
  const unitRise = unitRiseAt(t);
  const unitLine = (
    str: string,
    k: number,
    y: number,
    o: number,
    moving: boolean,
  ) => (
    <div
      key={`u${k}`}
      style={{
        ...text,
        left: unitLeft,
        top: baseY - maskTop - m.base * U,
        fontSize: U,
        lineHeight: `${U}px`,
        letterSpacing: `${TRACK}em`,
        color: spot,
        opacity: o,
        transform: lift(y, undefined, moving),
      }}
    >
      {str}
    </div>
  );
  const unitDrop = (maskBottom - maskTop) * 0.5;
  const swapMoves =
    Math.max(Math.abs(sNext.swap - s.swap), Math.abs(s.swap - sPrev.swap)) *
      unitDrop >
    1e-3;
  const unitEls =
    s.unitIdx === 0 || s.swap >= 1
      ? [
          unitLine(
            units[s.unitIdx],
            s.unitIdx,
            drop(unitRise),
            1,
            moves((tt) => drop(unitRiseAt(tt))) || swapMoves,
          ),
        ]
      : [
          unitLine(
            units[s.unitIdx - 1],
            s.unitIdx - 1,
            s.swap * unitDrop,
            1 - s.swap,
            swapMoves,
          ),
          unitLine(
            units[s.unitIdx],
            s.unitIdx,
            (s.swap - 1) * unitDrop,
            s.swap,
            swapMoves,
          ),
        ];

  const labelEl = tl.get("label");
  const labelP = interpolate(t, [labelEl.start, labelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: margin,
              top: margin,
              height: labelSize * 1.3,
              overflow: "hidden",
              fontFamily: geistMono.fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: `${labelSize * 1.3}px`,
              color: c.soft,
              whiteSpace: "pre",
            }}
          >
            <div
              style={{
                transform: `translateY(${((1 - labelP) * labelSize * 1.4).toFixed(2)}px)${glide(midway(labelP))}`,
              }}
            >
              {label}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            // Widened by the inverse of the refit's scale, so its right edge
            // still clips at the frame's.
            width: fitK === 1 ? W : left + (W - left) / fitK,
            top: maskTop,
            height: maskBottom - maskTop,
            overflow: "hidden",
            transform: `scale(${fitK})${glide(refit)}`,
            transformOrigin: `${left}px ${capTop - maskTop}px`,
          }}
        >
          {digitEls}
          {pointEl}
          {unitEls}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
