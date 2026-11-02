"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const serifUpright = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const serifItalic = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const sans = manrope.fontFamily;
const serif = serifUpright.fontFamily;

/**
 * Beat sheet (30fps, speed 1):
 * 0–34     the headline rises; a glass drop slides in and settles on the
 *          focus word, magnifying it. 34–62 hold on the word.
 * 62–124   the drop glides to the highlighted clip in the product pane.
 * 124–180  it travels down to the CTA slot, flattens into a pill and fills
 *          with the accent; the label and arrow land. 180–210 hold.
 * The pane's preview carries the gradients.sh "silk" sheen, so the glass has
 * colour to bend as it passes; the refraction is a single clean pass (no
 * RGB split) that pulls the rim inward, never the line next to it.
 */

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: sans,
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

export interface GlassLensProps {
  /** Headline lines, set big on the left. */
  lines?: string[];
  /** Set the last headline line in italic. */
  italicLast?: boolean;
  /** Which word the lens stops on first: line index and word index. */
  focus?: { line: number; word: number };
  /** Label inside the pill the lens becomes. */
  cta?: string;
  /** Replaces the remocn logo above the headline. */
  logo?: React.ReactNode;
  /** Screenshot for the product pane. */
  src?: string;
  /** Custom content for the product pane (wins over `src`). */
  children?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.06)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    pane: "#131315",
    paneEdge: "rgba(255,255,255,0.09)",
    block: "rgba(255,255,255,0.06)",
    blockHi: "rgba(255,255,255,0.11)",
    hair: "rgba(255,255,255,0.07)",
    paneShadow: "0 30px 80px -20px rgba(0,0,0,0.9)",
    glassTint: "rgba(255,255,255,0.03)",
    rimHi: 0.85,
    rimLo: 0.22,
    lensShadow: "rgba(0,0,0,0.7)",
    edgeLine: "rgba(255,255,255,0.05)",
    innerShade: "rgba(0,0,0,0.3)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.85)",
    fg: "#121214",
    muted: "#6E6C67",
    pane: "#FFFFFF",
    paneEdge: "rgba(18,18,20,0.08)",
    block: "rgba(18,18,20,0.05)",
    blockHi: "rgba(18,18,20,0.09)",
    hair: "rgba(18,18,20,0.07)",
    paneShadow: "0 30px 70px -24px rgba(60,52,40,0.28)",
    glassTint: "rgba(255,255,255,0.07)",
    rimHi: 1,
    rimLo: 0.45,
    lensShadow: "rgba(60,52,40,0.22)",
    edgeLine: "rgba(18,18,20,0.07)",
    innerShade: "rgba(60,52,40,0.12)",
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

/** gradients.sh "silk" (bg #030308; #3b3fd8, #f3d6c0, #8a7bff). */
function silk(t: number) {
  const a = 172 + Math.sin(t / 50) * 3;
  const x = 45 + Math.sin(t / 61) * 4;
  return [
    `linear-gradient(${a}deg, transparent 22%, rgba(243,214,192,0.62) 34%, rgba(59,63,216,0.72) 46%, transparent 82%)`,
    `radial-gradient(70% 45% at ${x}% 42%, rgba(138,123,255,0.4), transparent 70%)`,
    "#030308",
  ].join(", ");
}

const HEAD_TRACK = -0.022;
const CTA_TRACK = -0.015;

interface Face {
  family: string;
  italic?: boolean;
  weight: number;
  track: number;
}

