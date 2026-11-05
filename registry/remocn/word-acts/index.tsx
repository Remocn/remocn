"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Geist";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["100", "200", "300", "400", "500"],
  subsets: ["latin"],
});

export type WordAct = "stretch" | "split" | "heavy" | "faster" | "rebuilt";

export interface WordActBeat {
  word: string;
  act: WordAct;
  /** Frames this act stays on screen. The last act also gets `hold`. */
  frames?: number;
}

export interface WordActsProps {
  /**
   * Each word performs its meaning. `rebuilt` draws its word from geometric
   * strokes, so it supports lowercase a–z only.
   */
  acts?: WordActBeat[];
  /** Extra frames the final word holds as a poster. */
  hold?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_FRAMES: Record<WordAct, number> = {
  stretch: 26,
  split: 26,
  heavy: 28,
  faster: 22,
  rebuilt: 42,
};

const DEFAULT_ACTS: WordActBeat[] = [
  { word: "stretch", act: "stretch" },
  { word: "split", act: "split" },
  { word: "heavy", act: "heavy" },
  { word: "faster", act: "faster" },
  { word: "rebuilt", act: "rebuilt" },
];

const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F5F4F0", guide: "rgba(245,244,240,0.14)" },
  light: { bg: "#F5F4F0", fg: "#0A0A0B", guide: "rgba(10,10,11,0.14)" },
} as const;

/**
 * gradients.sh "halo": blue through rose into amber and a warm white. The
 * neighbours mix cleanly (violet, coral) so a sweep never goes muddy.
 */
const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;
const inkStops = (theme: "dark" | "light") =>
  theme === "dark"
    ? [HALO[3], HALO[2], HALO[1], HALO[0]]
    : [HALO[3], HALO[2], HALO[1]];

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Geist 400–500 advance per lowercase character at display tracking, in em. */
const ADVANCE = 0.44;
/** Geist with lineHeight 1: baseline and x-height middle from the top. */
const BASELINE = 0.855;
const X_MID = 0.59;

interface ActProps {
  word: string;
  t: number;
  dur: number;
  W: number;
  H: number;
  fg: string;
  accent: string;
  /** Three palette stops for the marks and the rebuilt strokes. */
  ink: string[];
  guide: string;
  fps: number;
}

const fitSize = (word: string, target: number, maxWidth: number) =>
  Math.min(target, maxWidth / Math.max(1, word.length * ADVANCE));

const wordStyle = (size: number, weight: number): React.CSSProperties => ({
  fontFamily: display,
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  whiteSpace: "nowrap",
});

function Stretch({ word, t, W, H, fg }: ActProps) {
  const size = fitSize(word, H * 0.3, W * 0.42);
  const p = interpolate(t, [2, 17], [0, 1], { ...CLAMP, easing: EASE_IO });
  const sx = 1 + p * 0.95;
  const sy = 1 - p * 0.06;
  // The stems thin out as the word is pulled, like taffy, so the stretched
  // word never reads heavier than the 500 it starts at.
  const wght = Math.round(500 - p * 230);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          ...wordStyle(size, 500),
          fontVariationSettings: `"wght" ${wght}`,
          color: fg,
          transform: `scale(${sx}, ${sy})`,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
}

