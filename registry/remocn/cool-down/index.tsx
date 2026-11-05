"use client";

import { loadFont as loadSaira } from "@remotion/google-fonts/Saira";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const saira = loadSaira("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CoolDownProps {
  title?: string;
  label?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#F2F4EE",
    grid: "rgba(255,255,255,0.07)",
    accent: "#76B900",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#0B0D08",
    grid: "rgba(0,0,0,0.08)",
    accent: "#4C7A00",
  },
} as const;

const FONT_PX = 200;
const TRACK = -0.035;
const RISE_LEN = 14;
const COOL_AT = 16;
const COOL_END = 86;
const LABEL_AT = 4;
const LABEL_LEN = 16;
const STILL_AT = 92;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  lines: number[];
  cap: number;
  base: number;
  asc: number;
  desc: number;
}

function measure(lines: string[]): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cool-down: no 2d context");
  ctx.font = `400 ${FONT_PX}px "${saira.fontFamily}"`;
  const widths = lines.map(
    (s) =>
      ctx.measureText(s).width / FONT_PX +
      TRACK * Math.max(0, Array.from(s).length - 1),
  );
  const m = ctx.measureText("Hxg");
  const asc = m.fontBoundingBoxAscent / FONT_PX;
  const desc = m.fontBoundingBoxDescent / FONT_PX;
  return {
    lines: widths,
    cap: ctx.measureText("H").actualBoundingBoxAscent / FONT_PX,
    base: (1 - (asc + desc)) / 2 + asc,
    asc,
    desc,
  };
}

function useMetrics(lines: string[]) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("cool-down: measuring"));
  const released = useRef(false);
  const key = lines.join("\n");
  useEffect(() => {
    let live = true;
    Promise.all([
      saira.waitUntilDone(),
      document.fonts.load(`400 100px "${saira.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(key.split("\n")));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return metrics;
}

function splitLines(title: string) {
  const words = title.split(" ").filter(Boolean);
  if (words.length < 2) return [title];
  let best = 1;
  let score = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const sc = Math.max(a, b);
    if (sc < score) {
      score = sc;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export function CoolDown({
  title = "Runs cool.",
  label = "a full launch film rendered, fans silent",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: CoolDownProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const hot = accent ?? c.accent;
  const fid = `cd${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const lines = splitLines(title);
  const m = useMetrics(lines);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const margin = Math.round(Math.min(W, H) * 0.075);
  const widest = Math.max(...m.lines);
  const F = Math.min(H * 0.4, (W - margin * 2) / widest);
  const lead = F * 0.96;
  const blockH = lead * (lines.length - 1) + m.cap * F;

  const rise = interpolate(t, [0, RISE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const heat = interpolate(t, [COOL_AT, COOL_END], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const shimmer = heat ** 1.4;
  const scale = shimmer * F * 0.075;
  const still = t >= STILL_AT || scale < 0.05;
  const color = `color-mix(in oklab, ${hot} ${(heat * 100).toFixed(1)}%, ${c.ink})`;
  const climb = t * F * 0.035;

  const labelP = interpolate(t, [LABEL_AT, LABEL_AT + LABEL_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelSize = Math.max(18, Math.min(H * 0.044, W * 0.04));
  const labelColor = `color-mix(in oklab, ${hot} ${(40 + heat * 60).toFixed(1)}%, ${c.ink})`;

  const pitch = Math.min(W, H) / 9;
  const gridCols = Math.ceil(W / pitch) + 1;
  const gridRows = Math.ceil(H / pitch) + 1;
  const gx = (W - Math.floor(W / pitch) * pitch) / 2;
  const gy = (H - Math.floor(H / pitch) * pitch) / 2;

  const baseLast = H - margin;
  const clipTop = baseLast - blockH - F * 0.12;
  const clipH = blockH + F * 0.32;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <filter
            id={fid}
            x="-10%"
            y="-250%"
            width="120%"
            height="600%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${(0.9 / F).toFixed(5)} ${(5.2 / F).toFixed(5)}`}
              numOctaves={2}
              seed={5}
              result="noise"
            />
            <feOffset in="noise" dy={-climb} result="drift" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="drift"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        {Array.from({ length: gridCols }, (_, i) => (
          <line
            key={`v${i}`}
            x1={gx + i * pitch}
            x2={gx + i * pitch}
            y1={0}
            y2={H}
            stroke={c.grid}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: gridRows }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            x2={W}
            y1={gy + i * pitch}
            y2={gy + i * pitch}
            stroke={c.grid}
            strokeWidth={1}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: margin,
          top: margin,
          width: W - margin * 2,
          height: labelSize * 2.9,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: saira.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            lineHeight: `${labelSize * 1.3}px`,
            letterSpacing: "-0.005em",
            color: labelColor,
            textWrap: "balance",
            maxWidth: Math.min(W - margin * 2, labelSize * 18),
            transform: `translateY(${((1 - labelP) * labelSize * 2.8).toFixed(2)}px)`,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: clipTop,
          height: clipH,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: margin,
            top: (1 - rise) * clipH,
            width: W - margin,
            height: clipH,
            filter: still ? undefined : `url(#${fid})`,
          }}
        >
          {lines.map((line, i) => {
            const baseY = baseLast - clipTop - (lines.length - 1 - i) * lead;
            return (
              <div
                key={`${i}-${line}`}
                style={{
                  position: "absolute",
                  right: 0,
                  top: baseY - m.base * F,
                  height: F,
                  fontFamily: saira.fontFamily,
                  fontWeight: 400,
                  fontSize: F,
                  lineHeight: `${F}px`,
                  letterSpacing: `${TRACK}em`,
                  whiteSpace: "pre",
                  color,
                  textAlign: "right",
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
