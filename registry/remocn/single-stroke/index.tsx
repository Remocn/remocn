"use client";

import { loadVariableFont } from "@remotion/google-fonts/Archivo";
import { getLength, getPointAtLength, reversePath } from "@remotion/paths";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const archivo = loadVariableFont("normal", { subsets: ["latin"] });

export interface SingleStrokeProps {
  value?: string;
  unit?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0E4D4A",
    panel: "#FF6B4A",
    panelInk: "#0E4D4A",
    stroke: "#FFC93C",
    hair: "rgba(244,233,216,0.55)",
    tip: "#F4E9D8",
  },
  light: {
    bg: "#F4E9D8",
    panel: "#0E4D4A",
    panelInk: "#F4E9D8",
    stroke: "#FF6B4A",
    hair: "rgba(14,77,74,0.4)",
    tip: "#0E4D4A",
  },
} as const;

interface Digit {
  d: string;
  s: [number, number];
  e: [number, number];
  rev?: boolean;
}

const DIGITS: Record<string, Digit> = {
  "0": {
    d: "M .31 0 C .5 0 .62 .2 .62 .5 C .62 .8 .5 1 .31 1 C .12 1 0 .8 0 .5 C 0 .2 .12 0 .31 0",
    s: [1, 0],
    e: [1, 0],
  },
  "1": {
    d: "M .12 .22 L .38 0 L .38 1",
    s: [0.76, -0.65],
    e: [0, 1],
  },
  "2": {
    d: "M .04 .24 C .08 .08 .2 0 .33 0 C .5 0 .6 .12 .6 .27 C .6 .42 .5 .52 .36 .64 L .02 1 L .62 1",
    s: [0.24, -0.97],
    e: [1, 0],
  },
  "3": {
    d: "M .05 .12 C .14 .04 .23 0 .32 0 C .48 0 .58 .1 .58 .24 C .58 .38 .47 .46 .3 .46 C .5 .46 .62 .57 .62 .72 C .62 .89 .49 1 .31 1 C .18 1 .08 .94 .02 .85",
    s: [0.75, -0.66],
    e: [0.35, 0.94],
  },
  "4": {
    d: "M .46 1 L .46 0 L 0 .7 L .64 .7",
    s: [0, -1],
    e: [1, 0],
  },
  "5": {
    d: "M .58 0 L .1 0 L .05 .44 C .14 .38 .23 .36 .33 .36 C .5 .36 .62 .48 .62 .66 C .62 .86 .49 1 .3 1 C .17 1 .07 .94 .02 .86",
    s: [-1, 0],
    e: [-0.53, -0.85],
    rev: true,
  },
  "6": {
    d: "M .54 .06 C .47 .02 .4 0 .33 0 C .12 0 0 .22 0 .55 C 0 .84 .13 1 .31 1 C .5 1 .62 .86 .62 .67 C .62 .48 .49 .36 .32 .36 C .16 .36 .04 .46 0 .6",
    s: [-0.87, -0.5],
    e: [-0.27, 0.96],
    rev: true,
  },
  "7": {
    d: "M 0 0 L .62 0 C .45 .25 .3 .6 .25 1",
    s: [1, 0],
    e: [0.45, 0.89],
  },
  "8": {
    d: "M .31 .46 C .14 .46 .04 .36 .04 .23 C .04 .1 .16 0 .31 0 C .46 0 .58 .1 .58 .23 C .58 .36 .48 .46 .31 .46 C .13 .46 0 .58 0 .73 C 0 .89 .13 1 .31 1 C .49 1 .62 .89 .62 .73 C .62 .58 .49 .46 .31 .46",
    s: [-1, 0],
    e: [-1, 0],
    rev: true,
  },
  "9": {
    d: "M .62 .38 C .58 .53 .46 .62 .3 .62 C .13 .62 0 .5 0 .31 C 0 .13 .13 0 .31 0 C .5 0 .62 .14 .62 .4 C .62 .76 .48 1 .24 1 C .16 1 .09 .98 .03 .95",
    s: [-0.26, 0.97],
    e: [-0.9, -0.43],
    rev: true,
  },
};

const ADV = 0.62;
const SPACE = 0.34;
const REACH = 0.26;
const JOIN_DY = 0.46;
const STROKE = 0.13;

const DRAW_AT = 16;
const DRAW_LEN = 46;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SWEEP = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function place(d: string, ox: number, oy: number, k: number): string {
  const tokens = d.split(" ").filter(Boolean);
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (/^[MLC]$/.test(tok)) {
      out.push(tok);
      i++;
      continue;
    }
    const x = Number(tok);
    const y = Number(tokens[i + 1]);
    out.push(`${(ox + x * k).toFixed(2)} ${(oy + y * k).toFixed(2)}`);
    i += 2;
  }
  return out.join(" ");
}

