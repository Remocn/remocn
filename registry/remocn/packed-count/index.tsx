"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const figtree = loadFigtree("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface PackedCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const SKY = "#1185FE";

const THEMES = {
  dark: { bg: "#0B0F14", ink: "#F5F8FA" },
  light: { bg: "#FFFFFF", ink: "#0B0F14" },
} as const;
const TIGHT = -0.03;
const FONT_PX = 400;

const RISE_AT = 0;
const RISE_LEN = 16;
const RISE_GAP = 3;
const LABEL_AT = 10;
const COUNT_AT = 18;
const COUNT_LEN = 64;
const FILL_AT = 80;
const FILL_LEN = 20;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_COUNT = Easing.bezier(0.42, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Slot {
  ch: string;
  index: number;
  kind: "digit" | "sep" | "fix";
  place: number;
}

function group(n: number) {
  const s = String(Math.max(0, Math.floor(n)));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const fromEnd = s.length - i;
    if (i > 0 && fromEnd % 3 === 0) out += ",";
    out += s[i];
  }
  return out;
}

function buildSlots(value: number, prefix: string, suffix: string): Slot[] {
  const body = Array.from(group(value));
  const slots: Slot[] = [];
  Array.from(prefix).forEach((ch) => {
    slots.push({ ch, index: slots.length, kind: "fix", place: -1 });
  });
  let digitsRight = body.filter((c) => c !== ",").length;
  for (const ch of body) {
    if (ch === ",") {
      slots.push({ ch, index: slots.length, kind: "sep", place: digitsRight });
    } else {
      digitsRight--;
      slots.push({
        ch,
        index: slots.length,
        kind: "digit",
        place: digitsRight,
      });
    }
  }
  Array.from(suffix).forEach((ch) => {
    slots.push({ ch, index: slots.length, kind: "fix", place: -1 });
  });
  return slots;
}

interface Metrics {
  cell: number;
  adv: Record<string, number>;
  cap: number;
  asc: number;
  desc: number;
  label: number;
}

