"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  DEFAULT_FEATURES,
  type PillMorphElementId,
  pillMorphTimeline,
} from "./timeline";

const figtree = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});
const sans = figtree.fontFamily;

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

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(s: string, size: number, family: string, weight: number) {
  if (!measureCtx && typeof document !== "undefined") {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return s.length * size * 0.52;
  measureCtx.font = `${weight} ${size}px "${family}"`;
  return measureCtx.measureText(s).width;
}

function measure(
  version: number,
  name: string,
  features: string[],
  labelSize: number,
  featSize: number,
  fontFamily: string,
) {
  return {
    version,
    logo:
      labelSize * 0.742 +
      textWidth("emocn", labelSize, manrope.fontFamily, 600) -
      labelSize * 0.025 * 5,
    name: textWidth(name, labelSize, fontFamily, 400),
    feats: features.map((f) => textWidth(f, featSize, fontFamily, 400)),
  };
}

function useFontVersion(fontFamily: string) {
  const [handle] = useState(() => delayRender("pill-morph: fonts"));
  const [version, setVersion] = useState(0);
  const released = useRef(false);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    Promise.all([
      figtree.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`).catch(() => undefined),
    ]).then(() => {
      bump();
      if (!released.current) {
        released.current = true;
        continueRender(handle);
      }
    });
    if (typeof document === "undefined") return;
    document.fonts.addEventListener("loadingdone", bump);
    return () => document.fonts.removeEventListener("loadingdone", bump);
  }, [handle, fontFamily]);
  return version;
}

export interface PillMorphProps {
  features?: [string, string, string];
  logo?: React.ReactNode;
  name?: string;
  src?: string;
  children?: React.ReactNode;
  accent?: string;
  /** Caption over the preview in the built-in editor mock. */
  caption?: string;
  /** Corner radius of the open card, in px at 720p. */
  radius?: number;
  /** Text color of the name and features; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Size of the pill and card, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the pill's open, collapse, split and merge,
   * the editor, single features and the mark, by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<PillMorphElementId>;
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    base: "#04050A",
    scrim: "4,5,10",
    surface: "#17181C",
    fg: "#F3F2EF",
    muted: "rgba(243,242,239,0.55)",
    block: "rgba(255,255,255,0.06)",
    blockHi: "rgba(255,255,255,0.11)",
    hair: "rgba(255,255,255,0.08)",
    imgLine: "rgba(255,255,255,0.1)",
    ring: "rgba(255,255,255,0.1)",
    rim: "rgba(255,255,255,0.16)",
    shadow: "rgba(0,0,0,0.6)",
  },
  light: {
    base: "#EEF0F6",
    scrim: "244,244,247",
    surface: "#FFFFFF",
    fg: "#121214",
    muted: "rgba(18,18,20,0.55)",
    block: "rgba(18,18,20,0.05)",
    blockHi: "rgba(18,18,20,0.09)",
    hair: "rgba(18,18,20,0.08)",
    imgLine: "rgba(0,0,0,0.1)",
    ring: "rgba(18,18,20,0.09)",
    rim: "rgba(255,255,255,1)",
    shadow: "rgba(40,44,70,0.22)",
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const FEATURE_ICONS = [
  "M2.5 5.5h7v7h-7zM6.5 5.5V3.5h7v7h-4",
  "M2 3.5h12v9H2zM4.5 8h4.5M11 8h.5M4.5 10.5h7",
  "M2 3.5h12v9H2zM2 10.5c3.5-3.5 7-3.5 12-1.5M10.5 6.5h.01",
];

const SCENES = [
  { name: "Intro", len: "0:02" },
  { name: "Product", len: "0:03" },
  { name: "Captions", len: "0:02" },
  { name: "Pricing", len: "0:02" },
  { name: "Changelog", len: "0:02" },
  { name: "Outro", len: "0:01" },
];

const CLIPS = [
  [0, 0.17, 0],
  [0.18, 0.5, 1],
  [0.51, 0.74, 0],
  [0.75, 1, 0],
] as const;

const PLAY_FROM = 0.24;

function Editor({
  w,
  h,
  u,
  p,
  accent,
  t,
  c,
  caption,
  fontFamily,
}: {
  w: number;
  h: number;
  u: number;
  p: Palette;
  accent: string;
  t: number;
  /** The `content` element: rows and playhead. */
  c: ResolvedElement<PillMorphElementId>;
  caption: string;
  fontFamily: string;
}) {
  const side = w * 0.27;
  const fs = 16 * u;
  const row = (i: number) => {
    const lag = i * c.beat("rowStagger");
    return interpolate(
      t,
      [c.start + lag, c.start + c.beat("row") + lag],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    );
  };
  const playAt = c.start + c.beat("playAt");
  const play = interpolate(
    t,
    [playAt, playAt + c.beat("play")],
    [PLAY_FROM, 0.47],
    CLAMP,
  );
  const secs = play * 12;
  const tc = `0:${String(Math.floor(secs)).padStart(2, "0")}.${String(Math.floor((secs % 1) * 30)).padStart(2, "0")}`;
  const right = side + 16 * u;
  const rw = w - right;
  const prevH = h * 0.62;
  const barY = prevH + 12 * u;
  const trackY = barY + 34 * u;
  const trackH = h - trackY;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily }}>
      {SCENES.map((sc, i) => (
        <div
          key={sc.name}
          style={{
            position: "absolute",
            left: 0,
            top: i * 42 * u,
            width: side - 12 * u,
            height: 34 * u,
            borderRadius: 8 * u,
            background: i === 1 ? p.block : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 9 * u,
            padding: `0 ${10 * u}px`,
            boxSizing: "border-box",
            fontSize: fs,
            color: i === 1 ? p.fg : p.muted,
            opacity: row(i),
            transform: `translateX(${(1 - row(i)) * -10 * u}px)`,
          }}
        >
          <div
            style={{
              width: 7 * u,
              height: 7 * u,
              borderRadius: "50%",
              background: i === 1 ? accent : p.blockHi,
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1 }}>{sc.name}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>
            {sc.len}
          </span>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: side,
          top: 0,
          bottom: 0,
          width: 1,
          background: p.hair,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: right,
          top: 0,
          width: rw,
          height: prevH,
          borderRadius: 10 * u,
          overflow: "hidden",
          opacity: row(1),
          transform: `translateY(${(1 - row(1)) * 12 * u}px)`,
        }}
      >
        <Img
          src={staticFile("reel/reel-5.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${1.04 + play * 0.1})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10 * u,
            boxShadow: `inset 0 0 0 1px ${p.imgLine}`,
            background:
              "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.42) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16 * u,
            bottom: 14 * u,
            fontSize: 22 * u,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            opacity: row(3),
          }}
        >
          {caption}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: right,
          top: barY,
          width: rw,
          height: 24 * u,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontSize: fs,
          color: p.muted,
          fontVariantNumeric: "tabular-nums",
          opacity: row(2),
        }}
      >
        <svg
          width={14 * u}
          height={14 * u}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4.5 3.2v9.6l8-4.8z"
            stroke={p.fg}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ color: p.fg }}>{tc}</span>
        <span>/ 0:12.00</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: right,
          top: trackY,
          width: rw,
          height: trackH,
          opacity: row(3),
          transform: `translateY(${(1 - row(3)) * 10 * u}px)`,
        }}
      >
        {CLIPS.map(([a, b, on]) => (
          <div
            key={a}
            style={{
              position: "absolute",
              left: `${a * 100}%`,
              width: `calc(${(b - a) * 100}% - ${3 * u}px)`,
              top: 0,
              height: trackH * 0.52,
              borderRadius: 6 * u,
              background: on ? accent : p.blockHi,
              boxShadow: on
                ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                : `inset 0 0 0 1px ${p.hair}`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "30%",
            width: "36%",
            bottom: 0,
            height: trackH * 0.3,
            borderRadius: 5 * u,
            background: p.block,
            boxShadow: `inset 0 0 0 1px ${p.hair}`,
          }}
        />
        {/* Layout rounds a box's edges to whole pixels, so a playhead eased by
            `left` steps along unevenly; it is laid out where it starts and
            travels by a transform. */}
        <div
          style={{
            position: "absolute",
            left: `${PLAY_FROM * 100}%`,
            transform:
              play === PLAY_FROM
                ? undefined
                : `translateX(${(play - PLAY_FROM) * rw}px)`,
            top: -6 * u,
            bottom: -2 * u,
            width: 1.5 * u,
            background: p.fg,
            borderRadius: u,
          }}
        />
      </div>
    </div>
  );
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

interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  r: [number, number, number, number];
}

export function PillMorph(props: PillMorphProps) {
  const {
    name = "",
    features = DEFAULT_FEATURES,
    logo,
    src,
    children,
    accent = "#3B5BFD",
    caption = "Launch day, in one take",
    radius = 28,
    ink,
    background,
    fontFamily = sans,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { fps, width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    pillMorphTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const appearEl = tl.get("appear");
  const openEl = tl.get("open");
  const contentEl = tl.get("content");
  const collapseEl = tl.get("collapse");
  const splitEl = tl.get("split");
  const mergeEl = tl.get("merge");
  const markEl = tl.get("mark");
  const nameEl = tl.get("name");
  const driftEl = tl.get("drift");
  /** Before the bar splits, the card is one shape. */
  const whole = t < splitEl.start;
  const tall = height > width;
  const u = tall ? width / 760 : Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const dark = theme === "dark";
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "velvet-hour" : "glasswork");
  const gid = `goo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const fontVersion = useFontVersion(fontFamily);
  const cx = width / 2;
  const cy = height / 2;

  const sp = (
    start: number,
    config: { mass?: number; damping?: number; stiffness?: number },
  ) =>
    spring({
      frame: t - start,
      fps,
      config,
    });
  const fade = (a: number, b: number) =>
    interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const labelSize = 23 * u;
  const featSize = (tall ? 26 : 23) * u;
  const markSize = 24 * u;
  const pad = 20 * u;
  const widths = useMemo(
    () => measure(fontVersion, name, features, labelSize, featSize, fontFamily),
    [fontVersion, name, features, labelSize, featSize, fontFamily],
  );
  const labelW = logo ? markSize + 9 * u + widths.name : widths.logo;
  const w0 = labelW + pad * 2;
  const h0 = 52 * u;
  const cw = tall ? width * 0.86 : Math.min(width * 0.6, 760 * u);
  const ch = tall ? cw * 0.86 : Math.min(height * 0.64, 450 * u);
  const cr = radius * u;
  const barH = 66 * u;
  const pws = widths.feats.map((fw) => Math.max(170 * u, fw + 92 * u));
  const total = pws[0] + pws[1] + pws[2];
  const gap = (tall ? 18 : 30) * u;
  const tile = (tall ? 220 : 164) * u;
  const tileR = (tall ? 58 : 44) * u;
  const tileCy = cy - 22 * u;

  const appear = sp(appearEl.start, CARD);
  const wP = sp(openEl.start, MORPH);
  const hP = sp(openEl.start + openEl.beat("heightAt"), MORPH);
  const collapse = sp(collapseEl.start, MORPH);
  const split = sp(splitEl.start, CARD);
  const merge = sp(mergeEl.start, MORPH);
  const settle = sp(tl.get("settle").start, CHIP);

  let w = lerp(w0, cw, wP);
  let h = lerp(h0, ch, hP);
  w = lerp(w, total, collapse);
  h = lerp(h, barH, collapse);
  const rCard = Math.min(h / 2, lerp(h0 / 2, cr, hP));
  const r = Math.min(h / 2, lerp(rCard, h / 2, collapse));
  const lift = (1 - appear) * 14 * u;
  const scale0 = 0.94 + 0.06 * appear;

  const shapes: Shape[] = [];
  // Where each feature pill rests once split, for laying its label out there.
  const restSegCx: number[] = [];
  let restLeft = cx - (total + gap * 2) / 2;
  if (whole) {
    shapes.push({
      x: cx - (w * scale0) / 2,
      y: cy - (h * scale0) / 2 + lift,
      w: w * scale0,
      h: h * scale0,
      r: [r, r, r, r],
    });
  } else {
    const spread = Math.max(0, split) * (1 - merge);
    const g = gap * spread;
    const k = w / total;
    let left = cx - (w + g * 2) / 2;
    pws.forEach((pw0, i) => {
      const pw = pw0 * k;
      const ph = h;
      restSegCx.push(restLeft + pw0 / 2);
      restLeft += pw0 + gap;
      const inner = r * Math.min(1, Math.max(0, split));
      const segCx = left + pw / 2;
      left += pw + g;
      const mx = lerp(segCx, cx, merge);
      const mw =
        lerp(pw, tile, merge) * (1 + 0.06 * Math.max(0, settle - merge));
      const mh = lerp(ph, tile, merge);
      const mr = lerp(r, tileR, merge);
      const rr: [number, number, number, number] =
        i === 0
          ? [r, inner, inner, r]
          : i === 2
            ? [inner, r, r, inner]
            : [inner, inner, inner, inner];
      const rm = rr.map((v) => lerp(v, mr, merge)) as Shape["r"];
      shapes.push({
        x: mx - mw / 2,
        y: lerp(cy, tileCy, merge) - mh / 2,
        w: mw,
        h: mh,
        r: rm,
      });
    });
  }

  const span = (
    e: ResolvedElement<PillMorphElementId>,
    at: string,
    len: string,
  ) => {
    const a = e.start + e.beat(at);
    return fade(a, a + e.beat(len));
  };
  const labelOut = 1 - span(collapseEl, "labelOutAt", "labelOut");
  const content =
    fade(contentEl.start, contentEl.end) *
    (1 - span(collapseEl, "contentOut", "contentFade"));
  const featIn = (i: number) => {
    const e = tl.get(`feature:${i}`);
    const outAt =
      mergeEl.start + mergeEl.beat("featOut") + i * mergeEl.beat("featStagger");
    return (
      fade(e.start, e.end) * (1 - fade(outAt, outAt + mergeEl.beat("featFade")))
    );
  };
  const tileFill = span(mergeEl, "fillAt", "fill");
  const markIn = fade(markEl.start, markEl.end);
  const nameIn = fade(nameEl.start, nameEl.end);

  const s0 = shapes[0];
  const labelX = whole ? s0.x + pad * scale0 : 0;
  const labelY = whole
    ? s0.y + Math.min(s0.h / 2, 30 * u) - (labelSize * scale0) / 2
    : 0;
  // The card's label and content are laid out where the open card leaves
  // them and ride its growth as a transform: layout rounds a box and a
  // baseline to whole pixels, so text eased by `left`/`top` clicks along.
  const restX = cx - cw / 2;
  const restY = cy - ch / 2;
  const restLabelX = restX + pad;
  const restLabelY = restY + Math.min(ch / 2, 30 * u) - labelSize / 2;

  const drift = interpolate(t, [driftEl.start, driftEl.end], [1, 1.035]);
  const tileGlow = span(mergeEl, "glowAt", "glow");
  const blur = 12 * u;

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined
            ? p.base
            : background === "transparent"
              ? undefined
              : background,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <>
          <GshGround
            preset={resolvedGround}
            params={groundParams}
            timeOffset={dark ? 4 : 5}
            timeScale={0.45}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(60% 60% at 50% 48%, rgba(${p.scrim},${dark ? 0.5 : 0.36}) 0%, rgba(${p.scrim},${dark ? 0.18 : 0.1}) 100%)`,
            }}
          />
        </>
      ) : null}
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter
            id={gid}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={blur}
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12"
              result="goo"
            />
            <feMorphology
              in="goo"
              operator="erode"
              radius={Math.max(1, u)}
              result="inner"
            />
            <feComposite in="goo" in2="inner" operator="out" result="ring" />
            <feFlood floodColor={p.ring} result="ringColor" />
            <feComposite
              in="ringColor"
              in2="ring"
              operator="in"
              result="hair"
            />
            <feOffset in="goo" dy={1.5 * u} result="low" />
            <feComposite in="goo" in2="low" operator="out" result="top" />
            <feFlood floodColor={p.rim} result="rimColor" />
            <feComposite in="rimColor" in2="top" operator="in" result="rim" />
            <feMerge>
              <feMergeNode in="goo" />
              <feMergeNode in="hair" />
              <feMergeNode in="rim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            // The drift never rests, so it is always moving.
            transform: `scale(${drift})${glide(true)}`,
            opacity: interpolate(appear, [0, 0.4], [0, 1], CLAMP),
          }}
        >
          <AbsoluteFill
            style={{
              filter: `drop-shadow(0 ${16 * u}px ${28 * u}px ${p.shadow})`,
            }}
          >
            <AbsoluteFill style={{ filter: `url(#${gid})` }}>
              {shapes.map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: s.x,
                    top: s.y,
                    width: s.w,
                    height: s.h,
                    borderRadius: `${s.r[0]}px ${s.r[1]}px ${s.r[2]}px ${s.r[3]}px`,
                    background: p.surface,
                  }}
                />
              ))}
            </AbsoluteFill>
          </AbsoluteFill>

          {whole ? (
            <div
              style={{
                position: "absolute",
                left: restLabelX,
                top: restLabelY,
                display: "flex",
                alignItems: "center",
                gap: 9 * u * scale0,
                opacity: labelOut * span(appearEl, "labelAt", "label"),
                transform: `translate(${labelX - restLabelX}px, ${labelY - restLabelY}px) scale(${scale0})`,
                transformOrigin: "0 0",
              }}
            >
              {logo ? (
                <>
                  {logo}
                  <span
                    style={{
                      fontFamily,
                      fontWeight: 400,
                      fontSize: labelSize,
                      letterSpacing: "-0.02em",
                      color: fg,
                      lineHeight: `${markSize}px`,
                    }}
                  >
                    {name}
                  </span>
                </>
              ) : (
                <div
                  style={{
                    height: labelSize,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <RemocnLogo fontSize={labelSize} color={fg} />
                </div>
              )}
            </div>
          ) : null}

          {whole && content > 0 ? (
            <div
              style={{
                position: "absolute",
                left: restX + 22 * u,
                top: restY + 64 * u,
                transform: `translate(${s0.x - restX}px, ${s0.y - restY}px)`,
                width: cw - 44 * u,
                height: ch - 86 * u,
                opacity: content,
                overflow: "hidden",
                borderRadius: 12 * u,
                clipPath: `inset(0 0 ${Math.max(0, ch - 86 * u - (s0.h - 86 * u))}px 0)`,
              }}
            >
              {children ??
                (src ? (
                  <Img
                    src={src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Editor
                    w={cw - 44 * u}
                    h={ch - 86 * u}
                    u={u}
                    p={p}
                    accent={accent}
                    t={t}
                    c={contentEl}
                    caption={caption}
                    fontFamily={fontFamily}
                  />
                ))}
            </div>
          ) : null}

          {!whole
            ? shapes.map((s, i) => {
                const k = featIn(i);
                if (k <= 0) return null;
                // The label only needs the pill's centre: it is laid out on
                // the split pill at rest and follows the live one by a
                // transform, for the same reason as the card's label.
                const pw = pws[i];
                const dx = s.x + s.w / 2 - restSegCx[i];
                const dy = s.y + s.h / 2 - cy;
                return (
                  <div
                    key={features[i]}
                    style={{
                      position: "absolute",
                      left: restSegCx[i] - pw / 2,
                      top: cy - barH / 2,
                      width: pw,
                      height: barH,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10 * u,
                      fontFamily,
                      fontWeight: 400,
                      fontSize: featSize,
                      letterSpacing: "-0.01em",
                      color: fg,
                      whiteSpace: "nowrap",
                      opacity: k,
                      transform: `translate(${dx}px, ${dy + (1 - k) * 6 * u}px)`,
                    }}
                  >
                    <svg
                      width={featSize * 0.95}
                      height={featSize * 0.95}
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d={FEATURE_ICONS[i % FEATURE_ICONS.length]}
                        stroke={p.muted}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {features[i]}
                  </div>
                );
              })
            : null}

          {tileFill > 0 && !whole ? (
            <div
              style={{
                position: "absolute",
                left: shapes[1].x,
                top: shapes[1].y,
                width: shapes[1].w,
                height: shapes[1].h,
                borderRadius: `${shapes[1].r[0]}px`,
                background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 48%, rgba(0,0,0,0.14) 100%), ${accent}`,
                opacity: tileFill,
                boxShadow: `inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.3), 0 ${18 * u}px ${48 * u}px -${10 * u}px ${accent}${Math.round(
                  tileGlow * 140,
                )
                  .toString(16)
                  .padStart(2, "0")}`,
              }}
            />
          ) : null}

          {markIn > 0 ? (
            <div
              style={{
                position: "absolute",
                left: cx - tile / 2,
                top: tileCy - tile / 2,
                width: tile,
                height: tile,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: markIn,
                transform: `translateY(${(1 - markIn) * 6 * u}px) scale(${0.92 + 0.08 * markIn})`,
              }}
            >
              {logo ?? (
                <svg
                  viewBox="0 0 124.06 134.26"
                  height={tile * 0.46}
                  width={(tile * 0.46 * 124.06) / 134.26}
                  style={{ marginLeft: tile * 0.03 }}
                  aria-hidden
                >
                  <path fill="#FFFFFF" d={REMOCN_R_PATH} />
                </svg>
              )}
            </div>
          ) : null}
          {nameIn > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: tileCy + tile / 2 + 30 * u,
                display: "flex",
                justifyContent: "center",
                opacity: nameIn,
                transform: `translateY(${(1 - nameIn) * 10 * u}px)`,
              }}
            >
              {logo ? (
                <span
                  style={{
                    fontFamily,
                    fontWeight: 400,
                    fontSize: 28 * u,
                    letterSpacing: "-0.02em",
                    color: fg,
                  }}
                >
                  {name}
                </span>
              ) : (
                <RemocnLogo fontSize={34 * u} color={fg} />
              )}
            </div>
          ) : null}
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
