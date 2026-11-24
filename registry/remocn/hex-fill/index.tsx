"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useId, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  buildCells,
  type HexFillElementId,
  hexFillTimeline,
  pickFill,
  ringCount,
} from "./timeline";

const { fontFamily: brico } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

// gradients.sh "aurora" palette
const AURORA = {
  bg: "#03050b",
  c: ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"],
} as const;

export interface HexFillProps {
  value?: number;
  label?: string;
  rings?: number;
  /** Mark after the figure. */
  unit?: string;
  accent?: string;
  /** Color of the figure; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  /** Weight of the figure. */
  fontWeight?: number;
  /** Frames the cells take to fill. */
  fillLength?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  grain?: boolean;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the rings appearing, the copy, the fill sweep
   * and the settle, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<HexFillElementId>;
}

const CELL = 0.88;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: AURORA.bg,
    fg: "#F1F3F2",
    muted: "#8A8F99",
    hair: "rgba(255,255,255,0.26)",
    stops: [AURORA.c[0], AURORA.c[1], AURORA.c[2], AURORA.c[3]],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.24)",
    stops: ["#52c7a4", AURORA.c[1], AURORA.c[2], AURORA.c[3]],
    grain: 0.045,
  },
} as const;

function hexPath(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={53}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
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

export function HexFill(props: HexFillProps) {
  const {
    value = 86,
    label = "of renders served from cache",
    rings = 7,
    unit = "%",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = brico,
    fontWeight = 300,
    scale = 1,
    delay = 0,
    grain = true,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    hexFillTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const N = ringCount(rings);
  const pct = Math.max(0, Math.min(100, value));
  const all = useMemo(() => buildCells(N), [N]);
  const F = Math.round((pct / 100) * all.length);
  const cells = useMemo(() => pickFill(all, F), [all, F]);

  const heroSize = 168 * u;
  const pctSize = heroSize * 0.55;
  const labelSize = 24 * u;
  const digits = String(Math.round(pct)).length;
  const heroW = digits * 0.6 * heroSize + 0.62 * pctSize;
  const labelMax = 300 * u;
  const labelW = Math.min(labelMax, label.length * 0.5 * labelSize) + 22 * u;
  const textW = Math.max(heroW, labelW);
  const gap = 80 * u;

  const gridH = 3 * N + 2;
  const gridWUnits = (2 * N + 1) * Math.sqrt(3);
  const s = Math.min(
    (height * 0.74) / gridH,
    (width * 0.86 - gap - textW) / gridWUnits,
  );
  const gridW = gridWUnits * s;
  const left = (width - (gridW + gap + textW)) / 2;
  const gcx = left + gridW / 2;
  const gcy = height / 2;
  const textX = left + gridW + gap;

  const fill = tl.get("fill");
  const angMax = F > 0 ? cells[F - 1].ang : 1;
  const fillAt = (i: number) => {
    const k = Math.min(1, cells[i].ang / Math.max(1e-3, angMax));
    return (
      fill.start +
      (fill.beat("sweep") * Math.acos(1 - 2 * k)) / Math.PI +
      cells[i].ring * fill.beat("lag")
    );
  };
  const fillEnd = fill.end;
  let filled = 0;
  for (let i = 0; i < F; i++) {
    if (t >= fillAt(i)) filled++;
  }
  const shown = F > 0 ? Math.round((pct * filled) / F) : 0;

  const camAt = (tt: number) =>
    0.985 +
    0.025 *
      interpolate(tt, [0, fillEnd + fill.beat("cameraTail")], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
  const camScale = camAt(t);
  // The push is a long in-out ease, so it counts as moving while the frame's
  // edge still shifts, not by its progress.
  const camMoving =
    Math.abs(camAt(t + speed) - camScale) * width > 1e-3 ||
    Math.abs(camScale - camAt(Math.max(0, t - speed))) * width > 1e-3;
  const figureEl = tl.get("figure");
  const labelEl = tl.get("label");
  const doneEl = tl.get("done");
  const textIn = interpolate(t, [figureEl.start, figureEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelIn = interpolate(t, [labelEl.start, labelEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const done = interpolate(t, [doneEl.start, doneEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const hexR = s * CELL;
  const gradId = `hf${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const gR = (gridH * s) / 2;
  const drift = interpolate(t, [0, fillEnd + fill.beat("cameraTail")], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const sw = Math.max(1, 1.1 * u);

  return (
    <AbsoluteFill
      style={{
        background:
          background === "transparent" ? undefined : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${camScale})${glide(camMoving)}`,
            transformOrigin: "50% 50%",
          }}
        >
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <defs>
              <linearGradient
                id={gradId}
                gradientUnits="userSpaceOnUse"
                x1={gcx - gR * (0.9 - 0.15 * drift)}
                y1={gcy - gR}
                x2={gcx + gR * (0.9 + 0.15 * drift)}
                y2={gcy + gR}
              >
                <stop offset="0" stopColor={p.stops[0]} />
                <stop offset="0.36" stopColor={p.stops[1]} />
                <stop offset="0.74" stopColor={p.stops[2]} />
                <stop offset="1" stopColor={p.stops[3]} />
              </linearGradient>
            </defs>
            {cells.map((c, i) => {
              const x = gcx + c.x * s;
              const y = gcy + c.y * s;
              const ring = tl.get(`ring:${c.ring}`);
              const ringIn = interpolate(t, [ring.start, ring.end], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              const isFill = i < F;
              const local = isFill ? t - fillAt(i) : -1;
              const pop =
                local >= 0
                  ? spring({
                      frame: local,
                      fps,
                      config: { damping: 13, stiffness: 240, mass: 0.6 },
                    })
                  : 0;
              const outlineA = isFill ? ringIn : ringIn * (1 - 0.2 * done);
              return (
                <g key={`${c.x.toFixed(2)}_${c.y.toFixed(2)}`}>
                  <path
                    d={hexPath(x, y, hexR * (0.94 + 0.06 * ringIn))}
                    fill="none"
                    stroke={p.hair}
                    strokeWidth={sw}
                    opacity={
                      local >= 0
                        ? outlineA *
                          (1 - Math.min(1, local / fill.beat("fade")))
                        : outlineA
                    }
                  />
                  {local >= 0 ? (
                    <path
                      d={hexPath(x, y, hexR * (0.55 + 0.45 * pop))}
                      fill={`url(#${gradId})`}
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>

          <div
            style={{
              position: "absolute",
              left: textX,
              top: gcy,
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 18 * u,
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight,
                fontSize: heroSize,
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: fg,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                opacity: textIn,
                transform: `translateY(${(1 - textIn) * 14 * u}px)`,
              }}
            >
              {shown}
              <span
                style={{
                  fontSize: pctSize,
                  letterSpacing: "-0.02em",
                  marginLeft: 6 * u,
                  color: p.muted,
                }}
              >
                {unit}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12 * u,
                marginLeft: 6 * u,
                maxWidth: labelMax + 22 * u,
                opacity: labelIn,
                transform: `translateY(${(1 - labelIn) * 8 * u}px)`,
              }}
            >
              <span
                style={{
                  width: 10 * u,
                  height: 10 * u,
                  borderRadius: "50%",
                  background: accent,
                  flexShrink: 0,
                  marginTop: labelSize * 0.42,
                }}
              />
              <span
                style={{
                  fontFamily,
                  fontWeight: 400,
                  fontSize: labelSize,
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                  color: p.muted,
                  textWrap: "balance",
                }}
              >
                {label}
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </ScaleLayer>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      {grain ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