function Split({ word, t, W, H, fg, ink }: ActProps) {
  const size = fitSize(word, H * 0.4, W * 0.6);
  const draw = interpolate(t, [2, 8], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const open = interpolate(t, [8, 19], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const lineFade = interpolate(t, [9, 15], [1, 0], CLAMP);
  const dx = open * W * 0.034;
  const dy = open * size * 0.035;
  const width = word.length * ADVANCE * size;
  const half = (top: boolean) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: top ? 0 : X_MID * size,
        height: top ? X_MID * size : size * 0.6,
        overflow: "hidden",
        transform: `translate(${top ? -dx : dx}px, ${top ? -dy : dy}px)`,
      }}
    >
      <div
        style={{
          ...wordStyle(size, 500),
          color: fg,
          textAlign: "center",
          marginTop: top ? 0 : -X_MID * size,
        }}
      >
        {word}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: width * 1.3, height: size }}>
        {half(true)}
        {half(false)}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: X_MID * size - H * 0.003,
            height: Math.max(2, H * 0.006),
            width: `${draw * 100}%`,
            backgroundImage: `linear-gradient(90deg, ${ink.join(", ")})`,
            opacity: lineFade,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function Heavy({ word, t, W, H, fg, ink, fps }: ActProps) {
  const size = fitSize(word, H * 0.36, W * 0.58);
  const LAND = 9;
  const fall = interpolate(t, [0, LAND], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });
  const restTop = H * 0.5 - size * 0.55;
  const startTop = -size * 0.62;
  const impact = spring({
    frame: t - LAND,
    fps,
    config: { damping: 9, stiffness: 260, mass: 0.7 },
  });
  // impact: 0 → 1 with a small ring; squash peaks right at contact.
  const ring = t < LAND ? 0 : 1 - impact;
  const squash = Math.max(-0.05, ring) * 0.16;
  const sy = 1 - squash;
  const sx = 1 + squash * 0.45;
  const top = startTop + (restTop - startTop) * fall;
  const ruleDip = t < LAND ? 0 : ring * H * 0.018;
  const ruleWidth = word.length * ADVANCE * size * 1.12;
  const baseline = restTop + BASELINE * size;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top,
          textAlign: "center",
          ...wordStyle(size, 500),
          // Weight builds with the fall, hairline to 500; the face is variable.
          fontVariationSettings: `"wght" ${Math.round(100 + fall * 400)}`,
          color: fg,
          transform: `scale(${sx}, ${sy})`,
          transformOrigin: `50% ${BASELINE * 100}%`,
        }}
      >
        {word}
      </div>
      <div
        style={{
          position: "absolute",
          left: (W - ruleWidth) / 2,
          width: ruleWidth,
          top: baseline + size * 0.27 + ruleDip,
          height: Math.max(3, H * 0.006),
          backgroundImage: `linear-gradient(90deg, ${ink.join(", ")})`,
        }}
      />
    </AbsoluteFill>
  );
}

