"use client";

import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

// gradients.sh "fluted" palette
const FLUTED = {
  bg: "#050507",
  c: ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"],
} as const;

export interface FractionSplitProps {
  line?: string;
  highlight?: string;
  accentPiece?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const SEGS = 8;
const LEVELS = [
  { at: 24, label: "1/2", size: 4 },
  { at: 50, label: "1/4", size: 2 },
  { at: 76, label: "1/8", size: 1 },
];
const REG = 104;
const REG_LEN = 26;
const TEXT_IN = REG + 12;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const SPLIT_SPRING = { damping: 17, stiffness: 170, mass: 0.7 };

const THEMES = {
  dark: {
    bg: FLUTED.bg,
    fg: "#F3F2EF",
    muted: "#8B8A90",
    outline: "rgba(243,242,239,0.34)",
    hl: ["#6a9dff", FLUTED.c[2], "#ffb27e"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    outline: "rgba(18,18,20,0.34)",
    hl: [FLUTED.c[0], FLUTED.c[2], "#e85a26"],
    grain: 0.045,
  },
} as const;

function boundaryLevel(b: number) {
  if (b === 4) return 0;
  if (b === 2 || b === 6) return 1;
  return 2;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={37}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function FractionSplit({
  line = "Renders in 1/8 the time.",
  highlight = "1/8",
  accentPiece = 0,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: FractionSplitProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const ap = Math.max(0, Math.min(SEGS - 1, Math.round(accentPiece)));

  const cx = width / 2;
  const cy = height / 2;
  const barW = Math.min(width * 0.8, 1040 * u);
  const barH = 116 * u;
  const G = 14 * u;
  const R = 8 * u;
  const E = 3 * G;
  const textSize = 96 * u;
  const textLines = line.length * 0.43 * textSize > barW * 0.98 ? 2 : 1;
  const textH = textSize * textLines * 1.02;
  const textGap = 58 * u;
  const finalTop = cy - (barH + textGap + textH) / 2;

  const open: number[] = [0];
  for (let b = 1; b < SEGS; b++) {
    const lv = LEVELS[boundaryLevel(b)];
    const stagger = boundaryLevel(b) === 2 ? Math.abs(b - 4) * 0.6 : 0;
    open.push(
      spring({ frame: t - lv.at - stagger, fps, config: SPLIT_SPRING }),
    );
  }
  const totalGap = open.reduce((s, x) => s + x, 0) * G;
  const segW = (barW - totalGap) / SEGS;

  const reg = interpolate(t, [REG, REG + REG_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rise = interpolate(t, [REG, REG + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const drainOf = (j: number) => {
    const order = j > ap ? j - 1 : j;
    return interpolate(
      t,
      [REG + 2 + order * 1.5, REG + 16 + order * 1.5],
      [0, 1],
      { ...CLAMP, easing: EASE_IO },
    );
  };
  const left = cx - barW / 2 - (E / 2) * reg;
  const xs: number[] = [];
  let acc = left;
  for (let j = 0; j < SEGS; j++) {
    if (j > 0) acc += open[j] * G;
    xs.push(acc + (j > ap ? E * reg : 0));
    acc += segW;
  }
  const top = cy - barH / 2 + (finalTop - (cy - barH / 2)) * reg;

  const wipe = interpolate(t, [2, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const runs: { j0: number; j1: number }[] = [];
  for (let j = 0; j < SEGS; j++) {
    const solo = reg > 0 || j === 0 || open[j] > 0.002;
    if (solo) runs.push({ j0: j, j1: j });
    else runs[runs.length - 1].j1 = j;
  }

  const cornerAt = (b: number) =>
    b <= 0 || b >= SEGS ? R : R * Math.min(1, open[b] * 1.6 + reg);

  const labelStyle = {
    position: "absolute",
    left: 14 * u,
    fontFamily: sans,
    fontWeight: 500,
    fontSize: 20 * u,
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  } as const;
  const lastLabel = LEVELS[LEVELS.length - 1].label;
  const drift = interpolate(t, [REG, REG + REG_LEN + 50], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  // the palette's blue stop follows the accent prop
  const blue = accent;
  const flute = (deg: number) =>
    `linear-gradient(${deg + 12 * drift}deg, ${FLUTED.c[3]} 0%, ${FLUTED.c[2]} 30%, ${blue} 68%, ${FLUTED.c[0]} 100%)`;

  const pieces = runs.map(({ j0, j1 }) => {
    const x = xs[j0];
    const w = xs[j1] + segW - x;
    const rl = cornerAt(j0);
    const rr = cornerAt(j1 + 1);
    const box = {
      position: "absolute",
      left: x,
      top,
      width: w,
      height: barH,
      borderTopLeftRadius: rl,
      borderBottomLeftRadius: rl,
      borderTopRightRadius: rr,
      borderBottomRightRadius: rr,
    } as const;
    if (reg <= 0) {
      return <div key={`p${j0}-${j1}`} style={{ ...box, background: p.fg }} />;
    }
    const isAccent = j0 === ap;
    const fillH = barH * (isAccent ? rise : 1 - drainOf(j0));
    return (
      <div key={`p${j0}-${j1}`}>
        {isAccent ? null : (
          <div
            style={{
              ...box,
              boxSizing: "border-box",
              border: `${Math.max(1, 1.5 * u)}px solid ${p.outline}`,
            }}
          />
        )}
        <div
          style={{
            ...box,
            overflow: "hidden",
            background: isAccent ? p.fg : "transparent",
          }}
        >
          {isAccent ? (
            <div style={{ ...labelStyle, top: 12 * u, color: p.bg }}>
              {lastLabel}
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: fillH,
              overflow: "hidden",
              backgroundColor: p.fg,
              backgroundImage: isAccent ? flute(20) : undefined,
              backgroundSize: isAccent ? `${w}px ${barH}px` : undefined,
              backgroundPosition: "left bottom",
            }}
          >
            <div
              style={{
                ...labelStyle,
                top: 12 * u - (barH - fillH),
                color: isAccent ? "#FFFFFF" : p.bg,
              }}
            >
              {lastLabel}
            </div>
          </div>
        </div>
      </div>
    );
  });

  const labels: ReactNode[] = [];
  LEVELS.forEach((lv, li) => {
    const inK = interpolate(t, [lv.at + 6, lv.at + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const next = LEVELS[li + 1];
    const outK = next
      ? interpolate(t, [next.at - 5, next.at], [0, 1], CLAMP)
      : 0;
    if (!next && reg > 0) return;
    for (let g = 0; g < SEGS / lv.size; g++) {
      const j0 = g * lv.size;
      const op = inK * (1 - outK);
      if (op <= 0) continue;
      labels.push(
        <div
          key={`l${li}-${g.toString()}`}
          style={{
            ...labelStyle,
            left: xs[j0] + 14 * u,
            top: top + 12 * u,
            color: p.bg,
            opacity: op,
            transform: `translateY(${(1 - inK) * 6 * u}px)`,
          }}
        >
          {lv.label}
        </div>,
      );
    }
  });

  const idx = highlight ? line.indexOf(highlight) : -1;
  const words: { text: string; hl: boolean }[] = [];
  const pushWords = (s: string, hl: boolean) => {
    for (const w of s.split(/\s+/).filter(Boolean)) words.push({ text: w, hl });
  };
  if (idx >= 0) {
    pushWords(line.slice(0, idx), false);
    words.push({ text: highlight, hl: true });
    const rest = line.slice(idx + highlight.length);
    if (/^\S/.test(rest) && words.length) {
      const m = /^(\S+)(.*)$/.exec(rest);
      if (m) {
        words[words.length - 1] = {
          text: `${highlight}${m[1]}`,
          hl: true,
        };
        pushWords(m[2], false);
      }
    } else pushWords(rest, false);
  } else pushWords(line, false);

  const push = interpolate(t, [0, REG + REG_LEN + 40], [0.985, 1.01], {
    ...CLAMP,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <AbsoluteFill
          style={{
            clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          }}
        >
          {pieces}
          {labels}
        </AbsoluteFill>

        <div
          style={{
            position: "absolute",
            left: cx - barW * 0.5,
            width: barW,
            top: finalTop + barH + textGap,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: textSize,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            color: p.fg,
            textWrap: "balance",
          }}
        >
          {words.map((w, i) => {
            const k = interpolate(
              t,
              [TEXT_IN + i * 3, TEXT_IN + i * 3 + 18],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span key={`w${i.toString()}`}>
                <span
                  style={{
                    display: "inline-block",
                    color: w.hl ? "transparent" : p.fg,
                    ...(w.hl
                      ? {
                          fontWeight: 500,
                          paddingRight: "0.04em",
                          backgroundImage: `linear-gradient(${172 + 10 * drift}deg, ${p.hl[0]} 8%, ${blue} 32%, ${p.hl[1]} 70%, ${p.hl[2]} 94%)`,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                        }
                      : null),
                    opacity: k,
                    filter: k < 0.99 ? `blur(${(1 - k) * 8 * u}px)` : undefined,
                    transform: `translateY(${(1 - k) * 18 * u}px)`,
                  }}
                >
                  {w.text}
                </span>
                {i < words.length - 1 ? " " : null}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
