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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type CutOffElementId,
  cutOffTimeline,
  DEFAULT_LINE,
  lineWords,
} from "./timeline";

const syne = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CutOffProps {
  line?: string;
  reply?: string;
  highlight?: string;
  accent?: string;
  /** Text color of the cut-off line; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Fill that cuts in behind the reply; overrides the theme. */
  replyBackground?: string;
  /** Typeface for the copy. Load it yourself; Syne by default. */
  fontFamily?: string;
  /** Frames per letter as the last word is typed. */
  charFrames?: number;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the line's words, the typed last word, the
   * dash and the two parts of the reply, by the ids in `./timeline`. Frames
   * on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<CutOffElementId>;
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

function useEm(textsA: string[], textsB: string[], family: string) {
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
      document.fonts.load(`400 100px "${family}"`),
      document.fonts.load(`500 100px "${family}"`),
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
          ctx.font = `400 ${FONT_PX}px "${family}"`;
          for (const s of ka.split("\u0001")) {
            a[s] =
              ctx.measureText(s).width / FONT_PX +
              TRACK_A * Array.from(s).length;
          }
          ctx.font = `500 ${FONT_PX}px "${family}"`;
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
  }, [key, handle, family]);
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

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function CutOff(props: CutOffProps) {
  const {
    line = DEFAULT_LINE,
    reply = "Or let the code cut it.",
    highlight = "the code",
    accent,
    ink,
    background,
    replyBackground,
    fontFamily = syne.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  // The word gap fits the line into the clip itself, not into `speed`.
  const tl = useTimeline(cutOffTimeline, props, durationInFrames, timing);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const fg = ink ?? c.dim;
  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  const aWords = lineWords(line);
  const bWords = reply.split(" ").filter(Boolean);
  const fragment = aWords[aWords.length - 1] ?? "";
  const em = useEm(
    runs([...aWords.slice(0, -1), `${fragment}—`]),
    runs(bWords),
    fontFamily,
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

  const frag = tl.get("fragment");
  const fragAt = frag.start;
  const charFrames = frag.beat("char");
  const dash = tl.get("dash");
  const dashAt = dash.start;
  const cutAt = dash.end;
  const replyEls = [tl.get("reply"), tl.get("payoff")];

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
    fontFamily,
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
        let content = w;
        // The typed last word appears whole-letter at a time, below.
        const word = isFrag ? null : tl.get(`word:${i}`);
        let p = word
          ? interpolate(t, [word.start, word.end], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            })
          : 0;
        if (isFrag) {
          const letters = Array.from(fragment);
          const typed = Math.max(
            0,
            Math.min(letters.length, Math.floor((t - fragAt) / charFrames) + 1),
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
              color: fg,
              opacity: p,
              // Unrounded: a rise rounded to 0.01px parks the word as well.
              transform: `translateY(${(1 - p) * fA * 0.35}px)${glide(midway(p))}`,
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
        const part = replyEls[i < splitAt ? 0 : 1];
        const at = part.start;
        if (t < Math.max(cutAt, at)) return;
        const p = interpolate(t, [at, part.end], [0, 1], {
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
                // The hit overshoots past 1, so the tilt follows its window.
                transform: `translateY(${(1 - p) * fB * 0.22}px) scale(${(1 + (1 - p) * 0.05).toFixed(4)})${glide(t < part.end)}`,
                transformOrigin: "0% 100%",
              }}
            >
              {w}
            </div>
          </div>,
        );
      });
    });

  const field = before
    ? stage
    : transparent
      ? "transparent"
      : (replyBackground ?? c.replyBg);
  return (
    <AbsoluteFill style={{ background: field, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{nodes}</ScaleLayer>
    </AbsoluteFill>
  );
}
