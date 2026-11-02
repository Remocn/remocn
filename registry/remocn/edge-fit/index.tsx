"use client";

import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
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

const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface EdgeFitProps {
  words?: string[];
  caption?: string;
  logo?: React.ReactNode | null;
  letterGap?: number;
  hold?: number;
  accent?: string;
  background?: string;
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

const THEMES = {
  dark: {
    bg: "#1B2A6B",
    ink: "#F3E9D2",
  },
  light: {
    bg: "#F3E9D2",
    ink: "#1B2A6B",
  },
} as const;

const TRACK = -0.005;
const FONT_PX = 200;
const RISE = 6;
const LEAD = 3;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface WordMetrics {
  chars: string[];
  adv: number[];
  inkTop: number;
  inkBottom: number;
  inkLeft: number[];
  inkRight: number[];
}

interface Metrics {
  words: WordMetrics[];
  baseline: number;
}

function measure(words: string[]): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${anton.fontFamily}"`,
    fontWeight: "400",
    fontSize: `${FONT_PX}px`,
    lineHeight: "1",
    letterSpacing: `${TRACK}em`,
  });
  document.body.appendChild(probe);
  const width = (s: string) => {
    probe.textContent = s;
    return probe.getBoundingClientRect().width / FONT_PX;
  };
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `400 ${FONT_PX}px "${anton.fontFamily}"`;
    ctx.letterSpacing = `${TRACK * FONT_PX}px`;
  }

  const out: WordMetrics[] = words.map((word) => {
    const chars = Array.from(word);
    const adv: number[] = [];
    const inkLeft: number[] = [];
    const inkRight: number[] = [];
    let prev = 0;
    for (let i = 0; i < chars.length; i++) {
      const x = width(chars.slice(0, i + 1).join(""));
      adv.push(x - prev);
      prev = x;
      const pm = ctx?.measureText(chars.slice(0, i + 1).join(""));
      inkLeft.push(pm ? pm.actualBoundingBoxLeft / FONT_PX : 0);
      inkRight.push(pm ? pm.actualBoundingBoxRight / FONT_PX : x);
    }
    const wm = ctx?.measureText(word);
    return {
      chars,
      adv,
      inkTop: wm ? wm.actualBoundingBoxAscent / FONT_PX : 0.75,
      inkBottom: wm ? wm.actualBoundingBoxDescent / FONT_PX : 0.2,
      inkLeft,
      inkRight,
    };
  });
  probe.remove();

  let baseline = 0.8;
  if (ctx) {
    const fm = ctx.measureText("Hg");
    const asc = fm.fontBoundingBoxAscent / FONT_PX;
    const desc = fm.fontBoundingBoxDescent / FONT_PX;
    baseline = (1 - (asc + desc)) / 2 + asc;
  }
  return { words: out, baseline };
}

