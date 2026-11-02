"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import type React from "react";
import { Fragment, useId } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const bricolage = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export interface FlickSwapItem {
  label?: string;
  headline: string;
  highlight?: string;
}

export interface FlickSwapProps {
  items?: FlickSwapItem[];
  dwell?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_ITEMS: FlickSwapItem[] = [
  {
    label: "Captions",
    headline: "Every word lands on the beat.",
    highlight: "on the beat",
  },
  {
    label: "Transitions",
    headline: "Cuts that feel expensive.",
    highlight: "expensive",
  },
  {
    label: "Backgrounds",
    headline: "Grounds that never sit still.",
    highlight: "never sit still",
  },
];

const HALO = ["#fff4ec", "#ffb36b", "#e2457a", "#3d4dff"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    rail: "rgba(255,255,255,0.16)",
    wash: 0.2,
    highlight: (accent: string) =>
      `linear-gradient(90deg, ${HALO[1]} 0%, ${HALO[2]} 48%, color-mix(in oklab, ${accent} 70%, ${HALO[3]}) 100%)`,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    rail: "rgba(17,17,19,0.16)",
    wash: 0.16,
    highlight: (accent: string) =>
      `linear-gradient(90deg, #e8762a 0%, ${HALO[2]} 45%, ${accent} 100%)`,
  },
} as const;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function springOffset(t: number, x0: number, v0: number) {
  const w = 0.3;
  const z = 0.72;
  const wd = w * Math.sqrt(1 - z * z);
  const e = Math.exp(-z * w * t);
  return (
    e * (x0 * Math.cos(wd * t) + ((v0 + z * w * x0) / wd) * Math.sin(wd * t))
  );
}

const DRAG = 7;
const DRAG_AMT = 0.07;
const SETTLE = 22;

function scrollAt(f: number, n: number, period: number) {
  if (f < 0) return -0.48;
  let k = Math.min(n - 1, Math.floor(f / period));
  const nextRelease = (k + 1) * period;
  if (k < n - 1 && f >= nextRelease - DRAG) {
    const t = (f - (nextRelease - DRAG)) / DRAG;
    return k + DRAG_AMT * t * t;
  }
  k = Math.max(0, k);
  const t = f - k * period;
  if (k === 0) return springOffset(t, -0.48, 0.06);
  return k + springOffset(t, DRAG_AMT - 1, 0.085);
}

interface Word {
  text: string;
  index: number;
  hl: [number, number] | null;
}

function splitWords(text: string, highlight?: string) {
  const lower = text.toLowerCase();
  const h0 = highlight ? lower.indexOf(highlight.toLowerCase()) : -1;
  const h1 = h0 >= 0 && highlight ? h0 + highlight.length : -1;
  const hLen = Math.max(1, h1 - h0);
  const words: Word[] = [];
  const re = /\S+/g;
  let index = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const a = m.index;
    const b = a + m[0].length;
    const inside = h0 >= 0 && a < h1 && b > h0;
    words.push({
      text: m[0],
      index: index++,
      hl: inside
        ? [(Math.max(a, h0) - h0) / hLen, (Math.min(b, h1) - h0) / hLen]
        : null,
    });
  }
  return words;
}

