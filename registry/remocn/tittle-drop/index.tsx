"use client";

import { loadFont } from "@remotion/google-fonts/DMSans";
import { useLayoutEffect, useRef, useState } from "react";
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

const face = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
});

export interface TittleDropProps {
  /** The line. Every "i" and "j" is set dotless, a trailing "." is left open: the dots land there. */
  title?: string;
  /** Small grey line under the headline. */
  subline?: string;
  /** Which landing dot takes the accent (0-based, negative counts from the end). */
  accentDot?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  light: { bg: "#FAFAF9", fg: "#0E0E0D", muted: "#8C8C88", bubble: "#EDEDEA" },
  dark: { bg: "#0A0A0A", fg: "#F2F2F0", muted: "#7C7C79", bubble: "#1B1B1A" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

// Beats, in frames at 30fps (before `speed`).
const BUBBLE_IN = 0;
const RISE = 30;
const RISE_LEN = 30;
const SET = 34;
const WORD_STAGGER = 5;
const SET_LEN = 24;
const HOP0 = 72;
const HOP_GAP = 12;
const HOP_LEN = 17;
const SHIFT_LEN = 9;
/** The bubble is this much larger while it is alone on the stage. */
const SOLO_SCALE = 2.3;
/** Bubble scale once it waits above the line. */
const REST_SCALE = 1.3;
const DOTLESS: Record<string, string> = { i: "ı", j: "ȷ" };

interface Ink {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Target {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Index of the glyph span the dot crowns (-1 for the full stop). */
  glyph: number;
}

interface Layout {
  rowW: number;
  rowH: number;
  targets: Target[];
  /** Dot diameter in the bubble: the font's own tittle. */
  dot: number;
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Ink box of a glyph relative to its origin and baseline, read off a canvas.
 * With `topPart`, only the topmost island of ink (the tittle) is measured.
 */
function measureInk(
  char: string,
  family: string,
  fontSize: number,
  topPart: boolean,
): Ink | null {
  const k = 4;
  const size = fontSize * k;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size * 2);
  canvas.height = Math.ceil(size * 2);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const ox = Math.round(size * 0.5);
  const by = Math.round(size * 1.3);
  ctx.font = `400 ${size}px ${family}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(char, ox, by);
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const rowHasInk = (y: number) => {
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 127) return true;
    return false;
  };
  let top = -1;
  for (let y = 0; y < height; y++) {
    if (rowHasInk(y)) {
      top = y;
      break;
    }
  }
  if (top < 0) return null;
  let bottom = top;
  if (topPart) {
    while (bottom < height && rowHasInk(bottom)) bottom++;
  } else {
    for (let y = height - 1; y >= top; y--) {
      if (rowHasInk(y)) {
        bottom = y + 1;
        break;
      }
    }
  }
  let left = width;
  let right = 0;
  for (let y = top; y < bottom; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 127) {
        if (x < left) left = x;
        if (x + 1 > right) right = x + 1;
      }
    }
  }
  return {
    left: (left - ox) / k,
    right: (right - ox) / k,
    top: (top - by) / k,
    bottom: (bottom - by) / k,
  };
}

function sameLayout(a: Layout | null, b: Layout) {
  return (
    a !== null &&
    a.rowW === b.rowW &&
    a.rowH === b.rowH &&
    a.dot === b.dot &&
    a.targets.map((t) => `${t.x},${t.y}`).join() ===
      b.targets.map((t) => `${t.x},${t.y}`).join()
  );
}

export function TittleDrop({
  title = "Ship it in minutes.",
  subline = "Launch videos from ready-made Remotion components.",
  accentDot = -1,
  accent = "#3B5BFD",
  theme = "light",
  speed = 1,
}: TittleDropProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];

  const fontSize = Math.round(width * 0.076);
  const subSize = Math.round(width * 0.0165);
  const chars = Array.from(title);
  const hasStop = chars.at(-1) === ".";
  const wordOf: number[] = [];
  chars.forEach((ch, i) => {
    wordOf.push((wordOf[i - 1] ?? 0) + (ch === " " ? 1 : 0));
  });

  const rowRef = useRef<HTMLDivElement>(null);
  const glyphRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const baseRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [handle] = useState(() => delayRender("tittle-drop: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    face
      .waitUntilDone()
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!live) return;
        const row = rowRef.current;
        const base = baseRef.current;
        if (row && base) {
          const family = face.fontFamily.includes('"')
            ? face.fontFamily
            : `"${face.fontFamily}"`;
          const rowRect = row.getBoundingClientRect();
          // Studio scales the stage; work in unscaled composition pixels.
          const scale = rowRect.width / row.offsetWidth || 1;
          const baseline = base.offsetTop;
          const inks: Record<string, Ink | null> = {};
          const targets: Target[] = [];
          chars.forEach((ch, i) => {
            const isStop = hasStop && i === chars.length - 1;
            if (!DOTLESS[ch] && !isStop) return;
            const el = glyphRefs.current[i];
            if (!el) return;
            if (!(ch in inks))
              inks[ch] = measureInk(ch, family, fontSize, !isStop);
            const ink = inks[ch];
            if (!ink) return;
            const x0 = (el.getBoundingClientRect().left - rowRect.left) / scale;
            targets.push({
              x: x0 + (ink.left + ink.right) / 2,
              y: baseline + (ink.top + ink.bottom) / 2,
              w: ink.right - ink.left,
              h: ink.bottom - ink.top,
              glyph: isStop ? -1 : i,
            });
          });
          const tittle = targets.find((x) => x.glyph >= 0);
          const next: Layout = {
            rowW: row.offsetWidth,
            rowH: row.offsetHeight,
            targets,
            dot: tittle ? (tittle.w + tittle.h) / 2 : fontSize * 0.12,
          };
          setLayout((prev) => (sameLayout(prev, next) ? prev : next));
        }
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [title, fontSize, handle]);

  const targets = layout?.targets ?? [];
  const n = targets.length;
  const d = layout?.dot ?? fontSize * 0.12;
  const accentIndex = n === 0 ? -1 : ((accentDot % n) + n) % n;

  // The bubble: in, alone and large, then up to its place above the line.
  const bubbleIn = interpolate(frame, [BUBBLE_IN, BUBBLE_IN + 16], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const rise = interpolate(frame, [RISE, RISE + RISE_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const rowW = layout?.rowW ?? 0;
  const rowH = layout?.rowH ?? 0;
  const bubbleX = rowW / 2;
  const bubbleY = interpolate(rise, [0, 1], [rowH / 2, -fontSize * 0.42]);
  const bubbleScale =
    interpolate(rise, [0, 1], [SOLO_SCALE, REST_SCALE]) *
    interpolate(bubbleIn, [0, 1], [0.86, 1]);

  // Queue: three dots wait in the bubble, the front one hops, the rest shuffle
  // forward and a new one surfaces at the back until the line is dotted.
  const hopStart = (k: number) => HOP0 + k * HOP_GAP;
  let departed = 0;
  for (let k = 0; k < n; k++) {
    departed += interpolate(
      frame,
      [hopStart(k) + 2, hopStart(k) + 2 + SHIFT_LEN],
      [0, 1],
      { ...clamp, easing: EASE_IN_OUT },
    );
  }
  const waiting = n === 0 ? 3 : Math.min(3, n - departed);
  const gap = d * 2.05;
  const padX = d * 1.35;
  const bubbleW = 2 * padX + Math.max(0, waiting - 1) * gap + d;
  const bubbleH = d * 3.3;
  // Once the last dot leaves, the empty bubble folds away.
  const empty = Math.min(1, waiting);
  const bubbleOpacity = bubbleIn * empty ** 3;
  const bubbleK = bubbleScale * (0.4 + 0.6 * empty);

  const slotX = (slot: number) =>
    bubbleX + (slot - (waiting - 1) / 2) * gap * bubbleScale;
  const bounce = (slot: number) => {
    const u = (((frame - slot * 5) % 26) + 26) % 26;
    return u < 13 ? Math.sin((u / 13) * Math.PI) : 0;
  };

  let lastLand = HOP0;
  if (n > 0) lastLand = hopStart(n - 1) + HOP_LEN;

  const dots = targets.map((target, k) => {
    const start = hopStart(k);
    const land = start + HOP_LEN;
    const isAccent = k === accentIndex;
    const ink = isAccent ? accent : t.fg;
    if (frame < start) {
      const slot = k - departed;
      if (slot > 3) return null;
      const show = interpolate(slot, [2, 3], [1, 0], clamp);
      const b = bounce(Math.round(slot));
      const pre = interpolate(frame, [start - 3, start], [0, 1], clamp);
      return {
        key: k,
        x: slotX(slot),
        y: bubbleY - b * d * 0.42 * bubbleScale,
        w: d * bubbleScale,
        h: d * bubbleScale * (1 - pre * 0.22),
        sx: 1 + pre * 0.12,
        color: t.muted,
        opacity: bubbleIn * show * (0.55 + 0.45 * b),
      };
    }
    const p = interpolate(frame, [start, land], [0, 1], clamp);
    const sx0 = slotX(0);
    const x = interpolate(p, [0, 1], [sx0, target.x]);
    const lift = fontSize * 0.42 + Math.max(0, bubbleY - target.y) * 0.5;
    const y =
      interpolate(p, [0, 1], [bubbleY, target.y]) - lift * 4 * p * (1 - p);
    const dt = frame - land;
    const squash = dt >= 0 ? Math.exp(-dt / 4.5) * Math.cos(dt * 0.5) * 0.3 : 0;
    const stretch = dt < 0 ? Math.sin(p * Math.PI) * 0.12 : 0;
    const colorP = interpolate(p, [0, 0.6], [0, 1], clamp);
    return {
      key: k,
      x,
      y,
      w: interpolate(p, [0, 1], [d * bubbleScale, target.w]),
      h: interpolate(p, [0, 1], [d * bubbleScale, target.h]),
      sx: (1 + squash * 0.8) * (1 - stretch * 0.5),
      sy: (1 - squash) * (1 + stretch),
      color: interpolateColors(colorP, [0, 1], [t.muted, ink]),
      opacity: 1,
    };
  });

  // A tiny give in the stem the moment its dot lands.
  const dip = (glyph: number) => {
    const k = targets.findIndex((x) => x.glyph === glyph);
    if (k < 0) return 0;
    const dt = frame - (hopStart(k) + HOP_LEN);
    if (dt < 0 || dt > 9) return 0;
    return Math.sin((dt / 9) * Math.PI) * fontSize * 0.028;
  };

  const subStart = lastLand + 8;
  const subP = interpolate(frame, [subStart, subStart + 30], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill
      style={{
        background: t.bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: face.fontFamily,
      }}
    >
      <div
        ref={rowRef}
        style={{
          position: "relative",
          whiteSpace: "pre",
          fontSize,
          fontWeight: 400,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          color: t.fg,
          marginTop: height * 0.02,
        }}
      >
        {chars.map((ch, i) => {
          const isStop = hasStop && i === chars.length - 1;
          const p = interpolate(
            frame,
            [
              SET + wordOf[i] * WORD_STAGGER,
              SET + wordOf[i] * WORD_STAGGER + SET_LEN,
            ],
            [0, 1],
            { ...clamp, easing: EASE_OUT },
          );
          return (
            <span
              key={i}
              ref={(el) => {
                glyphRefs.current[i] = el;
              }}
              style={{
                position: "relative",
                top: (1 - p) * fontSize * 0.2 + dip(i),
                opacity: isStop ? 0 : p,
                filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined,
              }}
            >
              {DOTLESS[ch] ?? ch}
            </span>
          );
        })}
        <span
          ref={baseRef}
          style={{ display: "inline-block", width: 0, height: 0 }}
        />
        <div
          style={{
            position: "absolute",
            left: bubbleX - (bubbleW * bubbleK) / 2,
            top: bubbleY - (bubbleH * bubbleK) / 2,
            width: bubbleW * bubbleK,
            height: bubbleH * bubbleK,
            borderRadius: (bubbleH * bubbleK) / 2,
            background: t.bubble,
            opacity: layout ? bubbleOpacity : 0,
            filter: bubbleIn < 1 ? `blur(${(1 - bubbleIn) * 8}px)` : undefined,
          }}
        />
        {layout
          ? dots.map((dot) =>
              dot ? (
                <div
                  key={dot.key}
                  style={{
                    position: "absolute",
                    left: dot.x - dot.w / 2,
                    top: dot.y - dot.h / 2,
                    width: dot.w,
                    height: dot.h,
                    borderRadius: "50%",
                    background: dot.color,
                    opacity: dot.opacity,
                    transformOrigin: "50% 100%",
                    transform: `scale(${dot.sx}, ${dot.sy ?? 1})`,
                  }}
                />
              ) : null,
            )
          : null}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            marginTop: fontSize * 0.36,
            transform: `translate(-50%, ${(1 - subP) * 12}px)`,
            whiteSpace: "nowrap",
            fontSize: subSize,
            letterSpacing: "-0.005em",
            lineHeight: 1.4,
            color: t.muted,
            opacity: subP,
            filter: `blur(${(1 - subP) * 8}px)`,
          }}
        >
          {subline}
        </div>
      </div>
    </AbsoluteFill>
  );
}
