"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

export interface DeviceStop {
  label: string;
  width: number;
  height: number;
}

export interface DeviceMorphProps {
  /** Your own responsive UI; it is laid out at the live viewport width every frame. */
  children?: React.ReactNode;
  /** A screenshot to show instead of the built-in dashboard (no reflow). */
  src?: string;
  /** Exactly three stops: desktop, tablet, phone. */
  stops?: DeviceStop[];
  /** Phone to desktop instead of desktop to phone. */
  reverse?: boolean;
  /** Product name in the built-in dashboard's sidebar and phone header. */
  brand?: string;
  /** Greeting at the top of the built-in dashboard. */
  greeting?: string;
  /** Label of the built-in dashboard's primary button. */
  ctaLabel?: string;
  /** Replaces the remocn mark in the built-in dashboard's sidebar. */
  logo?: React.ReactNode;
  accent?: string;
  /** Text color of the device label; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the scene and dashboard. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the device, label and switcher, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "light" | "dark";
  /** Thumbnails for the six project cards. */
  images?: string[];
  /** gradients.sh preset for the ground. Defaults to "europa" (dark) or "paper-crease" (light). */
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_STOPS: DeviceStop[] = [
  { label: "Desktop", width: 1440, height: 900 },
  { label: "Tablet", width: 834, height: 1112 },
  { label: "Phone", width: 390, height: 844 },
];

const LAYOUT = {
  wide: { dw: 1280, dh: 720, maxW: 820, maxH: 500, cy: 322, segY: 618 },
  tall: { dw: 720, dh: 1280, maxW: 640, maxH: 700, cy: 700, segY: 1140 },
};
const CLICK_A = 50;
const CLICK_B = 124;
const MORPH = 44;

const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const MORPH_SPRING = { damping: 200 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp01 = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number, c: number) =>
  t <= 1 ? lerp(a, b, t) : lerp(b, c, t - 1);
const range = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], clamp01);

/** A spring leaves a sub-pixel tail behind; none of it once it's invisible. */
const px = (v: number) => (Math.abs(v) < 1e-3 ? 0 : v);
/** A translate, or none at all at rest so the layer tree stays as it was. */
const shift = (x: number, y: number) =>
  px(x) || px(y) ? `translate(${px(x)}px, ${px(y)}px)` : undefined;

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const PALETTES = {
  light: {
    canvas: "#F1F1F2",
    dot: "rgba(0,0,0,0.09)",
    chrome: "#F4F4F5",
    app: "#FFFFFF",
    side: "#FAFAFA",
    border: "#EAEAEE",
    text: "#111113",
    muted: "#6E6E78",
    faint: "#B9B9C2",
    chip: "#F2F2F4",
    pill: "#FFFFFF",
    good: "#16A34A",
  },
  dark: {
    canvas: "#09090A",
    dot: "rgba(255,255,255,0.07)",
    chrome: "#1A1A1D",
    app: "#0F0F11",
    side: "#0C0C0E",
    border: "#232327",
    text: "#EDEDEF",
    muted: "#8E8E98",
    faint: "#4A4A52",
    chip: "#1C1C20",
    pill: "#17171A",
    good: "#22C55E",
  },
};
type Palette = (typeof PALETTES)["light"];

const PATHS: Record<string, string> = {
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  folder: "M3 6h7l2 2h9v11H3z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  play: "M6 4l14 8-14 8z",
  image: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  menu: "M4 7h16M4 12h16M4 17h16",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  tablet: "M6 3h12v18H6zM11 18h2",
  phone: "M8 3h8v18H8zM11 18h2",
};

