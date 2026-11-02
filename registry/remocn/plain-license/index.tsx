"use client";

import { loadFont } from "@remotion/google-fonts/BigShoulders";
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

const shoulders = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PlainLicenseClause {
  legal: string;
  plain: string;
}

export interface PlainLicenseProps {
  clauses?: PlainLicenseClause[];
  highlight?: number;
  step?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#26231F", ink: "#F6F0E6", accent: "#2BD96B" },
  light: { bg: "#F5F5F2", ink: "#000000", accent: "#0E9F4B" },
} as const;

const DEFAULT_CLAUSES: PlainLicenseClause[] = [
  {
    legal: "Permission is hereby granted, free of charge,",
    plain: "Free,",
  },
  {
    legal:
      "to any person obtaining a copy of this software and associated documentation files (the “Software”),",
    plain: "for anyone,",
  },
  {
    legal:
      "to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.",
    plain: "for anything.",
  },
];

const WGHT = 500;
const PX = 200;
const LEAD = 1.04;
const T0 = 36;
const ZOOM = 26;
const LEGAL_ALPHA = 0.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Token {
  id: string;
  text: string;
  clause: number;
  plain: boolean;
}

interface Metrics {
  w: Record<string, number>;
  space: number;
  asc: number;
  desc: number;
  cap: number;
}

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("plain-license: no 2d context");
  ctx.font = `${WGHT} ${PX}px "${shoulders.fontFamily}"`;
  const w: Record<string, number> = {};
  for (const s of texts) w[s] = ctx.measureText(s).width / PX;
  const fm = ctx.measureText("Hgp");
  const h = ctx.measureText("H");
  return {
    w,
    space: ctx.measureText(" ").width / PX,
    asc: fm.fontBoundingBoxAscent / PX,
    desc: fm.fontBoundingBoxDescent / PX,
    cap: h.actualBoundingBoxAscent / PX,
  };
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("plain-license: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      shoulders.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${shoulders.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measureAll(key.split("\u0001")) });
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

interface Block {
  rows: { tokens: Token[]; xs: number[] }[];
  maxW: number;
}

function wrapBlock(tokens: Token[], m: Metrics, s: number, boxW: number) {
  const rows: { tokens: Token[]; xs: number[] }[] = [];
  let cur: Token[] = [];
  let xs: number[] = [];
  let x = 0;
  let maxW = 0;
  for (const tk of tokens) {
    const tw = m.w[tk.text] * s;
    const nx = cur.length === 0 ? 0 : x + m.space * s;
    if (cur.length > 0 && nx + tw > boxW) {
      rows.push({ tokens: cur, xs });
      maxW = Math.max(maxW, x);
      cur = [tk];
      xs = [0];
      x = tw;
    } else {
      cur.push(tk);
      xs.push(nx);
      x = nx + tw;
    }
  }
  if (cur.length > 0) {
    rows.push({ tokens: cur, xs });
    maxW = Math.max(maxW, x);
  }
  return { rows, maxW };
}

function fitSize(blocks: Token[][], m: Metrics, boxW: number, boxH: number) {
  let lo = 4;
  let hi = 400;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    let rows = 0;
    let fits = true;
    for (const b of blocks) {
      for (const tk of b) if (m.w[tk.text] * mid > boxW) fits = false;
      rows += wrapBlock(b, m, mid, boxW).rows.length;
    }
    const h = (m.cap + (rows - 1) * LEAD + 0.24) * mid;
    if (fits && h <= boxH) lo = mid;
    else hi = mid;
  }
  return lo;
}

function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