function measure(slots: Slot[], label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("packed-count: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${figtree.fontFamily}"`;
  let cell = 0;
  for (const d of "0123456789") {
    cell = Math.max(cell, ctx.measureText(d).width / FONT_PX);
  }
  const adv: Record<string, number> = {};
  for (const s of slots) {
    if (s.kind !== "digit") adv[s.ch] = ctx.measureText(s.ch).width / FONT_PX;
  }
  const zm = ctx.measureText("0");
  const cap = zm.actualBoundingBoxAscent / FONT_PX;
  const asc = zm.fontBoundingBoxAscent / FONT_PX;
  const desc = zm.fontBoundingBoxDescent / FONT_PX;
  return {
    cell,
    adv,
    cap,
    asc,
    desc,
    label: label ? ctx.measureText(label).width / FONT_PX : 0,
  };
}

function useMetrics(slots: Slot[], label: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("packed-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      figtree.waitUntilDone(),
      document.fonts.load(`500 100px "${figtree.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(slots, label));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [slots, label, handle]);
  return metrics;
}

export function PackedCount({
  value = 41900,
  from = 120,
  prefix = "",
  suffix = "",
  label = "replays on a single launch clip",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PackedCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const sky = accent ?? SKY;

  const target = Math.max(1, Math.floor(Math.abs(value)));
  const start = Math.min(target, Math.max(1, Math.floor(Math.abs(from))));
  const slots = useMemo(
    () => buildSlots(target, prefix, suffix),
    [target, prefix, suffix],
  );
  const m = useMetrics(slots, label);

  const logA = Math.log(start);
  const logB = Math.log(target);
  const countAt = (frame: number) => {
    const p = interpolate(frame, [COUNT_AT, COUNT_AT + COUNT_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_COUNT,
    });
    if (p >= 1) return target;
    const v = Math.floor(Math.exp(logA + (logB - logA) * p) + 1e-6);
    return Math.min(target, Math.max(start, v));
  };
  const joinAt = useMemo(() => {
    const startDigits = String(start).length;
    const out: number[] = [];
    const maxPlace = String(target).length;
    for (let place = 0; place < maxPlace; place++) {
      if (place < startDigits) {
        out.push(Number.NEGATIVE_INFINITY);
        continue;
      }
      const need = 10 ** place;
      let f = COUNT_AT;
      while (f < COUNT_AT + COUNT_LEN) {
        const p = interpolate(f, [COUNT_AT, COUNT_AT + COUNT_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_COUNT,
        });
        if (Math.exp(logA + (logB - logA) * p) >= need) break;
        f += 0.25;
      }
      out.push(f);
    }
    return out;
  }, [start, target, logA, logB]);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const margin = Math.min(W, H) * 0.065;
  const advOf = (s: Slot) => (s.kind === "digit" ? m.cell : m.adv[s.ch]);
  const finalSum = slots.reduce((a, s) => a + advOf(s), 0);
  const finalSpan = finalSum + TIGHT * (slots.length - 1);
  const F = Math.min(H * 0.56, (W - margin * 2) / finalSpan);
  const span = finalSpan * F;
  const left = margin;

  const presence = slots.map((s) => {
    if (s.kind === "fix") return 1;
    const at = joinAt[s.place] + (s.kind === "sep" ? 3 : 0);
    if (!Number.isFinite(at)) return 1;
    return spring({
      frame: t - at,
      fps,
      config: {
        damping: 22,
        stiffness: 150,
        mass: 0.8,
        overshootClamping: true,
      },
    });
  });

  let sumAdv = 0;
  let count = 0;
  slots.forEach((s, i) => {
    sumAdv += presence[i] * advOf(s) * F;
    count += presence[i];
  });
  const gap = count > 1 ? (span - sumAdv) / (count - 1) : 0;

  const xs: number[] = [];
  let cursor = left;
  slots.forEach((s, i) => {
    const p = presence[i];
    const a = advOf(s) * F;
    xs.push(cursor - (1 - p) * a);
    cursor += p * (a + gap);
  });

  const shown = group(countAt(t));
  const shownDigits = Array.from(shown).filter((ch) => ch !== ",");
  const digitSlots = slots.filter((s) => s.kind === "digit");

  const baseY = H - margin - m.desc * F * 0.35;
  const lineTop = baseY - (m.asc + (1 - m.asc - m.desc) / 2) * F;
  const maskTop = baseY - m.cap * F - F * 0.12;
  const maskH = m.cap * F + F * 0.3;

  const labelSize = label
    ? Math.min(H * 0.064, W * 0.06, ((W - margin * 2) * 0.9) / m.label)
    : 0;

  const fillStep = slots.length > 1 ? 10 / (slots.length - 1) : 0;
  const firstPresent = slots.findIndex((_, i) => presence[i] > 0.999);
  const glyphs: React.ReactNode[] = [];
  slots.forEach((s, i) => {
    const p = presence[i];
    if (p <= 0.001) return;
    let ch = s.ch;
    if (s.kind === "digit") {
      const k = digitSlots.length - 1 - s.place;
      const fromRight = shownDigits.length - 1 - s.place;
      ch = fromRight >= 0 ? shownDigits[fromRight] : digitSlots[k].ch;
    }
    const opening = s.kind === "fix" || !Number.isFinite(joinAt[s.place]);
    const order = Math.max(0, i - Math.max(0, firstPresent));
    const intro = opening
      ? interpolate(
          t,
          [RISE_AT + order * RISE_GAP, RISE_AT + order * RISE_GAP + RISE_LEN],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        )
      : 1;
    const opacity = interpolate(p, [0, 0.55], [0, 1], CLAMP);
    const fillP = interpolate(
      t,
      [FILL_AT + i * fillStep, FILL_AT + i * fillStep + FILL_LEN],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
    const w = advOf(s) * F;
    const style: React.CSSProperties = {
      position: "absolute",
      left: xs[i],
      top: lineTop - maskTop + (1 - intro) * maskH * 1.05,
      width: w,
      textAlign: "center",
      fontFamily: figtree.fontFamily,
      fontWeight: 500,
      fontSize: F,
      height: F * 1.3,
      lineHeight: `${F}px`,
      whiteSpace: "pre",
      opacity,
      color: c.ink,
    };
    glyphs.push(
      <div key={`s${s.index}`} style={style}>
        {ch}
      </div>,
    );
    if (fillP > 0) {
      glyphs.push(
        <div
          key={`f${s.index}`}
          style={{ ...style, opacity: opacity * fillP, color: sky }}
        >
          {ch}
        </div>,
      );
    }
  });

  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: margin,
            top: margin - labelSize * 0.1,
            height: labelSize * 1.3,
            overflow: "hidden",
            fontFamily: figtree.fontFamily,
            fontWeight: 500,
            fontSize: labelSize,
            lineHeight: `${labelSize * 1.2}px`,
            letterSpacing: "-0.015em",
            color: c.ink,
            whiteSpace: "pre",
          }}
        >
          <div
            style={{
              transform: `translateY(${((1 - labelP) * labelSize * 1.3).toFixed(2)}px)`,
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
          height: maskH,
          overflow: "hidden",
        }}
      >
        {glyphs}
      </div>
    </AbsoluteFill>
  );
}
