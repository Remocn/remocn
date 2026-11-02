"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serifFamily } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PhoneScrollProps {
  /** Tall screenshot, rendered 393pt wide and scrolled. */
  src?: string;
  /** Scroll offsets (screen points) to flick to, one flick per stop. */
  stops?: number[];
  /** Headline that slides in beside the phone. Pass "" to hide. */
  label?: string;
  /** Part of `label` set in the italic serif. */
  labelAccent?: string;
  eyebrow?: string;
  /** Custom screen content (393pt wide), scrolled like the screenshot. */
  children?: React.ReactNode;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const SW = 393;
const SH = 852;
const BEZEL = 11;
const BW = SW + BEZEL * 2;
const BH = SH + BEZEL * 2;
const HEADER_H = 196;

const FLICK_START = 40;
const PRESS = 5;
const DRAG = 6;
const TAU = 10;
const SEG = 46;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };

function scrollAt(f: number, stops: number[], fps: number): number {
  let base = 0;
  for (let i = 0; i < stops.length; i++) {
    const local = f - (FLICK_START + i * SEG) - PRESS;
    if (local <= 0) return base;
    const dist = stops[i] - base;
    const over = Math.sign(dist) * Math.min(26, Math.abs(dist) * 0.035);
    const v0 = (dist + over) / (TAU + DRAG / 2);
    const d0 = (v0 * DRAG) / 2;
    let y: number;
    if (local < DRAG) {
      y = base + d0 * (local / DRAG) ** 2;
    } else {
      const t = local - DRAG;
      const momentum =
        base + d0 + (dist + over - d0) * (1 - Math.exp(-t / TAU));
      const back = spring({
        frame: Math.max(0, t - TAU * 1.9),
        fps,
        config: CARD,
      });
      y = momentum - over * back;
    }
    if (i === stops.length - 1 || local < SEG - PRESS) return y;
    base = stops[i];
  }
  return base;
}

type Scene = "coast" | "alpine" | "desert" | "lake" | "aurora";
type Look = {
  sky: [string, string, string];
  sun: string;
  haze: string;
  far: string;
  mid: string;
  near: string;
  fg: "trees" | "dunes" | "cliff";
  sunY: number;
  water?: string;
  snow?: boolean;
  lights?: boolean;
};
const SCENES: Record<Scene, Look> = {
  coast: {
    sky: ["#5F82B6", "#E2AE90", "#FBD6A8"],
    sun: "#FFF1D6",
    haze: "#F4C9A2",
    far: "#9C7A8C",
    mid: "#5A465A",
    near: "#1E1820",
    fg: "cliff",
    sunY: 0.5,
    water: "#46607F",
  },
  alpine: {
    sky: ["#2F66AE", "#86B1E0", "#DAE7F3"],
    sun: "#FFFFFF",
    haze: "#D3E1EF",
    far: "#8DA4C2",
    mid: "#465D7B",
    near: "#111C26",
    fg: "trees",
    sunY: 0.06,
    snow: true,
    lights: true,
  },
  desert: {
    sky: ["#4F7DB2", "#E3B489", "#F5D4A2"],
    sun: "#FFF2D8",
    haze: "#EFC38D",
    far: "#D29E70",
    mid: "#B26A40",
    near: "#6A3720",
    fg: "dunes",
    sunY: 0.45,
  },
  lake: {
    sky: ["#527FA6", "#B2CDD2", "#ECEFE4"],
    sun: "#FFFBEA",
    haze: "#DBE5DE",
    far: "#7B9995",
    mid: "#3A5A51",
    near: "#0F1E1A",
    fg: "trees",
    sunY: 0.28,
    water: "#557F88",
    lights: true,
  },
  aurora: {
    sky: ["#040914", "#0D1F3A", "#223F63"],
    sun: "#E8F7FF",
    haze: "#2A4A6C",
    far: "#28405F",
    mid: "#132238",
    near: "#050A13",
    fg: "trees",
    sunY: -1,
    lights: true,
  },
};

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function ridge(
  seed: number,
  base: number,
  amp: number,
  sharp: boolean,
  w: number,
  h: number,
) {
  const pts: string[] = [];
  for (let x = -8; x <= w + 8; x += 3) {
    let v = 0;
    for (let o = 0, a = 1, fq = 0.011; o < 5; o++, a *= 0.47, fq *= 2.2) {
      const sn = Math.sin(x * fq + seed * (3.1 + o * 1.7));
      v += (sharp && o < 2 ? 1 - Math.abs(sn) * 1.7 : sn) * a;
    }
    pts.push(`${x},${(base - v * amp).toFixed(1)}`);
  }
  return `M-8,${h} L${pts.join(" L")} L${w + 8},${h} Z`;
}