let measureCtx: CanvasRenderingContext2D | null = null;
/** Advance width in em with the loaded face (a rough estimate before that). */
function measureEm(text: string, f: Face) {
  if (!measureCtx && typeof document !== "undefined") {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  const tracking = f.track * [...text].length;
  if (!measureCtx) return text.length * 0.48 + tracking;
  measureCtx.font = `${f.italic ? "italic " : ""}${f.weight} 100px "${f.family}"`;
  return measureCtx.measureText(text).width / 100 + tracking;
}

/** Holds the frame until the faces are in, so layout is measured once, right. */
function useFontsReady() {
  const [handle] = useState(() => delayRender("glass-lens: fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([
      manrope.waitUntilDone(),
      serifUpright.waitUntilDone(),
      serifItalic.waitUntilDone(),
    ]).then(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Layout {
  u: number;
  left: number;
  top: number;
  size: number;
  lineH: number;
  pane: { x: number; y: number; w: number; h: number };
  clip: { x: number; y: number };
  ctaY: number;
}

function useLayout(lineEms: number[]): Layout {
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const left = width * 0.075;
  const longest = Math.max(...lineEms);
  const size = Math.min(108 * u, (width * 0.43) / Math.max(longest, 1));
  const lineH = size * 1.02;
  const top = height * 0.5 - (lineEms.length * lineH) / 2 - 30 * u;
  const pane = {
    x: width * 0.535,
    y: height * 0.17,
    w: width * 0.4,
    h: height * 0.66,
  };
  // the accent clip in the placeholder timeline: the second lens stop
  const clip = {
    x: pane.x + pane.w * 0.47,
    y: pane.y + pane.h * 0.775,
  };
  return {
    u,
    left,
    top,
    size,
    lineH,
    pane,
    clip,
    ctaY: top + lineEms.length * lineH + 60 * u,
  };
}

/** The abstracted product: a pane of hairlines, a preview and a timeline. */
function Placeholder({
  w,
  h,
  u,
  p,
  accent,
  t,
}: {
  w: number;
  h: number;
  u: number;
  p: Palette;
  accent: string;
  t: number;
}) {
  const pad = w * 0.05;
  const bar = (x: number, y: number, bw: number, bh: number, c: string) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: bw,
        height: bh,
        borderRadius: bh / 2,
        background: c,
      }}
    />
  );
  const clips = [
    [0.05, 0.26, 0],
    [0.33, 0.28, 1],
    [0.63, 0.32, 0],
    [0.05, 0.4, 0],
    [0.47, 0.22, 0],
    [0.71, 0.24, 0],
  ];
  const head = (w - pad * 2) * interpolate(t, [20, 190], [0.38, 0.62], CLAMP);
  return (
    <>
      {bar(pad, h * 0.045, w * 0.16, 9 * u, p.blockHi)}
      {bar(w - pad - w * 0.1, h * 0.045, w * 0.1, 9 * u, p.block)}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: h * 0.11,
          height: 1,
          background: p.hair,
        }}
      />
      {/* the preview: the film being cut, lit by the silk sheen */}
      <div
        style={{
          position: "absolute",
          left: pad,
          top: h * 0.155,
          width: w - pad * 2,
          height: h * 0.47,
          borderRadius: 10 * u,
          background: silk(t),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "8%",
            bottom: "16%",
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 34 * u,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "#FFF8F2",
          }}
        >
          Launch day.
        </div>
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            bottom: "8%",
            height: 3 * u,
            borderRadius: 2 * u,
            background: "rgba(255,255,255,0.18)",
          }}
        >
          <div
            style={{
              width: `${interpolate(t, [0, 210], [22, 61], CLAMP)}%`,
              height: "100%",
              borderRadius: 2 * u,
              background: "rgba(255,248,242,0.85)",
            }}
          />
        </div>
      </div>
      {[0, 1].map((row) =>
        clips
          .filter((_, i) => Math.floor(i / 3) === row)
          .map(([x, cw, hi], i) => (
            <div
              key={`${row}-${x}`}
              style={{
                position: "absolute",
                left: pad + (w - pad * 2) * x,
                top: h * (0.73 + row * 0.1),
                width: (w - pad * 2) * cw - 4 * u,
                height: h * 0.075,
                borderRadius: 6 * u,
                background: hi ? accent : p.block,
                boxShadow: hi ? "none" : `inset 0 0 0 1px ${p.hair}`,
                display: "flex",
                alignItems: "center",
                paddingLeft: 8 * u,
                fontFamily: sans,
                fontSize: 10.5 * u,
                fontWeight: 500,
                color: hi ? "#FFFFFF" : p.muted,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {hi ? "Scene 03 · 4.2s" : i === 0 && row === 0 ? "Intro" : ""}
            </div>
          )),
      )}
      <div
        style={{
          position: "absolute",
          left: pad + head,
          top: h * 0.69,
          width: Math.max(1, 1.5 * u),
          height: h * 0.25,
          background: p.fg,
          opacity: 0.55,
        }}
      />
    </>
  );
}

