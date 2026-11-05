"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const RISE_GAP = 1.6;
const RISE_LEN = 16;
const LABEL_AT = 6;
const FIRST_STEP = 34;
const HOP_LEN = 7;
const HOP_GAP = 1;
const SWAP_LEN = 12;
const FOLD_LEN = 14;
const STEP_REST = 12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Plan {
  digits: string[];
  start: number;
  steps: number;
  foldAfter: number[];
  pointLeaves: boolean;
}

function plan(value: number, maxSteps: number): Plan {
  const v = Math.max(0, Math.abs(value));
  let s = v.toFixed(12).replace(/0+$/, "");
  if (s.endsWith(".")) s = s.slice(0, -1);
  const [intPart, frac = ""] = s.split(".");
  let steps = 0;
  let scaled = v;
  while (scaled > 0 && scaled < 1 && steps < maxSteps) {
    scaled *= 1000;
    steps++;
  }
  const end = intPart.length + steps * 3;
  const digits = Array.from(intPart + frac);
  while (digits.length < end) digits.push("0");
  const foldAfter = digits.map(() => -1);
  for (let k = 1; k <= steps; k++) {
    const slot = intPart.length + k * 3;
    let i = 0;
    while (i < slot - 1 && digits[i] === "0") {
      if (foldAfter[i] < 0) foldAfter[i] = k;
      i++;
    }
  }
  return {
    digits,
    start: intPart.length,
    steps,
    foldAfter,
    pointLeaves: end >= digits.length && steps > 0,
  };
}

interface Metrics {
  digit: number;
  point: number;
  cap: number;
  base: number;
  units: number[];
  label: number;
}