function treeline(
  seed: number,
  base: number,
  tall: number,
  w: number,
  h: number,
) {
  let d = `M-8,${h} L-8,${base} L${w + 8},${base} L${w + 8},${h} Z`;
  for (let x = -6, i = 0; x < w + 8; i++) {
    const edge = Math.abs(x / w - 0.5) * 2;
    const ht = tall * (0.12 + edge ** 1.5 * 0.7 + hash(seed + i * 1.37) * 0.3);
    const tw = ht * (0.26 + hash(seed + i * 2.11) * 0.12);
    for (let k = 0; k < 4; k++) {
      const yb = base - ht * (0.06 + k * 0.19);
      const wk = tw * (1 - k * 0.22);
      d += ` M${(x - wk / 2).toFixed(1)},${yb.toFixed(1)} L${x.toFixed(1)},${(yb - ht * 0.5).toFixed(1)} L${(x + wk / 2).toFixed(1)},${yb.toFixed(1)} Z`;
    }
    x += 2 + hash(seed + i * 3.7) * tw * 0.8;
  }
  return d;
}

function headland(seed: number, w: number, h: number) {
  const pts: string[] = [];
  for (let x = -8; x <= w * 0.55; x += 3) {
    const t = Math.max(0, x) / (w * 0.55);
    const n =
      Math.sin(x * 0.09 + seed) * 0.5 + Math.sin(x * 0.23 + seed * 2.3) * 0.3;
    pts.push(
      `${x},${(h * 0.66 + t ** 1.8 * h * 0.36 + n * h * 0.02).toFixed(1)}`,
    );
  }
  return `M-8,${h} L${pts.join(" L")} L${w * 0.55},${h} Z`;
}