function phraseFill(
  [a, b]: [number, number],
  image: string,
): React.CSSProperties {
  const f = Math.max(0.02, b - a);
  const K = 1 / f;
  const P = K > 1 ? a / f / (K - 1) : 0;
  return {
    backgroundImage: image,
    backgroundSize: `${K * 100}% 100%`,
    backgroundPosition: `${P * 100}% 0%`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

function estimateEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.24;
    else if (/[iljtf.,'’]/.test(ch)) w += 0.28;
    else if (/[mwMW]/.test(ch)) w += 0.82;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else w += 0.53;
  }
  return w;
}

export function FlickSwap({
  items = DEFAULT_ITEMS,
  dwell = 28,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: FlickSwapProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = PALETTES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const transparent = background === "transparent";
  const list = items.length > 0 ? items : DEFAULT_ITEMS;
  const n = list.length;

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.55
    : Math.min(width / 1280, height / 720);
  const padX = width * (portrait ? 0.08 : 0.09);
  const maxW = portrait ? width - padX * 2 : width * 0.76;

  const period = SETTLE + dwell;
  const y = scrollAt(frame, n, period);
  const v =
    (scrollAt(frame + 0.5, n, period) - scrollAt(frame - 0.5, n, period)) *
    height;
  const speedPx = Math.abs(v);
  const blur = Math.min(16 * s, speedPx * 0.13);
  const lean = Math.max(-1.2, Math.min(1.2, (v / height) * 9));
  const sway = (v / height) * 26 * s;

  const baseFs = (portrait ? 150 : 118) * s;
  const fsFor = (text: string) => {
    const em = Math.max(1, estimateEm(text) * 1.04);
    const three = Math.min(baseFs * (portrait ? 0.9 : 0.7), (maxW * 3) / em);
    return Math.min(baseFs, Math.max((maxW * 2) / em, three));
  };
  const labelFs = (portrait ? 24 : 19) * s;

  const gy = -y * 9;
  const ground = [
    `radial-gradient(48% 62% at 92% ${(64 + gy).toFixed(2)}%, color-mix(in oklab, ${HALO[2]} ${Math.round(p.wash * 100)}%, transparent) 0%, transparent 70%)`,
    `radial-gradient(38% 50% at 70% ${(96 + gy).toFixed(2)}%, color-mix(in oklab, ${HALO[1]} ${Math.round(p.wash * 70)}%, transparent) 0%, transparent 70%)`,
    `radial-gradient(55% 70% at 104% ${(30 + gy).toFixed(2)}%, color-mix(in oklab, ${HALO[3]} ${Math.round(p.wash * 120)}%, transparent) 0%, transparent 70%)`,
  ].join(", ");

  const railGap = 26 * s;
  const railH = railGap * (n - 1);
  const railX = width - padX * (portrait ? 0.55 : 0.42);
  const railTop = height / 2 - railH / 2;
  const railY = railTop + Math.max(-0.3, Math.min(n - 0.7, y)) * railGap;
  const railIn = interpolate(frame, [4, 16], [0, 1], CLAMP);

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <div style={{ position: "absolute", inset: 0, background: ground }} />
      ) : null}

      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={`fs-${uid}`} x="-5%" y="-60%" width="110%" height="220%">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: blur > 0.4 ? `url(#fs-${uid})` : undefined,
          transform: `translateX(${sway.toFixed(2)}px) rotate(${lean.toFixed(3)}deg)`,
          transformOrigin: "100% 100%",
        }}
      >
        {list.map((item, i) => {
          const off = (i - y) * height;
          if (Math.abs(off) > height * 1.05) return null;
          const fs = fsFor(item.headline);
          const words = splitWords(item.headline, item.highlight);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: padX,
                top: 0,
                height,
                width: maxW,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                transform: `translateY(${off.toFixed(2)}px)`,
              }}
            >
              {item.label ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: labelFs * 0.8,
                    marginBottom: fs * 0.32,
                    fontFamily: mono.fontFamily,
                    fontWeight: 500,
                    fontSize: labelFs,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: p.muted,
                  }}
                >
                  <span style={{ color: p.fg }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      width: labelFs * 1.6,
                      height: Math.max(1, 1.5 * s),
                      background: p.rail,
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: bricolage.fontFamily,
                  fontWeight: 500,
                  fontSize: fs,
                  lineHeight: 1.02,
                  letterSpacing: "-0.035em",
                  color: p.fg,
                  textWrap: "balance",
                }}
              >
                {words.map((w, k) => {
                  const lag =
                    (0.5 + Math.min(1.1, k * 0.13)) / Math.max(0.25, speed);
                  const rel =
                    (y - scrollAt(frame - lag * speed, n, period)) * height;
                  return (
                    <Fragment key={w.index}>
                      {k > 0 ? " " : null}
                      <span
                        style={{
                          display: "inline-block",
                          paddingRight: "0.03em",
                          marginRight: "-0.03em",
                          transform: `translateY(${rel.toFixed(2)}px)`,
                          ...(w.hl
                            ? phraseFill(w.hl, p.highlight(accent))
                            : {}),
                        }}
                      >
                        {w.text}
                      </span>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {n > 1 ? (
        <div style={{ position: "absolute", inset: 0, opacity: railIn }}>
          {list.map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: railX - 3 * s,
                top: railTop + i * railGap - 3 * s,
                width: 6 * s,
                height: 6 * s,
                borderRadius: 9,
                background: p.rail,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: railX - 3 * s,
              top: railY - 11 * s,
              width: 6 * s,
              height: 22 * s,
              borderRadius: 9,
              background: p.fg,
            }}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