function useMetrics(words: string[]) {
  const key = words.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("edge-fit: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      anton.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`400 100px "${anton.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(key.split("\u0001")) });
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

export function edgeFitTiming(words: string[], letterGap = 3, hold = 14) {
  const starts: number[] = [];
  let at = 0;
  for (const w of words) {
    starts.push(at);
    at += Math.max(1, Array.from(w).length - 1) * letterGap + 10 + hold;
  }
  return { starts, end: at };
}

export function EdgeFit({
  words = ["intros", "teasers", "recaps"],
  caption = "Fresh from the registry",
  logo,
  letterGap = 3,
  hold = 14,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: EdgeFitProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const spot = accent ?? c.ink;
  const list = useMemo(() => (words.length > 0 ? words : ["remocn"]), [words]);
  const m = useMetrics(list);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);
  const { starts } = edgeFitTiming(list, letterGap, hold);
  let wi = 0;
  for (let i = 0; i < starts.length; i++) if (t >= starts[i]) wi = i;
  const last = wi === list.length - 1;
  const wm = m.words[wi];
  const local = t - starts[wi];
  const n = wm.chars.length;

  const measureW = W * (portrait ? 0.9 : 0.9);
  const maxInk = H * (portrait ? 0.3 : 0.66);
  const inkH = wm.inkTop + wm.inkBottom;
  const fitOf = (k: number) => {
    const ink = wm.inkLeft[k - 1] + wm.inkRight[k - 1];
    return Math.min(measureW / Math.max(0.05, ink), maxInk / inkH);
  };
  const arrive = (j: number) =>
    j === 0
      ? 1
      : spring({
          frame: local - j * letterGap + LEAD,
          fps,
          config: { damping: 19, stiffness: 260, mass: 0.6 },
        });
  let S = fitOf(1);
  for (let k = 2; k <= n; k++) S += (fitOf(k) - fitOf(k - 1)) * arrive(k - 1);

  const open = wm.adv.map((_, j) => Math.min(1.04, Math.max(0, arrive(j))));
  let cursor = 0;
  const xs: number[] = [];
  for (let j = 0; j < n; j++) {
    xs.push(cursor);
    cursor += wm.adv[j] * open[j];
  }
  let shown = 1;
  for (let j = 1; j < n; j++) if (open[j] > 0.001) shown = j + 1;
  const kIn = Math.max(1, shown);
  const blend = shown > 1 ? Math.min(1, open[shown - 1]) : 1;
  const inkRightPrev = kIn > 1 ? wm.inkRight[kIn - 2] : wm.inkRight[0];
  const inkRight = inkRightPrev + (wm.inkRight[kIn - 1] - inkRightPrev) * blend;
  const inkW = (wm.inkLeft[0] + inkRight) * S;
  const left = (W - inkW) / 2 + wm.inkLeft[0] * S;

  const baseY = H / 2 + ((wm.inkTop - wm.inkBottom) / 2) * S;
  const boxTop = baseY - m.baseline * S;
  const maskTop = baseY - wm.inkTop * S - S * 0.04;
  const maskH = inkH * S + S * 0.08;

  const signAt = starts[list.length - 1] + Math.max(0, n - 1) * letterGap;
  const sign = last
    ? interpolate(t, [signAt, signAt + 16], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : 0;
  const smallFs = (portrait ? 38 : 26) * s;
  const margin = (portrait ? 64 : 48) * s;
  const logoNode =
    logo === null
      ? null
      : (logo ?? <RemocnLogo fontSize={smallFs * 1.25} color={c.ink} />);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop,
          height: maskH,
        }}
      >
        {wm.chars.map((ch, j) => {
          if (open[j] <= 0.001) return null;
          const first = j === 0;
          const rp = first
            ? wi === 0
              ? interpolate(local, [0, RISE + 2], [0, 1], {
                  ...CLAMP,
                  easing: EASE_OUT,
                })
              : 1
            : interpolate(local - j * letterGap, [0, RISE], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
          const x = left + xs[j] * S;
          return (
            <div
              key={`${wi}-${j}-${ch}`}
              style={{
                position: "absolute",
                left: x,
                top: boxTop - maskTop,
                height: S,
                lineHeight: `${S}px`,
                whiteSpace: "pre",
                fontFamily: anton.fontFamily,
                fontWeight: 400,
                fontSize: S,
                opacity: interpolate(rp, [0, 0.55], [0, 1], CLAMP),
                transform: `translateY(${((1 - rp) * S * 0.22).toFixed(2)}px)`,
                color: spot,
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>

      {sign > 0 ? (
        <>
          {caption ? (
            <div
              style={{
                position: "absolute",
                left: margin,
                bottom: margin,
                fontFamily: anton.fontFamily,
                fontWeight: 400,
                fontSize: smallFs,
                letterSpacing: "0.005em",
                lineHeight: 1,
                color: c.ink,
                opacity: sign,
                transform: `translateY(${((1 - sign) * smallFs * 0.8).toFixed(2)}px)`,
              }}
            >
              {caption}
            </div>
          ) : null}
          {logoNode ? (
            <div
              style={{
                position: "absolute",
                right: margin,
                bottom: margin,
                opacity: sign,
                transform: `translateY(${((1 - sign) * smallFs * 0.8).toFixed(2)}px)`,
              }}
            >
              {logoNode}
            </div>
          ) : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
}