function Scenery({
  scene,
  seed,
  w,
  h,
}: {
  scene: Scene;
  seed: number;
  w: number;
  h: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const p = SCENES[scene];
  const night = p.sunY < 0;
  const hz = h * (p.water ? 0.6 : 0.66);
  const sunX = w * (0.28 + hash(seed) * 0.44);
  const sunY = h * p.sunY;
  const ns = Math.round(seed * 10);
  const u = (k: string) => `url(#${id}${k})`;
  const lit = (
    k: string,
    c: string,
    top: number,
    bottom: number,
    snow = false,
  ) => (
    <linearGradient
      id={`${id}${k}`}
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1={top}
      x2="0"
      y2={bottom}
    >
      {snow ? (
        <stop offset="0" stopColor="#F4F7FB" />
      ) : (
        <stop
          offset="0"
          stopColor={`color-mix(in srgb, ${c} 70%, ${p.haze})`}
        />
      )}
      {snow ? <stop offset="0.3" stopColor="#D9E2EC" /> : null}
      <stop offset={snow ? "0.42" : "0.55"} stopColor={c} />
      <stop offset="1" stopColor={`color-mix(in srgb, ${c} 80%, #000)`} />
    </linearGradient>
  );
  const peaks = scene === "alpine" || scene === "aurora";
  const farD = ridge(
    seed + 9,
    hz - 26,
    h * (scene === "alpine" ? 0.2 : peaks ? 0.13 : 0.07),
    peaks,
    w,
    h,
  );
  const midD = ridge(
    seed,
    hz - 2,
    h * (scene === "alpine" ? 0.16 : peaks ? 0.1 : 0.06),
    peaks,
    w,
    h,
  );
  const scenery = (
    <>
      <path d={farD} fill={u("lf")} filter={u("t")} opacity={0.92} />
      <rect y={hz - 60} width={w} height={70} fill={u("hz")} />
      <path d={midD} fill={u("lm")} filter={u("t")} />
      <rect y={hz - 18} width={w} height={34} fill={u("hz")} opacity={0.6} />
    </>
  );
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="0.45" stopColor={p.sky[1]} />
          <stop offset={p.water ? "0.6" : "0.66"} stopColor={p.sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}b`}>
          <stop offset="0" stopColor={p.sun} stopOpacity="0.9" />
          <stop offset="0.12" stopColor={p.sun} stopOpacity="0.5" />
          <stop offset="0.45" stopColor={p.haze} stopOpacity="0.18" />
          <stop offset="1" stopColor={p.haze} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}hz`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.haze} stopOpacity="0" />
          <stop
            offset="0.65"
            stopColor={p.haze}
            stopOpacity={night ? 0.25 : 0.6}
          />
          <stop offset="1" stopColor={p.haze} stopOpacity="0" />
        </linearGradient>
        {lit("lf", p.far, hz - 26 - h * 0.15, hz + 10, p.snow)}
        {lit("lm", p.mid, hz - 2 - h * 0.17, hz + 40, p.snow)}
        <linearGradient id={`${id}fg`} x1="0" y1="0" x2="1" y2="0">
          <stop
            offset="0"
            stopColor={
              scene === "desert"
                ? `color-mix(in srgb, ${p.near} 55%, ${p.haze})`
                : p.near
            }
          />
          <stop offset="1" stopColor={p.near} />
        </linearGradient>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </radialGradient>
        <filter id={`${id}t`} x="-2%" y="-6%" width="104%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035 0.1"
            numOctaves="4"
            seed={ns}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 0.85"
            result="s"
          />
          <feComposite in="s" in2="d" operator="in" result="sd" />
          <feComposite in="sd" in2="d" operator="over" />
        </filter>
        <filter id={`${id}r`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.12"
            numOctaves="2"
            seed={ns + 3}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed={ns + 7}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id={`${id}f`}>
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <linearGradient id={`${id}wd`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.water} stopOpacity="0.1" />
          <stop
            offset="1"
            stopColor={`color-mix(in srgb, ${p.water} 60%, #000)`}
            stopOpacity="0.75"
          />
        </linearGradient>
        <clipPath id={`${id}wc`}>
          <rect y={hz} width={w} height={h - hz} />
        </clipPath>
      </defs>
      <rect width={w} height={h} fill={u("s")} />
      {night
        ? Array.from({ length: 70 }, (_, i) => (
            <circle
              key={i}
              cx={hash(seed + i * 1.3) * w}
              cy={hash(seed + i * 2.9) * hz * 0.85}
              r={0.35 + hash(seed + i * 5.1) * 0.75}
              fill="#fff"
              opacity={0.35 + hash(seed + i * 7.3) * 0.6}
            />
          ))
        : null}
      {night ? (
        <g style={{ filter: "blur(10px)" }} opacity={0.75}>
          <path
            d={`M-30,${h * 0.36} C${w * 0.25},${h * 0.12} ${w * 0.55},${h * 0.46} ${w + 30},${h * 0.2}`}
            stroke="#4FF0B0"
            strokeWidth={26}
            fill="none"
            opacity={0.7}
          />
          <path
            d={`M-30,${h * 0.28} C${w * 0.3},${h * 0.06} ${w * 0.6},${h * 0.36} ${w + 30},${h * 0.1}`}
            stroke="#3BC8B8"
            strokeWidth={46}
            fill="none"
            opacity={0.35}
          />
          <path
            d={`M${w * 0.2},${h * 0.1} C${w * 0.45},${h * 0.02} ${w * 0.7},${h * 0.2} ${w + 30},${h * 0.04}`}
            stroke="#B07CF0"
            strokeWidth={30}
            fill="none"
            opacity={0.25}
          />
        </g>
      ) : (
        <>
          <circle
            cx={sunX}
            cy={sunY}
            r={h * (0.2 + p.sunY * 0.7)}
            fill={u("b")}
          />
          <circle
            cx={sunX}
            cy={sunY}
            r={h * 0.032}
            fill={p.sun}
            style={{ filter: "blur(1.2px)" }}
          />
        </>
      )}
      {scenery}
      {p.water ? (
        <g clipPath={u("wc")}>
          <rect y={hz} width={w} height={h - hz} fill={p.water} />
          <g
            transform={`translate(0 ${2 * hz}) scale(1 -1)`}
            opacity={0.85}
            filter={u("r")}
          >
            <rect width={w} height={hz} fill={u("s")} />
            {night ? null : (
              <circle cx={sunX} cy={sunY} r={h * 0.3} fill={u("b")} />
            )}
            {scenery}
          </g>
          <rect y={hz} width={w} height={h - hz} fill={u("wd")} />
          {night
            ? null
            : Array.from({ length: 14 }, (_, i) => (
                <rect
                  key={i}
                  x={sunX - (6 + i * 1.6) * hash(seed + i * 4.1) - 4}
                  y={hz + 3 + i * i * 0.55}
                  width={(8 + i * 2.2) * (0.5 + hash(seed + i * 6.7))}
                  height={1 + i * 0.08}
                  rx={0.6}
                  fill={p.sun}
                  opacity={0.75 - i * 0.045}
                />
              ))}
        </g>
      ) : null}
      <g filter={u("f")}>
        {p.fg === "trees" ? (
          <path
            d={treeline(seed + 4, h * 0.97, h * 0.3, w, h)}
            fill={p.near}
            filter={u("t")}
          />
        ) : p.fg === "dunes" ? (
          <path
            d={ridge(seed + 5, h * 0.9, h * 0.07, false, w, h)}
            fill={u("fg")}
            filter={u("t")}
          />
        ) : (
          <path d={headland(seed + 5, w, h)} fill={p.near} filter={u("t")} />
        )}
      </g>
      {p.lights
        ? [0, 1, 2].map((i) => {
            const lx = w * (0.58 + hash(seed + 11) * 0.2) + i * 6;
            const ly = h * 0.9 - (i % 2) * 3;
            return (
              <g key={i}>
                <rect
                  x={lx - 3}
                  y={ly - 3}
                  width={8}
                  height={7}
                  fill="#FFB35C"
                  opacity={0.7}
                  filter={u("glow")}
                />
                <rect x={lx} y={ly} width={2.2} height={2.6} fill="#FFD9A0" />
              </g>
            );
          })
        : null}
      <rect width={w} height={h} fill={u("v")} />
      <rect
        width={w}
        height={h}
        filter={u("g")}
        opacity={0.22}
        style={{ mixBlendMode: "overlay" }}
      />
    </svg>
  );
}