function buildPath(chars: string[], k: number, ox: number, oy: number) {
  const parts: string[] = [];
  let x = ox;
  let prevEnd: { p: [number, number]; dir: [number, number] } | null = null;
  for (const ch of chars) {
    const raw = DIGITS[ch];
    if (!raw) continue;
    const g: Digit = raw.rev
      ? {
          d: raw.d,
          s: [-raw.e[0], -raw.e[1]],
          e: [-raw.s[0], -raw.s[1]],
        }
      : raw;
    const forward = place(g.d, x, oy, k);
    const placed = raw.rev
      ? reversePath(forward)
          .replace(/([MLC])/g, " $1 ")
          .replace(/,/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : forward;
    const first = placed.split(" ");
    const sx = Number(first[1]);
    const sy = Number(first[2]);
    if (prevEnd && Math.abs(sy - prevEnd.p[1]) <= JOIN_DY * k) {
      const dist = Math.hypot(sx - prevEnd.p[0], sy - prevEnd.p[1]);
      const r = Math.min(REACH * k * 1.5, dist * 0.42);
      const c1x = prevEnd.p[0] + prevEnd.dir[0] * r;
      const c1y = prevEnd.p[1] + prevEnd.dir[1] * r;
      const c2x = sx - g.s[0] * r;
      const c2y = sy - g.s[1] * r;
      parts.push(
        `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${sx.toFixed(2)} ${sy.toFixed(2)}`,
      );
      parts.push(placed.replace(/^M \S+ \S+ ?/, ""));
    } else {
      parts.push(placed);
    }
    const nums = placed.split(" ").filter((s) => !/^[MLC]$/.test(s));
    const ex = Number(nums[nums.length - 2]);
    const ey = Number(nums[nums.length - 1]);
    prevEnd = { p: [ex, ey], dir: g.e };
    x += (ADV + SPACE) * k;
  }
  return parts.join(" ");
}

export function SingleStroke({
  value = "27",
  unit = "Mar",
  label = "Demo day. Every team shows a film.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SingleStrokeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const panelFill = theme === "dark" ? (accent ?? c.panel) : c.panel;
  const strokeFill = theme === "light" ? (accent ?? c.stroke) : c.stroke;

  const chars = useMemo(
    () => Array.from(value).filter((ch) => DIGITS[ch] !== undefined),
    [value],
  );
  const n = Math.max(1, chars.length);
  const unitsW = n * ADV + (n - 1) * SPACE;
  const portrait = H > W * 1.1;
  const M = Math.min(W, H) * 0.075;
  const split = portrait ? H * 0.62 : W * 0.6;
  const fieldW = portrait ? W : split;
  const fieldH = portrait ? split : H;
  const k = Math.min(
    (fieldW - M * 2.4) / (unitsW + STROKE),
    (fieldH - M * 2.4) / (1 + STROKE),
  );
  const ox = fieldW / 2 - (unitsW * k) / 2;
  const oy = fieldH / 2 - k / 2;

  const d = useMemo(() => buildPath(chars, k, ox, oy), [chars, k, ox, oy]);
  const len = useMemo(() => (d ? getLength(d) : 0), [d]);

  const intro = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const panelP = interpolate(t, [2, 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IN_OUT,
  });
  const p = interpolate(t, [DRAW_AT, DRAW_AT + DRAW_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_SWEEP,
  });
  const drawn = len * p;
  const tip = len > 0 && p > 0 && p < 1 ? getPointAtLength(d, drawn) : null;
  const tipFade = interpolate(p, [0, 0.04, 0.94, 1], [0, 1, 1, 0], CLAMP);

  const sw = STROKE * k;
  const hairW = Math.max(1.5, k * 0.012);
  const unitP = interpolate(
    t,
    [DRAW_AT + DRAW_LEN - 10, DRAW_AT + DRAW_LEN + 8],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );
  const labelAt = DRAW_AT + DRAW_LEN - 2;
  const words = label ? label.split(" ") : [];

  const panelBox = portrait
    ? { left: 0, top: split, width: W, height: H - split }
    : { left: split, top: 0, width: W - split, height: H };
  const unitSize = portrait ? W * 0.17 : H * 0.17;
  const labelSize = portrait ? W * 0.056 : H * 0.056;
  const text = {
    fontFamily: archivo.fontFamily,
    letterSpacing: "-0.01em",
    color: c.panelInk,
  };

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <path
          d={d}
          fill="none"
          stroke={c.hair}
          strokeWidth={hairW}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={intro * (1 - p * 0.6)}
          pathLength={len}
          strokeDasharray={`${len} ${len}`}
          strokeDashoffset={len * (1 - intro)}
        />
        <path
          d={d}
          fill="none"
          stroke={strokeFill}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${drawn} ${len + sw}`}
          opacity={p > 0 ? 1 : 0}
        />
        {tip ? (
          <circle
            cx={tip.x}
            cy={tip.y}
            r={sw * 0.22}
            fill={c.tip}
            opacity={0.8 * tipFade}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          ...panelBox,
          background: panelFill,
          clipPath: portrait
            ? `inset(${((1 - panelP) * 100).toFixed(3)}% 0 0 0)`
            : `inset(0 0 0 ${((1 - panelP) * 100).toFixed(3)}%)`,
        }}
      >
        {unit ? (
          <div
            style={{
              ...text,
              position: "absolute",
              left: M,
              top: M * 0.9,
              fontVariationSettings: '"wdth" 125, "wght" 500',
              fontSize: unitSize,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              whiteSpace: "pre",
              opacity: unitP,
              transform: `translateY(${((1 - unitP) * unitSize * 0.3).toFixed(2)}px)`,
            }}
          >
            {unit}
          </div>
        ) : null}
        {words.length > 0 ? (
          <div
            style={{
              ...text,
              position: "absolute",
              left: M,
              right: M,
              bottom: M,
              fontVariationSettings: '"wdth" 125, "wght" 420',
              fontSize: labelSize,
              lineHeight: 1.18,
              textWrap: "balance",
            }}
          >
            {words.map((w, i) => {
              const q = interpolate(
                t,
                [labelAt + i * 3, labelAt + i * 3 + 16],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <span key={`${w}-${i}`}>
                  <span
                    style={{
                      display: "inline-block",
                      opacity: q,
                      transform: `translateY(${((1 - q) * labelSize * 0.6).toFixed(2)}px)`,
                    }}
                  >
                    {w}
                  </span>
                  {i < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