export function PlainLicense({
  clauses = DEFAULT_CLAUSES,
  highlight = 0,
  step = 40,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PlainLicenseProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = clauses.length > 0 ? clauses : DEFAULT_CLAUSES;
  const n = list.length;
  const stepLen = Math.max(34, step);
  const S = (k: number) => T0 + k * stepLen;
  const zoomAt = S(n - 1) + 34;
  const naturalEnd = zoomAt + ZOOM + 34;
  const pace = Math.max(1, naturalEnd / Math.max(1, durationInFrames));
  const t = frame * speed * pace;

  const legal: Token[][] = list.map((cl, i) =>
    splitWords(cl.legal).map((text, j) => ({
      id: `L${i}-${j}`,
      text,
      clause: i,
      plain: false,
    })),
  );
  const plain: Token[][] = list.map((cl, i) =>
    splitWords(cl.plain).map((text, j) => ({
      id: `P${i}-${j}`,
      text,
      clause: i,
      plain: true,
    })),
  );

  const texts = [...legal.flat(), ...plain.flat()].map((tk) => tk.text);
  const m = useMetrics(texts);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.065);
  const marginY = H * (portrait ? 0.08 : 0.1);
  const boxW = W - marginX * 2;
  const boxH = H * (portrait ? 0.62 : 1) - marginY * 2;
  const maxS = H * (portrait ? 0.12 : 0.3);

  const s0 = Math.min(fitSize(legal, m, boxW, boxH), maxS);
  const legalB: Block[] = legal.map((b) => wrapBlock(b, m, s0, boxW));
  const plainB: Block[] = plain.map((b) => wrapBlock(b, m, s0, boxW));
  const rowH = LEAD * s0;

  const blockAt = (k: number, i: number) => (i < k ? plainB[i] : legalB[i]);
  const tops: number[][] = [];
  const scales: number[] = [];
  for (let k = 0; k <= n; k++) {
    const row: number[] = [];
    let y = 0;
    let maxW = 0;
    for (let i = 0; i < n; i++) {
      row.push(y);
      const b = blockAt(k, i);
      y += b.rows.length * rowH;
      maxW = Math.max(maxW, b.maxW);
    }
    tops.push(row);
    const h = y - rowH + (m.cap + 0.24) * s0;
    scales.push(Math.max(1, Math.min(boxW / maxW, boxH / h, maxS / s0)));
  }

  const moveP = (k: number) =>
    interpolate(t, [S(k) + 16, S(k) + 34], [0, 1], {
      ...CLAMP,
      easing: EASE_MOVE,
    });
  const lerpState = (get: (k: number) => number) => {
    let v = get(0);
    for (let k = 0; k < n; k++) {
      const p = moveP(k);
      if (p <= 0) break;
      v = get(k) + (get(k + 1) - get(k)) * p;
    }
    return v;
  };
  const zoomP = interpolate(t, [zoomAt, zoomAt + ZOOM], [0, 1], {
    ...CLAMP,
    easing: EASE_MOVE,
  });
  const preZoom = lerpState((k) => (k === n ? scales[n - 1] : scales[k]));
  const scale = preZoom + (scales[n] - preZoom) * zoomP;

  const boxTop = (base: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * s0;

  const mix = (a: string, b: string, p: number) =>
    p <= 0
      ? a
      : p >= 1
        ? b
        : `color-mix(in oklab, ${b} ${(p * 100).toFixed(1)}%, ${a})`;

  const word = (
    key: string,
    text: string,
    x: number,
    base: number,
    color: string,
    opacity: number,
    dy: number,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: boxTop(base),
        height: s0,
        lineHeight: `${s0}px`,
        fontSize: s0,
        fontFamily: shoulders.fontFamily,
        fontWeight: WGHT,
        whiteSpace: "pre",
        color,
        opacity,
        transform: `translateY(${dy.toFixed(2)}px)`,
      }}
    >
      {text}
    </div>
  );

  const nodes: React.ReactNode[] = [];
  let rowIndex = 0;
  for (let i = 0; i < n; i++) {
    const st = S(i);
    const top = lerpState((k) => tops[k][i]);
    const mark = interpolate(t, [st, st + 8], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const out = interpolate(t, [st + 13, st + 22], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.55, 0, 1, 0.45),
    });
    if (out < 1) {
      legalB[i].rows.forEach((row, r) => {
        const ri = rowIndex++;
        const p = interpolate(t, [2 + ri * 2, 20 + ri * 2], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const base = top + m.cap * s0 + r * rowH;
        row.tokens.forEach((tk, j) => {
          nodes.push(
            word(
              tk.id,
              tk.text,
              row.xs[j],
              base,
              c.ink,
              p * (LEGAL_ALPHA + (1 - LEGAL_ALPHA) * mark) * (1 - out),
              (1 - p) * s0 * 0.3 + out * s0 * 0.16,
            ),
          );
        });
      });
    } else {
      rowIndex += legalB[i].rows.length;
    }
    const keep = i === highlight;
    const cool = keep
      ? 0
      : interpolate(t, [st + 50, st + 68], [0, 1], {
          ...CLAMP,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        });
    plainB[i].rows.forEach((row, r) => {
      const base = top + m.cap * s0 + r * rowH;
      row.tokens.forEach((tk, j) => {
        const inAt = st + 24 + j * 3;
        const p = interpolate(t, [inAt, inAt + 14], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (p <= 0) return;
        nodes.push(
          word(
            tk.id,
            tk.text,
            row.xs[j],
            base,
            mix(hi, c.ink, cool),
            p,
            (1 - p) * s0 * 0.28,
          ),
        );
      });
    });
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: marginX,
          top: marginY,
          width: boxW,
          height: boxH,
          transformOrigin: "0 0",
          transform: `scale(${scale.toFixed(4)})`,
        }}
      >
        {nodes}
      </div>
    </AbsoluteFill>
  );
}