const LISTINGS: {
  title: string;
  meta: string;
  dates: string;
  price: number;
  rating: string;
  scene: Scene;
}[] = [
  {
    title: "Halcyon Cove, Portugal",
    meta: "Ocean views · 2 beds",
    dates: "Nov 12 – 17",
    price: 218,
    rating: "4.96",
    scene: "coast",
  },
  {
    title: "Fernway Lodge, Norway",
    meta: "Mountain views · 3 beds",
    dates: "Dec 2 – 7",
    price: 304,
    rating: "4.92",
    scene: "alpine",
  },
  {
    title: "Quarry House, Morocco",
    meta: "Desert stay · 1 bed",
    dates: "Jan 8 – 13",
    price: 142,
    rating: "4.88",
    scene: "desert",
  },
  {
    title: "Tessel Cabin, Canada",
    meta: "Lakefront · 2 beds",
    dates: "Nov 20 – 25",
    price: 189,
    rating: "4.97",
    scene: "lake",
  },
  {
    title: "Lumen Dome, Iceland",
    meta: "Northern lights · 1 bed",
    dates: "Feb 3 – 8",
    price: 276,
    rating: "4.99",
    scene: "aurora",
  },
];

interface AppColors {
  bg: string;
  ink: string;
  muted: string;
  hair: string;
  pill: string;
  pillShadow: string;
  bar: string;
  dark: boolean;
}

