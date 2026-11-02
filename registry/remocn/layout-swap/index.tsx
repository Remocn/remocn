"use client";

import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
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

const inter = loadInterTight("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface LayoutSwapProps {
  headlines?: string[];
  highlight?: string;
  align?: "center" | "left";
  hold?: number;
  move?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    ground: (a: string) =>
      [
        `radial-gradient(70% 62% at 50% 120%, color-mix(in oklab, ${BEAM[2]} 52%, transparent) 0%, color-mix(in oklab, ${BEAM[3]} 42%, transparent) 46%, transparent 78%)`,
        `radial-gradient(34% 26% at 50% 104%, color-mix(in oklab, ${a} 26%, transparent) 0%, transparent 80%)`,
      ].join(", "),
    hl: (a: string) =>
      `linear-gradient(100deg, ${BEAM[0]} 0%, ${BEAM[1]} 34%, color-mix(in oklab, ${a} 70%, ${BEAM[1]}) 64%, ${BEAM[0]} 100%)`,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    ground: (a: string) =>
      [
        `radial-gradient(60% 55% at 50% 118%, color-mix(in oklab, ${BEAM[1]} 40%, transparent) 0%, color-mix(in oklab, ${a} 10%, transparent) 50%, transparent 78%)`,
      ].join(", "),
    hl: (a: string) =>
      `linear-gradient(100deg, ${BEAM[3]} 0%, ${a} 36%, #6f8dff 66%, ${BEAM[3]} 100%)`,
  },
} as const;