function measure(units: string[], label: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("point-hop: no 2d context");
  ctx.font = `500 100px "${geist.fontFamily}"`;
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

function useMetrics(units: string[], label: string) {
  const key = [...units, label].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("point-hop: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      geistMono.waitUntilDone(),
      document.fonts.load(`500 100px "${geist.fontFamily}"`),
      document.fonts.load(`400 100px "${geistMono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const parts = key.split("\u0001");
        setState({ key, m: measure(parts.slice(0, -1), parts.at(-1) ?? "") });
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

function stepTimes(k: number) {
  const stepLen = 3 * (HOP_LEN + HOP_GAP) + FOLD_LEN + STEP_REST;
  const at = FIRST_STEP + (k - 1) * stepLen;
  const hopsEnd = at + 3 * (HOP_LEN + HOP_GAP) - HOP_GAP;
  return {
    at,
    hop: (h: number) => at + h * (HOP_LEN + HOP_GAP),
    swapAt: hopsEnd - 6,
    foldAt: hopsEnd - 2,
  };
}

function stateAt(t: number, p: Plan, m: Metrics) {
  let q = p.start;
  let arc = 0;
  let land = 0;
  for (let k = 1; k <= p.steps; k++) {
    const st = stepTimes(k);
    for (let h = 0; h < 3; h++) {
      const a = st.hop(h);
      const raw = interpolate(t, [a, a + HOP_LEN], [0, 1], CLAMP);
      const e = EASE_IO(raw);
      q += e;
      if (raw > 0 && raw < 1) arc = Math.sin(Math.PI * e);
      const after = t - (a + HOP_LEN);
      if (after >= 0 && after < 5) land = Math.sin((after / 5) * Math.PI);
    }
  }
  const fold = p.digits.map((_, i) => {
    const k = p.foldAfter[i];
    if (k < 0) return 1;
    const st = stepTimes(k);
    return (
      1 -
      interpolate(t, [st.foldAt, st.foldAt + FOLD_LEN], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      })
    );
  });
  const last = stepTimes(Math.max(1, p.steps));
  const pointAlive = p.pointLeaves
    ? 1 -
      interpolate(t, [last.foldAt, last.foldAt + FOLD_LEN], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      })
    : 1;
  let unitIdx = 0;
  let swap = 1;
  for (let k = 1; k <= p.steps; k++) {
    const st = stepTimes(k);
    const s = interpolate(t, [st.swapAt, st.swapAt + SWAP_LEN], [0, 1], {
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

export function PointHop({
  value = 0.0000342,
  unit = "s",
  prefixes = ["", "m", "µ", "n"],
  label = "scene refresh after a prop change",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PointHopProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.pink;
  const pre = prefixes.length > 0 ? prefixes : [""];
  const p = useMemo(() => plan(value, pre.length - 1), [value, pre.length]);
  const units = useMemo(
    () => pre.slice(0, p.steps + 1).map((x) => x + unit),
    [pre, p.steps, unit],
  );
  const m = useMetrics(units, label);

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
  const s = stateAt(t, p, m);
  const fin = stateAt(1e6, p, m);

  const maxF = H * (portrait ? 0.2 : 0.42);
  const fitF = (em: number) => Math.min(maxF, measureW / em);
  const F = fitF(s.totalEm);
  const Fend = fitF(fin.totalEm);

  const labelSize = label
    ? Math.min(H * (portrait ? 0.022 : 0.036), measureW / m.label)
    : 0;
  const capTop = margin + (label ? labelSize * 1.2 + Fend * 0.5 : Fend * 0.3);
  const baseY = capTop + m.cap * F;
  const left = margin;

  const arcH = (m.cap + 0.3) * F;
  const maskTop = baseY - m.cap * F - arcH - F * 0.2;
  const maskBottom = baseY + F * 0.24;
  const glyphTop = (lift: number) => baseY - maskTop - m.base * F + lift;

  const rise = (i: number) =>
    interpolate(t, [i * RISE_GAP, i * RISE_GAP + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const drop = (r: number) => (1 - r) * (maskBottom - maskTop);

  const text = {
    position: "absolute" as const,
    whiteSpace: "pre" as const,
    fontFamily: geist.fontFamily,
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
          left: left + s.xs[i] * F,
          top: glyphTop(drop(rise(i))),
          fontSize: F,
          lineHeight: `${F}px`,
          color: c.ink,
          opacity: interpolate(f, [0, 0.7], [0, 1], CLAMP),
          transform: f < 1 ? `scaleX(${f.toFixed(4)})` : undefined,
          transformOrigin: "0% 50%",
        }}
      >
        {d}
      </div>
    );
  });

  const squash = 1 - 0.18 * s.land;
  const pointEl =
    s.pointAlive > 0.001 ? (
      <div
        style={{
          ...text,
          left: left + (s.pointX + TRACK * 0.5) * F,
          top: glyphTop(drop(rise(p.start)) - s.arc * arcH),
          fontSize: F,
          lineHeight: `${F}px`,
          color: spot,
          opacity: s.pointAlive,
          transform: `scale(${(1 / squash).toFixed(3)}, ${squash.toFixed(3)}) scale(${(0.5 + 0.5 * s.pointAlive).toFixed(3)})`,
          transformOrigin: `${(m.point * 50).toFixed(0)}% ${(m.base * 100).toFixed(0)}%`,
        }}
      >
        .
      </div>
    ) : null;

  const U = F * UNIT_SCALE;
  const unitLeft = left + (s.digitsW + s.unitGap) * F;
  const unitRise = rise(p.digits.length + 1);
  const unitLine = (str: string, k: number, y: number, o: number) => (
    <div
      key={`u${k}`}
      style={{
        ...text,
        left: unitLeft,
        top: baseY - maskTop - m.base * U + y,
        fontSize: U,
        lineHeight: `${U}px`,
        letterSpacing: `${TRACK}em`,
        color: spot,
        opacity: o,
      }}
    >
      {str}
    </div>
  );
  const unitDrop = (maskBottom - maskTop) * 0.5;
  const unitEls =
    s.unitIdx === 0 || s.swap >= 1
      ? [unitLine(units[s.unitIdx], s.unitIdx, drop(unitRise), 1)]
      : [
          unitLine(
            units[s.unitIdx - 1],
            s.unitIdx - 1,
            s.swap * unitDrop,
            1 - s.swap,
          ),
          unitLine(
            units[s.unitIdx],
            s.unitIdx,
            (s.swap - 1) * unitDrop,
            s.swap,
          ),
        ];

  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
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
              transform: `translateY(${((1 - labelP) * labelSize * 1.4).toFixed(2)}px)`,
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
          width: W,
          top: maskTop,
          height: maskBottom - maskTop,
          overflow: "hidden",
        }}
      >
        {digitEls}
        {pointEl}
        {unitEls}
      </div>
    </AbsoluteFill>
  );
}