function appColors(dark: boolean): AppColors {
  return dark
    ? {
        bg: "#121214",
        ink: "#F2F2F3",
        muted: "#9C9CA3",
        hair: "rgba(255,255,255,0.1)",
        pill: "#1D1D20",
        pillShadow:
          "0 0 0 0.5px rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.4)",
        bar: "rgba(18,18,20,0.96)",
        dark,
      }
    : {
        bg: "#FFFFFF",
        ink: "#222222",
        muted: "#6A6A6A",
        hair: "#EBEBEB",
        pill: "#FFFFFF",
        pillShadow: "0 0 0 0.5px rgba(0,0,0,0.08), 0 3px 12px rgba(0,0,0,0.1)",
        bar: "rgba(255,255,255,0.97)",
        dark,
      };
}

function Icon({
  d,
  size = 24,
  color,
}: {
  d: string;
  size?: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  trips: "M4 8h16v11H4zM9 8V5h6v3",
  inbox: "M4 5h16v11H9l-5 4z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4.5-6 8-6s7 2 8 6",
  filter: "M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4",
  cabin: "M3 20h18M5 20V11l7-6 7 6v9M10 20v-5h4v5",
  wave: "M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  peak: "M3 20l6-11 4 6 2-3 6 8z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5",
  lake: "M3 17c3 2 15 2 18 0M6 13l3-5 3 5M12 13l3-6 3 6",
  tag: "M3.5 12.5V4.5h8l9 9-8 8zM8 8.5h.01",
};

function StatusBar({ color }: { color: string }) {
  return (
    <div
      style={{
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 34px 0 50px",
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 400,
          color,
          letterSpacing: -0.2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        9:41
      </span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.6}
              y={9 - i * 3}
              width={3.2}
              height={3 + i * 3}
              rx={0.8}
              fill={color}
            />
          ))}
        </svg>
        <div
          style={{
            width: 25,
            height: 12,
            borderRadius: 3.5,
            boxShadow: `inset 0 0 0 1px ${color}`,
            padding: 1.5,
            boxSizing: "border-box",
            opacity: 0.9,
          }}
        >
          <div
            style={{
              width: "78%",
              height: "100%",
              borderRadius: 2,
              background: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ListingCard({
  l,
  i,
  c,
}: {
  l: (typeof LISTINGS)[number];
  i: number;
  c: AppColors;
}) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          height: 322,
          outline: `1px solid ${c.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          outlineOffset: -1,
        }}
      >
        <Scenery scene={l.scene} seed={i * 1.7 + 0.4} w={345} h={322} />
        {i === 0 ? (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "rgba(255,255,255,0.95)",
              borderRadius: 999,
              padding: "6px 11px",
              fontSize: 13,
              fontWeight: 400,
              color: "#222",
            }}
          >
            Guest favourite
          </div>
        ) : null}
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path
              d={ICONS.heart}
              fill="rgba(0,0,0,0.3)"
              stroke="#fff"
              strokeWidth={1.5}
            />
          </svg>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 5,
          }}
        >
          {[0, 1, 2, 3, 4].map((d) => (
            <div
              key={d}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#fff",
                opacity: d === 0 ? 1 : 0.55,
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          fontSize: 15.5,
          color: c.ink,
        }}
      >
        <span style={{ fontWeight: 400 }}>{l.title}</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
              fill={c.ink}
            />
          </svg>
          {l.rating}
        </span>
      </div>
      <div style={{ fontSize: 15, color: c.muted, marginTop: 2 }}>{l.meta}</div>
      <div style={{ fontSize: 15, color: c.muted, marginTop: 2 }}>
        {l.dates}
      </div>
      <div
        style={{
          fontSize: 15,
          color: c.muted,
          marginTop: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span style={{ color: c.ink, textDecoration: "underline" }}>
          ${l.price}
        </span>{" "}
        night
      </div>
    </div>
  );
}

function FeesNotice({ c }: { c: AppColors }) {
  return (
    <div
      style={{
        marginBottom: 30,
        padding: "14px 0",
        borderTop: `1px solid ${c.hair}`,
        borderBottom: `1px solid ${c.hair}`,
        display: "flex",
        gap: 12,
        alignItems: "center",
        fontSize: 15,
        color: c.ink,
      }}
    >
      <Icon d={ICONS.tag} size={22} color={c.ink} />
      <span>
        Prices include all fees
        <span style={{ color: c.muted }}> · 1,240 stays this week</span>
      </span>
    </div>
  );
}

function AppHeader({ scrolled, c }: { scrolled: number; c: AppColors }) {
  const cats: [keyof typeof ICONS, string][] = [
    ["cabin", "Cabins"],
    ["wave", "Beachfront"],
    ["peak", "Peaks"],
    ["sun", "Desert"],
    ["lake", "Lakes"],
  ];
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_H,
        background: c.bg,
        zIndex: 2,
        boxShadow: `0 1px 0 ${c.hair}, 0 6px 14px rgba(0,0,0,${scrolled * (c.dark ? 0.3 : 0.06)})`,
      }}
    >
      <StatusBar color={c.ink} />
      <div
        style={{
          margin: "8px 24px 0",
          height: 58,
          borderRadius: 29,
          background: c.pill,
          boxShadow: c.pillShadow,
          display: "flex",
          alignItems: "center",
          padding: "0 10px 0 20px",
          gap: 14,
        }}
      >
        <Icon d={ICONS.search} size={20} color={c.ink} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 400, color: c.ink }}>
            Where to?
          </div>
          <div style={{ fontSize: 12.5, color: c.muted, marginTop: 1 }}>
            Anywhere · Any week · Add guests
          </div>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            boxShadow: `inset 0 0 0 1px ${c.hair}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon d={ICONS.filter} size={17} color={c.ink} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 26px 0",
        }}
      >
        {cats.map(([ic, name], i) => (
          <div
            key={name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              opacity: i === 0 ? 1 : 0.6,
              paddingBottom: 9,
              borderBottom: `2px solid ${i === 0 ? c.ink : "transparent"}`,
            }}
          >
            <Icon d={ICONS[ic]} size={24} color={c.ink} />
            <span style={{ fontSize: 12, fontWeight: 400, color: c.ink }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabBar({ accent, c }: { accent: string; c: AppColors }) {
  const tabs: [keyof typeof ICONS, string][] = [
    ["search", "Explore"],
    ["heart", "Wishlists"],
    ["trips", "Trips"],
    ["inbox", "Inbox"],
    ["user", "Profile"],
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 86,
        background: c.bar,
        borderTop: `1px solid ${c.hair}`,
        zIndex: 2,
        display: "flex",
        justifyContent: "space-around",
        paddingTop: 9,
      }}
    >
      {tabs.map(([ic, name], i) => (
        <div
          key={name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            width: 64,
          }}
        >
          <Icon d={ICONS[ic]} size={24} color={i === 0 ? accent : c.muted} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: i === 0 ? c.ink : c.muted,
            }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

function BuiltInFeed({ c }: { c: AppColors }) {
  return (
    <div style={{ padding: `${HEADER_H + 22}px 24px 120px`, background: c.bg }}>
      {LISTINGS.map((l, i) => (
        <div key={l.title}>
          <ListingCard l={l} i={i} c={c} />
          {i === 1 ? <FeesNotice c={c} /> : null}
        </div>
      ))}
    </div>
  );
}

function PhoneBody({
  children,
  c,
}: {
  children: React.ReactNode;
  c: AppColors;
}) {
  const btn = (side: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [side]: -3,
        top,
        width: 4,
        height: h,
        borderRadius: 2,
        background: c.dark ? "#2C2C30" : "#B8B8BE",
      }}
    />
  );
  return (
    <div style={{ position: "relative", width: BW, height: BH }}>
      {btn("left", 150, 32)}
      {btn("left", 210, 62)}
      {btn("left", 284, 62)}
      {btn("right", 236, 98)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 68,
          background: c.dark ? "#0B0B0C" : "#E6E6EA",
          boxShadow: c.dark
            ? "inset 0 0 0 2px #3A3A3E, inset 0 0 0 3.5px #18181A"
            : "inset 0 0 0 2px #C9C9CE, inset 0 0 0 3.5px #F6F6F8",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: BEZEL,
          top: BEZEL,
          width: SW,
          height: SH,
          borderRadius: 56,
          overflow: "hidden",
          background: c.bg,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: (SW - 126) / 2,
            width: 126,
            height: 37,
            borderRadius: 19,
            background: "#000",
            zIndex: 5,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: (SW - 136) / 2,
            width: 136,
            height: 5,
            borderRadius: 3,
            background: c.ink,
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
}

export function PhoneScroll({
  src,
  stops = [930],
  label = "Find your next stay in two taps.",
  labelAccent = "two taps.",
  eyebrow = "remocn for iOS",
  children,
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  ground,
  groundParams,
}: PhoneScrollProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const blurId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}mb`;
  const dark = theme === "dark";
  const c = appColors(dark);
  const tall = height > width;

  const hasLabel = Boolean(label);
  const k = tall ? (height * 0.6) / BH : (height * 0.9) / BH;
  const phoneCx = tall || !hasLabel ? width / 2 : width * 0.33;
  const phoneCy = tall && hasLabel ? height * 0.63 : height / 2;

  const rise = spring({ frame: f, fps, config: HEAVY });
  const level = spring({ frame: f - 6, fps, config: HEAVY });
  const ty = (1 - rise) * height * 0.95;
  const rot = -8 * (1 - level);

  const y = scrollAt(f, stops, fps);
  const v = Math.abs(y - scrollAt(f - speed, stops, fps));
  const blur = Math.min(9, v * 0.09);

  const flick = Math.max(
    0,
    Math.min(stops.length - 1, Math.floor((f - FLICK_START + 4) / SEG)),
  );
  const fl = f - (FLICK_START + flick * SEG);
  const prev = flick === 0 ? 0 : stops[flick - 1];
  const dist = stops[flick] - prev;
  const d0 =
    (((dist + Math.sign(dist) * Math.min(26, Math.abs(dist) * 0.035)) /
      (TAU + DRAG / 2)) *
      DRAG) /
    2;
  const dragT = interpolate(fl, [PRESS, PRESS + DRAG], [0, 1], clamp);
  const dotY = SH * 0.74 - d0 * 0.55 * dragT * dragT;
  const dotIn = interpolate(fl, [0, 4], [0, 1], clamp);
  const dotOut = interpolate(
    fl,
    [PRESS + DRAG, PRESS + DRAG + 6],
    [1, 0],
    clamp,
  );
  const press = spring({ frame: fl, fps, config: CARD });
  const dotScale =
    interpolate(press, [0, 1], [1.3, 0.96]) *
    interpolate(fl, [PRESS + DRAG, PRESS + DRAG + 6], [1, 1.25], clamp);

  const typeIn = (d: number) =>
    interpolate(f, [16 + d, 32 + d], [0, 1], { ...clamp, easing: ENTER });
  const eyeIn = interpolate(f, [12, 26], [0, 1], { ...clamp, easing: LIGHT });
  const push = interpolate(f, [0, 120], [1, 1.03], clamp);

  const content = children ? (
    <div style={{ width: SW }}>{children}</div>
  ) : src ? (
    <Img src={src} style={{ width: SW, display: "block" }} />
  ) : (
    <BuiltInFeed c={c} />
  );

  const split =
    labelAccent && label.endsWith(labelAccent)
      ? [label.slice(0, label.length - labelAccent.length), labelAccent]
      : [label, ""];
  const ink = dark ? "#F4F2EE" : "#16161A";
  const sub = dark ? "rgba(244,242,238,0.58)" : "rgba(22,22,26,0.55)";
  const headSize = tall ? width * 0.105 : height * 0.088;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (dark ? "hearth" : "paper-crease")}
        params={groundParams}
        timeOffset={dark ? 2 : 4}
        timeScale={0.3}
      />
      <AbsoluteFill
        style={{
          background: dark ? "rgba(4,3,3,0.34)" : "rgba(246,244,240,0.28)",
        }}
      />
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={blurId} x="0" y="-10%" width="100%" height="120%">
          <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <div
          style={{
            position: "absolute",
            left: phoneCx - BW / 2,
            top: phoneCy - BH / 2,
            width: BW,
            height: BH,
            transform: `translateY(${ty}px) scale(${k}) rotate(${rot}deg)`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 68,
              boxShadow: dark
                ? "0 2px 6px rgba(0,0,0,0.5), 0 30px 80px -20px rgba(0,0,0,0.7)"
                : "0 2px 6px rgba(40,32,24,0.12), 0 30px 80px -20px rgba(40,32,24,0.3)",
            }}
          />
          <PhoneBody c={c}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: SW,
                transform: `translateY(${-y}px)`,
                filter: blur > 0.4 ? `url(#${blurId})` : undefined,
              }}
            >
              {content}
            </div>
            {!children && !src ? (
              <>
                <AppHeader
                  scrolled={interpolate(y, [0, 60], [0, 1], clamp)}
                  c={c}
                />
                <TabBar accent={accent} c={c} />
              </>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: SW * 0.56 - 21,
                top: dotY - 21,
                width: 42,
                height: 42,
                borderRadius: 21,
                background: "rgba(30,30,36,0.22)",
                boxShadow:
                  "inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.2)",
                opacity: f >= FLICK_START ? dotIn * dotOut : 0,
                transform: `scale(${dotScale})`,
                zIndex: 6,
              }}
            />
          </PhoneBody>
        </div>
        {hasLabel ? (
          <div
            style={{
              position: "absolute",
              ...(tall
                ? {
                    left: width * 0.08,
                    right: width * 0.08,
                    top: height * 0.07,
                    textAlign: "center",
                  }
                : {
                    left: width * 0.56,
                    width: width * 0.37,
                    top: 0,
                    bottom: 0,
                  }),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  fontSize: Math.max(height * 0.026, headSize * 0.26),
                  fontWeight: 400,
                  color: sub,
                  marginBottom: headSize * 0.32,
                  opacity: eyeIn,
                  transform: `translateY(${(1 - eyeIn) * 10}px)`,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div style={{ overflow: "hidden", paddingBottom: headSize * 0.12 }}>
              <div
                style={{
                  fontSize: headSize,
                  lineHeight: 1.04,
                  fontWeight: 300,
                  letterSpacing: "-0.035em",
                  color: ink,
                  textWrap: "balance",
                  transform: `translateY(${(1 - typeIn(0)) * 105}%)`,
                }}
              >
                {split[0]}
                {split[1] ? (
                  <span
                    style={{
                      fontFamily: serifFamily,
                      fontStyle: "italic",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                      fontSize: headSize * 1.08,
                      display: "inline-block",
                      opacity: typeIn(6),
                      transform: `translateY(${(1 - typeIn(6)) * 30}%)`,
                    }}
                  >
                    {split[1]}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