const TRACK = -0.032;
const LINE = 1.04;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.7, 0, 0.2, 1);
const EASE_IN = Easing.bezier(0.5, 0, 0.9, 0.4);

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function useWordWidths(words: string[]) {
  const key = words.join("\u0001");
  const estimate = words.map((w) => w.length * 0.52);
  const [widths, setWidths] = useState<{
    key: string;
    w: number[];
    space: number;
  } | null>(null);
  const [handle] = useState(() => delayRender("layout-swap: measuring"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    const font = `500 100px "${inter.fontFamily}"`;
    Promise.all([inter.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const list = key.split("\u0001");
        let w = list.map((s) => s.length * 0.52);
        let space = 0.24;
        if (ctx) {
          ctx.font = font;
          w = list.map(
            (s) =>
              ctx.measureText(s).width / 100 +
              TRACK * Math.max(0, s.length - 1),
          );
          space = ctx.measureText(" ").width / 100 + TRACK;
        }
        setWidths({ key, w, space });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);

  return widths && widths.key === key
    ? widths
    : { key, w: estimate, space: 0.24 };
}

function balance(w: number[], space: number, lines: number) {
  const n = w.length;
  const rowW = (a: number, b: number) => {
    let s = 0;
    for (let i = a; i < b; i++) s += w[i] + (i > a ? space : 0);
    return s;
  };
  const best: number[][] = [];
  const cut: number[][] = [];
  for (let k = 0; k <= lines; k++) {
    best.push(new Array(n + 1).fill(Number.POSITIVE_INFINITY));
    cut.push(new Array(n + 1).fill(0));
  }
  best[0][0] = 0;
  for (let k = 1; k <= lines; k++) {
    for (let i = 1; i <= n; i++) {
      for (let j = k - 1; j < i; j++) {
        const v = Math.max(best[k - 1][j], rowW(j, i));
        if (v < best[k][i]) {
          best[k][i] = v;
          cut[k][i] = j;
        }
      }
    }
  }
  const rows: [number, number][] = [];
  let i = n;
  for (let k = lines; k >= 1; k--) {
    const j = cut[k][i];
    rows.unshift([j, i]);
    i = j;
  }
  return { rows, widest: best[lines][n], rowW };
}

interface Placed {
  text: string;
  key: string;
  x: number;
  y: number;
  fs: number;
  w: number;
  order: number;
}

function layoutHeadline(
  words: string[],
  widths: number[],
  space: number,
  box: { w: number; h: number; cx: number; cy: number; left: number },
  maxFs: number,
  align: "center" | "left",
) {
  const n = Math.max(1, words.length);
  let chosen = balance(widths, space, 1);
  let fs = Math.min(maxFs, box.w / Math.max(chosen.widest, 0.01));
  for (let lines = 2; lines <= Math.min(4, n); lines++) {
    const next = balance(widths, space, lines);
    const nextFs = Math.min(
      maxFs,
      box.w / Math.max(next.widest, 0.01),
      box.h / (lines * LINE),
    );
    if (nextFs > fs * 1.18) {
      chosen = next;
      fs = nextFs;
    }
  }
  const rows = chosen.rows.filter(([a, b]) => b > a);
  const blockH = rows.length * LINE * fs;
  const top = box.cy - blockH / 2;
  const seen = new Map<string, number>();
  const placed: Placed[] = [];
  rows.forEach(([a, b], r) => {
    const rw = chosen.rowW(a, b) * fs;
    let x = align === "center" ? box.cx - rw / 2 : box.left;
    for (let i = a; i < b; i++) {
      const k = norm(words[i]) || words[i];
      const nth = seen.get(k) ?? 0;
      seen.set(k, nth + 1);
      placed.push({
        text: words[i],
        key: `${k}#${nth}`,
        x,
        y: top + r * LINE * fs,
        fs,
        w: widths[i] * fs,
        order: i,
      });
      x += (widths[i] + space) * fs;
    }
  });
  return placed;
}

export function LayoutSwap({
  headlines = [
    "Animations.",
    "Animations, transitions, backgrounds.",
    "Animations, transitions and backgrounds, ready to install.",
  ],
  highlight = "ready to install.",
  align = "center",
  hold = 28,
  move = 28,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: LayoutSwapProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const t = THEMES[theme];
  const steps = headlines.length > 0 ? headlines : ["remocn"];

  const split = steps.map((h) => h.split(/\s+/).filter(Boolean));
  const all = split.flat();
  const m = useWordWidths(all);
  let cursor = 0;
  const widthsPer = split.map((ws) => {
    const w = m.w.slice(cursor, cursor + ws.length);
    cursor += ws.length;
    return w;
  });

  const portrait = height > width * 1.1;
  const s = Math.min(width / 1280, height / 720);
  const padX = width * (portrait ? 0.09 : 0.1);
  const box = {
    w: width - padX * 2,
    h: height * (portrait ? 0.5 : 0.56),
    cx: width / 2,
    cy: height * 0.5,
    left: padX,
  };
  const maxFs = (portrait ? 170 : 150) * (portrait ? width / 1080 : s);

  const layouts = split.map((ws, k) =>
    layoutHeadline(ws, widthsPer[k], m.space, box, maxFs, align),
  );

  const ENTER = 20;
  const stepStart = (k: number) => ENTER + k * (hold + move);
  let k = 0;
  while (k < steps.length - 1 && frame >= stepStart(k) + hold) k++;
  const moving = k > 0 && frame < stepStart(k - 1) + hold + move;
  const from = moving ? k - 1 : k;
  const to = k;
  const moveT = moving
    ? (frame - (stepStart(from) + hold)) / Math.max(1, move)
    : 1;

  const hlKeys = new Set(
    (highlight ?? "").split(/\s+/).map(norm).filter(Boolean),
  );
  const last = steps.length - 1;
  const drift = interpolate(
    frame,
    [0, durationInFrames * speed],
    [0, 1],
    CLAMP,
  );

  type Draw = {
    id: string;
    text: string;
    x: number;
    y: number;
    fs: number;
    opacity: number;
    blur: number;
    hl: number;
  };
  const draws: Draw[] = [];

  const hlOf = (step: number, p: Placed) =>
    step === last && hlKeys.has(norm(p.text)) ? 1 : 0;

  if (!moving) {
    const L = layouts[to];
    L.forEach((p, i) => {
      const e =
        to === 0
          ? interpolate(frame, [i * 2.5, i * 2.5 + 16], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            })
          : 1;
      draws.push({
        id: `${to}:${p.key}`,
        text: p.text,
        x: p.x,
        y: p.y + (1 - e) * 0.32 * p.fs,
        fs: p.fs,
        opacity: e,
        blur: (1 - e) * 0.08 * p.fs,
        hl: hlOf(to, p),
      });
    });
  } else {
    const A = layouts[from];
    const B = layouts[to];
    const bByKey = new Map(B.map((p) => [p.key, p]));
    const aKeys = new Set(A.map((p) => p.key));
    const pairs = A.filter((p) => bByKey.has(p.key));
    const lead = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * 0.14);
    const sharedSorted = [...pairs].sort(
      (a, b) =>
        (bByKey.get(a.key)?.order ?? 0) - (bByKey.get(b.key)?.order ?? 0),
    );
    sharedSorted.forEach((a, i) => {
      const b = bByKey.get(a.key) as Placed;
      const d = lead(i, sharedSorted.length);
      const u = EASE_IO(Math.min(1, Math.max(0, (moveT - 0.16 - d) / 0.5)));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const mx = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
      const my = (a.y + b.y) / 2 + (LINE * (a.fs + b.fs)) / 4;
      let px = len > 0 ? -dy / len : 0;
      let py = len > 0 ? dx / len : 0;
      if (px * (mx - box.cx) + py * (my - box.cy) < 0) {
        px = -px;
        py = -py;
      }
      const fsMid = (a.fs + b.fs) / 2;
      const bow = Math.sin(Math.PI * u) * Math.min(0.55 * fsMid, len * 0.16);
      const x = a.x + dx * u + px * bow;
      const y = a.y + dy * u + py * bow;
      const fs = a.fs + (b.fs - a.fs) * u;
      const travel = len / fsMid;
      const depth = Math.sin(Math.PI * u) * Math.min(1, travel / 3.2);
      const dim = 1 - depth * 0.62;
      const soft = depth * 0.035 * fs;
      const hlA = hlOf(from, a);
      const hlB = hlOf(to, b);
      if (a.text === b.text) {
        draws.push({
          id: `s:${a.key}`,
          text: a.text,
          x,
          y,
          fs,
          opacity: dim,
          blur: soft,
          hl: hlA + (hlB - hlA) * u,
        });
      } else {
        const c = interpolate(u, [0.3, 0.7], [0, 1], CLAMP);
        draws.push({
          id: `sa:${a.key}`,
          text: a.text,
          x,
          y,
          fs,
          opacity: (1 - c) * dim,
          blur: soft,
          hl: hlA,
        });
        draws.push({
          id: `sb:${a.key}`,
          text: b.text,
          x,
          y,
          fs,
          opacity: c * dim,
          blur: soft,
          hl: hlB,
        });
      }
    });
    A.filter((p) => !bByKey.has(p.key)).forEach((a, i) => {
      const o = EASE_IN(Math.min(1, Math.max(0, (moveT - i * 0.03) / 0.34)));
      draws.push({
        id: `o:${a.key}`,
        text: a.text,
        x: a.x,
        y: a.y + o * 0.22 * a.fs,
        fs: a.fs * (1 - o * 0.06),
        opacity: 1 - o,
        blur: o * 0.07 * a.fs,
        hl: hlOf(from, a),
      });
    });
    const fresh = B.filter((p) => !aKeys.has(p.key));
    const gap = Math.min(0.05, 0.2 / Math.max(1, fresh.length));
    fresh.forEach((b, i) => {
      const e = EASE_OUT(
        Math.min(1, Math.max(0, (moveT - 0.56 - i * gap) / 0.38)),
      );
      draws.push({
        id: `i:${b.key}`,
        text: b.text,
        x: b.x,
        y: b.y + (1 - e) * 0.3 * b.fs,
        fs: b.fs,
        opacity: e,
        blur: (1 - e) * 0.08 * b.fs,
        hl: hlOf(to, b),
      });
    });
  }

  const transparent = background === "transparent";
  const hlImage = t.hl(accent);

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? t.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <div
          style={{
            position: "absolute",
            inset: "-6%",
            background: t.ground(accent),
            transform: `translateY(${(-drift * 3).toFixed(3)}%)`,
          }}
        />
      ) : null}
      {draws.map((d) => {
        const base: React.CSSProperties = {
          position: "absolute",
          left: d.x,
          top: d.y,
          fontFamily: inter.fontFamily,
          fontWeight: 500,
          fontSize: d.fs,
          lineHeight: LINE,
          letterSpacing: `${TRACK}em`,
          whiteSpace: "pre",
          opacity: d.opacity,
          filter: d.blur > 0.05 ? `blur(${d.blur.toFixed(2)}px)` : undefined,
        };
        return (
          <div key={d.id} style={base}>
            <span style={{ color: t.fg, opacity: 1 - d.hl }}>{d.text}</span>
            {d.hl > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: d.hl,
                  backgroundImage: hlImage,
                  backgroundSize: "180% 100%",
                  backgroundPosition: `${(drift * 60).toFixed(2)}% 0%`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  paddingRight: "0.06em",
                }}
              >
                {d.text}
              </span>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
