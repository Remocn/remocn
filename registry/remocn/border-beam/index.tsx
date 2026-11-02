"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { type CSSProperties, useId } from "react";
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

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
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

export interface BorderBeamProps {
  title?: string;
  description?: string;
  command?: string;
  showLogo?: boolean;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    card: "rgba(9,9,10,0.9)",
    depth: "0 2px 6px rgba(0,0,0,0.35), 0 30px 80px -20px rgba(0,0,0,0.7)",
    hair: "rgba(255,255,255,0.1)",
    trail: "rgba(255,255,255,0.1)",
    rule: "rgba(255,255,255,0.08)",
    head: "#FFFFFF",
    fg: "#EDEDED",
    muted: "#8F8F94",
    logo: "#EDEDED",
    glow: 0.55,
    ground: "charcoal-satin" as GshPresetId,
    groundParams: {
      colors: ["#2c3036", "#7d838c", "#4f555e"],
    } as Partial<GradientParams> | undefined,
  },
  light: {
    card: "rgba(255,255,255,0.9)",
    depth:
      "0 1px 2px rgba(20,24,60,0.06), 0 30px 70px -24px rgba(20,24,60,0.22)",
    hair: "rgba(10,10,10,0.1)",
    trail: "rgba(10,10,10,0.1)",
    rule: "rgba(10,10,10,0.07)",
    head: "",
    fg: "#0F0F10",
    muted: "#6E6E73",
    logo: "#0F0F10",
    glow: 0.3,
    ground: "paper-crease" as GshPresetId,
    groundParams: undefined as Partial<GradientParams> | undefined,
  },
};

const LAYERS = 28;

const EASE_ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SPRING_HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const T = {
  lapStart: 14,
  lapDur: 80,
  lag: 8,
  contentStart: 84,
  stagger: 5,
  contentDur: 18,
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6),
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const ch = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

