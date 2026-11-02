"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
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

const geist = loadGeist("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface UncommentLineProps {
  lines?: string[];
  marker?: string;
  highlight?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { pink: "#F472B6", bg: "#14151A", ink: "#FBF0DF" },
  light: { pink: "#C2185B", bg: "#FBF0DF", ink: "#14151A" },
} as const;

const TRACK = -0.035;
const LEADING = 1.06;
const MARK_SCALE = 0.62;
const DIM = 0.28;

const RISE_LEN = 16;
const RISE_GAP = 4;
const OPEN_AT = 34;
const OPEN_GAP = 13;
const OPEN_LEN = 14;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  lines: number[];
  marker: number;
  cap: number;
  base: number;
  baseM: number;
}

const baseOf = (asc: number, desc: number) => (1 - (asc + desc)) / 2 + asc;

function measure(lines: string[], marker: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("uncomment-line: no 2d context");
  ctx.font = `500 100px "${geist.fontFamily}"`;
  const widths = lines.map(
    (s) =>
      ctx.measureText(s).width / 100 +
      TRACK * Math.max(0, Array.from(s).length - 1),
  );
  const hm = ctx.measureText("H");
  ctx.font = `400 100px "${geistMono.fontFamily}"`;
  const mm = ctx.measureText(marker);
  return {
    lines: widths,
    marker: mm.width / 100,
    cap: hm.actualBoundingBoxAscent / 100,
    base: baseOf(
      hm.fontBoundingBoxAscent / 100,
      hm.fontBoundingBoxDescent / 100,
    ),
    baseM: baseOf(
      mm.fontBoundingBoxAscent / 100,
      mm.fontBoundingBoxDescent / 100,
    ),
  };
}

function useMetrics(lines: string[], marker: string) {
  const key = [marker, ...lines].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("uncomment-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [mk, ...ls] = key.split("\u0001");
    Promise.all([
      geist.waitUntilDone(),
      geistMono.waitUntilDone(),
      document.fonts.load(`500 100px "${geist.fontFamily}"`),
      document.fonts.load(`400 100px "${geistMono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(ls, mk) });
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

export function UncommentLine({
  lines = ["Fork the scenes.", "Change anything.", "Own the cut."],
  marker = "// ",
  highlight = -1,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: UncommentLineProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.pink;
  const list = lines.length > 0 ? lines : [" "];
  const m = useMetrics(list, marker);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);
  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const hl = highlight < 0 ? list.length + highlight : highlight;
  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.085);
  const measureW = W - 2 * margin;
  const markEm = m.marker * MARK_SCALE;
  const widest = Math.max(...m.lines) + markEm;
  const F = Math.min(
    (H * (portrait ? 0.4 : 0.7)) / (list.length * LEADING),
    measureW / widest,
  );
  const lineH = F * LEADING;
  const blockH = lineH * (list.length - 1) + m.cap * F;
  const firstBase = (H - blockH) / 2 + m.cap * F;
  const M = F * MARK_SCALE;

  const nodes = list.map((line, i) => {
    const baseY = firstBase + i * lineH;
    const r = interpolate(t, [i * RISE_GAP, i * RISE_GAP + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const at = OPEN_AT + i * OPEN_GAP;
    const o = interpolate(t, [at, at + OPEN_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const lit = interpolate(t, [at + 2, at + OPEN_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const textLeft = margin + markEm * F * (1 - o);
    const h = F * 1.3;
    const top = baseY - F * 1.05;
    const drop = (1 - r) * h;
    const color = i === hl ? spot : c.ink;
    const markOpacity = 1 - interpolate(o, [0, 0.6], [0, 1], CLAMP);
    return (
      <div key={`l${i}`}>
        {markOpacity > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: margin - F * 0.05,
              top,
              width: markEm * F + F * 0.1,
              height: h,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: F * 0.05 - o * markEm * F * 0.6,
                top: F * 1.05 - m.baseM * M + drop,
                height: M,
                lineHeight: `${M}px`,
                fontFamily: geistMono.fontFamily,
                fontWeight: 400,
                fontSize: M,
                whiteSpace: "pre",
                color: spot,
                opacity: markOpacity,
              }}
            >
              {marker}
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: textLeft - F * 0.05,
            top,
            width: m.lines[i] * F + F * 0.2,
            height: h,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: F * 0.05,
              top: F * 1.05 - m.base * F + drop,
              height: F,
              lineHeight: `${F}px`,
              fontFamily: geist.fontFamily,
              fontWeight: 500,
              fontSize: F,
              letterSpacing: `${TRACK}em`,
              whiteSpace: "pre",
              color,
              opacity: DIM + (1 - DIM) * lit,
            }}
          >
            {line}
          </div>
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
