"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const display = loadInterTight("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface ThinSlabSide {
  value: number;
  label: string;
  unit?: string;
}

export interface ThinSlabProps {
  title?: string;
  before?: ThinSlabSide;
  after?: ThinSlabSide;
  callout?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const BEAM = ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    slab: "#26262C",
    slabEdge: "#34343B",
    ghost: "#6A6970",
    deep: BEAM[3],
    tip: BEAM[0],
    haze: "rgba(61,91,255,0.10)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    slab: "#DDDAD2",
    slabEdge: "#CFCBC2",
    ghost: "#8F8C85",
    deep: "#1a1660",
    tip: BEAM[1],
    haze: "rgba(61,91,255,0.06)",
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SQUEEZE = Easing.bezier(0.7, 0, 0.18, 1.06);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const INTER_TIGHT_500 = [
  223, 271, 452, 595, 601, 786, 608, 269, 324, 324, 479, 624, 274, 420, 260,
  325, 604, 370, 571, 602, 611, 575, 589, 527, 588, 589, 260, 271, 624, 624,
  624, 483, 926, 657, 612, 693, 679, 561, 544, 707, 699, 227, 509, 623, 522,
  858, 706, 726, 597, 727, 603, 601, 608, 695, 657, 940, 624, 643, 597, 324,
  325, 324, 433, 418, 402, 529, 574, 528, 574, 543, 327, 575, 561, 207, 207,
  514, 207, 843, 557, 560, 574, 574, 342, 493, 330, 553, 524, 783, 509, 524,
  509, 396, 301, 396, 624,
];
const TNUM = 0.6;

function textEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") {
      w += TNUM;
      continue;
    }
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c <= 126 ? INTER_TIGHT_500[c - 32] : 600) / 1000;
  }
  return w;
}

function decimalsOf(n: number) {
  const s = String(n);
  const i = s.indexOf(".");
  return i < 0 ? 0 : Math.min(3, s.length - i - 1);
}

