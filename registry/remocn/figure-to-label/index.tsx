"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Onest";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

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

export interface FigureToLabelProps {
  value?: string;
  word?: string;
  eyebrow?: string;
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#eef1ec",
  colors: ["#d2f3e3", "#93d6bb", "#e3ecdf", "#eef1ec"],
  speed: 0.8,
  loopSeconds: 14,
  scale: 0.85,
  warp: 0.45,
  blur: 0.7,
  grain: 0.2,
  seed: 31,
};

const THEMES = {
  dark: {
    ink: "#eef6f2",
    dim: "rgba(238,246,242,0.58)",
    accent: "#7cf0c2",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "mist",
      colors: ["#dcfff4", "#55e6bd", "#0e9a7e", "#04332b"],
      background: "#010605",
      speed: 0.8,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.45,
      blur: 0.7,
      grain: 0.22,
      seed: 27,
    } as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "1,6,5",
    scrimAlpha: 0.5,
    card: "#f3f1ec",
    cardInk: "#18201d",
    cardFaint: "rgba(24,32,29,0.22)",
    cardShadow:
      "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(0,8,6,0.35), 0 16px 36px rgba(0,8,6,0.4), 0 60px 120px rgba(0,8,6,0.5)",
    line: "rgba(238,246,242,0.35)",
  },
  light: {
    ink: "#121a17",
    dim: "rgba(18,26,23,0.55)",
    accent: "#0f8a63",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "238,241,236",
    scrimAlpha: 0.45,
    card: "#101815",
    cardInk: "#d9f7ea",
    cardFaint: "rgba(217,247,234,0.22)",
    cardShadow:
      "inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(10,30,20,0.12), 0 16px 36px rgba(10,30,20,0.16), 0 60px 120px rgba(10,30,20,0.2)",
    line: "rgba(18,26,23,0.3)",
  },
};

const BEAT = {
  card: -3,
  dots: -8,
  dotsLen: 27,
  line: 9,
  note: 15,
  wave: 15,
  waveLen: 18,
  resolve: 33,
  resolveLen: 15,
  exit: 51,
  collapse: 54,
  type: 69,
  charStep: 2,
  logo: 75,
  caretOff: 117,
};

const FONT_PX = 200;
const CELLS = 15;
const REVEAL = Easing.bezier(0.32, 0.72, 0, 1);
const WIPE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const COLOR = Easing.bezier(0.83, 0, 0.17, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Dot {
  x: number;
  y: number;
  cov: number;
}

interface Sampled {
  text: (s: string, weight: number) => number;
  dots: Dot[];
  boxEm: number;
  figEm: number;
}

function buildSampled(_version: number, value: string): Sampled {
  const mctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  const text = (s: string, weight: number) => {
    const key = `${weight}|${s}`;
    if (cache[key] === undefined) {
      if (!mctx) return s.length * 0.55;
      mctx.font = `${weight} ${FONT_PX}px "${onest.fontFamily}"`;
      cache[key] = mctx.measureText(s).width / FONT_PX;
    }
    return cache[key];
  };
  const boxEm = 1.2;
  const figEm = text(value, 300);
  const cw = Math.ceil(figEm * FONT_PX) + 4;
  const ch = Math.ceil(boxEm * FONT_PX);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const dots: Dot[] = [];
  if (ctx) {
    ctx.font = `300 ${FONT_PX}px "${onest.fontFamily}"`;
    const mt = ctx.measureText(value);
    const asc = mt.fontBoundingBoxAscent;
    const desc = mt.fontBoundingBoxDescent;
    const baseline = (ch - (asc + desc)) / 2 + asc;
    ctx.fillStyle = "#000";
    ctx.fillText(value, 0, baseline);
    const data = ctx.getImageData(0, 0, cw, ch).data;
    const cell = FONT_PX / CELLS;
    const cols = Math.ceil(cw / cell);
    const rows = Math.ceil(ch / cell);
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        let sum = 0;
        let cnt = 0;
        for (let sy = 0; sy < 5; sy++) {
          for (let sx = 0; sx < 5; sx++) {
            const px = Math.floor(gx * cell + ((sx + 0.5) * cell) / 5);
            const py = Math.floor(gy * cell + ((sy + 0.5) * cell) / 5);
            if (px < cw && py < ch) {
              sum += data[(py * cw + px) * 4 + 3] / 255;
              cnt++;
            }
          }
        }
        const cov = cnt > 0 ? sum / cnt : 0;
        if (cov > 0.14) {
          dots.push({
            x: ((gx + 0.5) * cell) / FONT_PX,
            y: ((gy + 0.5) * cell) / FONT_PX,
            cov,
          });
        }
      }
    }
  }
  return { text, dots, boxEm, figEm };
}

