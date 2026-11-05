"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });
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

const MPX = 100;

type Metrics = {
  width: (s: string) => number;
  ink: (ch: string) => { left: number; right: number };
  xh: number;
  asc: number;
  desc: number;
};

function buildMetrics(family: string, weight: number, _version: number) {
  const ctx =
    typeof document !== "undefined"
      ? document.createElement("canvas").getContext("2d")
      : null;
  const font = `${weight} ${MPX}px "${family}"`;
  const wCache: Record<string, number> = {};
  const metrics: Metrics = {
    width: (s: string) => {
      if (wCache[s] === undefined) {
        if (!ctx) return s.length * 0.55;
        ctx.font = font;
        wCache[s] = ctx.measureText(s).width / MPX;
      }
      return wCache[s];
    },
    ink: (ch: string) => {
      if (!ctx) return { left: 0.04, right: 0.52 };
      ctx.font = font;
      const m = ctx.measureText(ch);
      return {
        left: -m.actualBoundingBoxLeft / MPX,
        right: m.actualBoundingBoxRight / MPX,
      };
    },
    xh: (() => {
      if (!ctx) return 0.53;
      ctx.font = font;
      return ctx.measureText("x").actualBoundingBoxAscent / MPX;
    })(),
    asc: 0.94,
    desc: 0.22,
  };
  if (ctx) {
    ctx.font = font;
    const box = ctx.measureText("x");
    metrics.asc = box.fontBoundingBoxAscent / MPX;
    metrics.desc = box.fontBoundingBoxDescent / MPX;
  }
  return metrics;
}

function useMetrics(family: string, weight: number, label: string) {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender(`letter-gate: ${label}`));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      geist.waitUntilDone(),
      document.fonts.load(`${weight} ${MPX}px "${family}"`),
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
  }, [handle, family, weight]);
  return useMemo(
    () => buildMetrics(family, weight, version),
    [family, weight, version],
  );
}

const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.7, 0, 0.84, 0);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type LetterGateProps = {
  letters?: string;
  fontFamily?: string;
  fontWeight?: number;
  ink?: string;
  /** Point of the outgoing scene (0–1) that the push carries to frame centre. */
  focus?: [number, number];
  /** Share of the transition spent pushing into the outgoing scene. */
  cut?: number;
  zoom?: number;
  size?: number;
  depth?: number;
};

export const letterGateDefaults: Required<LetterGateProps> = {
  letters: "bu",
  fontFamily: geist.fontFamily,
  fontWeight: 400,
  ink: "#16181d",
  focus: [0.5, 0.5],
  cut: 0.38,
  zoom: 3.4,
  size: 1.12,
  depth: 1.1,
};

const LETTER_TRACK = -0.02;
const SWAP = 0.12;
const PUSH_BLUR = 5;

const travel = (q: number) => 0.32 * q + 0.68 * q ** 1.9;

const FILL: React.CSSProperties = { position: "absolute", inset: 0 };

const LetterGatePresentation: React.FC<
  TransitionPresentationComponentProps<LetterGateProps>
> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const o = { ...letterGateDefaults, ...passedProps };
  const uid = useId().replace(/:/g, "");
  const m = useMetrics(o.fontFamily, o.fontWeight, "gate glyphs");
  const q = clamp01((p - o.cut) / (1 - o.cut));

  if (presentationDirection === "exiting") {
    const t = clamp01(p / o.cut);
    // The push accelerates straight into the cut: it never decelerates onto
    // the magnified pair, so there is no held frame before the gate opens.
    const e = t ** 1.6;
    const z = Math.exp(Math.log(o.zoom) * e);
    const tx = (0.5 - o.focus[0]) * W * e;
    const ty = (0.5 - o.focus[1]) * H * e;
    const blur = PUSH_BLUR * t * t;
    return (
      <div
        style={{
          ...FILL,
          opacity: q > 0 ? 0 : 1,
          filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            ...FILL,
            transform: `translate(${tx}px, ${ty}px) scale(${z})`,
            transformOrigin: `${o.focus[0] * 100}% ${o.focus[1] * 100}%`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const shown = p >= o.cut ? 1 : 0;
  // Match cut: the glyphs take over at full strength on the cut frame, and
  // only the scene behind them dissolves in.
  const sceneIn = clamp01(q / SWAP);
  // Parting starts on the cut itself: the glyphs never hold, they open while
  // the new scene dissolves in under them.
  const frames = Math.max(1, presentationDurationInFrames * (1 - o.cut));
  // The gate is already opening on the cut frame, so the pair is never seen
  // closed and still.
  const g = clamp01(q + 2 / frames);
  const dg = 1 / frames;
  const bScale = lerp(o.depth, 1, ENTER(q));
  const bBlur = 14 * (1 - ENTER(clamp01(q / 0.85)));

  const chars = Array.from(o.letters);
  const first = chars[0] ?? "b";
  const second = chars[1] ?? "u";
  const Fm = Math.min(H * o.size, W * 0.95);
  const boundary =
    (m.width(first + second) - m.width(second) + LETTER_TRACK) * Fm;
  const reach = W * 0.5 + Fm * 0.7;
  const d = travel(g) * reach;
  const v = (travel(g) - travel(Math.max(0, g - dg))) * reach;
  // Carries the push's momentum: a quick extra swell that hands over to the
  // slower spread.
  const s = 1 + 0.18 * (1 - (1 - g) ** 4) + 0.45 * g * g;
  const blurX = Math.min(48, v * 0.22);
  const baseline = H / 2 + (m.xh * Fm) / 2;
  const leftX = W / 2 - boundary - d;
  const rightX = W / 2 + d;
  const lInk = m.ink(first);
  const rInk = m.ink(second);
  const leftGone = leftX + lInk.right * Fm < W / 2 - (W / 2) * (1 / s) - 4;
  const rightGone = rightX + rInk.left * Fm > W / 2 + (W / 2) * (1 / s) + 4;

  return (
    <div style={{ ...FILL, opacity: shown }}>
      <div
        style={{
          ...FILL,
          opacity: sceneIn,
          transform: `scale(${bScale})`,
          filter: bBlur > 0.2 ? `blur(${bBlur.toFixed(2)}px)` : undefined,
        }}
      >
        {children}
      </div>
      <svg
        width={W}
        height={H}
        style={{ ...FILL, overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <filter
            id={`${uid}-smear`}
            x="-60%"
            y="-10%"
            width="220%"
            height="120%"
          >
            <feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} />
          </filter>
        </defs>
        <g
          transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2} ${-H / 2})`}
          filter={blurX > 0.3 ? `url(#${uid}-smear)` : undefined}
          style={{
            fontFamily: o.fontFamily,
            fontWeight: o.fontWeight,
            fontSize: Fm,
          }}
          fill={o.ink}
        >
          {leftGone ? null : (
            <text x={leftX} y={baseline}>
              {first}
            </text>
          )}
          {rightGone ? null : (
            <text x={rightX} y={baseline}>
              {second}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};

export function letterGate(
  props: LetterGateProps = {},
): TransitionPresentation<LetterGateProps> {
  return { component: LetterGatePresentation, props };
}

type Palette = {
  ink: string;
  muted: string;
  tint: string;
  accent: string;
  pillBg: string;
  pillBorder: string;
  pillInk: string;
  pillShadow: string;
  logo: string;
  field: string;
  handle: string;
  dot: string;
  nodeBase: string;
  shadow: string;
  violet: string;
  groundA: Partial<GradientParams>;
  groundB: Partial<GradientParams>;
};

const THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    ink: "#eef1fa",
    muted: "rgba(226,232,248,0.48)",
    tint: "#7b95ff",
    accent: "#3b5bfd",
    pillBg: "rgba(10,13,26,0.78)",
    pillBorder: "rgba(255,255,255,0.16)",
    pillInk: "#eef1fa",
    pillShadow:
      "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.35), 0 18px 40px rgba(0,4,30,0.45)",
    logo: "#ffffff",
    field: "rgba(255,255,255,0.035)",
    handle: "#0b0e17",
    dot: "rgba(255,255,255,0.085)",
    nodeBase: "rgba(13,17,29,0.86)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3), 0 14px 32px rgba(0,0,0,0.35)",
    violet: "#b39bff",
    groundA: {
      kind: "dither-burst",
      colors: ["#14208f", "#2e5bff", "#9fbcff", "#f4f6ff"],
      background: "#020309",
      speed: 1,
      loopSeconds: 14,
      warp: 0.25,
      seed: 12,
    },
    groundB: {
      kind: "mist",
      colors: ["#3557f0", "#1a2a8c", "#0b1240", "#04060f"],
      background: "#03050c",
      speed: 0.5,
      loopSeconds: 18,
      scale: 0.75,
      warp: 0.35,
      blur: 0.8,
      grain: 0.1,
      seed: 9,
    },
  },
  light: {
    ink: "#16181d",
    muted: "rgba(22,24,29,0.46)",
    tint: "#3b5bfd",
    accent: "#3b5bfd",
    pillBg: "#ffffff",
    pillBorder: "rgba(20,24,40,0.08)",
    pillInk: "#16181d",
    pillShadow:
      "0 1px 2px rgba(30,40,90,0.08), 0 8px 20px rgba(30,40,90,0.1), 0 24px 48px rgba(30,40,90,0.08)",
    logo: "#16181d",
    field: "#ffffff",
    handle: "#ffffff",
    dot: "rgba(30,34,52,0.14)",
    nodeBase: "rgba(255,255,255,0.92)",
    shadow:
      "0 1px 2px rgba(30,40,80,0.06), 0 6px 18px rgba(30,40,80,0.07), 0 20px 40px rgba(30,40,80,0.05)",
    violet: "#7a4df0",
    groundA: {
      kind: "mist",
      colors: ["#3d5cf5", "#8ea4ff", "#d4dcff", "#f3efe7"],
      background: "#eceef6",
      speed: 0.6,
      loopSeconds: 16,
      scale: 0.8,
      warp: 0.4,
      blur: 0.7,
      grain: 0.2,
      seed: 7,
    },
    groundB: {
      kind: "mist",
      colors: ["#c9d3ff", "#e6e9fb", "#f6efe4", "#9fb0f5"],
      background: "#f4f1ea",
      speed: 0.5,
      loopSeconds: 18,
      scale: 0.8,
      warp: 0.35,
      blur: 0.75,
      grain: 0.22,
      seed: 4,
    },
  },
};

const A_LEN = 64;
const B_LEN = 80;
const T_LEN = 26;
export const LETTER_GATE_DURATION = A_LEN + B_LEN - T_LEN;

const A_BEATS = { pill: -4, logo: -1, punch1: 18, punch2: 30 } as const;
const B_BEATS = {
  type: 24,
  press: 46,
  edge: 48,
  edgeLen: 14,
  node: 58,
} as const;
const PUNCH = [1, 1.35, 1.8] as const;

function pillFont(W: number, H: number) {
  const u = Math.min(W, H) / 720;
  return 38 * u;
}

function SceneA({
  text,
  palette,
  ground,
  groundParams,
}: {
  text: string;
  palette: Palette;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W, H) / 720;
  const fs = pillFont(W, H);
  const rise = spring({ frame: frame - A_BEATS.pill, fps, config: CARD });
  const logoIn = ENTER(clamp01((frame - A_BEATS.logo) / 12));
  const step = frame >= A_BEATS.punch2 ? 2 : frame >= A_BEATS.punch1 ? 1 : 0;
  const since =
    step === 2
      ? frame - A_BEATS.punch2
      : step === 1
        ? frame - A_BEATS.punch1
        : 99;
  const kick = since < 3 ? 1.035 - since * 0.012 : 1;
  const cam = PUNCH[step] * kick * (1 + 0.01 * clamp01(frame / A_LEN));
  return (
    <AbsoluteFill style={{ background: palette.groundA.background }}>
      <GshGround
        preset={ground}
        params={
          ground && !groundParams
            ? undefined
            : (groundParams ?? palette.groundA)
        }
        timeOffset={3}
        timeScale={0.7}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${cam})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: H / 2 - fs * 2.6,
            display: "flex",
            justifyContent: "center",
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 10 * u}px)`,
          }}
        >
          <RemocnLogo fontSize={24 * u} color={palette.logo} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: H / 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transform: `translateY(-50%) translateY(${(1 - rise) * 40 * u}px) scale(${lerp(0.9, 1, rise)})`,
              opacity: clamp01(rise * 2),
              filter: `blur(${Math.max(0, (1 - rise) * 6).toFixed(2)}px)`,
              background: palette.pillBg,
              border: `${1 * u}px solid ${palette.pillBorder}`,
              boxShadow: palette.pillShadow,
              borderRadius: 999,
              padding: `${fs * 0.42}px ${fs * 0.78}px ${fs * 0.46}px`,
              fontFamily: geist.fontFamily,
              fontWeight: 400,
              fontSize: fs,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: palette.pillInk,
              whiteSpace: "pre",
            }}
          >
            {text}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Handles({
  w,
  h,
  k,
  color,
  fill,
  t,
}: {
  w: number;
  h: number;
  k: number;
  color: string;
  fill: string;
  t: number;
}) {
  if (t <= 0.001) return null;
  const s = 7 * k;
  const corners = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ];
  return (
    <>
      {corners.map(([cx, cy]) => (
        <div
          key={`h${cx}-${cy}`}
          style={{
            position: "absolute",
            left: cx - s / 2,
            top: cy - s / 2,
            width: s,
            height: s,
            background: fill,
            border: `${1.25 * k}px solid ${color}`,
            borderRadius: 1.5 * k,
            transform: `scale(${t})`,
            boxSizing: "border-box",
          }}
        />
      ))}
    </>
  );
}

function SceneB({
  prompt,
  placeholder,
  label,
  nextLabel,
  palette,
  accent,
  ground,
  groundParams,
}: {
  prompt: string;
  placeholder: string;
  label: string;
  nextLabel: string;
  palette: Palette;
  accent: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const uid = useId().replace(/:/g, "");
  const tall = H > W * 1.1;
  const u = Math.min(W, H) / 720;
  const k = (tall ? 1.6 : 1.9) * u;
  const fieldText = 15 * k;
  const chars = Math.max(prompt.length, placeholder.length);
  const fw = 14 * k + chars * 0.6 * fieldText + 12 * k + 34 * k + 10 * k;
  const fh = 56 * k;
  const cx = W / 2;
  const cy = H / 2;
  const typed = Math.floor(
    clamp01((frame - B_BEATS.type) / prompt.length) * prompt.length,
  );
  const press = frame - B_BEATS.press;
  const pressS =
    press >= 0 ? 1 - 0.12 * Math.sin(Math.PI * clamp01(press / 6)) : 1;
  const edgeP = MOVE(clamp01((frame - B_BEATS.edge) / B_BEATS.edgeLen));
  const nodeLocal = frame - B_BEATS.node;
  const tw = 64 * k;
  const nx = tall ? cx + W * 0.16 : W * 0.85;
  const ny = tall ? cy + fh / 2 + 170 * k : cy + 0.2 * H;
  const from = tall ? { x: cx, y: cy + fh / 2 } : { x: cx + fw / 2, y: cy };
  const to = tall ? { x: nx, y: ny - tw / 2 } : { x: nx - tw / 2, y: ny };
  const c1 = tall
    ? { x: from.x, y: from.y + (to.y - from.y) * 0.5 }
    : { x: from.x + (to.x - from.x) * 0.5, y: from.y };
  const c2 = tall
    ? { x: to.x, y: to.y - (to.y - from.y) * 0.5 }
    : { x: to.x - (to.x - from.x) * 0.5, y: to.y };
  const edgeD = `M${from.x} ${from.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
  const inFrom = tall
    ? { x: cx - W * 0.2, y: -20 }
    : { x: -20, y: cy - 90 * k };
  const inTo = tall
    ? { x: cx, y: cy - fh / 2 - 34 * k }
    : { x: cx - fw / 2, y: cy };
  const inD = tall
    ? `M${inFrom.x} ${inFrom.y}C${inFrom.x} ${inTo.y * 0.6} ${inTo.x} ${inTo.y * 0.5} ${inTo.x} ${inTo.y}`
    : `M${inFrom.x} ${inFrom.y}C${inTo.x * 0.5} ${inFrom.y} ${inTo.x * 0.5} ${inTo.y} ${inTo.x} ${inTo.y}`;
  const push = 1 + 0.04 * clamp01(frame / B_LEN);
  const len = 900 * k;
  const nodePop = spring({ frame: nodeLocal, fps, config: CARD });
  const labelShown = Math.max(0, nodeLocal - 2);
  return (
    <AbsoluteFill style={{ background: palette.groundB.background }}>
      <GshGround
        preset={ground}
        params={
          ground && !groundParams
            ? undefined
            : (groundParams ?? palette.groundB)
        }
        timeOffset={5}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <pattern
              id={`${uid}-dots`}
              width={24 * k}
              height={24 * k}
              patternUnits="userSpaceOnUse"
              x={cx}
              y={cy}
            >
              <circle cx={12 * k} cy={12 * k} r={1.1 * k} fill={palette.dot} />
            </pattern>
          </defs>
          <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-dots)`} />
          <path
            d={inD}
            fill="none"
            stroke={palette.tint}
            strokeOpacity={0.55}
            strokeWidth={1.6 * k}
            strokeDasharray={`${5 * k} ${5 * k}`}
            strokeDashoffset={-frame * 0.4 * k}
            strokeLinecap="round"
          />
          {edgeP > 0 ? (
            <path
              d={edgeD}
              fill="none"
              stroke={palette.violet}
              strokeWidth={1.6 * k}
              strokeDasharray={`${len * edgeP} ${len}`}
              strokeLinecap="round"
              mask={`url(#${uid}-dash)`}
            />
          ) : null}
          <mask id={`${uid}-dash`} maskUnits="userSpaceOnUse">
            <path
              d={edgeD}
              fill="none"
              stroke="#fff"
              strokeWidth={3 * k}
              strokeDasharray={`${5 * k} ${5 * k}`}
            />
          </mask>
        </svg>
        <div
          style={{
            position: "absolute",
            left: cx - fw / 2,
            top: cy - fh / 2,
            width: fw,
            height: fh,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              width: fw,
              bottom: fh + 10 * k,
              textAlign: "center",
              fontFamily: mono.fontFamily,
              fontWeight: 400,
              fontSize: 15 * k,
              lineHeight: 1,
              color: palette.tint,
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 11 * k,
              background: palette.field,
              border: `${1.5 * k}px solid ${palette.tint}`,
              boxShadow: palette.shadow,
              display: "flex",
              alignItems: "center",
              paddingLeft: 16 * k,
              boxSizing: "border-box",
              fontFamily: mono.fontFamily,
              fontWeight: 400,
              fontSize: fieldText,
              color: typed > 0 ? palette.ink : palette.muted,
              whiteSpace: "pre",
            }}
          >
            {typed > 0 ? prompt.slice(0, typed) : placeholder}
            {frame < B_BEATS.press + 2 && Math.floor(frame / 5) % 2 === 0 ? (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5 * k,
                  height: fieldText * 1.15,
                  marginLeft: 2 * k,
                  background: palette.tint,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                right: 10 * k,
                top: fh / 2 - 17 * k,
                width: 34 * k,
                height: 34 * k,
                borderRadius: 17 * k,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${pressS})`,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={18 * k}
                height={18 * k}
                aria-hidden
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <Handles
            w={fw}
            h={fh}
            k={k}
            color={palette.tint}
            fill={palette.handle}
            t={1 - EXIT(clamp01((frame - B_BEATS.edge - 4) / 6))}
          />
        </div>
        {nodeLocal >= 0 ? (
          <div
            style={{
              position: "absolute",
              left: nx - tw / 2,
              top: ny - tw / 2,
              width: tw,
              height: tw,
              opacity: clamp01(nodeLocal / 4),
              transform: `scale(${lerp(1.14, 1, nodePop)})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                ...(tall
                  ? { left: tw + 14 * k, top: tw / 2 - 7.5 * k }
                  : { left: -40 * k, width: tw + 80 * k, bottom: tw + 9 * k }),
                textAlign: tall ? "left" : "center",
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: 15 * k,
                lineHeight: 1,
                color: palette.violet,
                whiteSpace: "pre",
              }}
            >
              {nextLabel.slice(0, Math.min(nextLabel.length, labelShown))}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 6 * k,
                background: palette.nodeBase,
                border: `${1.5 * k}px solid ${palette.violet}`,
                boxShadow: palette.shadow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 40 * k,
                  height: 40 * k,
                  borderRadius: 7 * k,
                  border: `${1.2 * k}px dashed ${palette.violet}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${spring({ frame: nodeLocal - 4, fps, config: CHIP })})`,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={21 * k}
                  height={21 * k}
                  aria-hidden
                >
                  <rect
                    x={5}
                    y={3}
                    width={14}
                    height={18}
                    rx={2.5}
                    fill="none"
                    stroke={palette.violet}
                    strokeWidth={1.5}
                  />
                  <path
                    d="M8.5 8h7M8.5 12h7M8.5 16h4"
                    fill="none"
                    stroke={palette.violet}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <Handles
              w={tw}
              h={tw}
              k={k}
              color={palette.violet}
              fill={palette.handle}
              t={spring({ frame: nodeLocal, fps, config: CHIP })}
            />
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export type LetterGateDemoProps = {
  theme?: "dark" | "light";
  accent?: string;
  text?: string;
  gate?: string;
  prompt?: string;
  placeholder?: string;
  label?: string;
  nextLabel?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  groundB?: GshPresetId;
  groundParamsB?: Partial<GradientParams>;
  transition?: LetterGateProps;
};

export function LetterGateDemo({
  theme = "dark",
  accent,
  text = "Start building",
  gate = "bu",
  prompt = "A launch film for v2",
  placeholder = "Describe your launch",
  label = "Prompt",
  nextLabel = "Script",
  ground,
  groundParams,
  groundB,
  groundParamsB,
  transition,
}: LetterGateDemoProps) {
  const { width: W, height: H } = useVideoConfig();
  const palette = THEMES[theme];
  const acc = accent ?? palette.accent;
  const m = useMetrics(geist.fontFamily, 400, "pill text");
  const idx = Math.max(0, text.indexOf(gate));
  const pair = text.indexOf(gate) >= 0 ? gate : text.slice(idx, idx + 2);
  const t = { ...letterGateDefaults, ...transition };
  // The push lands the pair exactly where the gate glyphs start, so the cut is
  // a match cut: same letters, same size, same place, new scene behind them.
  const u = Math.min(W, H) / 720;
  const fs = pillFont(W, H);
  const cutFrame = A_LEN - T_LEN + t.cut * T_LEN;
  const cam = PUNCH[2] * (1 + 0.01 * clamp01(cutFrame / A_LEN));
  const textW = (m.width(text) + LETTER_TRACK * text.length) * fs;
  const pairEnd = m.width(text.slice(0, idx + 2)) - m.width(pair.slice(1));
  const gateX = W / 2 - textW / 2 + (pairEnd + LETTER_TRACK * (idx + 1)) * fs;
  // Mirrors Chrome's line box: ascent and descent round to whole pixels and
  // the half-leading floors, which matters once the push magnifies it ~20×.
  const pillH = fs * (0.42 + 1.1 + 0.46) + 2 * u;
  const lineTop = H / 2 - pillH / 2 + u + 0.42 * fs;
  const asc = Math.round(m.asc * fs);
  const desc = Math.round(m.desc * fs);
  const baseline = lineTop + Math.floor((1.1 * fs - asc - desc) / 2) + asc;
  const gateY = baseline - (m.xh * fs) / 2;
  const Fm = Math.min(H * t.size, W * 0.95);
  const fx = (W / 2 + (gateX - W / 2) * cam) / W;
  const fy = (H / 2 + (gateY - H / 2) * cam) / H;
  const zoom = Fm / (fs * cam);
  return (
    <AbsoluteFill style={{ backgroundColor: palette.groundB.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={A_LEN}>
          <SceneA
            text={text}
            palette={palette}
            ground={ground}
            groundParams={groundParams}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={letterGate({
            letters: pair,
            fontFamily: geist.fontFamily,
            fontWeight: 400,
            ink: palette.ink,
            focus: [fx, fy],
            zoom,
            ...transition,
          })}
          timing={linearTiming({ durationInFrames: T_LEN })}
        />
        <TransitionSeries.Sequence durationInFrames={B_LEN}>
          <SceneB
            prompt={prompt}
            placeholder={placeholder}
            label={label}
            nextLabel={nextLabel}
            palette={palette}
            accent={acc}
            ground={groundB}
            groundParams={groundParamsB}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
