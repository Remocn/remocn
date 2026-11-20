"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const barlow = loadFont("normal", { weights: ["500"], subsets: ["latin"] });

export interface NegationDropProps {
  lines?: string[];
  /** Frame the first contraction drops. */
  dropAt?: number;
  /** Frames between one line's drop and the next. */
  stagger?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; Barlow Condensed by default. */
  fontFamily?: string;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#FFFFFF",
    dim: "#4A4A4A",
    accent: "#D4FF00",
    onBlock: "#000000",
  },
  light: {
    bg: "#D4FF00",
    ink: "#000000",
    dim: "#8FAD00",
    accent: "#000000",
    onBlock: "#D4FF00",
  },
} as const;

const TRACK = -0.01;
const LINE_H = 0.88;
const ENTER_AT = -4;
const ENTER_STAGGER = 6;
const ENTER_LEN = 16;
const FLIP_AT = 44;
const FLIP_GAP = 14;
const FALL_LEN = 9;
const CLOSE_DELAY = 6;
const LIT_DELAY = 6;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FALL = Easing.bezier(0.55, 0, 0.9, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_LINES = [
  "You can’t animate.",
  "You don’t have a team.",
  "It isn’t done.",
];

type PartKind = "plain" | "keep" | "drop";
interface Part {
  text: string;
  kind: PartKind;
}

function splitLine(line: string): Part[][] {
  const words = line.trim().split(/\s+/);
  let flipped = false;
  return words.map((w) => {
    if (!flipped) {
      const can = w.match(/^(can)([’']t)(\W*)$/i);
      const nt =
        can || /^(won|shan)[’']t/i.test(w)
          ? null
          : w.match(/^(\w+)(n[’']t)(\W*)$/i);
      const hit = can ?? nt;
      if (hit) {
        flipped = true;
        const parts: Part[] = [
          { text: hit[1], kind: "keep" },
          { text: hit[2].replace("'", "’"), kind: "drop" },
        ];
        if (hit[3]) parts.push({ text: hit[3], kind: "plain" });
        return parts;
      }
    }
    return [{ text: w, kind: "plain" }];
  });
}

const upper = (s: string) => s.toUpperCase();

function useWidths(strings: string[], family: string) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Map<string, number>;
    space: number;
    baseline: number;
    capTop: number;
  } | null>(null);
  const [handle] = useState(() => delayRender("negation-drop: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      barlow.waitUntilDone(),
      document.fonts.load(`500 100px "${family}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const probe = document.createElement("span");
        Object.assign(probe.style, {
          position: "absolute",
          left: "-99999px",
          top: "0",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: `"${family}"`,
          fontWeight: "500",
          fontSize: "100px",
          lineHeight: "1",
          letterSpacing: `${TRACK}em`,
        });
        document.body.appendChild(probe);
        const w = new Map<string, number>();
        for (const s of key.split("\u0001")) {
          probe.textContent = upper(s);
          w.set(s, probe.getBoundingClientRect().width / 100);
        }
        probe.textContent = "A A";
        const aa = probe.getBoundingClientRect().width;
        probe.textContent = "AA";
        const space = Math.max(
          0.2,
          ((aa - probe.getBoundingClientRect().width) / 100) * 1.5,
        );
        probe.remove();

        let baseline = 0.8;
        let capTop = 0.7;
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) {
          ctx.font = `500 200px "${family}"`;
          const fm = ctx.measureText("H");
          const asc = fm.fontBoundingBoxAscent / 200;
          const desc = fm.fontBoundingBoxDescent / 200;
          baseline = (1 - (asc + desc)) / 2 + asc;
          capTop = fm.actualBoundingBoxAscent / 200;
        }
        setState({ key: key + family, w, space, baseline, capTop });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key + family ? state : null;
}

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

export function NegationDrop({
  lines = DEFAULT_LINES,
  dropAt = FLIP_AT,
  stagger = FLIP_GAP,
  accent,
  ink,
  background,
  fontFamily = barlow.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: NegationDropProps) {
  const glide = useGlide();
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const block = accent ?? c.accent;

  const rows = useMemo(() => lines.map(splitLine), [lines]);
  const strings = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) for (const w of r) for (const p of w) set.add(p.text);
    return [...set];
  }, [rows]);
  const m = useWidths(strings, fontFamily);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const wOf = (s: string) => m.w.get(s) ?? 0;

  const lineEm = rows.map((r) => {
    let full = 0;
    let drop = 0;
    r.forEach((word, wi) => {
      if (wi > 0) full += m.space;
      for (const p of word) {
        full += wOf(p.text);
        if (p.kind === "drop") drop += wOf(p.text);
      }
    });
    return { full, drop };
  });

  const flipAt = (i: number) => dropAt + i * stagger;
  const closeAt = (tt: number) =>
    rows.map((_, i) =>
      spring({
        frame: tt - flipAt(i) - CLOSE_DELAY,
        fps,
        config: { damping: 15, stiffness: 150, mass: 0.8 },
      }),
    );
  const close = closeAt(t);

  const padX = W * (portrait ? 0.035 : 0.025);
  const measureW = W - padX * 2;
  const restF = lineEm.map((l) => measureW / Math.max(0.3, l.full - l.drop));
  const maxBlockH = H * (portrait ? 0.72 : 0.9);
  const restH = restF.reduce((a, f) => a + f * LINE_H, 0);
  const k = Math.min(1, maxBlockH / Math.max(1, restH));
  const layoutAt = (cl: number[]) => {
    const sizes = lineEm.map(
      (l, i) => (measureW / Math.max(0.3, l.full - l.drop * cl[i])) * k,
    );
    const blockH = sizes.reduce((a, f) => a + f * LINE_H, 0);
    let y = (H - blockH) / 2 + (sizes[0] ?? 0) * 0.04;
    const tops = sizes.map((f) => {
      const top = y;
      y += f * LINE_H;
      return top;
    });
    return { sizes, tops };
  };
  const now = layoutAt(close);
  const sizes = now.sizes;
  // While a line closes up, every line resizes and the block recentres. Font
  // size and `top` are layout, rounded to whole pixels, so the lines would
  // click, and a line handed back to layout when it stops would jump. So each
  // line is laid out at its closed size and place for its whole life and
  // carried to the live one by a transform.
  const rest = layoutAt(rows.map(() => 1));
  const drift = (g: ReturnType<typeof layoutAt>) =>
    Math.max(
      ...g.sizes.map(
        (f, i) =>
          Math.abs(f - sizes[i]) * 1.5 + Math.abs(g.tops[i] - now.tops[i]),
      ),
    );
  const closing =
    drift(layoutAt(closeAt(t + 1))) > 1e-3 ||
    drift(layoutAt(closeAt(t - 1))) > 1e-3;
  // The springs never quite reach 1; once every line has closed and nothing
  // moves, the leftover (well under a thousandth of a pixel) is dropped.
  const closed = !closing && close.every((cl) => cl > 0.5);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {rows.map((r, i) => {
          const live = sizes[i];
          const F = rest.sizes[i];
          const top = rest.tops[i];
          // Room on both sides so the clip never trims a line laid out at
          // its closed size, which is wider than the live one.
          const ox = W;
          const f0 = flipAt(i);
          const tint = interpolate(t, [f0 - 8, f0 - 1], [0, 1], CLAMP);
          const fall = interpolate(t, [f0, f0 + FALL_LEN], [0, 1], {
            ...CLAMP,
            easing: EASE_FALL,
          });
          const lit = interpolate(
            t,
            [f0 + LIT_DELAY, f0 + LIT_DELAY + 10],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const clipTop = top - F * 0.2;
          const liveClipTop = now.tops[i] - live * 0.2;
          const baseY = top + m.baseline * F;
          const clipBottom = baseY + F * 0.1;
          const lineW = (lineEm[i].full - lineEm[i].drop * close[i]) * F;
          const left = (W - lineW) / 2;
          const bpad = F * 0.05;

          const pieces: React.ReactNode[] = [];
          let x = 0;
          let passedDrop = false;
          r.forEach((word, wi) => {
            if (wi > 0) x += m.space * F;
            for (const p of word) {
              const pw = wOf(p.text) * F;
              const shift = passedDrop ? -lineEm[i].drop * F * close[i] : 0;
              const fallY = fall * F * 0.95;
              const style: React.CSSProperties = {
                position: "absolute",
                left: ox + left + x + shift,
                top: top - clipTop,
                height: F,
                lineHeight: `${F}px`,
                whiteSpace: "pre",
                color: fg,
              };
              if (p.kind === "drop") {
                style.color = interpolateHex(fg, c.dim, tint);
                style.transform = `translateY(${fallY.toFixed(2)}px)${glide(fall > 0 && fall < 1 && !closing)}`;
                passedDrop = true;
              }
              if (p.kind === "keep" && lit > 0) {
                style.color = `color-mix(in oklab, ${fg} ${((1 - lit) * 100).toFixed(1)}%, ${c.onBlock})`;
                pieces.push(
                  <div
                    key={`b${wi}`}
                    style={{
                      position: "absolute",
                      // The box sits where the closed line centres it and
                      // rides the recentring as a transform: its edge would
                      // round to whole pixels in `left`.
                      left:
                        ox +
                        (W - (lineEm[i].full - lineEm[i].drop) * F) / 2 +
                        x -
                        bpad,
                      top: baseY - m.capTop * F - bpad - clipTop,
                      width: pw + bpad * 2,
                      height: m.capTop * F + bpad * 2,
                      background: block,
                      transformOrigin: "0 50%",
                      transform: `translateX(${closed ? 0 : (-lineEm[i].drop * F * (1 - close[i])) / 2}px) scaleX(${lit.toFixed(4)})`,
                    }}
                  />,
                );
              }
              pieces.push(
                <span key={`${wi}-${p.kind}-${p.text}`} style={style}>
                  {upper(p.text)}
                </span>,
              );
              x += pw;
            }
          });

          const enterY = (tt: number) =>
            (1 -
              interpolate(
                tt,
                [
                  ENTER_AT + i * ENTER_STAGGER,
                  ENTER_AT + i * ENTER_STAGGER + ENTER_LEN,
                ],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              )) *
            (clipBottom - clipTop + F * 0.05);
          const rising =
            Math.abs(enterY(t + 1) - enterY(t)) > 1e-3 ||
            Math.abs(enterY(t) - enterY(t - 1)) > 1e-3;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: -ox,
                width: W + 2 * ox,
                top: clipTop,
                transformOrigin: "50% 0",
                transform: `translateY(${closed ? 0 : liveClipTop - clipTop}px) scale(${closed ? 1 : live / F})${glide(closing)}`,
                height: clipBottom - clipTop,
                overflow: "hidden",
                fontFamily,
                fontWeight: 500,
                fontSize: F,
                letterSpacing: `${TRACK}em`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateY(${enterY(t).toFixed(2)}px)${glide(rising && !closing)}`,
                }}
              >
                {pieces}
              </div>
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}

function interpolateHex(a: string, b: string, k: number) {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return k < 0.5 ? a : b;
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function hex(s: string) {
  const mm = s.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!mm) return null;
  const n = Number.parseInt(mm[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