/** Everything under the glass. Rendered once flat and once magnified. */
function Scene({
  t,
  lines,
  italicLast,
  logo,
  src,
  children,
  accent,
  p,
  L,
}: {
  t: number;
  lines: string[];
  italicLast: boolean;
  logo?: React.ReactNode;
  src?: string;
  children?: React.ReactNode;
  accent: string;
  p: Palette;
  L: Layout;
}) {
  const { width, height } = useVideoConfig();
  const { u } = L;
  const rise = (d: number) =>
    interpolate(t, [d - 8, d + 20], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const paneIn = rise(4);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        background: p.bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 70% at 38% 30%, ${p.stage}, transparent 75%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: L.left,
          top: L.top - 64 * u,
          opacity: rise(0),
        }}
      >
        {logo ?? <RemocnLogo fontSize={26 * u} color={p.fg} />}
      </div>
      {lines.map((line, i) => {
        const italic = italicLast && i === lines.length - 1 && lines.length > 1;
        return (
          <div
            key={line}
            style={{
              position: "absolute",
              left: L.left,
              top: L.top + i * L.lineH,
              height: L.lineH,
              display: "flex",
              alignItems: "center",
              fontFamily: serif,
              fontStyle: italic ? "italic" : "normal",
              fontWeight: 400,
              fontSize: L.size,
              letterSpacing: `${HEAD_TRACK}em`,
              lineHeight: 1,
              color: p.fg,
              whiteSpace: "pre",
              opacity: rise(i * 3),
              transform: `translateY(${(1 - rise(i * 3)) * 24 * u}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: L.pane.x,
          top: L.pane.y,
          width: L.pane.w,
          height: L.pane.h,
          borderRadius: 16 * u,
          background: p.pane,
          boxShadow: `inset 0 0 0 1px ${p.paneEdge}, ${p.paneShadow}`,
          overflow: "hidden",
          opacity: paneIn,
          transform: `translateX(${(1 - paneIn) * 40 * u}px)`,
        }}
      >
        {children ??
          (src ? (
            <Img
              src={src}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Placeholder
              w={L.pane.w}
              h={L.pane.h}
              u={u}
              p={p}
              accent={accent}
              t={t}
            />
          ))}
      </div>
    </div>
  );
}

/**
 * Displacement map for a convex drop: R/G ramps run from the rim toward the
 * centre (inverted), so the rim samples inward and the lens never pulls in
 * the content around it. Neutral grey (no shift) across the flat middle.
 */
function lensMap(w: number, h: number, edge: number) {
  const r = h / 2;
  const iw = Math.max(1, w - edge * 2);
  const ih = Math.max(1, h - edge * 2);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='x'><stop offset='0' stop-color='#f00'/><stop offset='1' stop-color='#000'/></linearGradient><linearGradient id='y' x2='0' y2='1'><stop offset='0' stop-color='#0f0'/><stop offset='1' stop-color='#000'/></linearGradient><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='${edge * 0.3}'/></filter></defs><rect width='${w}' height='${h}' fill='rgb(128,128,0)'/><rect width='${w}' height='${h}' rx='${r}' fill='url(#x)'/><rect width='${w}' height='${h}' rx='${r}' fill='url(#y)' style='mix-blend-mode:screen'/><rect x='${edge}' y='${edge}' width='${iw}' height='${ih}' rx='${Math.max(0, r - edge)}' fill='rgb(128,128,0)' filter='url(#b)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** White where the glass is flat: the interior passes through untouched. */
function coreMask(w: number, h: number, edge: number) {
  const inset = edge * 1.6;
  const iw = Math.max(1, w - inset * 2);
  const ih = Math.max(1, h - inset * 2);
  const r = Math.max(0, h / 2 - inset);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='${edge * 0.14}'/></filter></defs><rect x='${inset}' y='${inset}' width='${iw}' height='${ih}' rx='${r}' fill='#fff' filter='url(#b)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function GlassLens({
  lines = ["Every frame,", "composed."],
  italicLast = true,
  focus = { line: 0, word: 1 },
  cta = "Start with remocn",
  logo,
  src,
  children,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: GlassLensProps) {
  const frame = useCurrentFrame() * speed;
  const { fps, width } = useVideoConfig();
  const p = THEMES[theme];
  const fid = `lens${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ready = useFontsReady();

  const faceFor = (i: number): Face => ({
    family: serif,
    italic: italicLast && i === lines.length - 1 && lines.length > 1,
    weight: 400,
    track: HEAD_TRACK,
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure once the faces load
  const m = useMemo(() => {
    const lineEms = lines.map((l, i) => measureEm(l, faceFor(i)));
    const fl = lines[focus.line] ?? lines[0];
    const face = faceFor(lines[focus.line] ? focus.line : 0);
    const words = fl.split(" ");
    const before = words.slice(0, focus.word).join(" ");
    const wordEm = measureEm(words[focus.word] ?? words[0], face);
    const beforeEm = before ? measureEm(`${before} `, face) : 0;
    const ctaEm = measureEm(cta, {
      family: sans,
      weight: 500,
      track: CTA_TRACK,
    });
    return { lineEms, wordEm, beforeEm, ctaEm };
  }, [ready, lines, focus.line, focus.word, cta, italicLast]);
  const L = useLayout(m.lineEms);
  const { u } = L;

  // lens stops: off the headline, the focus word, the accent clip, the CTA
  const fx = L.left + m.beforeEm * L.size + (m.wordEm * L.size) / 2;
  const fy = L.top + (focus.line + 0.5) * L.lineH;

  const ctaSize = 21 * u;
  const ctaH = 64 * u;
  const ctaW = m.ctaEm * ctaSize + 28 * u + 64 * u;
  const stops = [
    { t: 0, x: L.left - 60 * u, y: fy + 40 * u, arc: 0 },
    { t: 34, x: fx, y: fy, arc: -30 },
    { t: 62, x: fx, y: fy, arc: 0 },
    { t: 98, x: L.clip.x, y: L.clip.y, arc: 70 },
    { t: 124, x: L.clip.x, y: L.clip.y, arc: 0 },
    { t: 158, x: L.left + ctaW / 2, y: L.ctaY, arc: 50 },
  ];
  const posAt = (tt: number) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (tt <= b.t) {
        const k = EASE_IO(interpolate(tt, [a.t, b.t], [0, 1], CLAMP) as number);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const bend = Math.sin(Math.PI * k) * b.arc * u;
        return {
          x: a.x + dx * k + (-dy / len) * bend,
          y: a.y + dy * k + (dx / len) * bend,
        };
      }
    }
    const last = stops[stops.length - 1];
    return { x: last.x, y: last.y };
  };
  const pos = posAt(frame);
  const prev = posAt(frame - 1.5);
  const vx = (pos.x - prev.x) / 1.5 / u;
  const vy = (pos.y - prev.y) / 1.5 / u;
  const spd = Math.hypot(vx, vy);
  const still = interpolate(spd, [0, 9], [1, 0], CLAMP);

  // liquid morph into the CTA pill: the drop flattens first and bulges
  // sideways (volume kept), then the width settles onto the label
  const mH = spring({
    frame: frame - 142,
    fps,
    config: { damping: 12, stiffness: 110, mass: 0.9 },
  });
  const mW = spring({
    frame: frame - 148,
    fps,
    config: { damping: 13, stiffness: 100, mass: 1 },
  });
  const bulge = 1 + 0.2 * Math.max(0, mH - mW);
  // wide enough that the magnified focus word sits inside the flat middle
  const baseW = Math.max(350 * u, m.wordEm * L.size * 1.18 + 90 * u);
  const baseH = 150 * u;
  const sx = 1 + interpolate(Math.abs(vx), [0, 30], [0, 0.2], CLAMP);
  const sy = 1 + interpolate(Math.abs(vy), [0, 30], [0, 0.2], CLAMP);
  const lw = (baseW + (ctaW - baseW) * mW) * bulge * sx * (2 - sy);
  const lh = (baseH + (ctaH - baseH) * mH) * sy * (2 - sx) ** 0.6;
  // once it lands, the pill grows from its left edge like a real button
  const anchor = Math.min(1, mH);
  const cx = pos.x + (L.left + lw / 2 - pos.x) * anchor;
  const lx = cx - lw / 2;
  const ly = pos.y - lh / 2;
  const radius = lh / 2;
  const morph = Math.min(1, mH);

  const enter = interpolate(frame, [-6, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const mag = 1 + (0.08 + 0.1 * still) * (1 - morph);
  const disp = (22 + 8 * still) * u * (1 - 0.55 * morph);
  const edge = Math.min(lw, lh) * 0.24;
  const M = Math.ceil(disp + 8 * u);
  const map = lensMap(Math.round(lw), Math.round(lh), edge);
  const core = coreMask(Math.round(lw), Math.round(lh), edge);

  const tint = interpolate(frame, [147, 160], [0, 0.92], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const label = interpolate(frame, [157, 173], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const arrow = interpolate(frame, [163, 180], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // the key light sits up-left; the rim highlight drifts as the lens travels
  const rimX = 22 + (pos.x / width) * 16;

  const sceneProps = {
    t: frame,
    lines,
    italicLast,
    logo,
    src,
    children,
    accent,
    p,
    L,
  };

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <Scene {...sceneProps} />

      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter
            id={fid}
            x={0}
            y={0}
            width={lw + M * 2}
            height={lh + M * 2}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map}
              x={M}
              y={M}
              width={lw}
              height={lh}
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={disp}
              xChannelSelector="R"
              yChannelSelector="G"
              result="bent"
            />
            {/* displacement samples nearest-pixel: soften the bent rim, and
                keep the flat middle as the crisp (magnified) source */}
            <feGaussianBlur in="bent" stdDeviation={0.6 * u} result="soft" />
            <feImage
              href={core}
              x={M}
              y={M}
              width={lw}
              height={lh}
              preserveAspectRatio="none"
              result="core"
            />
            <feComposite
              in="SourceGraphic"
              in2="core"
              operator="in"
              result="sharp"
            />
            <feComposite in="soft" in2="core" operator="out" result="rim" />
            <feComposite
              in="sharp"
              in2="rim"
              operator="arithmetic"
              k2={1}
              k3={1}
            />
          </filter>
        </defs>
      </svg>

      {/* soft cast shadow under the glass */}
      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          width: lw,
          height: lh,
          borderRadius: radius,
          boxShadow: `0 0 0 1px ${p.edgeLine}, 0 ${22 * u}px ${44 * u}px -${10 * u}px ${p.lensShadow}, 0 ${4 * u}px ${10 * u}px -${2 * u}px ${p.lensShadow}`,
          opacity: enter,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          width: lw,
          height: lh,
          borderRadius: radius,
          overflow: "hidden",
          opacity: enter,
          isolation: "isolate",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -M,
            top: -M,
            width: lw + M * 2,
            height: lh + M * 2,
            filter: `url(#${fid})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: M - lx,
              top: M - ly,
              width,
              height: "100%",
              transform: `scale(${mag})`,
              transformOrigin: `${cx}px ${pos.y}px`,
            }}
          >
            <Scene {...sceneProps} />
          </div>
        </div>

        {/* body: tint, accent fill for the CTA, inner shade and sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: p.glassTint,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: accent,
            opacity: tint,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: `inset 0 ${-8 * u}px ${18 * u}px -${6 * u}px ${p.innerShade}, inset 0 0 ${10 * u}px ${p.innerShade}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: radius * 0.35,
            right: radius * 0.35,
            top: 2 * u,
            height: lh * 0.42,
            borderRadius: `${radius}px ${radius}px ${radius * 0.6}px ${radius * 0.6}px`,
            background: `linear-gradient(180deg, rgba(255,255,255,${0.12 * p.rimHi}), rgba(255,255,255,0.03) 55%, rgba(255,255,255,0) 100%)`,
          }}
        />
        {/* specular rim */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            padding: 1.5 * u,
            background: `radial-gradient(ellipse 45% 60% at ${rimX}% 0%, rgba(255,255,255,${p.rimHi}), transparent 100%), radial-gradient(ellipse 40% 55% at ${100 - rimX}% 100%, rgba(255,255,255,${p.rimLo}), transparent 100%), rgba(255,255,255,${p.rimLo * 0.25})`,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,${p.rimLo * 0.5})`,
          }}
        />

        {/* CTA label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10 * u,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: ctaSize,
            letterSpacing: `${CTA_TRACK}em`,
            color: "#FFFFFF",
            whiteSpace: "nowrap",
            opacity: label,
            transform: `translateY(${(1 - label) * 8 * u}px)`,
          }}
        >
          {cta}
          <svg
            width={18 * u}
            height={18 * u}
            viewBox="0 0 18 18"
            style={{
              opacity: arrow,
              transform: `translateX(${(arrow - 1) * 8 * u}px)`,
            }}
            aria-hidden
          >
            <path
              d="M3 9h11M10 4.5 14.5 9 10 13.5"
              stroke="#FFFFFF"
              strokeWidth={1.7}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
