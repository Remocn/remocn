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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const syne = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export type CueCut = "slide" | "drop" | "lift" | "cut";

export interface CueWordScene {
  text: string;
  cue?: string;
  cut?: CueCut;
}

export interface CueWordProps {
  scenes?: CueWordScene[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0A",
    ink: "#FFFFFF",
    accent: "#FF3EA5",
    onAccent: "#0A0A0A",
    cueOnAccent: "#FFFFFF",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#000000",
    accent: "#D61F7F",
    onAccent: "#FFFFFF",
    cueOnAccent: "#000000",
  },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const FONT_PX = 200;
const LH = 1.06;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const RISE = 15;
const STAGGER = 3;
const CUE_GAP = 7;
const CUE_LAND = 12;
const MOVE = 20;
const FINAL_HOLD = 36;

const DEFAULT_SCENES: CueWordScene[] = [
  { text: "This line slides left.", cue: "slides left", cut: "slide" },
  { text: "The next one drops in.", cue: "drops in", cut: "drop" },
  { text: "And this one cuts.", cue: "cuts", cut: "cut" },
  { text: "Every move is one line of code.", cue: "one line" },
];

function useEmWidths(texts: string[]) {
  const key = texts.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    em: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("cue-word: measuring"));
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
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const em: Record<string, number> = {};
        if (ctx) {
          ctx.font = `${WGHT} ${FONT_PX}px "${syne.fontFamily}"`;
          for (const s of key.split("\u0001")) {
            em[s] =
              ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
          }
        }
        setState({ key, em });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.em : null;
}

const bare = (w: string) =>
  w.toLowerCase().replace(/^[“"'‘(]+|[.,!?;:…”"'’)—–]+$/g, "");

function cueMask(words: string[], cue: string | undefined) {
  const flags = words.map(() => false);
  const target = (cue ?? words[words.length - 1] ?? "")
    .split(" ")
    .filter(Boolean)
    .map(bare);
  if (target.length === 0) return flags;
  for (let i = words.length - target.length; i >= 0; i--) {
    if (target.every((tw, j) => bare(words[i + j]) === tw)) {
      for (let j = 0; j < target.length; j++) flags[i + j] = true;
      return flags;
    }
  }
  flags[words.length - 1] = true;
  return flags;
}

function lineCount(
  words: string[],
  em: Record<string, number>,
  F: number,
  maxW: number,
) {
  let lines = 1;
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && em[next] * F > maxW) {
      lines++;
      cur = w;
    } else {
      cur = next;
    }
  }
  return lines;
}

