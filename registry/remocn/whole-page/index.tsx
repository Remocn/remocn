"use client";

import { loadFont } from "@remotion/google-fonts/Gloock";
import type React from "react";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const gloock = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export interface WholePageProps {
  beliefs?: string[];
  title?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_BELIEFS = [
  "A launch video is part of the launch, not the chore you do after it.",
  "If it lives in code, it can live in the repo with everything else.",
  "Every frame you install is a file you are free to rewrite.",
  "Motion should explain the product. It should never show off.",
  "A team of one deserves a real film, too.",
  "The video goes out the same day the product does.",
];

const THEMES = {
  dark: { bg: "#0A1230", ink: "#FFFFFF", accent: "#FF4436" },
  light: { bg: "#F7F3EC", ink: "#14161F", accent: "#D92B1E" },
} as const;

const TRACK = -0.02;
const LH = 1.12;
const START = 6;
const PULL = 36;
const HOLD = 40;
const DIM = 0;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

let measureCtx: CanvasRenderingContext2D | null = null;

function em(s: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return s.length * 0.5;
  measureCtx.font = `400 100px "${gloock.fontFamily}"`;
  return measureCtx.measureText(s).width / 100 + TRACK * Array.from(s).length;
}

function useFontReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("whole-page: font"));
  useEffect(() => {
    let live = true;
    gloock
      .waitUntilDone()
      .then(() => document.fonts.load(`400 100px "${gloock.fontFamily}"`))
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(true);
        continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
}

interface Laid {
  words: { text: string; x: number; line: number }[];
  lines: number;
}

function wrapAt(words: string[], widths: number[], maxEm: number): Laid {
  const space = em(" ");
  const out: { text: string; x: number; line: number }[] = [];
  let line = 0;
  let x = 0;
  words.forEach((w, i) => {
    if (x > 0 && x + widths[i] > maxEm) {
      line += 1;
      x = 0;
    }
    out.push({ text: w, x, line });
    x += widths[i] + space;
  });
  return { words: out, lines: line + 1 };
}

function balanced(text: string, maxEm: number): Laid {
  const words = text.split(/\s+/).filter(Boolean);
  const widths = words.map(em);
  const base = wrapAt(words, widths, maxEm);
  let lo = Math.max(...widths, 0.1);
  let hi = maxEm;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (wrapAt(words, widths, mid).lines <= base.lines) hi = mid;
    else lo = mid;
  }
  return wrapAt(words, widths, hi);
}

