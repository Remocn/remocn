"use client";

import { loadFont } from "@remotion/google-fonts/Syne";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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

const syne = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface BatonWordProps {
  scenes?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0A0A0A", ink: "#FFFFFF", accent: "#FF3EA5" },
  light: { bg: "#FFFFFF", ink: "#000000", accent: "#D61F7F" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const FONT_PX = 200;
const LH = 1.04;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.75, 0.2);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const RISE = 16;
const STAGGER = 3;
const DROP = 9;
const DROP_STAGGER = 1.5;
const TRAVEL = 24;
const FINAL_HOLD = 34;
const PUNCT = /[.,!?;:…—–]+$/;

interface Metrics {
  em: Record<string, number>;
  asc: number;
  desc: number;
}

function measureAll(texts: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("baton-word: no 2d context");
  ctx.font = `${WGHT} ${FONT_PX}px "${syne.fontFamily}"`;
  const em: Record<string, number> = {};
  for (const s of texts) {
    em[s] = ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
  }
  const fm = ctx.measureText("Hxg");
  return {
    em,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("baton-word: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      syne.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${syne.fontFamily}"`),
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

interface Placed {
  word: string;
  line: number;
  x: number;
}

interface SceneLayout {
  words: Placed[];
  lines: number;
  F: number;
  left: number;
  top: number;
}

function wrap(
  words: string[],
  em: Record<string, number>,
  F: number,
  maxW: number,
) {
  const lines: string[][] = [[]];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    const next = [...cur, w].join(" ");
    if (cur.length > 0 && em[next] * F > maxW) lines.push([w]);
    else cur.push(w);
  }
  return lines;
}

function layoutScene(
  words: string[],
  m: Metrics,
  boxW: number,
  boxH: number,
  maxF: number,
): { lines: string[][]; F: number } {
  let lo = 4;
  let hi = maxF;
  const widest = Math.max(...words.map((w) => m.em[w]), 0.01);
  hi = Math.min(hi, boxW / widest);
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const lines = wrap(words, m.em, mid, boxW);
    if (lines.length * LH * mid <= boxH) lo = mid;
    else hi = mid;
  }
  return { lines: wrap(words, m.em, lo, boxW), F: lo };
}

function splitPunct(word: string) {
  const match = word.match(PUNCT);
  const punct = match ? match[0] : "";
  return { core: word.slice(0, word.length - punct.length), punct };
}

function prefixes(s: string) {
  const chars = Array.from(s);
  return chars.map((_, i) => chars.slice(0, i).join(""));
}

export function BatonWord({
  scenes = [
    "The app is ready for launch.",
    "Launch day needs a film.",
    "Film it in code.",
  ],
  accent,
  background,
  speed = 1,
  theme = "dark",
}: BatonWordProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const list = scenes.length > 0 ? scenes : [""];
  const sceneWords = list.map((s) => s.split(" ").filter(Boolean));
  const batons = sceneWords.slice(0, -1).map((ws, i) => {
    const a = splitPunct(ws[ws.length - 1] ?? "");
    const b = splitPunct(sceneWords[i + 1][0] ?? "");
    return { a, b };
  });

  const texts: string[] = [];
  for (const ws of sceneWords) {
    for (let i = 0; i < ws.length; i++) {
      texts.push(ws[i]);
      for (let j = i; j < ws.length; j++) {
        texts.push(ws.slice(i, j + 1).join(" "));
        texts.push(`${ws.slice(i, j + 1).join(" ")} `);
      }
    }
  }
  for (const bt of batons) {
    texts.push(
      bt.a.core,
      bt.b.core,
      ...prefixes(bt.a.core),
      ...prefixes(bt.b.core),
    );
  }
  const m = useMetrics(texts);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.08 : 0.065);
  const boxW = W - marginX * 2;
  const boxH = H * (portrait ? 0.66 : 0.84);
  const maxF = portrait ? W * 0.26 : H * 0.36;

  const layouts: SceneLayout[] = sceneWords.map((ws) => {
    const { lines, F } = layoutScene(ws, m, boxW, boxH, maxF);
    const placed: Placed[] = [];
    lines.forEach((ln, li) => {
      ln.forEach((w, wi) => {
        const before = ln.slice(0, wi).join(" ");
        placed.push({
          word: w,
          line: li,
          x: wi === 0 ? 0 : m.em[`${before} `] * F,
        });
      });
    });
    const blockH = lines.length * LH * F;
    return {
      words: placed,
      lines: lines.length,
      F,
      left: marginX,
      top: (H - blockH) / 2,
    };
  });

  const n = list.length;
  const fixedIn = (k: number) =>
    RISE + Math.max(0, sceneWords[k].length - 1) * STAGGER;
  let fixed = FINAL_HOLD;
  for (let k = 0; k < n; k++) fixed += fixedIn(k);
  const clearIn = (k: number) =>
    Math.max(0, sceneWords[k].length - 2) * DROP_STAGGER + DROP - 3;
  for (let k = 0; k < n - 1; k++) fixed += clearIn(k) + TRAVEL - 3;
  const read = Math.max(14, Math.floor((durationInFrames - fixed) / n));

  const inAt: number[] = [];
  const outAt: number[] = [];
  const travelAt: number[] = [];
  let cursor = 0;
  for (let k = 0; k < n; k++) {
    inAt.push(cursor);
    const settled = cursor + fixedIn(k);
    outAt.push(settled + read);
    const go = settled + read + (k < n - 1 ? clearIn(k) : 0);
    travelAt.push(go);
    cursor = go + TRAVEL - 3;
  }

  const lineTop = (L: SceneLayout, line: number) => L.top + line * LH * L.F;
  const textStyle = (size: number): React.CSSProperties => ({
    position: "absolute",
    height: size * LH,
    lineHeight: `${size * LH}px`,
    whiteSpace: "pre",
    fontFamily: syne.fontFamily,
    fontWeight: WGHT,
    fontSize: size,
    letterSpacing: `${TRACK}em`,
  });

  const nodes: React.ReactNode[] = [];

  for (let k = 0; k < n; k++) {
    const L = layouts[k];
    const ws = L.words;
    const first = k > 0 ? 1 : 0;
    const last = k < n - 1 ? ws.length - 1 : ws.length;
    if (t < inAt[k] - 2) continue;

    ws.forEach((pw, i) => {
      if (i < first || i >= last) return;
      const order = i - first;
      const p = interpolate(
        t,
        [inAt[k] + order * STAGGER, inAt[k] + order * STAGGER + RISE],
        [0, 1],
        { ...CLAMP, easing: EASE_OUT },
      );
      const q =
        k < n - 1
          ? interpolate(
              t,
              [outAt[k] + i * DROP_STAGGER, outAt[k] + i * DROP_STAGGER + DROP],
              [0, 1],
              { ...CLAMP, easing: EASE_IN },
            )
          : 0;
      if (p <= 0 || q >= 1) return;
      const leadColor = k > 0 && i === 0 ? hi : c.ink;
      const y = (1 - p) * L.F * 1.2 + q * L.F * 0.14;
      nodes.push(
        <div
          key={`s${k}w${i}`}
          style={{
            position: "absolute",
            left: L.left + pw.x,
            top: lineTop(L, pw.line) - L.F * 0.12,
            height: L.F * (LH + 0.3),
            overflow: "hidden",
          }}
        >
          <div
            style={{
              ...textStyle(L.F),
              position: "relative",
              top: L.F * 0.12,
              color: leadColor,
              opacity: 1 - q,
              transform: `translateY(${y.toFixed(2)}px)`,
            }}
          >
            {pw.word}
          </div>
        </div>,
      );
    });
  }

  for (let k = 0; k < n - 1; k++) {
    const A = layouts[k];
    const B = layouts[k + 1];
    const { a, b } = batons[k];
    const aw = A.words[A.words.length - 1];
    const bw = B.words[0];
    const solo = k > 0 && A.words.length === 1;
    const handsOn = k + 1 < n - 1 && B.words.length === 1;
    const startIn = inAt[k] + (A.words.length - 1 - (k > 0 ? 1 : 0)) * STAGGER;
    if (solo && t < outAt[k]) continue;
    if (!solo && t < startIn - 1) continue;
    if (handsOn && t >= outAt[k + 1]) continue;

    const pIn = solo
      ? 1
      : interpolate(t, [startIn, startIn + RISE], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
    const go = interpolate(t, [travelAt[k], travelAt[k] + TRAVEL], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const lit = solo
      ? 1
      : interpolate(t, [outAt[k], outAt[k] + 8], [0, 1], CLAMP);
    const swap = interpolate(go, [0.35, 0.7], [0, 1], CLAMP);
    const punctOut = interpolate(t, [outAt[k], outAt[k] + 8], [1, 0], CLAMP);

    const F = A.F + (B.F - A.F) * go;
    const x0 = A.left + aw.x;
    const y0 = lineTop(A, aw.line);
    const x1 = B.left + bw.x;
    const y1 = lineTop(B, bw.line);
    const arc = Math.sin(go * Math.PI) * Math.min(W, H) * 0.04;
    const x = x0 + (x1 - x0) * go;
    const y = y0 + (y1 - y0) * go - arc;

    const qOut =
      k + 1 < n - 1 && !handsOn
        ? interpolate(t, [outAt[k + 1], outAt[k + 1] + DROP], [0, 1], {
            ...CLAMP,
            easing: EASE_IN,
          })
        : 0;
    if (qOut >= 1) continue;
    const color = interpolateColors(lit, [0, 1], [c.ink, hi]);

    const aChars = Array.from(a.core);
    const bChars = Array.from(b.core);
    const same = aChars.length === bChars.length;
    const pa = prefixes(a.core).map((s) => (s ? m.em[s] : 0));
    const pb = prefixes(b.core).map((s) => (s ? m.em[s] : 0));
    const glyphs: React.ReactNode[] = [];
    if (same) {
      aChars.forEach((ch, i) => {
        const gx = (pa[i] + (pb[i] - pa[i]) * swap) * F;
        if (ch === bChars[i]) {
          glyphs.push(
            <span key={`g${i}`} style={{ ...textStyle(F), left: gx, top: 0 }}>
              {ch}
            </span>,
          );
        } else {
          glyphs.push(
            <span
              key={`ga${i}`}
              style={{ ...textStyle(F), left: gx, top: 0, opacity: 1 - swap }}
            >
              {ch}
            </span>,
            <span
              key={`gb${i}`}
              style={{ ...textStyle(F), left: gx, top: 0, opacity: swap }}
            >
              {bChars[i]}
            </span>,
          );
        }
      });
    } else {
      glyphs.push(
        <span
          key="wa"
          style={{ ...textStyle(F), left: 0, top: 0, opacity: 1 - swap }}
        >
          {a.core}
        </span>,
        <span
          key="wb"
          style={{ ...textStyle(F), left: 0, top: 0, opacity: swap }}
        >
          {b.core}
        </span>,
      );
    }
    const coreW = (m.em[a.core] + (m.em[b.core] - m.em[a.core]) * swap) * F;
    if (a.punct && punctOut > 0) {
      glyphs.push(
        <span
          key="pa"
          style={{
            ...textStyle(F),
            left: coreW,
            top: 0,
            opacity: punctOut,
            color: c.ink,
          }}
        >
          {a.punct}
        </span>,
      );
    }
    if (b.punct) {
      const pIn2 = interpolate(go, [0.8, 1], [0, 1], CLAMP);
      glyphs.push(
        <span
          key="pb"
          style={{
            ...textStyle(F),
            left: coreW,
            top: 0,
            opacity: pIn2,
            color: c.ink,
          }}
        >
          {b.punct}
        </span>,
      );
    }

    const dropY = qOut * B.F * 0.14;
    const riseY = (1 - pIn) * A.F * 1.2;
    const masked = go <= 0 || qOut > 0;
    const maskL = go <= 0 ? A : B;
    const inner = (
      <div
        style={{
          position: "absolute",
          left: masked ? 0 : x,
          top: masked ? maskL.F * 0.12 : y,
          width: 1,
          height: F * LH,
          color,
          opacity: 1 - qOut,
          transform: `translateY(${(riseY + dropY).toFixed(2)}px)`,
        }}
      >
        {glyphs}
      </div>
    );
    nodes.push(
      masked ? (
        <div
          key={`b${k}`}
          style={{
            position: "absolute",
            left: x,
            top: y - maskL.F * 0.12,
            width: W,
            height: maskL.F * (LH + 0.3),
            overflow: "hidden",
          }}
        >
          {inner}
        </div>
      ) : (
        <div key={`b${k}`}>{inner}</div>
      ),
    );
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