export function CueWord({
  scenes = DEFAULT_SCENES,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: CueWordProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const transparent = background === "transparent";
  const base = transparent ? "transparent" : (background ?? c.bg);

  const list = scenes.length > 0 ? scenes : [{ text: "" }];
  const sceneWords = list.map((s) => s.text.split(" ").filter(Boolean));
  const texts: string[] = [];
  for (const ws of sceneWords) {
    for (let i = 0; i < ws.length; i++) {
      texts.push(ws[i]);
      for (let j = i + 1; j < ws.length; j++) {
        texts.push(ws.slice(i, j + 1).join(" "));
      }
    }
  }
  const em = useEmWidths(texts);

  if (!em) {
    return <div style={{ position: "absolute", inset: 0, background: base }} />;
  }

  const portrait = H > W * 1.1;
  const boxW = W * (portrait ? 0.86 : 0.84);
  const maxLines = portrait ? 5 : 3;
  const capF = portrait ? W * 0.19 : H * 0.215;

  const sizes = sceneWords.map((ws) => {
    const widest = Math.max(...ws.map((w) => em[w] ?? 0), 0.01);
    let lo = 4;
    let top = Math.min(capF, boxW / widest);
    for (let i = 0; i < 28; i++) {
      const mid = (lo + top) / 2;
      if (lineCount(ws, em, mid, boxW) <= maxLines) lo = mid;
      else top = mid;
    }
    return lo;
  });

  const n = list.length;
  const settleOf = (k: number) =>
    k === 0
      ? RISE +
        Math.max(0, sceneWords[k].length - 1) * STAGGER +
        CUE_GAP +
        CUE_LAND
      : CUE_GAP + CUE_LAND;
  const moveOf = (k: number) => (list[k].cut === "cut" ? 0 : MOVE);
  let fixed = FINAL_HOLD;
  for (let k = 0; k < n; k++)
    fixed += settleOf(k) + (k < n - 1 ? moveOf(k) : 0);
  const read = Math.max(12, Math.floor((durationInFrames - fixed) / n));

  const arrive: number[] = [];
  const leave: number[] = [];
  let cursor = 0;
  for (let k = 0; k < n; k++) {
    arrive.push(cursor);
    const end = cursor + settleOf(k) + read;
    leave.push(end);
    cursor = end + (k < n - 1 ? moveOf(k) : 0);
  }

  const offsetOf = (k: number) => {
    let x = 0;
    let y = 0;
    if (k > 0) {
      const cut = list[k - 1].cut ?? "slide";
      const span = moveOf(k - 1);
      const p =
        span === 0
          ? t >= leave[k - 1]
            ? 1
            : 0
          : interpolate(t, [leave[k - 1], leave[k - 1] + span], [0, 1], {
              ...CLAMP,
              easing: EASE_IO,
            });
      if (cut === "slide") x += (1 - p) * W;
      if (cut === "drop") y -= (1 - p) * H;
      if (cut === "lift") y += (1 - p) * H;
      if (cut === "cut" && p < 1) y += H * 2;
    }
    if (k < n - 1) {
      const cut = list[k].cut ?? "slide";
      const span = moveOf(k);
      const p =
        span === 0
          ? t >= leave[k]
            ? 1
            : 0
          : interpolate(t, [leave[k], leave[k] + span], [0, 1], {
              ...CLAMP,
              easing: EASE_IO,
            });
      if (cut === "slide") x -= p * W;
      if (cut === "drop") y += p * H;
      if (cut === "lift") y -= p * H;
      if (cut === "cut" && p >= 1) y += H * 2;
    }
    return { x, y };
  };

  const layers: React.ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const startVis = k === 0 ? 0 : leave[k - 1];
    const endVis = k < n - 1 ? leave[k] + moveOf(k) : Number.POSITIVE_INFINITY;
    if (t < startVis || t > endVis) continue;
    const { x, y } = offsetOf(k);
    if (Math.abs(x) >= W || Math.abs(y) >= H) continue;

    const onAccent = k % 2 === 1;
    const field = onAccent ? hi : base;
    const inkCol = onAccent ? c.onAccent : c.ink;
    const cueCol = onAccent ? c.cueOnAccent : hi;
    const F = sizes[k];
    const ws = sceneWords[k];
    const flags = cueMask(ws, list[k].cue);
    const t0 = arrive[k];
    const restTime = (i: number) => (k === 0 ? t0 + i * STAGGER : -1e9);
    const cueAt =
      k === 0
        ? t0 + (ws.length - 1) * STAGGER + RISE + CUE_GAP - 8
        : t0 + CUE_GAP - 5;

    const spans = ws.map((w, i) => {
      const isCue = flags[i];
      const startAt = isCue ? cueAt : restTime(i);
      const p = interpolate(
        t,
        [startAt, startAt + (isCue ? CUE_LAND : RISE)],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_OUT,
        },
      );
      const style: React.CSSProperties = {
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "top",
        paddingBottom: F * 0.14,
        marginBottom: -F * 0.14,
      };
      return (
        <span key={`w${i}`}>
          <span style={style}>
            <span
              style={{
                display: "inline-block",
                color: isCue ? cueCol : inkCol,
                transform: `translateY(${((1 - p) * F * 1.15).toFixed(2)}px)`,
              }}
            >
              {w}
            </span>
          </span>
          {i < ws.length - 1 ? " " : ""}
        </span>
      );
    });

    layers.push(
      <div
        key={`s${k}`}
        style={{
          position: "absolute",
          inset: 0,
          background: field,
          transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: boxW,
            textAlign: "center",
            textWrap: "balance",
            fontFamily: syne.fontFamily,
            fontWeight: WGHT,
            fontSize: F,
            lineHeight: LH,
            letterSpacing: `${TRACK}em`,
            marginTop: -F * 0.06,
          }}
        >
          {spans}
        </div>
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      {layers}
    </AbsoluteFill>
  );
}
