"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const bricolage = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface SlashSection {
  title: string;
  sub?: string;
}

export interface SlashWipeProps {
  sections?: SlashSection[];
  every?: number;
  logo?: React.ReactNode;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_SECTIONS: SlashSection[] = [
  { title: "captions", sub: "31 caption styles that follow every word." },
  { title: "transitions", sub: "Cuts that land on the beat." },
];

const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const PALETTES = {
  dark: { bg: "#0A0A0B", fg: "#F4F3F0", muted: "#9A99A1" },
  light: { bg: "#F5F4F0", fg: "#111113", muted: "#6E6C67" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.7, 0, 0.25, 1);
const EASE_SWEEP = Easing.bezier(0.55, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

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

function estimateEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.22;
    else if (/[iljtfr.,'’!|]/.test(ch)) w += 0.33;
    else if (/[mw]/.test(ch)) w += 0.84;
    else if (/[MW]/.test(ch)) w += 0.9;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else w += 0.56;
  }
  return w;
}

const SLASH = {
  k: 0.36,
  sw: 0.1,
  desc: 0.12,
  asc: 0.78,
  gap: 0.07,
};

export function SlashWipe({
  sections = DEFAULT_SECTIONS,
  every = 56,
  logo,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: SlashWipeProps) {
  const raw = useCurrentFrame();
  const frame = raw * speed;
  const { width: W, height: H } = useVideoConfig();
  const p = PALETTES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const list = sections.length >= 1 ? sections.slice(0, 5) : DEFAULT_SECTIONS;
  const n = list.length;
  const portrait = H > W * 1.1;
  const u = Math.min(W, H) / 720;
  const margin = (portrait ? 64 : 64) * u;

  const slashAdvance =
    SLASH.sw + SLASH.k * (SLASH.asc + SLASH.desc) + SLASH.gap;
  const avail = W - margin * 2;
  const base = (portrait ? 230 : 210) * u;
  const yb = H * (portrait ? 0.5 : 0.565);
  const k = SLASH.k;
  const pad = 20 * u;
  const geo = list.map((s) => {
    const fs = Math.min(
      base,
      avail / (estimateEm(s.title) + slashAdvance + 0.04),
    );
    const x0 = margin - fs * 0.02;
    const yBot = yb + fs * SLASH.desc;
    return {
      fs,
      x0,
      sw: fs * SLASH.sw,
      yBot,
      yTop: yb - fs * SLASH.asc,
      xText: x0 + fs * slashAdvance,
      xL: x0 + k * (yBot - yb),
    };
  });
  const lineX = (xAtBase: number, y: number) => xAtBase + k * (yb - y);
  const travel = W + k * (H + pad - yb) + base * SLASH.sw + pad * 4;

  const T = (j: number) => 22 + j * every;
  const sweep = (j: number) => {
    const t0 = T(j);
    const stretch = interpolate(frame, [t0, t0 + 8], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
    const lead = interpolate(frame, [t0 + 6, t0 + 24], [0, travel], {
      ...CLAMP,
      easing: EASE_SWEEP,
    });
    const trail = interpolate(frame, [t0 + 10, t0 + 30], [0, travel], {
      ...CLAMP,
      easing: EASE_SWEEP,
    });
    return {
      started: frame >= t0,
      wiping: frame >= t0 + 6,
      done: frame >= t0 + 30,
      stretch,
      lead: geo[j].xL + geo[j].sw + lead,
      trail: geo[j].xL + trail,
    };
  };

  const regionOf = (i: number) => {
    const top = -pad;
    const bot = H + pad;
    let lt = -W * 4;
    let lb = -W * 4;
    let rt = W * 4;
    let rb = W * 4;
    if (i > 0) {
      const s = sweep(i - 1);
      if (!s.started) return null;
      if (!s.done) {
        rt = lineX(s.trail, top);
        rb = lineX(s.trail, bot);
      }
    }
    if (i < n - 1) {
      const s = sweep(i);
      if (s.done) return null;
      if (s.wiping) {
        lt = lineX(s.lead, top);
        lb = lineX(s.lead, bot);
      }
    }
    return `polygon(${lt}px ${top}px, ${Math.max(rt, lt)}px ${top}px, ${Math.max(rb, lb)}px ${bot}px, ${lb}px ${bot}px)`;
  };

  const gradStops = (
    <>
      <stop offset="0" stopColor={FLUTED[0]} />
      <stop
        offset="0.42"
        stopColor={`color-mix(in oklab, ${accent} 60%, ${FLUTED[1]})`}
      />
      <stop offset="0.8" stopColor={FLUTED[2]} />
      <stop offset="1" stopColor={FLUTED[3]} />
    </>
  );

  const renderSection = (s: SlashSection, i: number) => {
    const clip = regionOf(i);
    if (clip === null) return null;
    const { fs, x0, sw, yBot, yTop, xText } = geo[i];
    const glyphPoints = [
      [x0, yBot],
      [x0 + sw, yBot],
      [x0 + sw + k * (yBot - yTop), yTop],
      [x0 + k * (yBot - yTop), yTop],
    ]
      .map(([x, y]) => `${x},${y}`)
      .join(" ");
    const arrive = i === 0 ? null : T(i - 1);
    const rise =
      arrive === null
        ? interpolate(frame, [0, 16], [0, 1], { ...CLAMP, easing: EASE_OUT })
        : 1;
    const slide =
      arrive === null
        ? 1
        : interpolate(frame, [arrive + 12, arrive + 34], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
    const subStart = arrive === null ? 8 : arrive + 22;
    const subT = interpolate(frame, [subStart, subStart + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const glyphT =
      arrive === null
        ? interpolate(frame, [0, 14], [0, 1], { ...CLAMP, easing: EASE_OUT })
        : 1;
    const clipId = `${uid}-w${i}`;
    const gradId = `${uid}-g${i}`;
    return (
      <div
        key={`${s.title}-${i}`}
        style={{ position: "absolute", inset: 0, clipPath: clip }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={xText - fs * 0.06}
                y={yb - fs * 1.05}
                width={W}
                height={fs * 1.35}
              />
            </clipPath>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={yBot}
              x2={0}
              y2={yTop}
            >
              {gradStops}
            </linearGradient>
          </defs>
          <polygon
            points={glyphPoints}
            fill={`url(#${gradId})`}
            style={{
              clipPath: `inset(${(1 - glyphT) * 100}% 0 0 0)`,
            }}
          />
          <g clipPath={`url(#${clipId})`}>
            <text
              x={xText}
              y={yb}
              fill={p.fg}
              style={{
                fontFamily: bricolage.fontFamily,
                fontWeight: 500,
                fontSize: fs,
                letterSpacing: "-0.04em",
                transform: `translate(${(1 - slide) * -fs * 1.6}px, ${(1 - rise) * fs * 1.1}px)`,
              }}
            >
              {s.title}
            </text>
          </g>
        </svg>
        {s.sub ? (
          <div
            style={{
              position: "absolute",
              left: xText + fs * 0.03,
              top: yb + fs * 0.34,
              maxWidth: W - xText - margin,
              fontFamily: bricolage.fontFamily,
              fontWeight: 400,
              fontSize: (portrait ? 42 : 32) * u,
              lineHeight: 1.3,
              letterSpacing: "-0.015em",
              color: p.muted,
              textWrap: "balance",
              opacity: subT,
              transform: `translateX(${(1 - subT) * -18 * u}px)`,
            }}
          >
            {s.sub}
          </div>
        ) : null}
      </div>
    );
  };

  let band: React.ReactNode = null;
  for (let j = 0; j < n - 1; j++) {
    const s = sweep(j);
    if (!s.started || s.done) continue;
    const top = interpolate(s.stretch, [0, 1], [geo[j].yTop, -pad]);
    const bot = interpolate(s.stretch, [0, 1], [geo[j].yBot, H + pad]);
    const pts = [
      [lineX(s.trail, bot), bot],
      [lineX(s.lead, bot), bot],
      [lineX(s.lead, top), top],
      [lineX(s.trail, top), top],
    ]
      .map(([x, y]) => `${x},${y}`)
      .join(" ");
    const gid = `${uid}-band`;
    band = (
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gid}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={bot}
            x2={0}
            y2={top}
          >
            {gradStops}
          </linearGradient>
        </defs>
        <polygon points={pts} fill={`url(#${gid})`} />
      </svg>
    );
  }

  const transparent = background === "transparent";
  const logoT = interpolate(frame, [0, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {list.map(renderSection)}
      {band}
      {logo === null ? null : (
        <div
          style={{
            position: "absolute",
            left: margin,
            top: margin * 0.75,
            opacity: logoT,
          }}
        >
          {logo ?? (
            <RemocnLogo fontSize={(portrait ? 34 : 26) * u} color={p.fg} />
          )}
        </div>
      )}
    </AbsoluteFill>
  );
}
