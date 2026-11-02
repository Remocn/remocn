"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const figtree = loadFigtree("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface RewriteBarsProps {
  headlines?: string[];
  eyebrows?: string[];
  highlight?: string;
  align?: "center" | "left";
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    eyebrow: "#8F8E96",
    bar: (a: string) =>
      `linear-gradient(90deg, ${BEAM[3]} 0%, color-mix(in oklab, ${a} 80%, ${BEAM[3]}) 22%, ${BEAM[1]} 40%, ${BEAM[0]} 50%, ${BEAM[1]} 60%, color-mix(in oklab, ${a} 80%, ${BEAM[3]}) 78%, ${BEAM[3]} 100%)`,
    hl: (a: string) =>
      `linear-gradient(100deg, ${BEAM[1]} 0%, color-mix(in oklab, ${a} 55%, ${BEAM[1]}) 45%, ${BEAM[0]} 100%)`,
    ground: (a: string) =>
      `radial-gradient(70% 55% at 50% 118%, color-mix(in oklab, ${BEAM[2]} 34%, transparent) 0%, color-mix(in oklab, ${a} 12%, transparent) 50%, transparent 78%)`,
    front: "rgba(244,247,255,0.95)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    eyebrow: "#6E6C67",
    bar: (a: string) =>
      `linear-gradient(90deg, #c9d4ff 0%, ${BEAM[1]} 22%, color-mix(in oklab, ${a} 85%, white) 40%, ${a} 50%, color-mix(in oklab, ${a} 85%, white) 60%, ${BEAM[1]} 78%, #c9d4ff 100%)`,
    hl: (a: string) =>
      `linear-gradient(100deg, ${BEAM[3]} 0%, ${a} 50%, #6f8dff 100%)`,
    ground: (a: string) =>
      `radial-gradient(60% 50% at 50% 120%, color-mix(in oklab, ${BEAM[1]} 30%, transparent) 0%, color-mix(in oklab, ${a} 6%, transparent) 55%, transparent 80%)`,
    front: "rgba(255,255,255,0.95)",
  },
} as const;

const TRACK = -0.032;
const LINE = 1.08;
const BAR_H = 0.5;
const BAR_MID = 0.34;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SWEEP = Easing.bezier(0.45, 0, 0.2, 1);