function useSampled(value: string) {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("figure-to-label: sampling"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      onest.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`300 100px "${onest.fontFamily}"`),
      document.fonts.load(`400 100px "${onest.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle]);
  return useMemo(() => buildSampled(version, value), [version, value]);
}

export function FigureToLabel({
  value = "$6.4B",
  word = "valuation",
  eyebrow = "",
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: FigureToLabelProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useSampled(value);
  const portrait = H > W * 1.1;

  let content: React.ReactNode = <div />;
  if (m) {
    const cx = W / 2;
    const cy = H / 2;
    const room = W * (portrait ? 0.84 : 0.86);

    const noteE = portrait ? W * 0.04 : H * 0.04;
    const noteW = noteE * 3.9 + noteE * 0.45 + m.text(word, 400) * noteE;
    const lineLen = portrait ? H * 0.06 : W * 0.06;

    const Fg = portrait
      ? Math.min(W * 0.3, (room * 0.86) / m.figEm)
      : Math.min(H * 0.34, (room - lineLen - noteW - H * 0.1) / m.figEm);
    const figW = m.figEm * Fg;
    const boxH = m.boxEm * Fg;
    const padX = Fg * 0.16;
    const rulerH = Fg * 0.2;
    const cardW = figW + padX * 2;
    const cardH = boxH + rulerH;
    const groupW = portrait ? cardW : cardW + lineLen + noteW;
    const cardX = portrait ? cx - cardW / 2 : cx - groupW / 2;
    const cardY = portrait
      ? cy - (cardH + lineLen + noteE) / 2
      : cy - cardH / 2;

    const sp = m.text(" ", 300);
    const wordEm = m.text(word, 300);
    const Fi = portrait
      ? Math.min(W * 0.26, (W * 0.84) / Math.max(m.figEm, wordEm))
      : Math.min(H * 0.18, (W * 0.8) / (m.figEm + sp + wordEm));
    const lineW = (m.figEm + sp + wordEm) * Fi;
    const finX = portrait ? cx - (m.figEm * Fi) / 2 : cx - lineW / 2;
    const finY = portrait
      ? cy - m.boxEm * Fi * 0.92 + Fi * 0.18
      : cy - (m.boxEm * Fi) / 2 + Fi * 0.18;
    const wordY = portrait ? finY + Fi * 1.02 : finY;

    const cardIn = spring({ frame: frame - BEAT.card, fps, config: CARD });
    const col = spring({ frame: frame - BEAT.collapse, fps, config: HEAVY });
    const colPrev = spring({
      frame: frame - 1 - BEAT.collapse,
      fps,
      config: HEAVY,
    });
    const colE = Math.min(1, Math.max(0, col));
    const startX = cardX + padX;
    const startY = cardY;
    const figX = startX + (finX - startX) * col;
    const figY = startY + (finY - startY) * col;
    const figS = 1 + (Fi / Fg - 1) * col;
    const moveBlur = Math.min(6, Math.abs(col - colPrev) * 60);

    const colorP = interpolate(
      frame,
      [BEAT.collapse + 4, BEAT.collapse + 18],
      [0, 1],
      { ...CLAMP, easing: COLOR },
    );
    const figColor = `color-mix(in oklab, ${hi} ${(colorP * 100).toFixed(1)}%, ${c.cardInk})`;

    const cardScaleX =
      (1 - colE) * (0.94 + 0.06 * cardIn) + colE * ((figW * figS) / cardW);
    const cardOpacity =
      Math.min(1, Math.max(0, cardIn)) *
      (1 -
        interpolate(frame, [BEAT.collapse + 2, BEAT.collapse + 14], [0, 1], {
          ...CLAMP,
          easing: EXIT,
        }));
    const cardCx =
      cardX +
      cardW / 2 +
      (finX + (figW * Fi) / Fg / 2 - (cardX + cardW / 2)) * col;
    const cardCy =
      cardY +
      cardH / 2 +
      (finY + (boxH * Fi) / Fg / 2 - (cardY + cardH / 2)) * col;
    const cardH2 = cardH * (1 - colE) + boxH * figS * colE;
    const cardIntro = (1 - Math.min(1, Math.max(0, cardIn))) * H * 0.03;

    const card = (
      <div
        style={{
          position: "absolute",
          left: cardCx - cardW / 2,
          top: cardCy - cardH2 / 2 + cardIntro,
          width: cardW,
          height: cardH2,
          transform: `scaleX(${cardScaleX.toFixed(4)})`,
          borderRadius: Fg * 0.07,
          background: c.card,
          boxShadow: c.cardShadow,
          opacity: cardOpacity,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: padX,
            right: padX,
            bottom: rulerH * 0.36,
            height: rulerH * 0.3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {Array.from({ length: 25 }).map((_, i) => {
            const tick = interpolate(
              frame,
              [BEAT.line + i * 0.6, BEAT.line + 9 + i * 0.6],
              [0, 1],
              { ...CLAMP, easing: REVEAL },
            );
            return (
              <div
                key={`k${i}`}
                style={{
                  width: Math.max(1, Fg * 0.006),
                  height: `${(i % 6 === 0 ? 100 : 45) * tick}%`,
                  background: c.cardFaint,
                }}
              />
            );
          })}
        </div>
      </div>
    );

    const cell = 1 / CELLS;
    const waveX = interpolate(
      frame,
      [BEAT.wave, BEAT.wave + BEAT.waveLen],
      [-0.3, m.figEm + 0.3],
      { ...CLAMP, easing: WIPE },
    );
    const resolveEdge = interpolate(
      frame,
      [BEAT.resolve, BEAT.resolve + BEAT.resolveLen],
      [-0.25, m.figEm + 0.25],
      { ...CLAMP, easing: WIPE },
    );
    const soft = 0.35;
    const dotNodes = m.dots.map((d, i) => {
      const at = BEAT.dots + random(`ftl-${i}`) * (BEAT.dotsLen - 8);
      const pop = spring({ frame: frame - at, fps, config: CHIP });
      const wave = Math.exp(-(((d.x - waveX) / 0.22) ** 2));
      const res = Math.max(
        0,
        Math.min(1, (resolveEdge - d.x + soft * 0.5) / soft),
      );
      const baseR = cell * 0.5 * (0.42 + 0.5 * Math.sqrt(d.cov));
      const r = baseR * Math.max(0, pop) * (1 + 0.45 * wave) * (1 + 0.5 * res);
      return (
        <circle
          key={`d${i}`}
          cx={d.x}
          cy={d.y}
          r={Math.max(0, r)}
          opacity={1 - res}
        />
      );
    });
    const solidMask = `linear-gradient(90deg, #000 ${((resolveEdge - soft) / m.figEm) * 100}%, transparent ${(resolveEdge / m.figEm) * 100}%)`;

    const figure = (
      <div
        style={{
          position: "absolute",
          left: figX,
          top: figY,
          width: figW,
          height: boxH,
          transformOrigin: "0 0",
          transform: `scale(${figS.toFixed(5)})`,
          filter: moveBlur > 0.1 ? `blur(${moveBlur.toFixed(2)}px)` : undefined,
        }}
      >
        <svg
          viewBox={`0 0 ${m.figEm.toFixed(4)} ${m.boxEm}`}
          width={figW}
          height={boxH}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          aria-hidden
        >
          <g fill={c.cardInk}>{dotNodes}</g>
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: figW * 1.1,
            height: boxH,
            lineHeight: `${boxH}px`,
            fontFamily: onest.fontFamily,
            fontWeight: 300,
            fontSize: Fg,
            color: figColor,
            whiteSpace: "pre",
            WebkitMaskImage: solidMask,
            maskImage: solidMask,
          }}
        >
          {value}
        </div>
      </div>
    );

    const exitP = interpolate(frame, [BEAT.exit, BEAT.exit + 8], [0, 1], {
      ...CLAMP,
      easing: EXIT,
    });
    const lineP = interpolate(frame, [BEAT.line, BEAT.line + 12], [0, 1], {
      ...CLAMP,
      easing: WIPE,
    });
    const noteIn = interpolate(frame, [BEAT.note, BEAT.note + 12], [0, 1], {
      ...CLAMP,
      easing: REVEAL,
    });
    const noteLogo = spring({ frame: frame - BEAT.note, fps, config: CHIP });
    const anchorX = portrait ? cx : cardX + cardW;
    const anchorY = portrait ? cardY + cardH : cy;
    const outboard = (
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - exitP,
          transform: portrait
            ? `translateY(${(exitP * noteE * 2).toFixed(2)}px)`
            : `translateX(${(exitP * noteE * 2).toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: portrait ? anchorX - 0.5 : anchorX,
            top: portrait ? anchorY : anchorY - 0.5,
            width: portrait ? 1 : lineLen * 0.86,
            height: portrait ? lineLen * 0.8 : 1,
            background: c.line,
            transformOrigin: portrait ? "50% 0" : "0 50%",
            transform: portrait
              ? `scaleY(${lineP.toFixed(4)})`
              : `scaleX(${lineP.toFixed(4)})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: portrait ? cx - noteW / 2 : anchorX + lineLen,
            top: portrait ? anchorY + lineLen : anchorY - noteE / 2,
            height: noteE,
            display: "flex",
            alignItems: "center",
            gap: noteE * 0.45,
          }}
        >
          <div
            style={{
              opacity: Math.min(1, Math.max(0, noteLogo)),
              transform: `scale(${(0.7 + 0.3 * noteLogo).toFixed(4)})`,
            }}
          >
            <RemocnLogo fontSize={noteE} color={inkC} />
          </div>
          <div
            style={{
              fontFamily: onest.fontFamily,
              fontWeight: 400,
              fontSize: noteE,
              lineHeight: 1,
              color: c.dim,
              whiteSpace: "pre",
              clipPath: `inset(-20% ${((1 - noteIn) * 100).toFixed(2)}% -20% 0)`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    );

    const nChars = Array.from(word).length;
    const typedN = Math.max(
      0,
      Math.min(nChars, Math.floor((frame - BEAT.type) / BEAT.charStep) + 1),
    );
    const typedStr = Array.from(word).slice(0, typedN).join("");
    const typedPx = m.text(typedStr, 300) * Fi;
    const wordX = portrait
      ? cx - (wordEm * Fi) / 2
      : finX + (m.figEm + sp) * Fi;
    const caretVisible =
      frame >= BEAT.type - 4 &&
      frame < BEAT.caretOff &&
      (frame < BEAT.type + nChars * BEAT.charStep + 2 ||
        Math.floor(frame / 9) % 2 === 0);
    const lineTop = finY + (m.boxEm * Fi - Fi) / 2;
    const wordTop = wordY + (m.boxEm * Fi - Fi) / 2;

    const typed = (
      <>
        <div
          style={{
            position: "absolute",
            left: wordX,
            top: wordY,
            height: m.boxEm * Fi,
            lineHeight: `${m.boxEm * Fi}px`,
            fontFamily: onest.fontFamily,
            fontWeight: 300,
            fontSize: Fi,
            color: inkC,
            whiteSpace: "pre",
          }}
        >
          {typedStr}
        </div>
        <div
          style={{
            position: "absolute",
            left: wordX + typedPx + Fi * 0.05,
            top: wordTop + Fi * 0.08,
            width: Math.max(2, Fi * 0.035),
            height: Fi * 0.94,
            borderRadius: Fi * 0.02,
            background: hi,
            opacity: caretVisible ? 1 : 0,
          }}
        />
      </>
    );

    const logoP = spring({ frame: frame - BEAT.logo, fps, config: CHIP });
    const logoE = Math.min(1, Math.max(0, logoP));
    const eyeE = Fi * 0.32;
    const eyeIn = interpolate(frame, [BEAT.logo + 3, BEAT.logo + 15], [0, 1], {
      ...CLAMP,
      easing: REVEAL,
    });
    const eyeW =
      eyeE * 3.9 + (eyebrow ? eyeE * 0.45 + m.text(eyebrow, 400) * eyeE : 0);
    const eyebrowNode = (
      <div
        style={{
          position: "absolute",
          left: cx - eyeW / 2,
          top: lineTop - eyeE * 2.1,
          height: eyeE,
          display: "flex",
          alignItems: "center",
          gap: eyeE * 0.45,
        }}
      >
        <div
          style={{
            opacity: logoE,
            transform: `translateY(${((1 - logoP) * eyeE).toFixed(2)}px) scale(${(0.8 + 0.2 * logoP).toFixed(4)})`,
          }}
        >
          <RemocnLogo fontSize={eyeE} color={inkC} />
        </div>
        {eyebrow ? (
          <div
            style={{
              fontFamily: onest.fontFamily,
              fontWeight: 400,
              fontSize: eyeE,
              lineHeight: 1,
              color: c.dim,
              whiteSpace: "pre",
              clipPath: `inset(-20% ${((1 - eyeIn) * 100).toFixed(2)}% -20% 0)`,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
      </div>
    );

    const push = interpolate(frame, [0, durationInFrames], [1, 1.035], CLAMP);
    content = (
      <AbsoluteFill
        style={{
          transform: `scale(${push.toFixed(5)})`,
        }}
      >
        {card}
        {outboard}
        {figure}
        {typed}
        {eyebrowNode}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "95% 55%" : "70% 75%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},${(c.scrimAlpha * 0.35).toFixed(3)}) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default FigureToLabel;
