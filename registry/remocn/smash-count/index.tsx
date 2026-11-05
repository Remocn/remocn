"use client";

import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
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

const rubik = loadRubik("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SmashCountProps {
  value?: number;
  from?: number;
  cuts?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const RED = "#E60012";

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF" },
  light: { bg: "#FFFFFF", ink: "#000000" },
} as const;

type Anchor = "c" | "tl" | "tr" | "bl" | "br";
const ROUTE: Anchor[] = ["c", "tr", "bl", "tl", "br", "c", "tr", "tl"];

const TRACK = -0.04;
const FIRST_GAP = 13;
const LAST_GAP = 6;
const PUNCH_LEN = 5;
const LAND_LEN = 12;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  widths: number[];
  cap: number;
  base: number;
  label: number;
}

function cutValues(from: number, value: number, cuts: number) {
  const n = Math.max(2, Math.min(cuts, Math.abs(value - from) + 1));
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const x = k / (n - 1);
    const e = 1 - (1 - x) ** 1.7;
    out.push(Math.round(from + (value - from) * e));
  }
  for (let k = 1; k < n; k++) {
    if (out[k] === out[k - 1]) out[k] = out[k - 1] + Math.sign(value - from);
  }
  out[n - 1] = value;
  return out;
}

function cutTimes(n: number) {
  const out = [0];
  for (let k = 1; k < n; k++) {
    const g =
      FIRST_GAP + (LAST_GAP - FIRST_GAP) * ((k - 1) / Math.max(1, n - 2));
    out.push(out[k - 1] + g);
  }
  return out.map((v) => Math.round(v));
}

function measure(texts: string[], label: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("smash-count: no 2d context");
  ctx.font = `500 100px "${rubik.fontFamily}"`;
  const widths = texts.map(
    (s) =>
      ctx.measureText(s).width / 100 +
      TRACK * Math.max(0, Array.from(s).length - 1),
  );
  const fm = ctx.measureText("0123456789");
  const asc = fm.fontBoundingBoxAscent / 100;
  const desc = fm.fontBoundingBoxDescent / 100;
  ctx.font = `400 100px "${rubik.fontFamily}"`;
  return {
    widths,
    cap: ctx.measureText("0").actualBoundingBoxAscent / 100,
    base: (1 - (asc + desc)) / 2 + asc,
    label: label ? ctx.measureText(label).width / 100 : 0,
  };
}

function useMetrics(texts: string[], label: string) {
  const key = [...texts, label].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("smash-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const parts = key.split("\u0001");
    Promise.all([
      rubik.waitUntilDone(),
      document.fonts.load(`500 100px "${rubik.fontFamily}"`),
      document.fonts.load(`400 100px "${rubik.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(parts.slice(0, -1), parts[parts.length - 1] ?? ""),
        });
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

function splitLabel(label: string) {
  const words = label.split(" ").filter(Boolean);
  if (words.length < 3) return [label];
  let best = 1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const d = Math.abs(a - b);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export function SmashCount({
  value = 64,
  from = 1,
  cuts = 6,
  prefix = "",
  suffix = "",
  label = "scenes, zero keyframes",
  accent = RED,
  background,
  speed = 1,
  theme = "dark",
}: SmashCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const values = useMemo(
    () => cutValues(Math.round(from), Math.round(value), Math.round(cuts)),
    [from, value, cuts],
  );
  const texts = useMemo(
    () => values.map((v) => `${prefix}${v.toLocaleString("en-US")}${suffix}`),
    [values, prefix, suffix],
  );
  const lines = useMemo(() => (label ? splitLabel(label) : []), [label]);
  const m = useMetrics(
    texts,
    lines.reduce((a, b) => (a.length > b.length ? a : b), ""),
  );

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const n = texts.length;
  const times = cutTimes(n);
  let k = 0;
  for (let i = 0; i < n; i++) if (t >= times[i]) k = i;
  const last = k === n - 1;
  const local = t - times[k];

  const margin = Math.min(W, H) * 0.07;
  const anchor: Anchor = last ? "bl" : ROUTE[k % ROUTE.length];
  const x = k / Math.max(1, n - 1);
  const capFrac = last
    ? portrait
      ? 0.34
      : 0.74
    : (portrait ? 0.12 : 0.24) + (portrait ? 0.14 : 0.3) * x ** 1.2;
  const F = Math.min(
    (capFrac * H) / m.cap,
    (W - 2 * margin) / Math.max(0.2, m.widths[k]),
  );
  const textW = m.widths[k] * F;
  const capPx = m.cap * F;

  const left =
    anchor === "c"
      ? (W - textW) / 2
      : anchor === "tl" || anchor === "bl"
        ? margin
        : W - margin - textW;
  const baseY =
    anchor === "c"
      ? (H + capPx) / 2
      : anchor === "tl" || anchor === "tr"
        ? margin + capPx
        : H - margin;

  const punch = last
    ? interpolate(local, [0, LAND_LEN], [1.05, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : interpolate(local, [0, PUNCH_LEN], [1.08, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
  const ox =
    anchor === "c" ? "50%" : anchor === "tl" || anchor === "bl" ? "0%" : "100%";
  const oy = `${(m.base * 100).toFixed(1)}%`;

  const labelFs = Math.min(
    H * (portrait ? 0.03 : 0.052),
    (W * (portrait ? 0.8 : 0.42)) / Math.max(0.1, m.label),
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left,
          top: baseY - m.base * F,
          height: F,
          lineHeight: `${F}px`,
          whiteSpace: "pre",
          fontFamily: rubik.fontFamily,
          fontWeight: 500,
          fontSize: F,
          letterSpacing: `${TRACK}em`,
          color: accent,
          transform: `scale(${punch.toFixed(4)})`,
          transformOrigin: `${ox} ${oy}`,
        }}
      >
        {texts[k]}
      </div>
      {last && lines.length > 0 ? (
        <div
          style={{
            position: "absolute",
            right: margin,
            top: margin - labelFs * 0.1,
            textAlign: "right",
            fontFamily: rubik.fontFamily,
            fontWeight: 400,
            fontSize: labelFs,
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
            whiteSpace: "pre",
            color: c.ink,
          }}
        >
          {lines.join("\n")}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
