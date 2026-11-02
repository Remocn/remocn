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

export interface CutOffProps {
  line?: string;
  reply?: string;
  highlight?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0A",
    ink: "#FFFFFF",
    dim: "rgba(255,255,255,0.94)",
    replyBg: "#FFFFFF",
    replyInk: "#0A0A0A",
    accent: "#FF3EA5",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#000000",
    dim: "rgba(0,0,0,0.92)",
    replyBg: "#000000",
    replyInk: "#FFFFFF",
    accent: "#D61F7F",
  },
} as const;

const TRACK_A = -0.02;
const TRACK_B = -0.04;
const FONT_PX = 200;
const LH_A = 1.18;
const LH_B = 1.0;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_HIT = Easing.bezier(0.2, 1.35, 0.4, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const LEAD_IN = 6;
const WORD_IN = 9;
const LETTER = 2;
const DASH_HOLD = 4;
const HIT = 8;
const HIT_GAP = 9;
const MIN_HOLD = 40;

function useEm(textsA: string[], textsB: string[]) {
  const key = `${textsA.join("\u0001")}\u0002${textsB.join("\u0001")}`;
  const [state, setState] = useState<{
    key: string;
    a: Record<string, number>;
    b: Record<string, number>;
  } | null>(null);
  const [handle] = useState(() => delayRender("cut-off: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      syne.waitUntilDone(),
      document.fonts.load(`400 100px "${syne.fontFamily}"`),
      document.fonts.load(`500 100px "${syne.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [ka, kb] = key.split("\u0002");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const a: Record<string, number> = {};
        const b: Record<string, number> = {};
        if (ctx) {
          ctx.font = `400 ${FONT_PX}px "${syne.fontFamily}"`;
          for (const s of ka.split("\u0001")) {
            a[s] =
              ctx.measureText(s).width / FONT_PX +
              TRACK_A * Array.from(s).length;
          }
          ctx.font = `500 ${FONT_PX}px "${syne.fontFamily}"`;
          for (const s of kb.split("\u0001")) {
            b[s] =
              ctx.measureText(s).width / FONT_PX +
              TRACK_B * Array.from(s).length;
          }
        }
        setState({ key, a, b });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state : null;
}

function runs(words: string[]) {
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    for (let j = i; j < words.length; j++) {
      out.push(words.slice(i, j + 1).join(" "));
    }
  }
  return out;
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
    if (cur.length > 0 && em[[...cur, w].join(" ")] * F > maxW) lines.push([w]);
    else cur.push(w);
  }
  return lines;
}

const bare = (w: string) =>
  w.toLowerCase().replace(/^[“"'‘(]+|[.,!?;:…”"'’)—–]+$/g, "");

export function CutOff({
  line = "So first I export the clips, redo all the captions, then line up the mus",
  reply = "Or let the code cut it.",
  highlight = "the code",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: CutOffProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const cleanLine = line.replace(/[\s—–-]+$/, "");
  const aWords = cleanLine.split(" ").filter(Boolean);
  const bWords = reply.split(" ").filter(Boolean);
  const fragment = aWords[aWords.length - 1] ?? "";
  const em = useEm(
    runs([...aWords.slice(0, -1), `${fragment}—`]),
    runs(bWords),
  );

  if (!em) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const shown = [...aWords.slice(0, -1), `${fragment}—`];

  const aMaxW = W * (portrait ? 0.84 : 0.8);
  const fA = portrait ? W * 0.09 : H * 0.122;
  const aLines = wrap(shown, em.a, fA, aMaxW);
  const aBlockH = aLines.length * LH_A * fA;
  const aLeft = W * (portrait ? 0.09 : 0.08);
  const aTop = (H - aBlockH) / 2;

  const bBoxW = W * (portrait ? 0.84 : 0.86);
  const bBoxH = H * (portrait ? 0.5 : 0.62);
  const widestB = Math.max(...bWords.map((w) => em.b[w] ?? 0), 0.01);
  let lo = 4;
  let top = Math.min(portrait ? W * 0.26 : H * 0.34, bBoxW / widestB);
  for (let i = 0; i < 28; i++) {
    const mid = (lo + top) / 2;
    if (wrap(bWords, em.b, mid, bBoxW).length * LH_B * mid <= bBoxH) lo = mid;
    else top = mid;
  }
  const fB = lo;
  const bLines = wrap(bWords, em.b, fB, bBoxW);
  const bLeft = W * (portrait ? 0.08 : 0.07);
  const bBottom = H * (portrait ? 0.9 : 0.86);
  const bTop = bBottom - bLines.length * LH_B * fB;

  const fragLetters = Array.from(fragment).length;
  const fixedTail = fragLetters * LETTER + DASH_HOLD + HIT_GAP + HIT + MIN_HOLD;
  const gap = Math.max(
    3,
    Math.min(
      7,
      (durationInFrames - LEAD_IN - fixedTail) / Math.max(1, aWords.length - 1),
    ),
  );
  const fragAt = LEAD_IN + (aWords.length - 1) * gap;
  const dashAt = fragAt + fragLetters * LETTER;
  const cutAt = dashAt + DASH_HOLD;

  const hlTokens = highlight.split(" ").filter(Boolean).map(bare);
  const hlFlags = bWords.map(() => false);
  for (
    let i = 0;
    i + hlTokens.length <= bWords.length && hlTokens.length > 0;
    i++
  ) {
    if (hlTokens.every((h, j) => bare(bWords[i + j]) === h)) {
      for (let j = 0; j < hlTokens.length; j++) hlFlags[i + j] = true;
      break;
    }
  }
  let splitAt = bWords.findIndex((w) => /[,;:—]$/.test(w)) + 1;
  if (splitAt <= 0 || splitAt >= bWords.length) {
    const firstHl = hlFlags.indexOf(true);
    splitAt = firstHl > 0 ? firstHl : Math.ceil(bWords.length / 2);
  }

  const textBase = (
    size: number,
    wght: number,
    track: number,
    lh: number,
  ): React.CSSProperties => ({
    position: "absolute",
    whiteSpace: "pre",
    fontFamily: syne.fontFamily,
    fontWeight: wght,
    fontSize: size,
    lineHeight: `${size * lh}px`,
    height: size * lh,
    letterSpacing: `${track}em`,
  });

  const before = t < cutAt;
  const nodes: React.ReactNode[] = [];
  if (before) {
    let idx = 0;
    aLines.forEach((ln, li) => {
      ln.forEach((w, wi) => {
        const i = idx++;
        const before = ln.slice(0, wi).join(" ");
        const x = wi === 0 ? 0 : (em.a[`${before} ${w}`] ?? 0) - (em.a[w] ?? 0);
        const isFrag = i === shown.length - 1;
        const at = LEAD_IN + i * gap;
        let content = w;
        let p = interpolate(t, [at, at + WORD_IN], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        if (isFrag) {
          const letters = Array.from(fragment);
          const typed = Math.max(
            0,
            Math.min(letters.length, Math.floor((t - fragAt) / LETTER) + 1),
          );
          content = letters.slice(0, typed).join("");
          p = t >= fragAt ? 1 : 0;
        }
        if (p <= 0 || content === "") return;
        nodes.push(
          <div
            key={`a${i}`}
            style={{
              ...textBase(fA, 400, TRACK_A, LH_A),
              left: aLeft + x * fA,
              top: aTop + li * LH_A * fA,
              color: c.dim,
              opacity: p,
              transform: `translateY(${((1 - p) * fA * 0.35).toFixed(2)}px)`,
            }}
          >
            {content}
            {isFrag && t >= dashAt ? (
              <span style={{ color: hi }}>—</span>
            ) : null}
          </div>,
        );
      });
    });
  }

  let bi = 0;
  if (!before)
    bLines.forEach((ln, li) => {
      ln.forEach((w, wi) => {
        const i = bi++;
        const before = ln.slice(0, wi).join(" ");
        const x = wi === 0 ? 0 : (em.b[`${before} ${w}`] ?? 0) - (em.b[w] ?? 0);
        const at = i < splitAt ? cutAt - 3 : cutAt + HIT_GAP;
        if (t < Math.max(cutAt, at)) return;
        const p = interpolate(t, [at, at + HIT], [0, 1], {
          ...CLAMP,
          easing: EASE_HIT,
        });
        nodes.push(
          <div
            key={`b${i}`}
            style={{
              position: "absolute",
              left: bLeft + x * fB,
              top: bTop + li * LH_B * fB - fB * 0.1,
              height: fB * (LH_B + 0.32),
            }}
          >
            <div
              style={{
                ...textBase(fB, 500, TRACK_B, LH_B),
                position: "relative",
                top: fB * 0.1,
                color: hlFlags[i] ? hi : c.replyInk,
                transform: `translateY(${((1 - p) * fB * 0.22).toFixed(2)}px) scale(${(1 + (1 - p) * 0.05).toFixed(4)})`,
                transformOrigin: "0% 100%",
              }}
            >
              {w}
            </div>
          </div>,
        );
      });
    });

  const field = before ? stage : transparent ? "transparent" : c.replyBg;
  return (
    <AbsoluteFill style={{ background: field, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
