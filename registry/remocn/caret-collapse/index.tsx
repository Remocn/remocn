"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const sans = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
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

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type CaretPoint = { x: number; y: number; h: number };

export type CaretCollapseProps = {
  from?: CaretPoint;
  to?: CaretPoint;
  paper?: string;
  caret?: string;
  caretWidth?: number;
};

export const caretCollapseDefaults: Required<CaretCollapseProps> = {
  from: { x: 0.5, y: 0.5, h: 0.1 },
  to: { x: 0.5, y: 0.5, h: 0.05 },
  paper: "#f3f2ee",
  caret: "#3B5BFD",
  caretWidth: 4,
};

const PHASE = {
  cropX: [0, 0.34],
  cropY: [0.06, 0.36],
  caretIn: [0.28, 0.34],
  blinkOff: [0.42, 0.5],
  glide: [0.5, 0.66],
  openY: [0.68, 0.9],
  openX: [0.72, 1],
  handoff: 0.88,
} as const;

const MORPH = Easing.bezier(0.65, 0, 0.35, 1);
const GLIDE = Easing.bezier(0.83, 0, 0.17, 1);
const OPEN = Easing.bezier(0.32, 0.72, 0, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (p: number, range: readonly [number, number], easing = MORPH) =>
  interpolate(p, [range[0], range[1]], [0, 1], { ...CLAMP, easing });

function windowClip(
  W: number,
  H: number,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  tx: number,
  ty: number,
) {
  const left = lerp(0, cx - cw / 2, tx);
  const right = lerp(W, cx + cw / 2, tx);
  const top = lerp(0, cy - ch / 2, ty);
  const bottom = lerp(H, cy + ch / 2, ty);
  const r = Math.min(22, (right - left) / 2, (bottom - top) / 2);
  return `inset(${top}px ${W - right}px ${H - bottom}px ${left}px round ${r}px)`;
}

function caretAt(p: number, o: Required<CaretCollapseProps>) {
  const g = ramp(p, PHASE.glide, GLIDE);
  return {
    x: lerp(o.from.x, o.to.x, g),
    y: lerp(o.from.y, o.to.y, g),
    h: lerp(o.from.h, o.to.h, g),
  };
}

const CaretCollapsePresentation: React.FC<
  TransitionPresentationComponentProps<CaretCollapseProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const o = {
    ...caretCollapseDefaults,
    ...passedProps,
  } as Required<CaretCollapseProps>;
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    const tx = ramp(p, PHASE.cropX);
    const ty = ramp(p, PHASE.cropY);
    const cx = o.from.x * W;
    const cy = o.from.y * H;
    return (
      <AbsoluteFill style={{ backgroundColor: o.paper }}>
        <AbsoluteFill
          style={{
            clipPath: windowClip(
              W,
              H,
              cx,
              cy,
              o.caretWidth,
              o.from.h * H,
              tx,
              ty,
            ),
            opacity: p >= PHASE.cropY[1] ? 0 : 1,
          }}
        >
          <AbsoluteFill
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `scale(${1 - 0.06 * tx})`,
              filter: `blur(${5 * tx}px)`,
            }}
          >
            {children}
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const tx = ramp(p, PHASE.openX, OPEN);
  const ty = ramp(p, PHASE.openY, OPEN);
  const ox = o.to.x * W;
  const oy = o.to.y * H;
  const step = 1 / Math.max(2, presentationDurationInFrames);
  const c = caretAt(p, o);
  const blinkOff = p > PHASE.blinkOff[0] && p < PHASE.blinkOff[1];
  const caretOpacity =
    interpolate(p, [PHASE.caretIn[0], PHASE.caretIn[1]], [0, 1], CLAMP) *
    (blinkOff ? 0 : 1) *
    (p >= PHASE.handoff ? 0 : 1);
  const prev = caretAt(Math.max(0, p - step * 1.5), o);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: windowClip(
            W,
            H,
            ox,
            oy,
            o.caretWidth,
            o.to.h * H,
            1 - tx,
            1 - ty,
          ),
          opacity: p < PHASE.openY[0] ? 0 : 1,
        }}
      >
        <AbsoluteFill
          style={{
            transformOrigin: `${ox}px ${oy}px`,
            transform: `scale(${1 + 0.05 * (1 - tx)})`,
            filter: `blur(${4 * (1 - tx)}px)`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: Math.min(prev.x, c.x) * W,
          top: (c.y - c.h * 0.32) * H,
          width: Math.abs(prev.x - c.x) * W,
          height: c.h * 0.64 * H,
          borderRadius: c.h * H,
          backgroundImage: `linear-gradient(${prev.x > c.x ? 90 : 270}deg, ${o.caret} 0%, transparent 100%)`,
          opacity: caretOpacity * 0.45,
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: c.x * W - o.caretWidth / 2,
          top: (c.y - c.h / 2) * H,
          width: o.caretWidth,
          height: c.h * H,
          borderRadius: o.caretWidth,
          backgroundColor: o.caret,
          opacity: caretOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

export function caretCollapse(
  props: CaretCollapseProps = {},
): TransitionPresentation<CaretCollapseProps> {
  return { component: CaretCollapsePresentation, props };
}

export interface CaretCollapseDemoProps {
  theme?: "dark" | "light";
  accent?: string;
  url?: string;
  label?: string;
  question?: string;
  prompt?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundParamsB?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    ink: "#eef1f8",
    muted: "rgba(226,232,246,0.56)",
    faint: "rgba(226,232,246,0.36)",
    paper: "#050609",
    caret: "#6f8cff",
    card: "rgba(16,18,26,0.82)",
    chip: "rgba(255,255,255,0.06)",
    hairline: "rgba(255,255,255,0.1)",
    highlight: "rgba(255,255,255,0.07)",
    shadow: "0,0,0",
    sendInk: "#ffffff",
    groundA: {
      kind: "limb",
      colors: ["#e8f4ff", "#4aa3ff", "#1d4fd6", "#06143a"],
      background: "#02040a",
      speed: 1.2,
      loopSeconds: 10,
      seed: 3,
    } as Partial<GradientParams>,
    groundB: {
      kind: "mist",
      colors: ["#c9d6ff", "#5b78ff", "#1f2b8f", "#070b24"],
      background: "#03050d",
      speed: 0.7,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.7,
      seed: 12,
    } as Partial<GradientParams>,
  },
  light: {
    ink: "#15171c",
    muted: "rgba(21,23,28,0.56)",
    faint: "rgba(21,23,28,0.36)",
    paper: "#f3f2ee",
    caret: "#3B5BFD",
    card: "rgba(255,255,255,0.86)",
    chip: "rgba(21,23,28,0.04)",
    hairline: "rgba(21,23,28,0.09)",
    highlight: "rgba(255,255,255,0.9)",
    shadow: "40,44,70",
    sendInk: "#ffffff",
    groundA: {
      kind: "mist",
      colors: ["#6e8dff", "#a9b9ff", "#d9defa", "#1a1f4a"],
      background: "#eeece8",
      speed: 0.8,
      loopSeconds: 14,
      scale: 0.8,
      warp: 0.4,
      blur: 0.65,
      grain: 0.3,
      seed: 4,
    } as Partial<GradientParams>,
    groundB: {
      kind: "mist",
      colors: ["#aebcff", "#d9dffb", "#c8b8ff", "#eef0f6"],
      background: "#f1f1f5",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.85,
      warp: 0.4,
      blur: 0.75,
      grain: 0.22,
      seed: 14,
    } as Partial<GradientParams>,
  },
};

const A_LEN = 72;
const B_LEN = 96;
const T_LEN = 36;
export const CARET_COLLAPSE_DURATION = A_LEN + B_LEN - T_LEN;

const A_BEATS = { label: 0, type: 4, typeEnd: 22 } as const;
const B_BEATS = { heading: 24, type: 40, typeEnd: 72, send: 78 } as const;

const MONO_ADVANCE = 0.6;
const TYPE_IN = Easing.bezier(0.32, 0.72, 0, 1);
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

function urlLayout(W: number, H: number, url: string) {
  const tall = H > W;
  const fs = Math.min(
    tall ? W * 0.075 : W * 0.06,
    (W * 0.84) / (url.length * MONO_ADVANCE),
  );
  const textW = url.length * MONO_ADVANCE * fs;
  const left = (W - textW) / 2;
  const cy = H * 0.5;
  const caretW = Math.max(3, fs * 0.06);
  return {
    fs,
    left,
    cy,
    caretW,
    caretH: fs * 0.92,
    caretX: left + textW + fs * 0.08 + caretW / 2,
  };
}

function promptLayout(W: number, H: number) {
  const tall = H > W;
  const s = tall ? W / 900 : (W / 1280) * 1.1;
  const cardW = tall ? W * 0.86 : W * 0.62;
  const cardLeft = (W - cardW) / 2;
  const cardTop = tall ? H * 0.44 : H * 0.42;
  const pad = 22 * s;
  const chipH = 40 * s;
  const fs = (tall ? 34 : 25) * s;
  const lineTop = cardTop + pad + chipH + 16 * s;
  const caretW = Math.max(2.5, 2.6 * s);
  return {
    s,
    tall,
    cardW,
    cardLeft,
    cardTop,
    pad,
    chipH,
    fs,
    lineTop,
    caretW,
    caretH: fs * 1.08,
    caretX: cardLeft + pad + caretW / 2,
    caretY: lineTop + fs * 0.69,
  };
}

function SceneA({
  url,
  label,
  palette,
  ground,
  groundParams,
}: {
  url: string;
  label: string;
  palette: (typeof THEMES)["dark"];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const L = urlLayout(W, H, url);
  const typed = Math.floor(
    interpolate(frame, [A_BEATS.type, A_BEATS.typeEnd], [0, url.length], CLAMP),
  );
  const lab = interpolate(frame, [A_BEATS.label, A_BEATS.label + 12], [0, 1], {
    ...CLAMP,
    easing: TYPE_IN,
  });
  const push = interpolate(frame, [0, A_LEN], [1, 1.03], CLAMP);
  const slash = url.indexOf("/");
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundA, ...groundParams }}
        timeOffset={2}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: `${L.caretX}px ${L.cy}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.cy - L.fs * 1.55,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: L.fs * 0.22,
            opacity: lab,
            transform: `translateY(${(1 - lab) * 12}px)`,
            fontFamily: sans.fontFamily,
            fontWeight: 400,
            fontSize: Math.max(H * 0.028, L.fs * 0.3),
            color: palette.muted,
          }}
        >
          <RemocnLogo
            fontSize={Math.max(H * 0.03, L.fs * 0.32)}
            color={palette.ink}
          />
          <span>{label}</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: L.left,
            top: L.cy - L.fs * 0.6,
            height: L.fs * 1.2,
            lineHeight: `${L.fs * 1.2}px`,
            fontFamily: mono.fontFamily,
            fontWeight: 300,
            fontSize: L.fs,
            letterSpacing: 0,
            whiteSpace: "pre",
            color: palette.ink,
          }}
        >
          {url.split("").map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              style={{
                color:
                  i >= typed
                    ? "transparent"
                    : slash >= 0 && i >= slash
                      ? palette.caret
                      : palette.ink,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: L.left + typed * MONO_ADVANCE * L.fs + L.fs * 0.08,
            top: L.cy - L.caretH / 2,
            width: L.caretW,
            height: L.caretH,
            borderRadius: L.caretW,
            backgroundColor: palette.caret,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  plus: "M12 5v14M5 12h14",
  link: "M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1",
  close: "M7 7l10 10M17 7L7 17",
  chevron: "M7 10l5 5 5-5",
  mic: "M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3",
  up: "M12 19V5M6 11l6-6 6 6",
  spark:
    "M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5",
};

function SceneB({
  question,
  prompt,
  url,
  palette,
  ground,
  groundParams,
}: {
  question: string;
  prompt: string;
  url: string;
  palette: (typeof THEMES)["dark"];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const P = promptLayout(W, H);
  const s = P.s;
  const typed = Math.floor(
    interpolate(
      frame,
      [B_BEATS.type, B_BEATS.typeEnd],
      [0, prompt.length],
      CLAMP,
    ),
  );
  const done = typed >= prompt.length;
  const caretOn = !done || Math.floor((frame - B_BEATS.typeEnd) / 8) % 2 === 1;
  const send = spring({ frame: frame - B_BEATS.send, fps, config: CHIP });
  const armed = interpolate(
    frame,
    [B_BEATS.typeEnd - 6, B_BEATS.typeEnd],
    [0, 1],
    CLAMP,
  );
  const push = interpolate(frame, [0, B_LEN], [1, 1.03], CLAMP);
  const words = question.split(" ");
  const qfs = (P.tall ? 60 : 54) * s;
  const pill = (label: string, icon?: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6 * s,
        height: 36 * s,
        padding: `0 ${12 * s}px`,
        borderRadius: 999,
        color: palette.muted,
        fontSize: 16 * s,
      }}
    >
      {icon ? <Icon d={icon} size={16 * s} color={palette.muted} /> : null}
      {label}
      <Icon d={ICONS.chevron} size={14 * s} color={palette.faint} />
    </div>
  );
  return (
    <AbsoluteFill>
      <GshGround
        preset={ground}
        params={ground ? groundParams : { ...palette.groundB, ...groundParams }}
        timeOffset={5}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: `${P.caretX}px ${P.caretY}px`,
          fontFamily: sans.fontFamily,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: P.cardLeft - 40 * s,
            width: P.cardW + 80 * s,
            top: P.cardTop - qfs * (P.tall ? 2.9 : 1.75),
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: "0.24em",
            fontSize: qfs,
            fontWeight: 300,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
            color: palette.ink,
          }}
        >
          {words.map((w, i) => {
            const p = interpolate(
              frame,
              [B_BEATS.heading + i * 2, B_BEATS.heading + i * 2 + 13],
              [0, 1],
              { ...CLAMP, easing: TYPE_IN },
            );
            return (
              <span
                key={`${w}-${i}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  padding: "0.04em 0.04em 0.14em",
                  margin: "-0.04em -0.04em -0.14em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 130}%)`,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: P.cardLeft,
            top: P.cardTop,
            width: P.cardW,
            padding: P.pad,
            borderRadius: 24 * s,
            backgroundColor: palette.card,
            boxShadow: `inset 0 0 0 1px ${palette.hairline}, inset 0 1px 0 ${palette.highlight}, 0 1px 2px rgba(${palette.shadow},0.12), 0 12px 32px rgba(${palette.shadow},0.18), 0 40px 90px rgba(${palette.shadow},0.22)`,
            backdropFilter: "blur(18px)",
            display: "flex",
            flexDirection: "column",
            gap: 16 * s,
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 8 * s,
              height: P.chipH,
              padding: `0 ${10 * s}px 0 ${6 * s}px`,
              borderRadius: 12 * s,
              backgroundColor: palette.chip,
              boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
              fontSize: 15 * s,
              color: palette.ink,
            }}
          >
            <div
              style={{
                width: 28 * s,
                height: 28 * s,
                borderRadius: 8 * s,
                backgroundColor: palette.caret,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS.link} size={16 * s} color="#ffffff" />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.15,
              }}
            >
              <span>{url}</span>
              <span style={{ color: palette.faint, fontSize: 12.5 * s }}>
                Brand kit attached
              </span>
            </div>
            <Icon d={ICONS.close} size={14 * s} color={palette.faint} />
          </div>
          <div
            style={{
              minHeight: P.fs * 1.38 * (P.tall ? 3 : 2),
              fontSize: P.fs,
              lineHeight: 1.38,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: palette.ink,
            }}
          >
            {prompt.slice(0, typed)}
            <span
              style={{
                display: "inline-block",
                width: P.caretW,
                height: P.caretH,
                marginLeft: typed > 0 ? 2 * s : 0,
                verticalAlign: "-0.2em",
                borderRadius: P.caretW,
                backgroundColor: palette.caret,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 * s }}>
            <div
              style={{
                width: 36 * s,
                height: 36 * s,
                borderRadius: 999,
                boxShadow: `inset 0 0 0 1px ${palette.hairline}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS.plus} size={18 * s} color={palette.muted} />
            </div>
            {pill("Launch film", ICONS.spark)}
            <div style={{ flex: 1 }} />
            {pill("Build")}
            <Icon d={ICONS.mic} size={20 * s} color={palette.muted} />
            <div
              style={{
                width: 38 * s,
                height: 38 * s,
                marginLeft: 6 * s,
                borderRadius: 11 * s,
                backgroundColor: palette.caret,
                opacity: 0.35 + armed * 0.65,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 - Math.sin(Math.min(1, send) * Math.PI) * 0.12})`,
                boxShadow: `0 6px 18px rgba(${palette.shadow},${0.25 * armed})`,
              }}
            >
              <Icon d={ICONS.up} size={20 * s} color={palette.sendInk} />
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function CaretCollapseDemo({
  theme = "dark",
  accent,
  url = "remocn.dev/launch",
  label = "is live",
  question = "What will you launch next?",
  prompt = "Make a 30-second launch film for our 2.0 release",
  ground,
  groundParams,
  groundB,
  groundParamsB,
}: CaretCollapseDemoProps) {
  const base = THEMES[theme];
  const palette = { ...base, caret: accent ?? base.caret };
  const { width: W, height: H } = useVideoConfig();
  const A = urlLayout(W, H, url);
  const B = promptLayout(W, H);
  return (
    <AbsoluteFill style={{ backgroundColor: palette.paper }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>
          <SceneA
            url={url}
            label={label}
            palette={palette}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={caretCollapse({
            from: {
              x: A.caretX / W,
              y: A.cy / H,
              h: A.caretH / H,
            },
            to: { x: B.caretX / W, y: B.caretY / H, h: B.caretH / H },
            paper: palette.paper,
            caret: palette.caret,
            caretWidth: A.caretW,
          })}
          timing={linearTiming({ durationInFrames: T_LEN })}
        />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>
          <SceneB
            question={question}
            prompt={prompt}
            url={url}
            palette={palette}
            ground={groundB}
            groundParams={groundParamsB}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
