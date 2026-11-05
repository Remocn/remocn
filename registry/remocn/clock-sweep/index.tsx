"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ClockSweepProps {
  minutes?: number;
  title?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SWEEP = Easing.bezier(0.55, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.05)",
    glow: ["rgba(75,43,214,0.2)", "rgba(138,139,255,0.08)"],
    fg: "#F3F2EF",
    muted: "#85848A",
    major: "rgba(243,242,239,0.78)",
    minor: "rgba(243,242,239,0.3)",
    wedge: 0.92,
    limb: ["#160c3a", "#4b2bd6", "#8a8bff", "#e9ecff"],
    word: "linear-gradient(100deg, #e9ecff 0%, #b4b6ff 40%, #8a8bff 75%, #6d5cf0 100%)",
    grain: 0.065,
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.9)",
    glow: ["rgba(138,139,255,0.16)", "rgba(233,236,255,0.9)"],
    fg: "#121214",
    muted: "#6E6C67",
    major: "rgba(18,18,20,0.7)",
    minor: "rgba(18,18,20,0.26)",
    wedge: 0.85,
    limb: ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"],
    word: "linear-gradient(100deg, #4b2bd6 0%, #6a5cf5 45%, #8a8bff 100%)",
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}

function arcPath(deg: number, r: number) {
  const a = polar(0, r);
  const b = polar(Math.max(0.001, deg), r);
  const large = deg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={21}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Dial({
  t,
  r,
  value,
  minutes,
  accent,
  p,
  u,
}: {
  t: number;
  r: number;
  value: number;
  minutes: number;
  accent: string;
  p: Palette;
  u: number;
}) {
  const deg = value * 6;
  const stop = interpolate(t, [66, 69, 84], [0, 1, 0], CLAMP);
  const settled = interpolate(t, [66, 76], [0, 1], CLAMP);

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const at = 2 + i * 0.32;
    const k = interpolate(t, [at, at + 10], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const len = r * (major ? 0.085 : 0.042);
    const outer = r * (1 - (1 - k) * 0.05);
    const a = polar(i * 6, outer);
    const b = polar(i * 6, outer - len);
    const passed = i > 0 && i <= minutes && deg >= i * 6 - 0.01;
    const lit = passed
      ? interpolate(deg, [i * 6 - 0.01, i * 6 + 2], [0, 1], CLAMP)
      : 0;
    const zero = i === 0 ? interpolate(t, [28, 34], [0, 1], CLAMP) : 0;
    const base = major ? p.major : p.minor;
    ticks.push(
      <line
        key={i}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={lit > 0.5 || zero > 0.5 ? accent : base}
        strokeWidth={(major ? 2 : 1.25) * u * (1 + 0.4 * Math.max(lit, zero))}
        strokeLinecap="round"
        opacity={k}
      />,
    );
  }

  const handIn = interpolate(t, [12, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const handLen = r * 0.8 * (0.18 + 0.82 * handIn);
  const tip = polar(deg, handLen);
  const tail = polar(deg + 180, r * 0.1 * handIn);
  const arcR = r * 1.075;
  const arcW = 3 * u;
  const arcOn = interpolate(t, [28, 34], [0, 1], CLAMP);
  const [c0, c1, c2, c3] = p.limb;
  const d = Math.max(0.001, deg);
  const wedge = `conic-gradient(from 0deg, ${c0} 0deg, ${c1} ${d * 0.45}deg, ${c2} ${d * 0.82}deg, ${c3} ${d}deg, transparent ${d}deg)`;
  const wedgeMask =
    "radial-gradient(circle closest-side, transparent 8%, rgba(0,0,0,0.5) 40%, #000 92%, transparent 92.6%)";
  const endDot = polar(deg, arcR);
  const pad = r * 1.25;

  return (
    <>
      {deg > 0.05 ? (
        <div
          style={{
            position: "absolute",
            left: -r * 1.04,
            top: -r * 1.04,
            width: r * 2.08,
            height: r * 2.08,
            borderRadius: "50%",
            background: wedge,
            maskImage: wedgeMask,
            WebkitMaskImage: wedgeMask,
            opacity: p.wedge * (0.85 + stop * 0.15),
          }}
        />
      ) : null}
      <svg
        width={pad * 2}
        height={pad * 2}
        viewBox={`${-pad} ${-pad} ${pad * 2} ${pad * 2}`}
        style={{
          position: "absolute",
          left: -pad,
          top: -pad,
          overflow: "visible",
        }}
        aria-hidden
      >
        <circle
          r={r * 1.075}
          fill="none"
          stroke={p.minor}
          strokeWidth={Math.max(1, u)}
          opacity={0.5 * interpolate(t, [6, 26], [0, 1], CLAMP)}
        />
        {ticks}
        {deg > 0.05 ? (
          <path
            d={arcPath(deg, arcR)}
            fill="none"
            stroke={accent}
            strokeWidth={arcW * (1 + stop * 0.35)}
            strokeLinecap="round"
            opacity={arcOn}
          />
        ) : null}
        <circle
          cx={endDot.x}
          cy={endDot.y}
          r={arcW * 1.6}
          fill={accent}
          opacity={settled}
        />
        <circle
          r={arcW * (1.6 + 2.6 * stop)}
          cx={endDot.x}
          cy={endDot.y}
          fill="none"
          stroke={accent}
          strokeWidth={u}
          opacity={stop * 0.6}
        />
        <line
          x1={tail.x}
          y1={tail.y}
          x2={tip.x}
          y2={tip.y}
          stroke={p.fg}
          strokeWidth={2.25 * u}
          strokeLinecap="round"
          opacity={handIn}
        />
        <circle r={5.5 * u} fill={p.fg} opacity={handIn} />
        <circle r={2 * u} fill={accent} opacity={handIn} />
      </svg>
    </>
  );
}

function Headline({
  t,
  title,
  minutes,
  size,
  p,
}: {
  t: number;
  title: string;
  minutes: number;
  size: number;
  p: Palette;
}) {
  const lines = title.split("\n").map((l) => l.split(/\s+/).filter(Boolean));
  const flat = lines.flat();
  const hit = flat.indexOf(String(minutes));
  let n = 0;
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.06,
        letterSpacing: "-0.032em",
        color: p.fg,
        textWrap: "balance",
      }}
    >
      {lines.map((line, li) => (
        <div key={`l${li}-${line.join(" ")}`}>
          {line.map((w, wi) => {
            const i = n++;
            const at = 82 + i * 2.5;
            const k = interpolate(t, [at, at + 20], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const accentWord = hit >= 0 && (i === hit || i === hit + 1);
            return (
              <span
                key={`${w}-${i}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  verticalAlign: "top",
                  paddingBottom: size * 0.14,
                  marginBottom: -size * 0.14,
                  marginRight: wi < line.length - 1 ? size * 0.24 : 0,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - k) * 135}%)`,
                    color: p.fg,
                    ...(accentWord
                      ? {
                          fontFamily: serif,
                          fontStyle: "italic",
                          fontWeight: 400,
                          fontSize: "1.12em",
                          lineHeight: 0.95,
                          letterSpacing: "-0.01em",
                          paddingRight: "0.06em",
                          backgroundImage: p.word,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }
                      : null),
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function ClockSweep({
  minutes = 4,
  title,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ClockSweepProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = THEMES[theme];
  const total = Math.min(59, Math.max(0.25, minutes));

  const sweep = interpolate(t, [32, 66], [0, 1], {
    ...CLAMP,
    easing: EASE_SWEEP,
  });
  const after = Math.max(0, t - 66);
  const kick =
    t > 66 ? 0.07 * Math.sin(after * 1.1) * Math.exp(-after * 0.45) : 0;
  const value = total * sweep + kick;

  const r = Math.min(height * 0.29, width * 0.19);
  const glide = interpolate(t, [70, 104], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const leftX = width * 0.255;
  const push =
    interpolate(t, [20, 66], [0, 1], { ...CLAMP, easing: EASE_IO }) *
    (1 - glide);
  const focus = polar(total * 3, r * 0.62);
  const pushS = 1 + push * 0.32;
  const cx =
    interpolate(glide, [0, 1], [width / 2, leftX]) - focus.x * (pushS - 1);
  const cy = height / 2 - focus.y * (pushS - 1);
  const dialScale =
    interpolate(t, [0, 30], [1.04, 1], { ...CLAMP, easing: EASE_OUT }) *
    pushS *
    interpolate(t, [104, 170], [1, 1.015], CLAMP);

  const secs = total * sweep * 60;
  const mm = Math.floor(secs / 60);
  const ss = Math.floor(secs % 60);
  const readout = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const readIn = interpolate(t, [18, 34], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const readLit = interpolate(t, [66, 72], [0, 1], CLAMP);

  const headSize = Math.min(height * 0.098, width * 0.055);
  const headLeft = cx + r * 1.36;
  const headW = width - (leftX + r * 1.36) - width * 0.03;
  const headDrift = interpolate(t, [76, 170], [0, -6 * u], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 34% 52% at ${(cx / width) * 100 + 4}% ${30 - 4 * glide}%, ${p.glow[1]}, transparent 70%)`,
            `radial-gradient(ellipse 60% 80% at ${(cx / width) * 100}% 62%, ${p.glow[0]}, transparent 72%)`,
            `radial-gradient(ellipse 55% 75% at ${(cx / width) * 100}% 48%, ${p.stage}, transparent 72%)`,
          ].join(", "),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: 0,
          height: 0,
          transform: `scale(${dialScale})`,
        }}
      >
        <Dial
          t={t}
          r={r}
          value={value}
          minutes={total}
          accent={accent}
          p={p}
          u={u}
        />
        <div
          style={{
            position: "absolute",
            left: -r,
            width: r * 2,
            top: r * 0.34,
            textAlign: "center",
            fontFamily: mono,
            fontWeight: 400,
            fontSize: r * 0.1,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
            color: readLit > 0.5 ? accent : p.muted,
            opacity: readIn,
          }}
        >
          {readout}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: headLeft,
          width: headW,
          top: cy,
          transform: `translateY(calc(-50% + ${headDrift}px))`,
        }}
      >
        <Headline
          t={t}
          title={
            title ??
            `From idea to video\nin ${minutes} ${minutes === 1 ? "minute" : "minutes"}`
          }
          minutes={minutes}
          size={headSize}
          p={p}
        />
      </div>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
