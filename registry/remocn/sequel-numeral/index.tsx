"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
import { useEffect, useRef, useState } from "react";
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

const isRemocn = (name: string) => name.trim().toLowerCase() === "remocn";

const baseOf = (asc: number, desc: number) => (1 - (asc + desc)) / 2 + asc;

function measure(name: string, numeral: string, tagline: string): Metrics {
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

  ctx.font = `500 100px "${rubik.fontFamily}"`;
  const nmText = numeral || "2";
  const fm = ctx.measureText(nmText);
  const num =
    fm.width / 100 + NUM_TRACK * Math.max(0, Array.from(nmText).length - 1);
  const numCap = fm.actualBoundingBoxAscent / 100;
  const numBase = baseOf(
    fm.fontBoundingBoxAscent / 100,
    fm.fontBoundingBoxDescent / 100,
  );

  ctx.font = `400 100px "${rubik.fontFamily}"`;
  const tagW = tagline ? ctx.measureText(tagline).width / 100 : 0;
  return { name: nameW, nameBase, num, numCap, numBase, tagline: tagW };
}

function useMetrics(name: string, numeral: string, tagline: string) {
  const key = [name, numeral, tagline].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("sequel-numeral: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const [n, nu, tg] = key.split("\u0001");
    Promise.all([
      rubik.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`500 100px "${rubik.fontFamily}"`),
      document.fonts.load(`400 100px "${rubik.fontFamily}"`),
      document.fonts.load(`600 100px "${manrope.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(n, nu, tg) });
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

export function SequelNumeral({
  name = "remocn",
  numeral = "2",
  tagline = "Part two. Out now.",
  accent = RED,
  background,
  speed = 1,
  theme = "dark",
}: SequelNumeralProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const m = useMetrics(name, numeral, tagline);

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
  const supP = interpolate(t, [SUP_AT, SUP_AT + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drop = interpolate(t, [DROP_AT, DROP_AT + DROP_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_DROP,
  });
  const grow = spring({
    frame: t - GROW_AT,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
  });
  const settle = spring({
    frame: t - GROW_AT,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.9 },
    durationInFrames: SETTLE_LEN,
  });
  const tagP = interpolate(t, [TAG_AT, TAG_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const L = L0 + (L1 - L0) * settle;
  const cap = LOGO_CAP * L;
  const supS = (SUP * cap) / m.numCap;
  const sizeFree = supS + (S1 - supS) * grow;
  const gap = gapSup + (gap1 - gapSup) * Math.min(1, Math.max(0, grow));

  const lock0 = m.name * L0 + gapSup + m.num * supS0;
  const nameLeft0 = (W - lock0) / 2;
  const nameLeft1 = W - margin - m.num * S1 - gap1 - m.name * L1;
  const nameLeft = nameLeft0 + (nameLeft1 - nameLeft0) * settle;
  const numLeft = nameLeft + m.name * L + gap;

  const base0 = H / 2 + (LOGO_CAP * L0) / 2;
  const base1 = (H + m.numCap * S1) / 2;
  const baseY = base0 + (base1 - base0) * settle;

  const supBase = baseY - cap + m.numCap * sizeFree;
  const numBaseY = supBase + (baseY - supBase) * drop;
  const size = Math.min(sizeFree, (numBaseY - margin) / m.numCap);

  const nameRise = (1 - nameP) * L * 1.2;
  const tagFs = Math.min(
    H * (portrait ? 0.022 : 0.04),
    (W * 0.6) / Math.max(0.1, m.tagline),
  );

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: nameLeft - L * 0.1,
          top: baseY - L * 1.1,
          width: m.name * L + L * 0.3,
          height: L * 1.4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: L * 0.1,
            top: L * 1.1 - m.nameBase * L + nameRise,
            height: L,
          }}
        >
          {isRemocn(name) ? (
            <RemocnLogo fontSize={L} color={c.ink} />
          ) : (
            <div
              style={{
                fontFamily: manrope.fontFamily,
                fontWeight: 600,
                fontSize: L,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                whiteSpace: "pre",
                color: c.ink,
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
          left: numLeft,
          top: numBaseY - m.numBase * size,
          height: size,
          lineHeight: `${size}px`,
          whiteSpace: "pre",
          fontFamily: rubik.fontFamily,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: `${NUM_TRACK}em`,
          color: accent,
          opacity: supP,
          transform: `translateY(${((1 - supP) * cap * 0.4).toFixed(2)}px)`,
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
              fontFamily: rubik.fontFamily,
              fontWeight: 400,
              fontSize: tagFs,
              lineHeight: `${tagFs * 1.3}px`,
              letterSpacing: "-0.01em",
              whiteSpace: "pre",
              color: c.soft,
              transform: `translateY(${((1 - tagP) * tagFs * 1.4).toFixed(2)}px)`,
            }}
          >
            {tagline}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
