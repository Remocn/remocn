"use client";

import { loadVariableFont } from "@remotion/google-fonts/Urbanist";
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

const urbanist = loadVariableFont("normal", { subsets: ["latin"] });

export interface ChurnCountProps {
  value?: number;
  from?: number;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0B0B0B", ink: "#FFFFFF", blue: "#2F6BFF" },
  light: { bg: "#FFFFFF", ink: "#0A0A0A", blue: "#1F4FE0" },
} as const;

const W_THIN = 100;
const W_FULL = 600;
const RECOVER = 13;
const COUNT_AT = 8;
const COUNT_END = 84;
const LABEL_AT = 3;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.3, 0.1, 0.05, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  slot: number;
  comma: number;
  baseline: number;
  cap: number;
}

function measure(): Metrics {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  let slot = 0.62;
  let comma = 0.26;
  let baseline = 0.8;
  let cap = 0.7;
  if (ctx) {
    let maxW = 0;
    for (const w of [W_THIN, 300, W_FULL]) {
      ctx.font = `${w} 200px "${urbanist.fontFamily}"`;
      for (const d of "0123456789") {
        maxW = Math.max(maxW, ctx.measureText(d).width / 200);
      }
    }
    slot = maxW;
    ctx.font = `${W_FULL} 200px "${urbanist.fontFamily}"`;
    comma = ctx.measureText(",").width / 200;
    const fm = ctx.measureText("0");
    const asc = fm.fontBoundingBoxAscent / 200;
    const desc = fm.fontBoundingBoxDescent / 200;
    baseline = (1 - (asc + desc)) / 2 + asc;
    cap = fm.actualBoundingBoxAscent / 200;
  }
  return { slot, comma, baseline, cap };
}

function useMetrics() {
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("churn-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      urbanist.waitUntilDone(),
      document.fonts.load(`${W_THIN} 100px "${urbanist.fontFamily}"`),
      document.fonts.load(`${W_FULL} 100px "${urbanist.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setM(measure());
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return m;
}

function mix(a: string, b: string, k: number) {
  const p = (h: string, i: number) => Number.parseInt(h.slice(i, i + 2), 16);
  const c = [1, 3, 5].map((i) =>
    Math.round(p(a, i) + (p(b, i) - p(a, i)) * k)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${c.join("")}`;
}

function normalizeHex(c: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  return null;
}

export function ChurnCount({
  value = 72960,
  from = 0,
  label = "frames played back live, straight from your props",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: ChurnCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const blue = normalizeHex(accent ?? "") ?? c.blue;
  const m = useMetrics();

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const target = Math.max(0, Math.round(value));
  const start = Math.max(0, Math.min(target, Math.round(from)));

  const countAt = useMemo(
    () => (f: number) => {
      const g = interpolate(f, [COUNT_AT, COUNT_END], [0, 1], {
        ...CLAMP,
        easing: EASE_COUNT,
      });
      return Math.round(start + (target - start) * g);
    },
    [start, target],
  );

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);

  const finalText = target.toLocaleString("en-US");
  const finalDigits = finalText.replace(/,/g, "").length;
  const finalCommas = finalText.length - finalDigits;
  const unitW = finalDigits * m.slot + finalCommas * m.comma;

  const marginR = W * (portrait ? 0.07 : 0.055);
  const marginB = H * (portrait ? 0.08 : 0.07);
  const maxW = W * (portrait ? 0.86 : 0.72);
  const maxInk = H * (portrait ? 0.24 : 0.52);
  const F = Math.min(maxW / unitW, maxInk / m.cap);
  const baseY = H - marginB;
  const right = W - marginR;
  const figLeft = right - unitW * F;

  const current = countAt(t);
  const text = current.toLocaleString("en-US");
  const chars = Array.from(text);

  const placeOf: number[] = [];
  let p = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === ",") placeOf[i] = -1;
    else placeOf[i] = p++;
  }

  const recency = (place: number) => {
    const pow = 10 ** place;
    const f0 = Math.floor(t);
    const digitAt = (f: number) => Math.floor(countAt(f) / pow) % 10;
    const now = digitAt(f0);
    for (let k = 0; k <= RECOVER; k++) {
      const f = f0 - k;
      if (f < COUNT_AT) return 1;
      if (digitAt(f - 1) !== now) {
        return Math.min(1, (t - f) / RECOVER);
      }
    }
    return 1;
  };

  const nodes: React.ReactNode[] = [];
  let x = right;
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    const isComma = ch === ",";
    const w = (isComma ? m.comma : m.slot) * F;
    x -= w;
    let weight = W_FULL;
    let color: string = c.ink;
    if (!isComma) {
      const r = EASE_OUT(recency(placeOf[i]));
      weight = W_THIN + (W_FULL - W_THIN) * r;
      color = mix(blue, c.ink, r);
    } else {
      const nextPlace = placeOf[i + 1] ?? 0;
      const r = EASE_OUT(recency(nextPlace + 1));
      weight = W_THIN + (W_FULL - W_THIN) * r;
      color = mix(blue, c.ink, r);
    }
    nodes.push(
      <span
        key={`${chars.length - i}`}
        style={{
          position: "absolute",
          left: x,
          top: baseY - m.baseline * F,
          width: w,
          height: F,
          lineHeight: `${F}px`,
          textAlign: "center",
          fontSize: F,
          fontVariationSettings: `"wght" ${weight.toFixed(1)}`,
          color,
        }}
      >
        {ch}
      </span>,
    );
  }

  const enter = interpolate(t, [0, 10], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelFs = (portrait ? 48 : 40) * s;
  const labelLeft = portrait ? W * 0.07 : figLeft + F * 0.04;
  const labelW = portrait ? W * 0.86 : Math.min(W * 0.4, unitW * F * 0.62);
  const labelBottom = H - (baseY - m.cap * F) + labelFs * 1.1;

  return (
    <AbsoluteFill
      style={{
        background: stage,
        overflow: "hidden",
        fontFamily: urbanist.fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: enter,
          fontVariantNumeric: "lining-nums",
          letterSpacing: 0,
          whiteSpace: "pre",
        }}
      >
        {nodes}
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: labelLeft,
            bottom: labelBottom,
            width: labelW,
            fontSize: labelFs,
            fontWeight: 400,
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            textWrap: "balance",
            color: blue,
            opacity: labelP,
            transform: `translateY(${((1 - labelP) * labelFs * 0.5).toFixed(2)}px)`,
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