function G({
  n,
  color,
  size = 18,
  sw = 1.5,
}: {
  n: string;
  color: string;
  size?: number;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d={PATHS[n]}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV = [
  { icon: "home", label: "Home" },
  { icon: "folder", label: "Projects" },
  { icon: "grid", label: "Templates" },
  { icon: "play", label: "Renders" },
  { icon: "image", label: "Assets" },
  { icon: "gear", label: "Settings" },
];

const KPIS = [
  {
    label: "Renders this week",
    value: "128",
    delta: "+18%",
    pts: [4, 6, 5, 8, 7, 11, 14],
  },
  {
    label: "Minutes rendered",
    value: "342",
    delta: "+9%",
    pts: [6, 5, 7, 6, 9, 8, 10],
  },
  {
    label: "Avg. render time",
    value: "41s",
    delta: "−12%",
    pts: [12, 11, 12, 9, 8, 8, 6],
  },
];

const PROJECTS = [
  {
    title: "Launch teaser",
    meta: "Edited 2h ago · 1080p",
    dur: "0:24",
  },
  {
    title: "Onboarding walkthrough",
    meta: "Edited yesterday · 4K",
    dur: "1:12",
  },
  {
    title: "Changelog 2.4",
    meta: "Edited Mon · 1080p",
    dur: "0:38",
  },
  {
    title: "Customer story: Fernway",
    meta: "Edited Sep 28 · 1080p",
    dur: "2:05",
  },
  {
    title: "Pricing explainer",
    meta: "Edited Sep 24 · 720p",
    dur: "0:45",
  },
  {
    title: "Feature drop: Captions",
    meta: "Edited Sep 19 · 1080p",
    dur: "0:31",
  },
];

const DEFAULT_IMAGES = [1, 2, 3, 4, 5, 6].map((n) =>
  staticFile(`reel/reel-${n}.jpg`),
);

function Thumb({
  p,
  i,
  src,
  accent,
  w,
  h,
  rw,
  rh,
}: {
  p: (typeof PROJECTS)[number];
  i: number;
  src: string;
  accent: string;
  w: number;
  h: number;
  /** The thumbnail's size at rest: the corner pieces are laid out there. */
  rw: number;
  rh: number;
}) {
  const rendering = i === 1;
  // The badge and the progress bar ride the thumbnail's bottom-right corner
  // as it resizes; a carrier laid out at the resting size moves them by
  // transform, since layout would round each step to a whole pixel.
  const corner = shift(w - rw, h - rh);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#1A1A1D",
        overflow: "hidden",
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          filter: rendering ? "saturate(0.6) brightness(0.8)" : undefined,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: rw,
          height: rh,
          transform: corner,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: rendering ? 16 : 10,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(10,10,12,0.66)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 400,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {rendering ? "Rendering 64%" : p.dur}
        </div>
      </div>
      {rendering ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: rh,
            transform: shift(0, h - rh),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 4,
              background: "rgba(255,255,255,0.25)",
            }}
          >
            <div style={{ width: "64%", height: "100%", background: accent }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const KPI_H = 108;

/** Where everything in the dashboard sits at morph progress `t`. */
function dashLayout(t: number, vw: number, vh: number) {
  const tp = range(t, 1, 2);
  const label = 1 - range(t, 0, 0.55);
  const statusH = seg(t, 0, 24, 46);
  const topH = seg(t, 64, 60, 54);
  const sideW = seg(t, 232, 72, 0);
  const pad = seg(t, 32, 24, 16);
  const cx = sideW + pad;
  const cw = vw - sideW - 2 * pad;
  const top0 = statusH + topH + pad;
  const gap = seg(t, 16, 16, 12);
  const third = (cw - 2 * gap) / 3;
  const kpiW = lerp(third, cw * 0.72, ease(tp));
  const secY = top0 + 72 + KPI_H + 30;
  const gridY = secY + 38;
  const layoutAt = (n: number) =>
    PROJECTS.map((_, i) => {
      const w = (cw - (n - 1) * gap) / n;
      const h = (w * 9) / 16 + 62;
      return {
        x: cx + (i % n) * (w + gap),
        y: gridY + Math.floor(i / n) * (h + gap),
        w,
      };
    });
  const [from, to, u] =
    t <= 1 ? [layoutAt(3), layoutAt(2), t] : [layoutAt(2), layoutAt(1), t - 1];
  const kAt = (i: number) => inOut(range(u, i * 0.05, 0.75 + i * 0.05));
  const cards = PROJECTS.map((_, i) => {
    const k = kAt(i);
    const nFrom = t <= 1 ? 3 : 2;
    const hops =
      Math.floor(i / nFrom) !== Math.floor(i / (nFrom - 1)) &&
      to[i].x < from[i].x - 1;
    const at = hops ? (k < 0.5 ? 0 : 1) : k;
    const w = lerp(from[i].w, to[i].w, k);
    return {
      x: lerp(from[i].x, to[i].x, at),
      y: lerp(from[i].y, to[i].y, hops ? at : k),
      w,
      thumbH: (w * 9) / 16,
      hop: !hops
        ? 1
        : k < 0.5
          ? 1 - k * 2
          : interpolate(u, [0.5, 0.8], [0, 1], clamp01),
    };
  });
  const rightPad = seg(t, 24, 20, 16);
  const avatarX = vw - rightPad - 32;
  const btnW = seg(t, 116, 116, 34);
  const btnX = avatarX - 12 - btnW;
  const bellX = btnX - 12 - 34;
  const searchW = seg(t, 260, 34, 0);
  return {
    vw,
    vh,
    tp,
    label,
    statusH,
    statusPad: seg(t, 20, 20, 30),
    statusFont: seg(t, 12, 13, 16),
    topH,
    sideW,
    pad,
    cx,
    cw,
    top0,
    gap,
    kpiW,
    secY,
    cards,
    avatarX,
    btnW,
    btnX,
    bellX,
    searchW,
    searchX: bellX - 10 - searchW,
    logoX: lerp(22, 20, label) - 80 * tp,
    navX: lerp(27, 24, label) - 80 * tp,
    pillX: 12 - 80 * tp,
  };
}

function Dashboard({
  t,
  morphing,
  vw,
  vh,
  tRest,
  vwRest,
  vhRest,
  c,
  accent,
  images,
  brand,
  greeting,
  ctaLabel,
  logo,
}: {
  t: number;
  /** The viewport is changing on this frame. */
  morphing: boolean;
  vw: number;
  vh: number;
  /** The morph's resting state: layout holds every piece there. */
  tRest: number;
  vwRest: number;
  vhRest: number;
  c: Palette;
  accent: string;
  images: string[];
  brand: string;
  greeting: string;
  ctaLabel: string;
  logo?: React.ReactNode;
}) {
  // The dashboard reflows at the live viewport every frame. Layout rounds a
  // box and a baseline to whole pixels, so every piece is laid out where it
  // rests and carried from there by transform: same path, no clicks.
  const d = dashLayout(t, vw, vh);
  const r = dashLayout(tRest, vwRest, vhRest);
  const pin = (x: number, y: number, rx: number, ry: number) => ({
    left: rx,
    top: ry,
    transform: shift(x - rx, y - ry),
  });
  const { tp, label, statusH, topH, sideW, pad, cx, cw, top0, gap, kpiW } = d;
  const phoneOnly = range(t, 1.35, 1.9);
  const txt = { position: "absolute" as const, whiteSpace: "nowrap" as const };
  const fontK = d.statusFont / r.statusFont;
  const greetSize = seg(t, 26, 25, 23);
  const greetRest = seg(tRest, 26, 25, 23);
  const kpiTop = top0 + 72;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: c.app,
        color: c.text,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...txt,
          left: 0,
          top: 0,
          width: r.vw,
          height: r.statusH,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${r.statusPad}px`,
          boxSizing: "border-box",
          fontSize: r.statusFont,
          fontWeight: 400,
          opacity: range(t, 0.5, 1),
        }}
      >
        <span
          style={{
            // Set at the resting size and scaled: a font-size that eases
            // reflows the line, and the reflow rounds.
            transformOrigin: "0 50%",
            transform:
              shift(d.statusPad - r.statusPad, (statusH - r.statusH) / 2) ||
              Math.abs(fontK - 1) > 1e-6
                ? `${shift(d.statusPad - r.statusPad, (statusH - r.statusH) / 2) ?? ""} scale(${fontK})`
                : undefined,
          }}
        >
          9:41
        </span>
        <span
          style={{
            display: "flex",
            gap: 5,
            alignItems: "center",
            transform: shift(
              vw - d.statusPad - (r.vw - r.statusPad),
              (statusH - r.statusH) / 2,
            ),
          }}
        >
          <span
            style={{
              width: 17,
              height: 10,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${c.text} 0 20%, transparent 20% 30%, ${c.text} 30% 50%, transparent 50% 60%, ${c.text} 60% 80%, transparent 80%)`,
            }}
          />
          <span
            style={{
              width: 24,
              height: 11,
              borderRadius: 3,
              border: `1.5px solid ${c.text}`,
              boxSizing: "border-box",
              padding: 1,
            }}
          >
            <span
              style={{
                display: "block",
                width: "70%",
                height: "100%",
                borderRadius: 1,
                background: c.text,
              }}
            />
          </span>
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          ...pin(0, statusH, 0, r.statusH),
          width: Math.max(sideW, 0.01),
          height: vh - statusH,
          background: c.side,
          borderRight: sideW > 1 ? `1px solid ${c.border}` : "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            ...pin(d.logoX, 18, r.logoX, 18),
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {logo ?? (
              <svg viewBox="0 0 124.06 134.26" height={14} aria-hidden>
                <path fill="#fff" d={REMOCN_R_PATH} />
              </svg>
            )}
          </div>
          <span
            style={{
              fontSize: 17,
              fontWeight: 400,
              letterSpacing: -0.3,
              opacity: label,
            }}
          >
            {brand}
          </span>
        </div>
        {NAV.map((n, i) => {
          const y = 76 + i * 42;
          const active = i === 1;
          const pillW = lerp(48, sideW - 24, label);
          return (
            <div key={n.label}>
              {active && (
                <div
                  style={{
                    position: "absolute",
                    ...pin(d.pillX, y - 9, r.pillX, y - 9),
                    width: pillW,
                    height: 36,
                    borderRadius: 9,
                    background: withAlpha(accent, 0.1),
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  ...pin(d.navX, y, r.navX, y),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <G n={n.icon} color={active ? accent : c.muted} />
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 400,
                    color: active ? c.text : c.muted,
                    opacity: label,
                  }}
                >
                  {n.label}
                </span>
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: r.vh - r.statusH,
            transform: shift(0, vh - statusH - (r.vh - r.statusH)),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 20,
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${c.border}`,
              background: c.app,
              opacity: label,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 400 }}>Render minutes</div>
            <div style={{ color: c.muted, marginTop: 3 }}>312 of 500 used</div>
            <div
              style={{
                marginTop: 10,
                height: 6,
                borderRadius: 6,
                background: c.chip,
              }}
            >
              <div
                style={{
                  width: "62%",
                  height: "100%",
                  borderRadius: 6,
                  background: accent,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          ...pin(sideW, statusH, r.sideW, r.statusH),
          width: vw - sideW,
          height: topH,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            ...txt,
            ...pin(pad, topH / 2 - 10, r.pad, r.topH / 2 - 10),
            fontSize: 14.5,
            fontWeight: 400,
            color: c.muted,
            opacity: 1 - range(t, 1.05, 1.5),
          }}
        >
          Projects <span style={{ color: c.faint, margin: "0 6px" }}>/</span>
          <span style={{ color: c.text }}>All projects</span>
        </div>
        <div
          style={{
            ...txt,
            left: r.pad,
            top: r.topH / 2 - 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: phoneOnly,
            transform: `translate(${px(pad - r.pad) + (1 - phoneOnly) * -12}px, ${px(topH / 2 - r.topH / 2)}px)`,
          }}
        >
          <G n="menu" color={c.text} size={24} />
          <span style={{ fontSize: 19, fontWeight: 400, letterSpacing: -0.3 }}>
            {brand}
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          ...pin(
            d.searchX,
            statusH + topH / 2 - 18,
            r.searchX,
            r.statusH + r.topH / 2 - 18,
          ),
          width: d.searchW + 2,
          height: 36,
          borderRadius: 9,
          border: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 8,
          boxSizing: "border-box",
          overflow: "hidden",
          opacity: 1 - range(t, 1, 1.4),
          fontSize: 13.5,
          color: c.muted,
          whiteSpace: "nowrap",
        }}
      >
        <G n="search" color={c.muted} size={17} />
        <span style={{ opacity: label, flex: 1 }}>Search projects…</span>
        <span
          style={{
            opacity: label,
            fontSize: 11.5,
            padding: "2px 6px",
            marginRight: 8,
            borderRadius: 5,
            background: c.chip,
          }}
        >
          ⌘K
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          ...pin(
            d.bellX + 8,
            statusH + topH / 2 - 9,
            r.bellX + 8,
            r.statusH + r.topH / 2 - 9,
          ),
          opacity: 1 - range(t, 1, 1.4),
        }}
      >
        <G n="bell" color={c.muted} />
      </div>
      <div
        style={{
          position: "absolute",
          ...pin(
            d.btnX,
            statusH + topH / 2 - 17,
            r.btnX,
            r.statusH + r.topH / 2 - 17,
          ),
          width: d.btnW,
          height: 34,
          borderRadius: 9,
          background: accent,
          color: "#fff",
          fontSize: 13.5,
          fontWeight: 400,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {/* Centred in the resting width and carried by half the change, so
            the label stays centred without a reflow per frame. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: r.btnW,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transform: shift((d.btnW - r.btnW) / 2, 0),
          }}
        >
          <G n="plus" color="#fff" size={16} sw={2.2} />
          <span
            style={{
              opacity: 1 - range(t, 1.2, 1.6),
              display: d.btnW < 60 ? "none" : "inline",
            }}
          >
            {ctaLabel}
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          ...pin(
            d.avatarX,
            statusH + topH / 2 - 16,
            r.avatarX,
            r.statusH + r.topH / 2 - 16,
          ),
          width: 32,
          height: 32,
          borderRadius: 99,
          background: "#B86A52",
          color: "#fff",
          fontSize: 12,
          fontWeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        MC
      </div>
      <div style={{ ...txt, ...pin(cx, top0, r.cx, r.top0) }}>
        <div
          style={{
            position: morphing ? "relative" : undefined,
            fontSize: greetSize,
            fontWeight: 400,
            letterSpacing: -0.6,
          }}
        >
          {morphing ? (
            <>
              {/* While the size eases, the line keeps its live box (the line
                  under it moves as before) and the glyphs are drawn at the
                  resting size and scaled: a font-size that changes moves the
                  baseline by layout, which rounds. Scaling about the top
                  corner lands the baseline where the live size puts it. */}
              <span style={{ visibility: "hidden" }}>{greeting}</span>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: greetRest,
                  letterSpacing: (-0.6 * greetRest) / greetSize,
                  transformOrigin: "0 0",
                  transform: `scale(${greetSize / greetRest})`,
                }}
              >
                {greeting}
              </div>
            </>
          ) : (
            greeting
          )}
        </div>
        <div style={{ fontSize: 14.5, color: c.muted, marginTop: 6 }}>
          3 renders finished overnight.
        </div>
      </div>
      {KPIS.map((m, i) => {
        const x = cx + i * (kpiW + gap);
        const rx = r.cx + i * (r.kpiW + r.gap);
        const max = Math.max(...m.pts);
        const path = m.pts
          .map(
            (v, j) => `${j === 0 ? "M" : "L"}${j * 12} ${30 - (v / max) * 26}`,
          )
          .join(" ");
        return (
          <div
            key={m.label}
            style={{
              position: "absolute",
              ...pin(x, kpiTop, rx, r.top0 + 72),
              width: kpiW,
              height: KPI_H,
              borderRadius: 12,
              border: `1px solid ${c.border}`,
              background: c.app,
              boxSizing: "border-box",
              padding: 16,
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 13, color: c.muted, whiteSpace: "nowrap" }}>
              {m.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 10,
              }}
            >
              <span
                style={{ fontSize: 28, fontWeight: 400, letterSpacing: -0.6 }}
              >
                {m.value}
              </span>
              <span style={{ fontSize: 12, fontWeight: 400, color: c.good }}>
                {m.delta}
              </span>
            </div>
            <svg
              width={74}
              height={32}
              style={{
                position: "absolute",
                // `right: 16` off the padding box (the card's width less its
                // two 1px borders), pinned at the resting width.
                left: r.kpiW - 2 - 16 - 74,
                bottom: 18,
                transform: shift(kpiW - r.kpiW, 0),
                overflow: "visible",
              }}
              aria-hidden="true"
            >
              <path
                d={path}
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      })}
      <div
        style={{
          ...txt,
          ...pin(cx, d.secY, r.cx, r.secY),
          width: r.cw,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 400 }}>Recent projects</span>
        <span
          style={{
            fontSize: 13.5,
            color: c.muted,
            fontWeight: 400,
            transform: shift(cw - r.cw, 0),
          }}
        >
          View all
        </span>
      </div>
      {PROJECTS.map((p, i) => {
        const card = d.cards[i];
        const rest = r.cards[i];
        const { w, hop } = card;
        const move = shift(card.x - rest.x, card.y - rest.y);
        return (
          <div
            key={p.title}
            style={{
              position: "absolute",
              left: rest.x,
              top: rest.y,
              width: w,
              height: card.thumbH + 62,
              borderRadius: 12,
              border: `1px solid ${c.border}`,
              background: c.app,
              overflow: "hidden",
              boxSizing: "border-box",
              opacity: hop,
              transform: `${move ?? ""} scale(${0.96 + 0.04 * hop})`.trim(),
            }}
          >
            <div style={{ position: "relative", height: card.thumbH }}>
              <Thumb
                p={p}
                i={i}
                src={images[i % images.length]}
                accent={accent}
                w={w - 2}
                h={card.thumbH}
                rw={rest.w - 2}
                rh={rest.thumbH}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: rest.thumbH,
                transform: shift(0, card.thumbH - rest.thumbH),
                padding: "11px 14px",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 400 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: c.muted, marginTop: 4 }}>
                {p.meta}
              </div>
            </div>
          </div>
        );
      })}
      {tp > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: r.vh - 84,
            transform: shift(0, vh - r.vh + (1 - ease(tp)) * 96),
            width: vw,
            height: 84,
            background: withAlpha(c.app, 0.94),
            borderTop: `1px solid ${c.border}`,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: r.vw,
              height: 84,
              display: "flex",
              justifyContent: "space-around",
              paddingTop: 10,
              boxSizing: "border-box",
            }}
          >
            {NAV.filter((_, i) => i !== 2).map((n, i) => (
              <div
                key={n.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 400,
                  color: i === 1 ? accent : c.muted,
                  // space-around hands item i a (2i+1)/10 share of the
                  // extra width, so this is where it lands at `vw`.
                  transform: shift(((vw - r.vw) * (2 * i + 1)) / 10, 0),
                }}
              >
                <G n={n.icon} color={i === 1 ? accent : c.muted} size={22} />
                {n.label}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: r.vw / 2 - 66,
              bottom: 8,
              transform: shift((vw - r.vw) / 2, 0),
              width: 132,
              height: 5,
              borderRadius: 5,
              background: c.text,
              opacity: 0.85,
            }}
          />
        </div>
      )}
    </div>
  );
}

function Cursor({
  x,
  y,
  restX,
  restY,
  press,
  opacity,
}: {
  x: number;
  y: number;
  restX: number;
  restY: number;
  press: number;
  opacity: number;
}) {
  return (
    <svg
      width={22}
      height={26}
      viewBox="0 0 20 24"
      style={{
        position: "absolute",
        // Laid out where it ends; the glide there is a transform.
        left: restX - 2.2,
        top: restY - 2.2,
        opacity,
        transformOrigin: "2px 2px",
        transform: `translate(${px(x - restX)}px, ${px(y - restY)}px) scale(${1 - 0.04 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#111114"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
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

export function DeviceMorph({
  children,
  src,
  stops = DEFAULT_STOPS,
  reverse = false,
  brand = "remocn",
  greeting = "Good morning, Maya",
  ctaLabel = "New video",
  logo,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = sans,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "light",
  images = DEFAULT_IMAGES,
  ground,
  groundParams,
}: DeviceMorphProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const tall = H > W * 1.2;
  const L = tall ? LAYOUT.tall : LAYOUT.wide;
  const k = W / L.dw;
  const c = PALETTES[theme];
  const fg = ink ?? c.text;
  const dark = theme === "dark";
  const [s0, s1, s2] = [
    stops[0] ?? DEFAULT_STOPS[0],
    stops[1] ?? DEFAULT_STOPS[1],
    stops[2] ?? DEFAULT_STOPS[2],
  ];

  const morphAt = (f: number, at: number) =>
    spring({
      frame: f - at - 2,
      fps,
      config: MORPH_SPRING,
      durationInFrames: MORPH,
    });
  const tAt = (f: number) => {
    const ab = morphAt(f, CLICK_A) + morphAt(f, CLICK_B);
    return reverse ? 2 - ab : ab;
  };
  const enterAt = (f: number) => spring({ frame: f, fps, config: HEAVY });
  const chromeAt = (f: number) => spring({ frame: f - 6, fps, config: CARD });
  const stepA = morphAt(frame, CLICK_A);
  const stepB = morphAt(frame, CLICK_B);
  const t = reverse ? 2 - stepA - stepB : stepA + stepB;
  const shifts = (at: (f: number) => number, eps: number) =>
    Math.abs(at(frame + speed) - at(frame)) > eps ||
    Math.abs(at(frame) - at(frame - speed)) > eps;

  const fit = (s: DeviceStop, chrome: number) =>
    Math.min(L.maxW / s.width, (L.maxH - chrome) / s.height);
  const geom = (t: number) => {
    const vw = seg(t, s0.width, s1.width, s2.width);
    const vh = seg(t, s0.height, s1.height, s2.height);
    const sc = seg(t, fit(s0, 34), fit(s1, 24), fit(s2, 20));
    const screenW = vw * sc;
    const screenH = vh * sc;
    const barH = seg(t, 34, 0, 0);
    const bezel = seg(t, 0, 12, 10);
    const outerW = screenW + 2 * bezel;
    const outerH = screenH + barH + 2 * bezel;
    return {
      vw,
      vh,
      sc,
      screenW,
      screenH,
      barH,
      bezel,
      radius: seg(t, 12, 30, 42),
      outerW,
      outerH,
      fx: L.dw / 2 - outerW / 2,
      fy: L.cy - outerH / 2,
    };
  };
  const {
    vw,
    vh,
    sc,
    screenW,
    screenH,
    barH,
    bezel,
    radius,
    outerW,
    outerH,
    fx,
    fy,
  } = geom(t);
  // Layout holds the device where it comes to rest; the morph on the way
  // there is a transform. Layout rounds a box and a baseline to whole pixels,
  // so a frame eased by `left`/`top`/`padding` clicks along pixel by pixel.
  const rest = geom(reverse ? 0 : 2);
  const dx = px(fx - rest.fx);
  const dy = px(fy - rest.fy);
  const enter = enterAt(frame);
  const chromeIn = chromeAt(frame);
  const morphing = shifts(tAt, 1e-6);
  const deviceMoving = morphing || shifts(enterAt, 1e-6);
  const chromeMoving = shifts(chromeAt, 6e-5);

  const chipW = 168;
  const segW = chipW * 3 + 8;
  const segX = L.dw / 2 - segW / 2;
  const segY = L.segY;
  const chipCenter = (i: number) => ({
    x: segX + 4 + i * chipW + chipW / 2,
    y: segY + 24,
  });
  const [firstTarget, secondTarget] = reverse ? [1, 0] : [1, 2];
  const a = chipCenter(firstTarget);
  const b = chipCenter(secondTarget);
  const keys = [
    { f: 20, x: L.dw * 0.74, y: segY - 80 },
    { f: CLICK_A - 3, x: a.x + 8, y: a.y + 4 },
    { f: CLICK_A + 14, x: a.x + 8, y: a.y + 4 },
    { f: CLICK_A + 34, x: a.x + 30, y: a.y - 40 },
    { f: CLICK_B - 24, x: a.x + 30, y: a.y - 40 },
    { f: CLICK_B - 3, x: b.x + 8, y: b.y + 4 },
    { f: CLICK_B + 14, x: b.x + 8, y: b.y + 4 },
    { f: CLICK_B + 40, x: b.x + 120, y: b.y - 30 },
  ];
  const last = keys[keys.length - 1];
  let cur = last;
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i].f) {
      const p = ease(range(frame, keys[i - 1].f, keys[i].f));
      cur = {
        f: 0,
        x: lerp(keys[i - 1].x, keys[i].x, p),
        y: lerp(keys[i - 1].y, keys[i].y, p) - Math.sin(p * Math.PI) * 22,
      };
      break;
    }
  }
  const pressAt = (at: number) =>
    spring({ frame: frame - (at - 2), fps, config: CHIP }) -
    spring({ frame: frame - (at + 2), fps, config: CHIP });
  const pressA = pressAt(CLICK_A);
  const pressB = pressAt(CLICK_B);
  const press = pressA + pressB;
  const curOpacity =
    range(frame, 18, 24) * (1 - range(frame, CLICK_B + 30, CLICK_B + 40));
  const deviceBg = interpolateColors(
    t,
    [0, 0.35, 0.7],
    [c.chrome, "#0B0B0D", "#0B0B0D"],
  );
  const nearest = Math.round(t);
  const handle = (u: number, v: number) => (
    <div
      key={`${u}-${v}`}
      style={{
        position: "absolute",
        left: u * (rest.outerW + 2 * o) - 3.5,
        top: v * (rest.outerH + 2 * o) - 3.5,
        transform: shift(
          u * (outerW - rest.outerW),
          v * (outerH - rest.outerH),
        ),
        width: 7,
        height: 7,
        background: "#fff",
        border: `1px solid ${accent}`,
        boxSizing: "border-box",
        borderRadius: 1.5,
      }}
    />
  );
  const o = 8;
  const dims = `${Math.round(vw)} × ${Math.round(vh)}`;

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined ? (dark ? "#01040a" : "#eeece8") : undefined,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <AbsoluteFill style={{ transform: `scale(${1.04 + 0.03 * (t / 2)})` }}>
          <GshGround
            preset={ground ?? (dark ? "europa" : "paper-crease")}
            params={groundParams}
            timeOffset={4}
            timeScale={0.5}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: L.dw,
            height: L.dh,
            transform: `scale(${k})`,
            transformOrigin: "0 0",
            fontFamily,
            color: fg,
            WebkitFontSmoothing: "antialiased",
          }}
        >
          {tall ? (
            <div
              style={{
                position: "absolute",
                left: 64,
                right: 64,
                top: 150,
                opacity: chromeIn,
                transform: `translateY(${(1 - chromeIn) * 24}px)${glide(chromeMoving || morphing)}`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: 96,
                  fontSize: 88,
                  fontWeight: 300,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: fg,
                }}
              >
                {[s0, s1, s2].map((s, i) => {
                  const vis = Math.max(0, 1 - Math.abs(t - i) * 2);
                  if (vis <= 0.001) return null;
                  return (
                    <div
                      key={s.label}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        opacity: vis,
                        transform: `translateY(${(t - i) * -40}px)`,
                        filter: `blur(${(1 - vis) * 8}px)`,
                      }}
                    >
                      {s.label}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontFamily: mono,
                  fontSize: 28,
                  color: c.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {dims}
              </div>
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                left: rest.fx - o,
                top: rest.fy - o - 28,
                transform: `translate(${dx}px, ${dy}px)${glide(morphing)}`,
                fontFamily: mono,
                fontSize: 16,
                color: c.muted,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
                opacity: chromeIn,
              }}
            >
              <span style={{ color: fg }}>{[s0, s1, s2][nearest].label}</span>
              {"  "}
              {dims}
            </div>
          )}

          <div
            style={{
              position: "absolute",
              left: rest.fx - o,
              top: rest.fy - o,
              width: outerW + 2 * o,
              transform: shift(dx, dy),
              height: outerH + 2 * o,
              border: `1px solid ${withAlpha(accent, 0.6)}`,
              borderRadius: radius + o,
              boxSizing: "border-box",
              opacity: chromeIn,
            }}
          >
            {[
              [0, 0],
              [1, 0],
              [0, 1],
              [1, 1],
            ].map(([u, v]) => handle(u, v))}
          </div>

          <div
            style={{
              position: "absolute",
              left: rest.fx,
              top: rest.fy,
              width: outerW,
              height: outerH,
              borderRadius: radius,
              background: deviceBg,
              padding: rest.bezel,
              boxSizing: "border-box",
              boxShadow: dark
                ? "0 0 0 1px rgba(255,255,255,0.1), 0 40px 80px -24px rgba(0,0,0,0.85)"
                : "0 0 0 1px rgba(16,24,40,0.08), 0 2px 6px rgba(16,24,40,0.06), 0 40px 80px -28px rgba(16,24,40,0.4)",
              opacity: interpolate(enter, [0, 0.4], [0, 1], clamp01),
              transform: `translate(${dx}px, ${px(dy + (1 - enter) * 36)}px) scale(${0.96 + 0.04 * enter})${glide(deviceMoving)}`,
            }}
          >
            {barH > 0.5 && (
              <div
                style={{
                  position: "absolute",
                  left: rest.bezel,
                  top: rest.bezel,
                  width: screenW,
                  transform: shift(bezel - rest.bezel, bezel - rest.bezel),
                  height: barH,
                  overflow: "hidden",
                  opacity: 1 - range(t, 0, 0.2),
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 14 + i * 18,
                      top: 34 / 2 - 6,
                      transform: shift(0, (barH - 34) / 2),
                      width: 12,
                      height: 12,
                      borderRadius: 12,
                      background: dark ? "#3A3A40" : "#D4D4D8",
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: geom(0).screenW / 2 - 150,
                    top: 34 / 2 - 11,
                    transform: shift(
                      (screenW - geom(0).screenW) / 2,
                      (barH - 34) / 2,
                    ),
                    width: 300,
                    height: 22,
                    borderRadius: 7,
                    background: dark ? "#0F0F11" : "#FFFFFF",
                    boxShadow: `inset 0 0 0 1px ${c.border}`,
                    fontSize: 12,
                    color: c.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  remocn.dev/projects
                </div>
              </div>
            )}
            <div
              style={{
                position: "relative",
                top: rest.barH,
                transform: shift(
                  bezel - rest.bezel,
                  bezel + barH - rest.bezel - rest.barH,
                ),
                width: screenW,
                height: screenH,
                borderRadius: Math.max(0, radius - bezel) * range(t, 0, 0.5),
                overflow: "hidden",
                background: c.app,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: vw,
                  height: vh,
                  transform: `scale(${sc})`,
                  transformOrigin: "0 0",
                }}
              >
                {children ? (
                  <div style={{ position: "absolute", inset: 0 }}>
                    {children}
                  </div>
                ) : src ? (
                  <Img
                    src={src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                    }}
                  />
                ) : (
                  <Dashboard
                    t={t}
                    morphing={morphing}
                    vw={vw}
                    vh={vh}
                    tRest={reverse ? 0 : 2}
                    vwRest={rest.vw}
                    vhRest={rest.vh}
                    c={c}
                    accent={accent}
                    images={images}
                    brand={brand}
                    greeting={greeting}
                    ctaLabel={ctaLabel}
                    logo={logo}
                  />
                )}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: rest.screenW / 2 - 40,
                  top: 8,
                  width: 80,
                  height: 22,
                  borderRadius: 20,
                  background: "#000",
                  opacity: range(t, 1.45, 1.9),
                  transform: `translateX(${px((screenW - rest.screenW) / 2)}px) scale(${0.6 + 0.4 * range(t, 1.45, 1.9)})`,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: rest.outerW / 2 - 3,
                top: rest.bezel / 2 - 3,
                transform: shift(
                  (outerW - rest.outerW) / 2,
                  (bezel - rest.bezel) / 2,
                ),
                width: 6,
                height: 6,
                borderRadius: 6,
                background: "#2A2A2E",
                opacity: range(t, 0.5, 1) * (1 - range(t, 1.2, 1.5)),
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: segX,
              top: segY,
              width: segW,
              height: 48,
              borderRadius: 13,
              background: c.pill,
              boxSizing: "border-box",
              boxShadow: dark
                ? "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 32px -12px rgba(0,0,0,0.7)"
                : "0 0 0 1px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.06), 0 12px 32px -12px rgba(16,24,40,0.25)",
              opacity: chromeIn,
              transform: `translateY(${(1 - chromeIn) * 16}px)${glide(chromeMoving)}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 4 + (reverse ? 0 : 2) * chipW,
                transform: shift((t - (reverse ? 0 : 2)) * chipW, 0),
                top: 4,
                width: chipW,
                height: 40,
                borderRadius: 9,
                background: withAlpha(accent, dark ? 0.22 : 0.1),
              }}
            />
            {[s0, s1, s2].map((s, i) => {
              const on = 1 - Math.min(1, Math.abs(t - i));
              const pressed =
                (i === firstTarget ? pressA : 0) +
                (i === secondTarget ? pressB : 0);
              return (
                <div
                  key={s.label}
                  style={{
                    position: "absolute",
                    left: 4 + i * chipW,
                    top: 4,
                    width: chipW,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 16,
                    fontWeight: 400,
                    color: interpolateColors(on, [0, 1], [c.muted, c.text]),
                    transform: `scale(${1 - 0.04 * pressed})`,
                  }}
                >
                  <G
                    n={["monitor", "tablet", "phone"][i]}
                    color={on > 0.5 ? accent : c.muted}
                    size={17}
                    sw={1.5}
                  />
                  {s.label}
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 16,
                      color: c.muted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.width}
                  </span>
                </div>
              );
            })}
          </div>
          <Cursor
            x={cur.x}
            y={cur.y}
            restX={last.x}
            restY={last.y}
            press={press}
            opacity={curOpacity}
          />
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