export function WholePage({
  beliefs = DEFAULT_BELIEFS,
  title = "What we believe",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: WholePageProps) {
  const frame = useCurrentFrame();
  const t = frame * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontReady();

  if (!ready || beliefs.length === 0) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = beliefs.length;
  const portrait = H > W * 1.1;
  const cols = Math.min(n, portrait ? 2 : 3);
  const rows = Math.ceil(n / cols);
  const mx = W * (portrait ? 0.08 : 0.07);
  const top = H * (portrait ? 0.08 : 0.1);
  const Ft = H * (portrait ? 0.022 : 0.04);
  const gridTop = title ? top + Ft * 2.6 : top;
  const gutter = W * (portrait ? 0.06 : 0.04);
  const colW = (W - mx * 2 - gutter * (cols - 1)) / cols;
  const gridH = H * (portrait ? 0.9 : 0.9) - gridTop;

  const layoutAt = (F: number) => {
    const lays = beliefs.map((b) => balanced(b, colW / F));
    const rowLines = Array.from({ length: rows }, (_, r) =>
      Math.max(...lays.slice(r * cols, r * cols + cols).map((l) => l.lines), 1),
    );
    const total =
      rowLines.reduce((s, l) => s + l * LH * F, 0) + (rows - 1) * F * 1.1;
    return { lays, rowLines, total };
  };

  const widestWord = Math.max(
    ...beliefs.flatMap((b) => b.split(/\s+/).map(em)),
  );
  const fits = (F: number) =>
    layoutAt(F).total <= gridH && widestWord * F <= colW;
  const orphaned = (F: number) =>
    layoutAt(F).lays.some(
      (l) =>
        l.lines > 1 && l.words.filter((w) => w.line === l.lines - 1).length < 2,
    );
  let Fp = 0;
  let firstFit = 0;
  for (let F = H * 0.12; F > 6 && Fp === 0; F *= 0.985) {
    if (!fits(F)) continue;
    if (firstFit === 0) firstFit = F;
    if (!orphaned(F) || F < firstFit * 0.9) Fp = F;
  }
  if (Fp === 0) Fp = firstFit || 6;
  const { lays, rowLines } = layoutAt(Fp);
  const rowTop: number[] = [];
  let acc = gridTop;
  for (let r = 0; r < rows; r++) {
    rowTop.push(acc);
    acc += rowLines[r] * LH * Fp + Fp * 1.1;
  }
  const slack = portrait ? Math.max(0, (H * 0.9 - (acc - Fp * 1.1)) / 2) : 0;
  const paras = lays.map((l, i) => ({
    x: mx + (i % cols) * (colW + gutter),
    y: rowTop[Math.floor(i / cols)] + slack,
    h: l.lines * LH * Fp,
    lay: l,
  }));
  const zoomOf = paras.map((p) => {
    const lineW = Math.max(...p.lay.words.map((w) => w.x + em(w.text)), 0.1);
    return Math.max(
      1,
      Math.min(
        (W - mx * 2) / (lineW * Fp),
        (H * (portrait ? 0.6 : 0.78)) / p.h,
        (H * (portrait ? 0.1 : 0.16)) / Fp,
      ),
    );
  });
  const ax = mx;
  const ay = H * (portrait ? 0.1 : 0.1);

  const D = durationInFrames * speed;
  const per = Math.max(30, (D - START - PULL - HOLD) / n);
  const pan = Math.min(16, per * 0.36);
  const arriveAt = (i: number) => START + i * per;
  const pullAt = START + n * per - 6;

  let qx = paras[0].x;
  let qy = paras[0].y;
  let S = zoomOf[0];
  for (let i = 1; i < n; i++) {
    const p = interpolate(t, [arriveAt(i) - pan, arriveAt(i)], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    if (p > 0) {
      qx = paras[i - 1].x + (paras[i].x - paras[i - 1].x) * p;
      qy = paras[i - 1].y + (paras[i].y - paras[i - 1].y) * p;
      S = zoomOf[i - 1] * (zoomOf[i] / zoomOf[i - 1]) ** p;
    }
  }
  const pull = interpolate(t, [pullAt, pullAt + PULL], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const z = S ** (1 - pull);
  const zp = (S - z) / Math.max(0.0001, S - 1);
  const cx = qx + (ax - qx) * zp;
  const cy = qy + (ay - qy) * zp;
  const tx = ax - cx * z;
  const ty = ay - cy * z;

  const intro = interpolate(t, [0, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const settle = interpolate(pull, [0.35, 1], [0, 1], CLAMP);

  const nodes: React.ReactNode[] = [];
  paras.forEach((para, i) => {
    const arrive = i === 0 ? START : arriveAt(i);
    const leaveAt = arriveAt(i + 1) - pan;
    const leave =
      i < n - 1
        ? interpolate(t, [leaveAt, leaveAt + pan * 0.55], [0, 1], {
            ...CLAMP,
            easing: Easing.bezier(0.55, 0, 1, 0.45),
          })
        : 0;
    const isLast = i === n - 1;
    const wordsN = para.lay.words.length;
    const stagger = Math.min(1.6, 14 / Math.max(1, wordsN));
    para.lay.words.forEach((w, wi) => {
      const on = interpolate(
        t,
        [
          arrive - pan * 0.5 + wi * stagger,
          arrive - pan * 0.5 + 12 + wi * stagger,
        ],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const focus = on * (1 - leave);
      const read = t >= arrive - pan * 0.5 + 12 + wi * stagger ? 1 : 0;
      const base = DIM + (1 - DIM) * focus;
      const finalOp = read ? 1 : DIM;
      const opacity = (base + (finalOp - base) * settle) * intro;
      const color = isLast
        ? interpolateColors(Math.max(focus, settle * read), [0, 1], [c.ink, hi])
        : c.ink;
      const rise = i === 0 ? (1 - intro) * Fp * 0.3 : 0;
      nodes.push(
        <div
          key={`p${i}w${wi}`}
          style={{
            position: "absolute",
            left: para.x + w.x * Fp,
            top: para.y + w.line * LH * Fp + rise,
            fontFamily: gloock.fontFamily,
            fontWeight: 400,
            fontSize: Fp,
            lineHeight: `${LH * Fp}px`,
            letterSpacing: `${TRACK}em`,
            whiteSpace: "pre",
            color,
            opacity,
          }}
        >
          {w.text}
        </div>,
      );
    });
  });

  const titleOp = interpolate(pull, [0.4, 1], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(5)})`,
        }}
      >
        {title ? (
          <div
            style={{
              position: "absolute",
              left: mx,
              top: top + slack,
              fontFamily: gloock.fontFamily,
              fontWeight: 400,
              fontSize: Ft,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              whiteSpace: "pre",
              color: c.ink,
              opacity: 0.6 * titleOp,
            }}
          >
            {title}
          </div>
        ) : null}
        {nodes}
      </div>
    </AbsoluteFill>
  );
}