export function BorderBeam({
  title = "Version 2.0",
  description = "Launch videos, written in React. Installed like shadcn.",
  command = "npx shadcn add @remocn/launch-film",
  showLogo = true,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: BorderBeamProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const portrait = H > W * 1.1;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);

  const w = portrait ? W * 0.84 : W * 0.6;
  const h = portrait ? H * 0.36 : H * 0.52;
  const r = portrait ? W * 0.03 : W * 0.0125;
  const P = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
  const pad = portrait ? W * 0.07 : W * 0.034;
  const mx = w / 2;
  const d = [
    `M ${mx} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z",
  ].join(" ");

  const enter = spring({ frame, fps, config: SPRING_HEAVY });
  const enterO = interpolate(frame, [0, 12], [0, 1], {
    ...CLAMP,
    easing: EASE_ENTER,
  });
  const lapAt = (start: number) =>
    interpolate(frame, [start, start + T.lapDur], [0, P], {
      ...CLAMP,
      easing: EASE_MOVE,
    });
  const headD = lapAt(T.lapStart);
  const tailD = lapAt(T.lapStart + T.lag);
  const L = headD - tailD;

  const head = c.head || accent;
  const target = (m: number) =>
    m > LAYERS ? 0 : Math.min(0.98, (1 - (m - 1) / LAYERS) ** 1.6);
  const layers: { j: number; len: number; color: string; alpha: number }[] = [];
  if (L > 0.5) {
    for (let j = LAYERS; j >= 1; j--) {
      const alpha = 1 - (1 - target(j)) / (1 - target(j + 1));
      const tt = (j - 1) / (LAYERS - 1);
      layers.push({
        j,
        len: (L * j) / LAYERS,
        color:
          theme === "dark"
            ? mix(head, accent, Math.min(1, tt * 1.25))
            : mix(accent, "#0A0A0A", 0.15 * (1 - tt)),
        alpha,
      });
    }
  }

  const beamPaths = (strokeWidth: number) =>
    layers.map((layer) => (
      <path
        key={layer.j}
        d={d}
        fill="none"
        stroke={layer.color}
        strokeOpacity={layer.alpha}
        strokeWidth={strokeWidth}
        strokeDasharray={`${layer.len} ${P}`}
        strokeDashoffset={-(headD - layer.len)}
      />
    ));

  const item = (i: number): CSSProperties => {
    const p = interpolate(
      frame,
      [
        T.contentStart + i * T.stagger,
        T.contentStart + i * T.stagger + T.contentDur,
      ],
      [0, 1],
      { ...CLAMP, easing: EASE_ENTER },
    );
    return {
      opacity: p,
      filter: `blur(${(1 - p) * 6}px)`,
      transform: `translateY(${(1 - p) * H * 0.02}px)`,
    };
  };

  const s = Math.min(W / 1280, H / 720);
  const titleFs = portrait ? W * 0.1 : W * 0.056;
  const descFs = portrait ? W * 0.038 : H * 0.032;
  const monoFs = portrait ? W * 0.03 : H * 0.025;
  const logoFs = portrait ? W * 0.045 : H * 0.036;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={theme === "light" ? 3 : 5}
        timeScale={0.4}
      />
      <div
        style={{
          position: "absolute",
          left: (W - w) / 2,
          top: (H - h) / 2,
          width: w,
          height: h,
          opacity: enterO,
          transform: `translateY(${(1 - enter) * H * 0.04}px) scale(${0.97 + 0.03 * enter})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: r,
            backgroundColor: c.card,
            boxShadow: c.depth,
          }}
        />
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <filter
              id={`${uid}-glow`}
              x={-40 * s}
              y={-40 * s}
              width={w + 80 * s}
              height={h + 80 * s}
              filterUnits="userSpaceOnUse"
            >
              <feGaussianBlur stdDeviation={5 * s} />
            </filter>
          </defs>
          <path d={d} fill="none" stroke={c.hair} strokeWidth={1} />
          {tailD > 0 ? (
            <path
              d={d}
              fill="none"
              stroke={c.trail}
              strokeWidth={1}
              strokeDasharray={`${tailD} ${P}`}
            />
          ) : null}
          <g filter={`url(#${uid}-glow)`} opacity={c.glow}>
            {beamPaths(4 * s)}
          </g>
          <g>{beamPaths(Math.max(1, 1.5 * s))}</g>
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: pad,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ ...item(0), minHeight: logoFs }}>
            {showLogo ? <RemocnLogo fontSize={logoFs} color={c.logo} /> : null}
          </div>
          <div>
            <div
              style={{
                ...item(1),
                fontFamily: geist.fontFamily,
                fontWeight: 400,
                fontSize: titleFs,
                letterSpacing: "-0.045em",
                lineHeight: 1,
                color: c.fg,
                whiteSpace: "pre",
              }}
            >
              {title}
            </div>
            <div
              style={{
                ...item(2),
                marginTop: titleFs * 0.32,
                fontFamily: geist.fontFamily,
                fontWeight: 300,
                fontSize: descFs,
                letterSpacing: "-0.01em",
                lineHeight: 1.4,
                color: c.muted,
                maxWidth: w - pad * 2,
                textWrap: "balance",
              }}
            >
              {description}
            </div>
            {command ? (
              <div
                style={{
                  ...item(3),
                  marginTop: titleFs * 0.5,
                  paddingTop: monoFs * 1.1,
                  borderTop: `1px solid ${c.rule}`,
                  display: "flex",
                  gap: monoFs * 0.7,
                  fontFamily: geistMono.fontFamily,
                  fontWeight: 400,
                  fontSize: monoFs,
                  letterSpacing: "-0.01em",
                  whiteSpace: "pre",
                  color: c.fg,
                }}
              >
                <span style={{ color: c.muted }}>$</span>
                <span style={{ flex: 1 }}>{command}</span>
                <svg
                  width={monoFs * 1.1}
                  height={monoFs * 1.1}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={c.muted}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  aria-hidden
                  style={{ alignSelf: "center" }}
                >
                  <rect
                    x="8.5"
                    y="8.5"
                    width="11"
                    height="11"
                    rx="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
