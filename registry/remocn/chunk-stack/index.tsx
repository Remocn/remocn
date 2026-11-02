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
  weights: ["500"],
  subsets: ["latin"],
});

export interface ChunkStackProps {
  text?: string;
  highlight?: string;
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
    pillInk: "#133A24",
  },
  light: {
    bg: "#FFD23F",
    ink: "#133A24",
    accent: "#FFFFFF",
    pillInk: "#133A24",
  },
} as const;

const FONT_PX = 200;
const TRACK = -0.025;
const LEAD = 0.98;
const RISE_LEN = 16;
const OPEN_AT = 26;
const OPEN_GAP = 3;
const OPEN_LEN = 14;
const DROP_AT = 50;
const DROP_GAP = 4;
const DROP_LEN = 22;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  run: number[];
  runW: number;
  words: number[];
  space: number;
  asc: number;
  desc: number;
  xh: number;
}

function measure(words: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("chunk-stack: no 2d context");
  ctx.font = `500 ${FONT_PX}px "${nunito.fontFamily}"`;
  const w = (s: string) =>
    ctx.measureText(s).width / FONT_PX +
    TRACK * Math.max(0, Array.from(s).length - 1);
  const run: number[] = [];
  let prefix = "";
  for (const word of words) {
    run.push(prefix ? w(prefix) + TRACK : 0);
    prefix += word;
  }
  const fm = ctx.measureText("Hg");
  return {
    run,
    runW: w(prefix),
    words: words.map(w),
    space: ctx.measureText(" ").width / FONT_PX,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    xh: ctx.measureText("x").actualBoundingBoxAscent / FONT_PX,
  };
}

function useMetrics(words: string[]) {
  const key = words.join(" ");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("chunk-stack: measuring"));
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
        setMetrics(measure(key.split(" ")));
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

function impact(u: number) {
  if (u < 0) return 0;
  return Math.exp(-u / 3.4) * Math.cos(u * 0.6);
}

export function ChunkStack({
  text = "learn motion by making it",
  highlight = "making",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: ChunkStackProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const pill = accent ?? c.accent;
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const m = useMetrics(words);

  if (!m || words.length === 0) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const n = words.length;
  const gapOpen = m.space * 1.35;
  const spacedW = m.runW + gapOpen * (n - 1);
  const openAll = interpolate(
    t,
    [OPEN_AT, OPEN_AT + (n - 2) * OPEN_GAP + OPEN_LEN],
    [0, 1],
    { ...CLAMP, easing: EASE_IN_OUT },
  );
  const lineSize = Math.min(
    (W * 0.9) / (m.runW + (spacedW - m.runW) * openAll),
    H * 0.2,
  );
  const maxWord = Math.max(...m.words);
  const stackSize = Math.min(
    (W * 0.82) / maxWord,
    (H * 0.84) / (LEAD * (n - 1) + m.xh + 0.32),
    H * 0.3,
  );
  const R = Math.max(lineSize, stackSize);
  const lh = R * 1.4;
  const bo = (lh - (m.asc + m.desc) * R) / 2 + m.asc * R;

  const lineBase = H / 2 + (m.xh * lineSize) / 2;
  const stackH = (LEAD * (n - 1) + m.xh) * stackSize;
  const stackTop = (H - stackH) / 2 + m.xh * stackSize;

  const rise = interpolate(t, [0, RISE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const opens = Array.from({ length: n }, (_, k) =>
    k === 0
      ? 0
      : interpolate(
          t,
          [
            OPEN_AT + (k - 1) * OPEN_GAP,
            OPEN_AT + (k - 1) * OPEN_GAP + OPEN_LEN,
          ],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        ),
  );
  let shift = 0;
  const lineX: number[] = [];
  for (let k = 0; k < n; k++) {
    shift += opens[k] * gapOpen;
    lineX.push(m.run[k] + shift);
  }
  const curW = m.runW + shift;
  const lineLeft = (W - curW * lineSize) / 2;

  const hlIndex = words.findIndex(
    (w) =>
      w.replace(/[^\p{L}\p{N}]/gu, "") ===
      highlight.replace(/[^\p{L}\p{N}]/gu, ""),
  );

  const nodes: React.ReactNode[] = [];
  let pillNode: React.ReactNode = null;
  for (let k = 0; k < n; k++) {
    const start = DROP_AT + k * DROP_GAP;
    const dv = interpolate(t, [DROP_AT + k * 2, DROP_AT + k * 2 + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    const d = interpolate(t, [start + 6, start + DROP_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    const x0 = lineLeft + lineX[k] * lineSize + (m.words[k] * lineSize) / 2;
    const y0 = lineBase;
    const x1 = W / 2;
    const y1 = stackTop + k * LEAD * stackSize;
    const size = lineSize + (stackSize - lineSize) * d;
    const cx = x0 + (x1 - x0) * d;
    const by = y0 + (y1 - y0) * dv;
    const q = impact(t - start - DROP_LEN);
    const sx = 1 + 0.08 * q;
    const sy = 1 - 0.12 * q;
    const s = size / R;
    const wpx = m.words[k] * R;
    const risePx = (1 - rise) * lineSize * 1.3;

    if (k === hlIndex) {
      const pp = interpolate(
        t,
        [start + DROP_LEN - 2, start + DROP_LEN + 10],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      if (pp > 0) {
        const padX = 0.2 * stackSize;
        const pw = m.words[k] * stackSize + padX * 2;
        const ph = (m.xh + 0.62) * stackSize;
        const top = y1 - (m.xh + 0.3) * stackSize;
        pillNode = (
          <div
            key="pill"
            style={{
              position: "absolute",
              left: x1 - pw / 2,
              top,
              width: pw,
              height: ph,
              borderRadius: ph * 0.34,
              background: pill,
              opacity: pp,
              transform: `scale(${(0.9 + 0.1 * pp) * sx}, ${(0.7 + 0.3 * pp) * sy})`,
              transformOrigin: `50% ${((m.xh + 0.3) * stackSize).toFixed(1)}px`,
            }}
          />
        );
      }
    }

    const hlOn =
      k === hlIndex
        ? interpolate(
            t,
            [start + DROP_LEN - 1, start + DROP_LEN + 6],
            [0, 1],
            CLAMP,
          )
        : 0;
    nodes.push(
      <div
        key={`w${k}`}
        style={{
          position: "absolute",
          left: cx - wpx / 2,
          top: by - bo + risePx,
          width: wpx,
          height: lh,
          fontFamily: nunito.fontFamily,
          fontWeight: 500,
          fontSize: R,
          lineHeight: `${lh}px`,
          letterSpacing: `${TRACK}em`,
          whiteSpace: "pre",
          color: hlOn > 0.5 ? c.pillInk : c.ink,
          transform: `scale(${(s * sx).toFixed(4)}, ${(s * sy).toFixed(4)})`,
          transformOrigin: `50% ${bo.toFixed(1)}px`,
        }}
      >
        {words[k]}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath:
            t < RISE_LEN
              ? `inset(0 0 ${(H - lineBase - m.desc * lineSize * 0.9).toFixed(1)}px 0)`
              : undefined,
        }}
      >
        {pillNode}
        {nodes}
      </div>
    </AbsoluteFill>
  );
}
