"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const figtree = loadFigtree("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface WakeWipeProps {
  lines?: string[];
  highlight?: string;
  eyebrow?: string;
  hold?: number;
  /** Frames for one wake to sweep across the frame. */
  wake?: number;
  fontWeight?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the lines (the eyebrow stays mono). Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Film grain over the scene. */
  grain?: boolean;
  /** Size of the text, around the frame's center; the wake stays full-bleed. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    muted: "#8E8D94",
    edge: ["#fff4ec", "#ffb36b", "#e2457a"],
    ground: 0.5,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    muted: "#6E6C67",
    edge: ["#ff8a3d", "#ff3d9a", "#7a5cff"],
    ground: 0.46,
    grain: 0.035,
  },
} as const;

const TRACK = -0.035;
const START = 4;
const WAKE_LEN = 28;
const REVEAL_LEN = 18;
const REVEAL_TAIL = 0.32;
const TAIL = 0.5;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_WAKE = Easing.bezier(0.5, 0, 0.2, 1);
const EASE_REVEAL = Easing.bezier(0.3, 0, 0.15, 1);
const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const mix = (c: string, a: number) =>
  `color-mix(in oklab, ${c} ${(Math.max(0, Math.min(1, a)) * 100).toFixed(1)}%, transparent)`;

function measure(lines: string[], font: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return lines.map((l) => l.length * 0.52);
  ctx.font = font;
  return lines.map(
    (l) => ctx.measureText(l).width / 1000 + TRACK * Array.from(l).length,
  );
}

function useWidths(lines: string[], fontFamily: string, weight: number) {
  const [widths, setWidths] = useState<number[] | null>(null);
  const [handle] = useState(() => delayRender("wake-wipe: measuring"));
  const released = useRef(false);
  const key = lines.join("\n");
  useEffect(() => {
    let live = true;
    Promise.all([
      figtree.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`${weight} 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setWidths(measure(key.split("\n"), `${weight} 1000px "${fontFamily}"`));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, fontFamily, weight, handle]);
  return widths;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `ww${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={11}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
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

export function WakeWipe({
  lines = [
    "Animations you own.",
    "Transitions that land.",
    "Ship the launch video today.",
  ],
  highlight = "today.",
  eyebrow = "Inside remocn",
  hold = 54,
  wake = WAKE_LEN,
  fontWeight = 500,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = figtree.fontFamily,
  grain = true,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: WakeWipeProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const items = lines.length ? lines : [""];
  const widths = useWidths(items, fontFamily, fontWeight);

  if (!widths) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W;
  const padX = W * (portrait ? 0.08 : 0.085);
  const maxW = W - padX * 2;
  const widest = Math.max(...widths, 0.1);
  const maxRows = portrait ? 3 : 2;
  const F = Math.min(
    portrait ? W * 0.15 : H * 0.17,
    (maxW * maxRows * 0.9) / widest,
  );

  const rowsOf = (w: number) => Math.max(1, Math.ceil((w * F) / maxW - 0.02));
  const rows = Math.max(...widths.map(rowsOf), 1);
  const blockH = rows * F * 1.04;
  const ebSize = Math.max(Math.min(H, W) * 0.026, 12);
  const ebGap = F * 0.42;
  const stackH = blockH + (eyebrow ? ebSize + ebGap : 0);
  const centerY = portrait ? H * 0.56 : H * 0.5;
  const blockTop = centerY - stackH / 2 + (eyebrow ? ebSize + ebGap : 0);

  const cx = -W * 0.6;
  const cy = H * 0.64;
  const T = W * TAIL;
  const T2 = W * REVEAL_TAIL;
  const r0 = Math.hypot(0 - cx, 0) - 2;
  const r1 = Math.hypot(W - cx, Math.max(cy, H - cy)) + T + 2;

  const boxTop = blockTop - F * 0.08;
  const boxRight = (i: number) =>
    padX + Math.min(widths[i] * F, maxW) + F * 0.1;
  const boxBottom = (i: number) =>
    blockTop + rowsOf(widths[i]) * F * 1.04 + F * 0.12;
  const far = (i: number) =>
    Math.max(
      Math.hypot(boxRight(i) - cx, boxTop - cy),
      Math.hypot(boxRight(i) - cx, boxBottom(i) - cy),
    );
  const near = (i: number) =>
    Math.hypot(
      padX - F * 0.1 - cx,
      Math.min(Math.max(cy, boxTop), boxBottom(i)) - cy,
    );

  const last = items.length - 1;
  const startOf = (k: number) => START + k * hold;
  const rRest = Math.max(
    W * 1.06 - cx,
    last > 0 ? far(last - 1) + W * 0.03 : 0,
  );
  const frontAt = (k: number, time: number) => {
    const end = k === last ? rRest : r1;
    const p = interpolate(time, [startOf(k), startOf(k) + wake], [0, 1], {
      ...CLAMP,
      easing: EASE_WAKE,
    });
    const breathe =
      k === last ? Math.sin((time - startOf(k)) / 22) * W * 0.006 * p : 0;
    return r0 + (end - r0) * p + breathe;
  };
  const erasedAt = (k: number) => {
    if (k === 0) return startOf(0);
    const target = far(k - 1);
    for (let s = 0; s <= wake; s += 0.25)
      if (frontAt(k, startOf(k) + s) >= target) return startOf(k) + s;
    return startOf(k) + wake;
  };
  const revealAt = (k: number, time: number) => {
    const t0 = erasedAt(k);
    if (time < t0) return 0;
    const p = interpolate(time, [t0, t0 + REVEAL_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_REVEAL,
    });
    const r = near(k) + (far(k) + T2 - near(k)) * p;
    return Math.min(r, frontAt(k, time) - 1);
  };

  let k = 0;
  for (let i = 0; i < items.length; i++) if (t >= startOf(i)) k = i;
  const R = frontAt(k, t);
  const R2 = revealAt(k, t);
  const at = `circle farthest-corner at ${cx.toFixed(1)}px ${cy.toFixed(1)}px`;

  const deep = accent;
  const tail = (a: number) =>
    `radial-gradient(${at}, transparent ${(R - T).toFixed(1)}px, ${mix(deep, 0.55 * a)} ${(R - T * 0.5).toFixed(1)}px, ${mix(c.edge[2], 0.82 * a)} ${(R - T * 0.2).toFixed(1)}px, ${mix(c.edge[1], 0.96 * a)} ${(R - T * 0.055).toFixed(1)}px, ${mix(c.edge[0], a)} ${(R - 2.5).toFixed(1)}px, ${mix(c.edge[0], a)} ${R.toFixed(1)}px, transparent ${(R + 1).toFixed(1)}px)`;
  const revealTint = (a: number) =>
    `radial-gradient(${at}, transparent ${(R2 - T2).toFixed(1)}px, ${mix(deep, 0.6 * a)} ${(R2 - T2 * 0.55).toFixed(1)}px, ${mix(c.edge[2], 0.9 * a)} ${(R2 - T2 * 0.22).toFixed(1)}px, ${mix(c.edge[1], a)} ${(R2 - T2 * 0.06).toFixed(1)}px, ${mix(c.edge[0], a)} ${(R2 - 1).toFixed(1)}px, transparent ${(R2 + 0.5).toFixed(1)}px)`;
  const inside = `radial-gradient(${at}, #000 ${(R2 - 0.5).toFixed(1)}px, transparent ${(R2 + 0.5).toFixed(1)}px)`;
  const outside = `radial-gradient(${at}, transparent ${(R - 0.5).toFixed(1)}px, #000 ${(R + 0.5).toFixed(1)}px)`;

  const textBlock: React.CSSProperties = {
    position: "absolute",
    left: padX,
    width: maxW,
    top: blockTop,
    fontFamily,
    fontWeight,
    fontSize: F,
    lineHeight: 1.04,
    letterSpacing: `${TRACK}em`,
    textWrap: "balance",
  };

  const revealEnd = erasedAt(last) + REVEAL_LEN;
  const settled = interpolate(t, [revealEnd - 4, revealEnd + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const finalFill = `linear-gradient(100deg, ${c.edge[1]} 0%, ${c.edge[2]} 45%, ${deep} 100%)`;

  type Mode = "ink" | "lit" | "final";
  const renderLine = (i: number, mode: Mode) => {
    const text = items[i];
    const h = i === last && highlight ? text.lastIndexOf(highlight) : -1;
    if (h < 0) return mode === "final" ? null : text;
    const word = text.slice(h, h + highlight.length);
    const wordStyle: React.CSSProperties =
      mode === "final"
        ? {
            backgroundImage: finalFill,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            opacity: settled,
          }
        : mode === "ink"
          ? { opacity: 1 - settled }
          : {};
    return (
      <>
        {text.slice(0, h)}
        <span style={wordStyle}>{word}</span>
        {text.slice(h + highlight.length)}
      </>
    );
  };

  const layer = (
    key: string,
    i: number,
    mode: Mode,
    style: React.CSSProperties,
  ) => (
    <div key={key} style={{ position: "absolute", inset: 0, ...style }}>
      <div style={textBlock}>{renderLine(i, mode)}</div>
    </div>
  );

  const eyebrowP = interpolate(t, [START + 8, START + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: tail(c.ground),
        }}
      />
      <ScaleLayer scale={scale}>
        {k > 0
          ? layer("old", k - 1, "ink", {
              color: fg,
              WebkitMaskImage: outside,
              maskImage: outside,
            })
          : null}
        {layer("new", k, "ink", {
          color: fg,
          WebkitMaskImage: inside,
          maskImage: inside,
        })}
        {k === last && highlight
          ? layer("final", k, "final", { color: "transparent" })
          : null}
        {layer("lit", k, "lit", {
          color: "transparent",
          backgroundImage: revealTint(k === last ? 1 - settled : 1),
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        })}
        {eyebrow ? (
          <div
            style={{
              position: "absolute",
              left: padX,
              top: blockTop - ebGap - ebSize,
              lineHeight: 1,
              fontFamily: mono.fontFamily,
              fontWeight: 400,
              fontSize: ebSize,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: c.muted,
              opacity: eyebrowP,
              transform: `translateY(${((1 - eyebrowP) * ebSize * 0.6).toFixed(2)}px)${glide(midway(eyebrowP))}`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
      </ScaleLayer>
      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