function formatNumber(n: number, decimals: number) {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "−" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

function autoCallout(before: number, after: number) {
  if (before <= 0 || after <= 0 || before === after) return "";
  const big = Math.max(before, after);
  const small = Math.min(before, after);
  const ratio = big / small;
  const word = after < before ? "less" : "more";
  if (ratio >= 2) {
    const r = ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10;
    return `${r}× ${word}`;
  }
  const pct = Math.round((Math.abs(after - before) / before) * 100);
  return `${after < before ? "−" : "+"}${pct}%`;
}

function Roll({
  text,
  progressIn,
  progressOut = 0,
  style,
}: {
  text: string;
  progressIn: number;
  progressOut?: number;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: style.fontSize,
        overflow: "hidden",
        padding: "0.12em 0.2em 0.26em 0.12em",
        margin: "-0.12em -0.2em -0.26em -0.12em",
      }}
    >
      <div
        style={{
          ...style,
          transform: `translateY(${(1 - progressIn) * 150 - progressOut * 150}%)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

const DEFAULT_BEFORE: ThinSlabSide = {
  value: 14,
  label: "By hand",
  unit: "days",
};
const DEFAULT_AFTER: ThinSlabSide = {
  value: 1,
  label: "With remocn",
  unit: "day",
};

export function ThinSlab({
  title = "Time to your first launch video",
  before = DEFAULT_BEFORE,
  after = DEFAULT_AFTER,
  callout,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: ThinSlabProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];
  const gid = `ts${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const defaultSides = before === DEFAULT_BEFORE && after === DEFAULT_AFTER;
  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);

  const wipe = interpolate(frame, [-5, 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const titleIn = interpolate(frame, [-4, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const numIn = interpolate(frame, [3, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const ghostIn = interpolate(frame, [40, 52], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelSwap = interpolate(frame, [42, 56], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const squeeze = interpolate(frame, [46, 82], [0, 1], {
    ...CLAMP,
    easing: EASE_SQUEEZE,
  });
  const count = Math.min(1, Math.max(0, squeeze));
  const calloutIn = interpolate(frame, [70, 88], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const sheen = interpolate(frame, [84, 108], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const left = width * (portrait ? 0.08 : 0.1);
  const slabW = width * (portrait ? 0.78 : 0.7);
  const titleFs = (portrait ? 26 : 22) * s;
  const labelFs = (portrait ? 22 : 18) * s;
  const tMax = height * (portrait ? 0.2 : 0.28);
  const tMin = Math.max(5 * s, tMax * 0.035);

  const maxV = Math.max(Math.abs(before.value), Math.abs(after.value), 1e-6);
  const thickOf = (v: number) => Math.max(tMin, (Math.abs(v) / maxV) * tMax);
  const tBefore = thickOf(before.value);
  const tAfter = thickOf(after.value);
  const thick = Math.max(tMin * 0.8, tBefore + (tAfter - tBefore) * squeeze);

  const decimals = Math.max(decimalsOf(before.value), decimalsOf(after.value));
  const value = before.value + (after.value - before.value) * count;
  const shown = formatNumber(count >= 0.999 ? after.value : value, decimals);
  const unit =
    shown === formatNumber(after.value, decimals)
      ? (after.unit ?? "")
      : (before.unit ?? "");
  const numText = `${shown}${unit ? ` ${unit}` : ""}`;
  const grows = tAfter > tBefore;
  const widest = Math.max(
    textEm(
      `${formatNumber(before.value, decimals)}${before.unit ? ` ${before.unit}` : ""}`,
    ),
    textEm(
      `${formatNumber(after.value, decimals)}${after.unit ? ` ${after.unit}` : ""}`,
    ),
  );
  const numFs = Math.min(
    (portrait ? 190 : 168) * s,
    (width - left * 2) / (widest * 0.97),
  );

  const gap = height * (portrait ? 0.05 : 0.065);
  const groupH = titleFs * 2.6 + labelFs * 1.5 + numFs * 1.02 + gap + tMax;
  const titleY = Math.max(height * 0.06, (height - groupH) / 2);
  const labelY = titleY + titleFs * 2.6;
  const numY = labelY + labelFs * 1.5;
  const slabCy = numY + numFs * 1.02 + gap + tMax / 2;

  const radius = (h: number) => Math.min(14 * s, h / 2);
  const slabTop = slabCy - thick / 2;
  const ghostTop = slabCy - tBefore / 2;
  const callText =
    callout ??
    (defaultSides ? "14× faster" : autoCallout(before.value, after.value));

  const transparent = background === "transparent";
  const showStage = !transparent && background === undefined;

  const dimX = left + slabW + 26 * s;
  const tick = 9 * s;

  const ghost = (
    <>
      <rect
        x={left}
        y={ghostTop}
        width={slabW}
        height={tBefore}
        rx={radius(tBefore)}
        fill="none"
        stroke={grows ? t.fg : t.ghost}
        strokeWidth={1.4 * s}
        strokeDasharray={`${6 * s} ${6 * s}`}
        opacity={ghostIn * 0.9}
      />
      <text
        x={left + 18 * s}
        y={ghostTop + 18 * s + labelFs * 0.8}
        fill={grows ? t.fg : t.muted}
        fontFamily={mono.fontFamily}
        fontSize={labelFs * 0.9}
        letterSpacing={labelFs * 0.9 * 0.08}
        opacity={interpolate(squeeze, [0.35, 0.8], [0, 1], CLAMP)}
      >
        {`${before.label} · ${formatNumber(before.value, decimalsOf(before.value))}${before.unit ? ` ${before.unit}` : ""}`.toUpperCase()}
      </text>
    </>
  );

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? t.bg),
        overflow: "hidden",
      }}
    >
      {showStage ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: squeeze > 0 ? Math.min(1, squeeze) : 0,
            background: `radial-gradient(${slabW * 0.75}px ${tMax * 1.1}px at ${left + slabW * 0.6}px ${slabCy}px, ${t.haze} 0%, transparent 100%)`,
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left,
          top: titleY,
          maxWidth: width - left * 2,
          fontFamily: display.fontFamily,
          fontWeight: 400,
          fontSize: titleFs,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: t.muted,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 10 * s}px)`,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: "absolute",
          left,
          top: labelY,
          height: labelFs * 1.3,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Roll
            text={before.label.toUpperCase()}
            progressIn={numIn}
            progressOut={labelSwap}
            style={{
              fontFamily: mono.fontFamily,
              fontWeight: 400,
              fontSize: labelFs,
              letterSpacing: "0.08em",
              color: t.muted,
            }}
          />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Roll
            text={after.label.toUpperCase()}
            progressIn={labelSwap}
            style={{
              fontFamily: mono.fontFamily,
              fontWeight: 500,
              fontSize: labelFs,
              letterSpacing: "0.08em",
              color: theme === "dark" ? BEAM[1] : accent,
            }}
          />
        </div>
      </div>

      <div style={{ position: "absolute", left, top: numY }}>
        <Roll
          text={numText}
          progressIn={numIn}
          style={{
            fontFamily: display.fontFamily,
            fontWeight: 500,
            fontSize: numFs,
            lineHeight: 1,
            letterSpacing: "-0.035em",
            fontVariantNumeric: "tabular-nums",
            color: t.fg,
          }}
        />
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`${gid}f`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={t.deep} />
            <stop offset="0.5" stopColor={accent} />
            <stop offset="0.86" stopColor={BEAM[1]} />
            <stop offset="1" stopColor={t.tip} />
          </linearGradient>
          <linearGradient
            id={`${gid}s`}
            gradientUnits="userSpaceOnUse"
            x1={left - slabW * 0.3 + sheen * slabW * 1.6}
            x2={left + slabW * 0.0 + sheen * slabW * 1.6}
            y1="0"
            y2="0"
          >
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.85} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <clipPath id={`${gid}c`}>
            <rect x={left} y={0} width={slabW * wipe} height={height} />
          </clipPath>
        </defs>

        {grows ? null : ghost}
        <g clipPath={`url(#${gid}c)`}>
          <rect
            x={left}
            y={slabTop}
            width={slabW}
            height={thick}
            rx={radius(thick)}
            fill={t.slab}
            stroke={t.slabEdge}
            strokeWidth={1 * s}
          />
          <rect
            x={left}
            y={slabTop}
            width={slabW}
            height={thick}
            rx={radius(thick)}
            fill={`url(#${gid}f)`}
            opacity={Math.min(1, Math.max(0, squeeze * 1.15))}
          />
          {sheen > 0 && sheen < 1 ? (
            <rect
              x={left}
              y={slabTop}
              width={slabW}
              height={thick}
              rx={radius(thick)}
              fill={`url(#${gid}s)`}
              opacity={0.9}
            />
          ) : null}
        </g>

        {grows ? ghost : null}

        <g opacity={interpolate(wipe, [0.7, 1], [0, 1], CLAMP)}>
          <line
            x1={dimX - tick}
            x2={dimX + tick}
            y1={slabTop}
            y2={slabTop}
            stroke={t.muted}
            strokeWidth={1.4 * s}
          />
          <line
            x1={dimX - tick}
            x2={dimX + tick}
            y1={slabTop + thick}
            y2={slabTop + thick}
            stroke={t.muted}
            strokeWidth={1.4 * s}
          />
          <line
            x1={dimX}
            x2={dimX}
            y1={slabTop}
            y2={slabTop + thick}
            stroke={t.muted}
            strokeWidth={1.4 * s}
          />
        </g>
      </svg>

      {callText ? (
        <div
          style={{
            position: "absolute",
            left: portrait ? undefined : dimX + 18 * s,
            right: portrait ? width - (left + slabW) : undefined,
            top: portrait ? slabCy + tMax / 2 + 26 * s : slabCy,
            transform: portrait
              ? `translateY(${(1 - calloutIn) * 12 * s}px)`
              : `translate(${(1 - calloutIn) * -10 * s}px, -50%)`,
            opacity: calloutIn,
            fontFamily: display.fontFamily,
            fontWeight: 500,
            fontSize: (portrait ? 44 : 30) * s,
            letterSpacing: "-0.02em",
            color: t.fg,
            whiteSpace: "nowrap",
          }}
        >
          {callText}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
