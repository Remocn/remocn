"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const rubik = loadRubik("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface SequelNumeralProps {
  name?: string;
  numeral?: string;
  tagline?: string;
  accent?: string;
  /** Color of the name; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the numeral and tagline. Load it yourself; Rubik by default. */
  fontFamily?: string;
  /** Replaces the remocn logo when `name` is "remocn". */
  logo?: React.ReactNode;
  /** Frames the numeral sits as a superscript before it drops and grows. */
  hold?: number;
  /** Size of the lockup and tagline, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        whiteSpace: "pre",
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

const RED = "#E60012";

const THEMES = {
  dark: { bg: "#000000", ink: "#FFFFFF", soft: "rgba(255,255,255,0.64)" },
  light: { bg: "#FFFFFF", ink: "#000000", soft: "rgba(0,0,0,0.6)" },
} as const;

const NUM_TRACK = -0.03;
const LOGO_CAP = 0.76;
const SUP = 0.52;

const NAME_AT = 0;
const SUP_AT = 10;
const DROP_AT = 42;
const DROP_LEN = 10;
const GROW_AT = 50;
const SETTLE_LEN = 26;
const TAG_AT = 82;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_DROP = Easing.bezier(0.55, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  name: number;
  nameBase: number;
  num: number;
  numCap: number;
  numBase: number;
  tagline: number;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const isRemocn = (name: string) => name.trim().toLowerCase() === "remocn";

const baseOf = (asc: number, desc: number) => (1 - (asc + desc)) / 2 + asc;

function measure(
  name: string,
  numeral: string,
  tagline: string,
  font: string,
): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("sequel-numeral: no 2d context");
  ctx.font = `600 100px "${manrope.fontFamily}"`;
  const nameText = isRemocn(name) ? "emocn" : name;
  const nameRaw =
    ctx.measureText(nameText).width / 100 - 0.025 * nameText.length;
  const nameW = isRemocn(name)
    ? nameRaw + 0.04 + (LOGO_CAP * 124.06) / 134.26
    : nameRaw;
  const nm = ctx.measureText("e");
  const nameBase = baseOf(
    nm.fontBoundingBoxAscent / 100,
    nm.fontBoundingBoxDescent / 100,
  );

  ctx.font = `500 100px "${font}"`;
  const nmText = numeral || "2";
  const fm = ctx.measureText(nmText);
  const num =
    fm.width / 100 + NUM_TRACK * Math.max(0, Array.from(nmText).length - 1);
  const numCap = fm.actualBoundingBoxAscent / 100;
  const numBase = baseOf(
    fm.fontBoundingBoxAscent / 100,
    fm.fontBoundingBoxDescent / 100,
  );

  ctx.font = `400 100px "${font}"`;
  const tagW = tagline ? ctx.measureText(tagline).width / 100 : 0;
  return { name: nameW, nameBase, num, numCap, numBase, tagline: tagW };
}

function useMetrics(
  name: string,
  numeral: string,
  tagline: string,
  font: string,
) {
  const key = [name, numeral, tagline, font].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("sequel-numeral: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [n, nu, tg, f] = key.split("\u0001");
    Promise.all([
      rubik.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`500 100px "${f}"`),
      document.fonts.load(`400 100px "${f}"`),
      document.fonts.load(`600 100px "${manrope.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(n, nu, tg, f) });
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

export function SequelNumeral({
  name = "remocn",
  numeral = "2",
  tagline = "Part two. Out now.",
  accent = RED,
  ink,
  background,
  fontFamily = rubik.fontFamily,
  logo,
  hold = DROP_AT - SUP_AT,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: SequelNumeralProps) {
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, fps } = useSceneConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const m = useMetrics(name, numeral, tagline, fontFamily);
  const dropAt = SUP_AT + hold;
  const growAt = dropAt + (GROW_AT - DROP_AT);
  const tagAt = growAt + (TAG_AT - GROW_AT);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.07 : 0.075);

  const L0 = Math.min(
    H * (portrait ? 0.075 : 0.16),
    (W * (portrait ? 0.62 : 0.5)) / m.name,
  );
  const L1 = L0 * (portrait ? 0.62 : 0.5);
  const supS0 = (SUP * LOGO_CAP * L0) / m.numCap;
  const gapSup = 0.06 * L0;

  const capTarget = H * (portrait ? 0.46 : 0.8);
  const room = W - 2 * margin - m.name * L1;
  const S1 = Math.min(capTarget / m.numCap, room / (m.num + 0.08));
  const gap1 = 0.08 * S1;

  const nameP = interpolate(t, [NAME_AT, NAME_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const supPOf = (f: number) =>
    interpolate(f, [SUP_AT, SUP_AT + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const supP = supPOf(t);
  const dropOf = (f: number) =>
    interpolate(f, [dropAt, dropAt + DROP_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_DROP,
    });
  const growOf = (f: number) =>
    spring({
      frame: f - growAt,
      fps,
      config: { damping: 14, stiffness: 120, mass: 0.9 },
    });
  const settleAt = (f: number) =>
    spring({
      frame: f - growAt,
      fps,
      config: { damping: 200, stiffness: 120, mass: 0.9 },
      durationInFrames: SETTLE_LEN,
    });
  const settle = settleAt(t);
  // The settle carries the name by hundreds of pixels; a step under 1e-6 of
  // it is under a thousandth of a pixel.
  const settling =
    Math.abs(settleAt(t + speed) - settle) > 1e-6 ||
    Math.abs(settle - settleAt(t - speed)) > 1e-6;
  const tagP = interpolate(t, [tagAt, tagAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const L = L0 + (L1 - L0) * settle;
  const cap = LOGO_CAP * L;

  const lock0 = m.name * L0 + gapSup + m.num * supS0;
  const nameLeft0 = (W - lock0) / 2;
  const nameLeft1 = W - margin - m.num * S1 - gap1 - m.name * L1;
  const nameLeftAt = (k: number) => nameLeft0 + (nameLeft1 - nameLeft0) * k;
  const nameLeft = nameLeftAt(settle);

  const base0 = H / 2 + (LOGO_CAP * L0) / 2;
  const base1 = (H + m.numCap * S1) / 2;
  const baseYAt = (k: number) => base0 + (base1 - base0) * k;
  const baseY = baseYAt(settle);

  // The numeral's box as a function of the frame, so it can be compared with
  // its neighbours to tell motion from rest.
  const numeralOf = (st: number, gr: number, dr: number) => {
    const nL = L0 + (L1 - L0) * st;
    const nCap = LOGO_CAP * nL;
    const supS = (SUP * nCap) / m.numCap;
    const sizeFree = supS + (S1 - supS) * gr;
    const gap = gapSup + (gap1 - gapSup) * Math.min(1, Math.max(0, gr));
    const nBase = baseYAt(st);
    const supBase = nBase - nCap + m.numCap * sizeFree;
    const numBaseY = supBase + (nBase - supBase) * dr;
    const size = Math.min(sizeFree, (numBaseY - margin) / m.numCap);
    return {
      left: nameLeftAt(st) + m.name * nL + gap,
      top: numBaseY - m.numBase * size,
      size,
      cap: nCap,
    };
  };
  const numeralAt = (f: number) => {
    const at = numeralOf(settleAt(f), growOf(f), dropOf(f));
    return { ...at, rise: (1 - supPOf(f)) * at.cap * 0.4 };
  };
  const num = numeralAt(t);
  const numPrev = numeralAt(t - speed);
  const numNext = numeralAt(t + speed);
  const numShifts = [numPrev, numNext].some(
    (o) =>
      Math.abs(o.left - num.left) > 1e-3 ||
      Math.abs(o.top - num.top) > 1e-3 ||
      Math.abs(o.size - num.size) * m.num > 1e-3,
  );
  const numRises = [numPrev, numNext].some(
    (o) =>
      Math.abs(Number(o.rise.toFixed(2)) - Number(num.rise.toFixed(2))) > 0,
  );
  // A font size and a place eased by layout land on whole pixels, baseline
  // and all, so the drop and the grow step unevenly. The numeral is laid out
  // once at its final size and place and scaled and shifted to the live ones
  // from its top-left corner, where size and place both scale from. That is
  // so all its life: handed back to layout at rest, it would jump by what the
  // rounding takes. The grow spring leaves a tail far under a pixel.
  const numRest = numeralOf(1, 1, 1);
  const numBox = numRest;
  const settled = (d: number) => (Math.abs(d) > 1e-3 ? d : 0);
  const numDx = settled(num.left - numRest.left);
  const numDy = settled(num.top - numRest.top);
  const numK =
    Math.abs(num.size - numRest.size) * m.num > 1e-3
      ? num.size / numRest.size
      : 1;

  // The name's font size shrinks as it settles, and layout rounds the box and
  // the baseline of a growing font to whole pixels. So the block is laid out
  // once at the settled size and position, and the shrink and the travel are
  // a transform on it, all its life.
  const Lb = L1;
  const blockLeft = nameLeftAt(1) - L1 * 0.1;
  const blockTop = baseYAt(1) - L1 * 1.1;
  const blockMove = `translate(${settled(nameLeft - L * 0.1 - blockLeft)}px, ${settled(
    baseY - L * 1.1 - blockTop,
  )}px) scale(${L / L1})${glide(settling)}`;

  const nameRise = (1 - nameP) * Lb * 1.2;
  const tagFs = Math.min(
    H * (portrait ? 0.022 : 0.04),
    (W * 0.6) / Math.max(0.1, m.tagline),
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: blockLeft,
            top: blockTop,
            width: m.name * Lb + Lb * 0.3,
            height: Lb * 1.4,
            overflow: "hidden",
            transform: blockMove,
            transformOrigin: "0 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: Lb * 0.1,
              // The rise is a transform, not `top`: layout rounds a
              // baseline to whole pixels, so the name clicked up into place.
              top: Lb * 1.1 - m.nameBase * Lb,
              height: Lb,
              transform: `translateY(${nameRise}px)${glide(midway(nameP) && !settling)}`,
            }}
          >
            {isRemocn(name) ? (
              (logo ?? <RemocnLogo fontSize={Lb} color={fg} />)
            ) : (
              <div
                style={{
                  fontFamily: manrope.fontFamily,
                  fontWeight: 600,
                  fontSize: Lb,
                  lineHeight: 1,
                  letterSpacing: "-0.025em",
                  whiteSpace: "pre",
                  color: fg,
                }}
              >
                {name}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: numBox.left,
            top: numBox.top,
            height: numBox.size,
            lineHeight: `${numBox.size}px`,
            whiteSpace: "pre",
            fontFamily,
            fontWeight: 500,
            fontSize: numBox.size,
            letterSpacing: `${NUM_TRACK}em`,
            color: accent,
            opacity: supP,
            transformOrigin: "0 0",
            transform: `translateY(${((1 - supP) * cap * 0.4).toFixed(2)}px) translate(${numDx}px, ${numDy}px) scale(${numK})${glide(numShifts || numRises)}`,
          }}
        >
          {numeral}
        </div>

        {tagline ? (
          <div
            style={{
              position: "absolute",
              left: margin,
              top: margin,
              height: tagFs * 1.3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 400,
                fontSize: tagFs,
                lineHeight: `${tagFs * 1.3}px`,
                letterSpacing: "-0.01em",
                whiteSpace: "pre",
                color: c.soft,
                transform: `translateY(${(1 - tagP) * tagFs * 1.4}px)${glide(midway(tagP))}`,
              }}
            >
              {tagline}
            </div>
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