function Faster({ word, t, W, H, fg, ink }: ActProps) {
  const size = fitSize(word, H * 0.34, W * 0.6);
  const SNAP = 7;
  const overshoot = -W * 0.018;
  const posAt = (f: number) => {
    if (f < SNAP) {
      const run = interpolate(f, [0, SNAP], [0, 1], {
        ...CLAMP,
        easing: Easing.bezier(0.1, 0.6, 0.2, 1),
      });
      return W * 0.95 * (1 - run) + overshoot * run;
    }
    const settle = interpolate(f, [SNAP, SNAP + 5], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return overshoot * (1 - settle);
  };
  const x = posAt(t);
  const v = Math.min(1, Math.max(0, posAt(t - 1) - x) / (W * 0.12));
  // Leans into the rush, then rocks back past upright as it snaps.
  const rock = interpolate(t, [SNAP, SNAP + 2, SNAP + 6], [0, 4, 0], CLAMP);
  const skew = -14 * v + rock;
  const width = word.length * ADVANCE * size;
  const lines = [0.42, 0.56, 0.68, 0.8];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          transform: `translateX(${x}px)`,
        }}
      >
        <div
          style={{
            ...wordStyle(size, 500),
            color: fg,
            transform: `skewX(${skew}deg)`,
          }}
        >
          {word}
        </div>
        {lines.map((y, i) => {
          const len = v * W * (0.22 + ((i * 37) % 11) / 45);
          return (
            <div
              key={y}
              style={{
                position: "absolute",
                left: width * 0.96 + (i % 2) * size * 0.1,
                top: y * size,
                width: len,
                height: Math.max(2, size * 0.026),
                borderRadius: H,
                backgroundImage:
                  i === 1
                    ? `linear-gradient(90deg, ${ink[0]}, ${ink[1]} 70%, transparent)`
                    : `linear-gradient(90deg, ${fg}, transparent)`,
                opacity: v > 0.03 ? 1 : 0,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/* ---------- rebuilt: a geometric stroke alphabet ---------- */

type Stroke =
  | { k: "l"; x1: number; y1: number; x2: number; y2: number }
  | { k: "a"; cx: number; cy: number; r: number; a0: number; a1: number }
  | { k: "p"; pts: [number, number][] }
  | { k: "d"; cx: number; cy: number; r: number };

const L = (x1: number, y1: number, x2: number, y2: number): Stroke => ({
  k: "l",
  x1,
  y1,
  x2,
  y2,
});
const A = (
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): Stroke => ({
  k: "a",
  cx,
  cy,
  r,
  a0,
  a1,
});
const P = (...pts: [number, number][]): Stroke => ({ k: "p", pts });
const D = (cx: number, cy: number, r: number): Stroke => ({
  k: "d",
  cx,
  cy,
  r,
});

const O = A(25, -25, 19, 0, 360);
const SW = 8;
const XH = 50;
const ASC = 78;
const GAP = 8;

const GLYPHS: Record<string, { w: number; s: Stroke[] }> = {
  a: { w: 50, s: [O, L(44, -50, 44, 0)] },
  b: { w: 50, s: [L(6, -ASC, 6, 0), O] },
  c: { w: 46, s: [A(25, -25, 19, -45, -315)] },
  d: { w: 50, s: [O, L(44, -ASC, 44, 0)] },
  e: { w: 50, s: [L(6, -25, 44, -25), A(25, -25, 19, 0, -318)] },
  f: {
    w: 32,
    s: [L(14, -59, 14, 0), A(27, -59, 13, 180, 320), L(0, -44, 30, -44)],
  },
  g: { w: 50, s: [O, L(44, -50, 44, 8), A(25, 8, 19, 0, 150)] },
  h: {
    w: 50,
    s: [L(6, -ASC, 6, 0), A(25, -25, 19, 180, 360), L(44, -25, 44, 0)],
  },
  i: { w: 12, s: [L(6, -50, 6, 0), D(6, -67, 7.5)] },
  j: { w: 16, s: [L(10, -50, 10, 10), A(-6, 10, 16, 0, 140), D(10, -67, 7.5)] },
  k: { w: 44, s: [L(6, -ASC, 6, 0), L(42, -50, 6, -16), L(20, -29, 44, 0)] },
  l: { w: 12, s: [L(6, -ASC, 6, 0)] },
  m: {
    w: 80,
    s: [
      L(6, -50, 6, 0),
      A(23, -27, 17, 180, 360),
      L(40, -27, 40, 0),
      A(57, -27, 17, 180, 360),
      L(74, -27, 74, 0),
    ],
  },
  n: {
    w: 50,
    s: [L(6, -50, 6, 0), A(25, -25, 19, 180, 360), L(44, -25, 44, 0)],
  },
  o: { w: 50, s: [O] },
  p: { w: 50, s: [L(6, -50, 6, 26), O] },
  q: { w: 50, s: [O, L(44, -50, 44, 26)] },
  r: { w: 34, s: [L(6, -50, 6, 0), A(25, -25, 19, 180, 290)] },
  s: { w: 44, s: [A(23, -37, 11, -25, -270), A(23, -14, 11, -90, 155)] },
  t: { w: 30, s: [L(14, -70, 14, 0), L(0, -44, 30, -44)] },
  u: {
    w: 50,
    s: [L(6, -50, 6, -25), A(25, -25, 19, 180, 0), L(44, -50, 44, 0)],
  },
  v: { w: 46, s: [P([3, -50], [23, -10], [43, -50])] },
  w: { w: 66, s: [P([2, -50], [18, -10], [33, -46], [48, -10], [64, -50])] },
  x: { w: 46, s: [L(4, -50, 42, 0), L(42, -50, 4, 0)] },
  y: { w: 46, s: [L(3, -50, 23, -4), L(43, -50, 12, 26)] },
  z: { w: 46, s: [P([4, -44], [40, -44], [6, -6], [42, -6])] },
};

const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const delta = a1 - a0;
  if (Math.abs(delta) >= 360) {
    const [x0, y0] = pt(cx, cy, r, a0);
    const [xm, ym] = pt(cx, cy, r, a0 + 180);
    return `M${x0} ${y0}A${r} ${r} 0 1 1 ${xm} ${ym}A${r} ${r} 0 1 1 ${x0} ${y0}`;
  }
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const large = Math.abs(delta) > 180 ? 1 : 0;
  const sweep = delta > 0 ? 1 : 0;
  return `M${x0} ${y0}A${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
}

function strokeCenter(s: Stroke): [number, number] {
  switch (s.k) {
    case "l":
      return [(s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2];
    case "d":
      return [s.cx, s.cy];
    case "p": {
      const xs = s.pts.map((p) => p[0]);
      const ys = s.pts.map((p) => p[1]);
      return [
        (Math.min(...xs) + Math.max(...xs)) / 2,
        (Math.min(...ys) + Math.max(...ys)) / 2,
      ];
    }
    case "a": {
      if (Math.abs(s.a1 - s.a0) >= 360) return [s.cx, s.cy];
      const [x, y] = pt(s.cx, s.cy, s.r * 0.6, (s.a0 + s.a1) / 2);
      return [x, y];
    }
  }
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function Rebuilt({ word, t, W, H, ink, guide }: ActProps) {
  const gradId = `wa-ink-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const letters = word.toLowerCase().split("");
  let cursor = 0;
  const placed: { s: Stroke; ox: number }[] = [];
  for (const ch of letters) {
    const g = GLYPHS[ch];
    if (!g) {
      cursor += 26 + GAP;
      continue;
    }
    for (const s of g.s) placed.push({ s, ox: cursor });
    cursor += g.w + GAP;
  }
  const total = Math.max(1, cursor - GAP);
  const unit = Math.min((W * 0.6) / total, (H * 0.46) / (ASC + 26));
  const midX = total / 2;
  const midY = -XH / 2;

  const n = placed.length;
  const OUT0 = 5;
  const OUT1 = 16;
  const IN0 = 22;
  const IN1 = 36;
  const guides = Math.min(
    interpolate(t, [OUT0, OUT1], [0, 1], CLAMP),
    interpolate(t, [IN1 - 4, IN1 + 6], [1, 0], CLAMP),
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <svg
        width={W}
        height={H}
        viewBox={`${-W / 2 / unit + midX} ${-H / 2 / unit + midY} ${W / unit} ${H / unit}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          {/* The palette is fixed to the word's footprint: scattered strokes
              carry the colour of where they belong, and the poster reads as
              one sweep from blue to warm. */}
          {placed.map(({ ox }, i) => (
            // Each stroke is drawn in its glyph's local space, so its
            // gradient is shifted back by the glyph's home offset.
            <linearGradient
              key={i}
              id={`${gradId}-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={-ox}
              y1={-ASC}
              x2={total - ox}
              y2={0}
            >
              {ink.map((c, k) => (
                <stop key={c} offset={k / (ink.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          ))}
        </defs>
        {[0, -XH, -ASC].map((y) => (
          <line
            key={y}
            x1={midX - W / unit}
            x2={midX + W / unit}
            y1={y}
            y2={y}
            stroke={guide}
            strokeWidth={1 / unit}
            opacity={guides}
          />
        ))}
        {placed.map(({ s, ox }, i) => {
          const [cx, cy] = strokeCenter(s);
          const gx = cx + ox;
          const order = i / Math.max(1, n - 1);
          const out = interpolate(
            t,
            [OUT0 + order * 3, OUT1 + order * 3],
            [0, 1],
            { ...CLAMP, easing: EASE_IO },
          );
          const back = interpolate(
            t,
            [IN0 + order * 5, IN1 + order * 5 - 4],
            [0, 1],
            { ...CLAMP, easing: Easing.bezier(0.2, 1.25, 0.4, 1) },
          );
          const e = out * (1 - back);
          const ex = (gx - midX) * 0.26 + (hash(i + 1) - 0.5) * 18;
          const ey = (cy - midY) * 0.7 + (hash(i + 7) - 0.5) * 56;
          const rot = (hash(i + 13) - 0.5) * 70;
          const transform = `translate(${ox + ex * e} ${ey * e}) rotate(${rot * e} ${cx} ${cy})`;
          if (s.k === "d") {
            return (
              <g key={i} transform={transform}>
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={s.r * 0.8}
                  fill={`url(#${gradId}-${i})`}
                />
              </g>
            );
          }
          const d =
            s.k === "l"
              ? `M${s.x1} ${s.y1}L${s.x2} ${s.y2}`
              : s.k === "a"
                ? arcPath(s.cx, s.cy, s.r, s.a0, s.a1)
                : `M${s.pts.map((p) => p.join(" ")).join("L")}`;
          return (
            <g key={i} transform={transform}>
              <path
                d={d}
                fill="none"
                stroke={`url(#${gradId}-${i})`}
                strokeWidth={SW}
                strokeLinecap="butt"
                strokeLinejoin="miter"
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}

const ACTS: Record<WordAct, (p: ActProps) => React.ReactElement> = {
  stretch: Stretch,
  split: Split,
  heavy: Heavy,
  faster: Faster,
  rebuilt: Rebuilt,
};

export function WordActs({
  acts = DEFAULT_ACTS,
  hold = 32,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: WordActsProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];

  let start = 0;
  let index = acts.length - 1;
  let local = 0;
  let dur = 1;
  for (let i = 0; i < acts.length; i++) {
    const len = acts[i].frames ?? DEFAULT_FRAMES[acts[i].act];
    const last = i === acts.length - 1;
    if (frame < start + len || last) {
      index = i;
      local = frame - start;
      dur = len + (last ? hold : 0);
      break;
    }
    start += len;
  }
  const beat = acts[index];
  const Act = ACTS[beat.act];

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, overflow: "hidden" }}>
      {beat ? (
        <Act
          word={beat.word}
          t={local}
          dur={dur}
          W={W}
          H={H}
          fg={c.fg}
          accent={accent}
          ink={inkStops(theme)}
          guide={c.guide}
          fps={fps}
        />
      ) : null}
    </AbsoluteFill>
  );
}
