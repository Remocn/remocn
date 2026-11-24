"use client";

import { loadFont as loadSaira } from "@remotion/google-fonts/Saira";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type CoolDownElementId, coolDownTimeline } from "./timeline";

const saira = loadSaira("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CoolDownProps {
  title?: string;
  label?: string;
  accent?: string;
  /** Text color the title cools to; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the title and label. Load it yourself; Saira by default. */
  fontFamily?: string;
  /** Frames the title takes to cool from the accent to the ink. */
  cooldown?: number;
  /** Strength of the heat shimmer; 0 turns it off. */
  haze?: number;
  /** Size of the copy, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches the title's rise, the label and the cool down,
   * by the ids in `./timeline`. Frames on the scene timeline, after `delay`
   * and `speed`.
   */
  timing?: Timing<CoolDownElementId>;
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

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

const between = (p: number) => p > 0 && p < 1;
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

function measure(lines: string[], fontFamily: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cool-down: no 2d context");
  ctx.font = `400 ${FONT_PX}px "${fontFamily}"`;
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

function useMetrics(lines: string[], fontFamily: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("cool-down: measuring"));
  const released = useRef(false);
  const key = lines.join("\n");
  useEffect(() => {
    let live = true;
    Promise.all([
      saira.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(key.split("\n"), fontFamily));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
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

export function CoolDown(props: CoolDownProps) {
  const {
    title = "Runs cool.",
    label = "a full launch film rendered, fans silent",
    accent,
    ink,
    background,
    fontFamily = saira.fontFamily,
    haze = 1,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    coolDownTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const bg = background ?? c.bg;
  const hot = accent ?? c.accent;
  const fg = ink ?? c.ink;
  const fid = `cd${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const lines = splitLines(title);
  const m = useMetrics(lines, fontFamily);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }

  const margin = Math.round(Math.min(W, H) * 0.075);
  const widest = Math.max(...m.lines);
  const F = Math.min(H * 0.4, (W - margin * 2) / widest);
  const lead = F * 0.96;
  const blockH = lead * (lines.length - 1) + m.cap * F;

  const riseEl = tl.get("rise");
  const cool = tl.get("cool");
  const labelEl = tl.get("label");
  const rise = interpolate(t, [riseEl.start, riseEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const heat = interpolate(t, [cool.start, cool.end], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const shimmer = heat ** 1.4;
  const warp = shimmer * F * 0.075 * haze;
  const still = t >= cool.start + cool.beat("still") || warp < 0.05;
  const color = `color-mix(in oklab, ${hot} ${(heat * 100).toFixed(1)}%, ${fg})`;
  const climb = t * F * 0.035;

  const labelP = interpolate(t, [labelEl.start, labelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelSize = Math.max(18, Math.min(H * 0.044, W * 0.04));
  const labelColor = `color-mix(in oklab, ${hot} ${(40 + heat * 60).toFixed(1)}%, ${fg})`;

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
              scale={warp}
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
      <ScaleLayer scale={scale}>
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
              fontFamily,
              fontWeight: 400,
              fontSize: labelSize,
              lineHeight: `${labelSize * 1.3}px`,
              letterSpacing: "-0.005em",
              color: labelColor,
              textWrap: "balance",
              maxWidth: Math.min(W - margin * 2, labelSize * 18),
              transform: `translateY(${((1 - labelP) * labelSize * 2.8).toFixed(2)}px)${glide(between(labelP))}`,
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
              // The rise is a transform, not `top`: layout rounds a baseline
              // to whole pixels, so the title eased by `top` clicks upward. It
              // stays on at rest to keep the mark.
              top: 0,
              transform: `translateY(${(1 - rise) * clipH}px)${glide(between(rise))}`,
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
                    fontFamily,
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
      </ScaleLayer>
    </AbsoluteFill>
  );
}