const RESOLVE = 14;
const COLLAPSE = 12;
const REFLOW = 14;
const LINE_STAGGER = 3;

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function useWordWidths(words: string[]) {
  const key = words.join("\u0001");
  const estimate = words.map((w) => w.length * 0.5);
  const [widths, setWidths] = useState<{
    key: string;
    w: number[];
    space: number;
  } | null>(null);
  const [handle] = useState(() => delayRender("rewrite-bars: measuring"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    const font = `500 100px "${figtree.fontFamily}"`;
    Promise.all([figtree.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        const list = key.split("\u0001");
        let w = list.map((s) => s.length * 0.5);
        let space = 0.24;
        if (ctx) {
          ctx.font = font;
          w = list.map(
            (s) => ctx.measureText(s).width / 100 + TRACK * [...s].length,
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

interface Line {
  words: string[];
  x: number;
  base: number;
  w: number;
}

interface Layout {
  lines: Line[];
  top: number;
}

export function RewriteBars({
  headlines = [
    "Scenes you copy, not configure.",
    "Captions that move with the voice.",
    "Your launch video, rendered from code.",
  ],
  eyebrows = ["01 · Scenes", "02 · Captions", "03 · Render"],
  highlight = "rendered from code",
  align = "center",
  hold = 20,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: RewriteBarsProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];

  const heads = headlines.length > 0 ? headlines : ["remocn"];
  const split = heads.map((h) => h.split(/\s+/).filter(Boolean));
  const all = split.flat();
  const measured = useWordWidths(all);

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);
  const maxW = width * (portrait ? 0.84 : 0.8);
  const maxFs = (portrait ? 104 : 96) * s;
  const eyeFs = (portrait ? 22 : 18) * s;
  const hasEyebrows = eyebrows.length > 0;

  let offset = 0;
  const wordW = split.map((ws) => {
    const out = measured.w.slice(offset, offset + ws.length);
    offset += ws.length;
    return out;
  });
  const fitRows = (wsW: number[], fs: number) => {
    for (let lines = 1; lines <= Math.min(3, wsW.length); lines++) {
      const b = balance(wsW, measured.space, lines);
      if (b.widest * fs <= maxW) return b;
    }
    return null;
  };
  let fs = maxFs;
  for (let guard = 0; guard < 40; guard++) {
    if (wordW.every((w) => w.length === 0 || fitRows(w, fs))) break;
    fs *= 0.95;
  }

  const layouts: Layout[] = wordW.map((wsW, h) => {
    const b = fitRows(wsW, fs) ?? balance(wsW, measured.space, 3);
    const lineH = fs * LINE;
    const eyeBlock = hasEyebrows ? eyeFs + fs * 0.42 : 0;
    const blockH = eyeBlock + b.rows.length * lineH;
    const top = height / 2 - blockH / 2 + eyeBlock;
    const left = (width - maxW) / 2;
    const lines = b.rows.map(([a, z], r) => {
      const w = b.rowW(a, z) * fs;
      return {
        words: split[h].slice(a, z),
        x: align === "center" ? width / 2 - w / 2 : left,
        base: top + r * lineH + fs * 0.86,
        w,
      };
    });
    return { lines, top };
  });

  const resolveAt: number[] = [];
  const collapseAt: number[] = [];
  const collapseEnd: number[] = [];
  let tt = 12;
  for (let h = 0; h < heads.length; h++) {
    const stagger = LINE_STAGGER * (layouts[h].lines.length - 1);
    resolveAt.push(tt);
    collapseAt.push(tt + RESOLVE + stagger + hold);
    collapseEnd.push(collapseAt[h] + COLLAPSE + stagger);
    tt = collapseEnd[h] + REFLOW;
  }

  let cur = 0;
  for (let h = 0; h < heads.length - 1; h++) {
    if (frame >= collapseEnd[h]) cur = h + 1;
  }
  const last = heads.length - 1;
  const L = layouts[cur];
  const prev = cur > 0 ? layouts[cur - 1] : null;

  const reflowStart = cur > 0 ? collapseEnd[cur - 1] : -2;
  const reflowK = interpolate(
    frame,
    [reflowStart, reflowStart + REFLOW],
    [0, 1],
    { ...CLAMP, easing: EASE_IO },
  );

  const shimmer = frame * 0.012;

  const fromLines: { x: number; base: number; w: number }[] = prev
    ? prev.lines
    : L.lines.map((ln) => ({
        x: ln.x + ln.w * 0.36,
        base: ln.base,
        w: ln.w * 0.28,
      }));
  const nBars = Math.max(fromLines.length, L.lines.length);

  const textHl = new Set(
    highlight
      .split(/\s+/)
      .map(norm)
      .filter((w) => w.length > 0),
  );

  const lineH = fs * LINE;
  const barH = fs * BAR_H;
  const isLast = cur === last;

  const bars: React.ReactNode[] = [];
  const texts: React.ReactNode[] = [];

  for (let j = 0; j < nBars; j++) {
    const a = fromLines[Math.min(j, fromLines.length - 1)];
    const b = L.lines[Math.min(j, L.lines.length - 1)];
    const x = interpolate(reflowK, [0, 1], [a.x, b.x]);
    const w = interpolate(reflowK, [0, 1], [a.w, b.w]);
    const base = interpolate(reflowK, [0, 1], [a.base, b.base]);
    const splitting = j >= fromLines.length;
    const merging = j >= L.lines.length;
    let barO = 1;
    if (splitting)
      barO = interpolate(reflowK, [0, 0.45], [0, 1], CLAMP) * (cur > 0 ? 1 : 0);
    if (merging) barO = interpolate(reflowK, [0.5, 1], [1, 0], CLAMP);
    if (cur === 0 && reflowK <= 0)
      barO *= interpolate(frame, [-2, 4], [0, 1], CLAMP);

    const lineIdx = Math.min(j, L.lines.length - 1);
    const rs = resolveAt[cur] + lineIdx * LINE_STAGGER;
    const res = interpolate(frame, [rs, rs + RESOLVE], [0, 1], {
      ...CLAMP,
      easing: EASE_SWEEP,
    });
    const cs = collapseAt[cur] + lineIdx * LINE_STAGGER;
    const col =
      cur < last
        ? interpolate(frame, [cs, cs + COLLAPSE], [0, 1], {
            ...CLAMP,
            easing: EASE_SWEEP,
          })
        : 0;

    const textVisible = res > 0 && !merging;
    const barFrom = col > 0 ? 0 : res;
    const barTo = col > 0 ? col : 1;
    const pad = barH * 0.5;
    const bx = x - pad * 0.4;
    const bw = w + pad * 0.8;
    const barTop = base - fs * BAR_MID - barH / 2;
    if (barTo - barFrom > 0.001 && barO > 0.001) {
      const leftCut = barFrom * bw;
      const rightCut = (1 - barTo) * bw;
      bars.push(
        <div
          key={`bar${j}`}
          style={{
            position: "absolute",
            left: bx,
            top: barTop,
            width: bw,
            height: barH,
            borderRadius: barH / 2,
            backgroundImage: t.bar(accent),
            backgroundSize: `${width * 1.2}px 100%`,
            backgroundPositionX: `${-bx + ((shimmer % 1) - 0.5) * width * 1.2}px`,
            backgroundRepeat: "repeat-x",
            opacity: barO,
            clipPath: `inset(-2px ${rightCut}px -2px ${leftCut}px round ${barH / 2}px)`,
          }}
        />,
      );
    }

    const frontK = col > 0 && col < 1 ? col : res > 0 && res < 1 ? res : -1;
    if (frontK >= 0 && !merging) {
      const fx = bx + bw * frontK;
      const fo = Math.sin(frontK * Math.PI);
      bars.push(
        <div
          key={`front${j}`}
          style={{
            position: "absolute",
            left: fx - fs * 0.5,
            top: base - fs * 0.86,
            width: fs * 0.5,
            height: fs * 1.06,
            background: `linear-gradient(90deg, transparent 0%, ${t.front} 100%)`,
            opacity: fo * 0.22,
            maskImage:
              "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
          }}
        />,
      );
    }

    if (textVisible) {
      const ln = L.lines[j];
      const lw = ln.w + fs * 0.3;
      const leftEdge = col > 0 ? bx + bw * col - ln.x : -fs * 0.2;
      const rightEdge = col > 0 ? lw : bx + bw * res - ln.x;
      texts.push(
        <div
          key={`t${cur}-${j}`}
          style={{
            position: "absolute",
            left: ln.x,
            top: ln.base - fs * 0.86,
            height: lineH,
            whiteSpace: "pre",
            fontFamily: figtree.fontFamily,
            fontWeight: 500,
            fontSize: fs,
            lineHeight: `${fs * 0.86 + fs * 0.22}px`,
            letterSpacing: `${TRACK}em`,
            color: t.fg,
            width: lw,
            clipPath: `inset(-20% ${lw - rightEdge}px -30% ${leftEdge}px)`,
          }}
        >
          {ln.words.map((wd, k) => {
            const hl = isLast && textHl.has(norm(wd));
            return (
              <Fragment key={k}>
                {k > 0 ? " " : null}
                <span
                  style={
                    hl
                      ? {
                          backgroundImage: t.hl(accent),
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }
                      : undefined
                  }
                >
                  {wd}
                </span>
              </Fragment>
            );
          })}
        </div>,
      );
    }
  }

  let eyebrow: React.ReactNode = null;
  if (hasEyebrows) {
    const label = eyebrows[Math.min(cur, eyebrows.length - 1)] ?? "";
    const prevTop = prev ? prev.top : L.top;
    const top = interpolate(reflowK, [0, 1], [prevTop, L.top]);
    const inO = interpolate(
      frame,
      [resolveAt[cur] - 4, resolveAt[cur] + 8],
      [0, 1],
      CLAMP,
    );
    const outO =
      cur < last
        ? interpolate(
            frame,
            [collapseAt[cur], collapseAt[cur] + 8],
            [1, 0],
            CLAMP,
          )
        : 1;
    const firstX = L.lines[0]?.x ?? 0;
    eyebrow = (
      <div
        style={{
          position: "absolute",
          left: align === "center" ? 0 : firstX,
          right: align === "center" ? 0 : undefined,
          top: top - fs * 0.42 - eyeFs * 0.2,
          textAlign: align === "center" ? "center" : "left",
          fontFamily: mono.fontFamily,
          fontWeight: 400,
          fontSize: eyeFs,
          lineHeight: 1,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: t.eyebrow,
          opacity: Math.min(inO, outO),
        }}
      >
        {label}
      </div>
    );
  }

  const transparent = background === "transparent";

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
            inset: 0,
            background: t.ground(accent),
            opacity: interpolate(frame, [0, 30], [0.6, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            }),
          }}
        />
      ) : null}
      {eyebrow}
      {bars}
      {texts}
    </AbsoluteFill>
  );
}
