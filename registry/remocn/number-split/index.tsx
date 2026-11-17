"use client";

import { loadFont } from "@remotion/google-fonts/DMSans";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
loadDisplay("italic", { weights: ["400"], subsets: ["latin"] });

export interface SplitPart {
  label: string;
  value: number;
}

export interface NumberSplitProps {
  total?: string;
  label?: string;
  parts?: SplitPart[];
  accent?: string;
  /** Text color of the total and part values; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the total, label and values. Load it yourself; Fraunces by default. */
  fontFamily?: string;
  /** Frames the total holds in the middle before it moves up and splits. */
  hold?: number;
  /** Thickness of the bar, in px at 720p. */
  barHeight?: number;
  grain?: boolean;
  /** Size of the figure, bar and parts, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_PARTS: SplitPart[] = [
  { label: "animations", value: 120 },
  { label: "captions", value: 31 },
  { label: "transitions", value: 90 },
  { label: "backgrounds", value: 60 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_LAND = Easing.bezier(0.2, 1.1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.28)",
    // gradients.sh "mesh": accent blue through periwinkle to lilac.
    ramp: ["#2e45b7", "#8796ee", "#ecdcf2"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.85)",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.3)",
    ramp: ["#2e45b7", "#6f7fe6", "#b3a3ec"],
    grain: 0.045,
  },
} as const;

const BAR_IN = 10;
const MOVE = 36;
const MOVE_DUR = 26;
const TREE = MOVE + MOVE_DUR - 2;

export const numberSplitLength = () => TREE + 8 + 12 + 6 + 24 + 40;

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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function widths(values: number[], total: number, min: number) {
  const sum = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  let w = values.map((v) => (Math.max(0, v) / sum) * total);
  for (let pass = 0; pass < 4; pass++) {
    const small = w.map((x) => x < min);
    const fixed = small.filter(Boolean).length * min;
    const rest = w.reduce((a, x, i) => (small[i] ? a : a + x), 0);
    if (!small.some(Boolean) || rest <= 0) break;
    w = w.map((x, i) => (small[i] ? min : (x / rest) * (total - fixed)));
  }
  return w;
}

function splitUnit(total: string) {
  const m = total.match(/^([\d.,\s]+)(.*)$/);
  return m ? { num: m[1], unit: m[2] } : { num: total, unit: "" };
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

export function NumberSplit({
  total = "300+",
  label = "components",
  parts = DEFAULT_PARTS,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = display,
  hold = MOVE,
  barHeight = 16,
  grain = true,
  scale = 1,
  delay = 0,
  theme = "dark",
  speed = 1,
}: NumberSplitProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const c = THEMES[theme];
  const fg = ink ?? c.fg;
  const bg =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const moveAt = hold;
  const splitAt = moveAt + MOVE_DUR - 10;
  const treeAt = moveAt + MOVE_DUR - 2;
  const n = Math.max(1, parts.length);

  const L = W * 0.1;
  const rowW = W - 2 * L;
  const gap = 20 * u;
  const segW = widths(
    parts.map((p) => p.value),
    rowW - gap * (n - 1),
    120 * u,
  );

  const heroF0 = 240 * u;
  const heroF1 = 156 * u;
  const valF = 64 * u;
  const barH = barHeight * u;
  const treeH = 64 * u;
  const block = heroF1 * 0.92 + 18 * u + treeH + barH + 26 * u + valF + 34 * u;
  const top = (H - block) / 2;
  const heroTop1 = top;
  const treeTop = top + heroF1 * 0.92 + 18 * u;
  const barY1 = treeTop + treeH;
  const valTop = barY1 + barH + 26 * u;

  const heroTop0 = H / 2 - heroF0 * 0.56;
  const barY0 = heroTop0 + heroF0 * 0.92 + 30 * u;
  const { num, unit } = splitUnit(total);
  const heroW0 = (num.length * 0.6 + unit.length * 0.4) * heroF0;

  const heroIn = interpolate(t, [0, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_LAND,
  });
  const heroBlur = interpolate(t, [0, 9], [1, 0], CLAMP);
  const barIn = interpolate(t, [BAR_IN, BAR_IN + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const mv = interpolate(t, [moveAt, moveAt + MOVE_DUR], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const split = interpolate(t, [splitAt, splitAt + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gapP = interpolate(t, [splitAt, splitAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_LAND,
  });
  const labelIn = interpolate(t, [moveAt + 14, moveAt + 32], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const stemP = interpolate(t, [treeAt, treeAt + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const spanP = interpolate(t, [treeAt + 8, treeAt + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const cam = interpolate(t, [0, treeAt + 90], [1, 1.025], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const heroScale = 1 + (heroF1 / heroF0 - 1) * mv;
  const heroTop = heroTop0 + (heroTop1 - heroTop0) * mv;
  const labelF = 44 * u;
  const labelW = label.length * 0.43 * labelF;
  const lockShift = -((labelW + 22 * u) / 2) * labelIn;

  const barY = barY0 + (barY1 - barY0) * mv;
  const fullW = heroW0 * 0.86 + (rowW - heroW0 * 0.86) * mv;
  const scaleW = fullW / rowW;
  const gapNow = gap * gapP;
  const segs: { x: number; w: number; cx: number }[] = [];
  const sumW = segW.reduce((a, b) => a + b, 0);
  let x = W / 2 - (sumW * scaleW + gapNow * (n - 1)) / 2;
  for (let i = 0; i < n; i++) {
    const w = segW[i] * scaleW;
    segs.push({ x, w, cx: x + w / 2 });
    x += w + gapNow;
  }

  const stroke = Math.max(1, u);
  const stemTop = treeTop;
  const midY = treeTop + treeH * 0.45;
  const firstCx = segs[0].cx;
  const lastCx = segs[n - 1].cx;
  const center = W / 2;
  const root = center + lockShift;
  const dropAt = segs.map((s) => {
    const end = s.cx < root ? firstCx : lastCx;
    const frac = Math.min(
      1,
      Math.abs(s.cx - root) / Math.max(1, Math.abs(end - root)),
    );
    return treeAt + 8 + 12 * frac;
  });

  const gradId = `split${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const barL = center + (segs[0].x - center) * barIn;
  const barR = center + (segs[n - 1].x + segs[n - 1].w - center) * barIn;
  const drift = interpolate(t, [0, 150], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 65% at 50% 42%, ${c.key}, transparent 72%)`,
        }}
      />
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{ transform: `scale(${cam})`, transformOrigin: "50% 45%" }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: heroTop,
              display: "flex",
              justifyContent: "center",
              transform: `translateX(${lockShift}px)`,
            }}
          >
            <div
              style={{
                position: "relative",
                transformOrigin: "50% 0",
                transform: `scale(${heroScale})`,
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  padding: `${heroF0 * 0.04}px ${heroF0 * 0.04}px 0`,
                  margin: `${-heroF0 * 0.04}px ${-heroF0 * 0.04}px 0`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    fontFamily,
                    fontWeight: 400,
                    fontSize: heroF0,
                    lineHeight: 0.92,
                    letterSpacing: "-0.035em",
                    fontVariantNumeric: "tabular-nums",
                    color: fg,
                    transform: `translateY(${(1 - heroIn) * 104}%)`,
                    filter:
                      heroBlur > 0.02
                        ? `blur(${heroBlur * 10 * u}px)`
                        : undefined,
                  }}
                >
                  <span>{num}</span>
                  {unit ? (
                    <span
                      style={{
                        color: accent,
                        fontSize: heroF0 * 0.56,
                        lineHeight: 1,
                        marginLeft: heroF0 * 0.03,
                        marginTop: heroF0 * 0.04,
                      }}
                    >
                      {unit}
                    </span>
                  ) : null}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: `calc(100% + ${(22 * u * heroF0) / heroF1}px)`,
                  bottom: heroF0 * 0.06,
                  fontFamily,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: labelF / (heroF1 / heroF0),
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  color: c.muted,
                  opacity: labelIn,
                  transform: `translateX(${(1 - labelIn) * -14 * u}px)`,
                  filter: `blur(${(1 - labelIn) * 6 * u}px)`,
                }}
              >
                {label}
              </div>
            </div>
          </div>

          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <defs>
              <linearGradient
                id={gradId}
                gradientUnits="userSpaceOnUse"
                x1={barL - (barR - barL) * 0.04 * drift}
                y1={0}
                x2={Math.max(barL + 1, barR)}
                y2={0}
              >
                <stop offset={0} stopColor={accent} />
                <stop offset={0.2} stopColor={c.ramp[0]} />
                <stop offset={0.62} stopColor={c.ramp[1]} />
                <stop offset={1} stopColor={c.ramp[2]} />
              </linearGradient>
            </defs>
            <line
              x1={root}
              y1={stemTop}
              x2={root}
              y2={stemTop + (midY - stemTop) * stemP}
              stroke={c.hair}
              strokeWidth={stroke}
            />
            <line
              x1={root + (firstCx - root) * spanP}
              y1={midY}
              x2={root + (lastCx - root) * spanP}
              y2={midY}
              stroke={c.hair}
              strokeWidth={stroke}
              opacity={stemP >= 1 ? 1 : 0}
            />
            {segs.map((s, i) => {
              const ds = dropAt[i];
              const drop = interpolate(t, [ds, ds + 10], [0, 1], {
                ...CLAMP,
                easing: EASE_OUT,
              });
              const dp = drop > 0 ? 1 : 0;
              return (
                <g key={i} opacity={dp}>
                  <line
                    x1={s.cx}
                    y1={midY}
                    x2={s.cx}
                    y2={midY + (barY1 - 8 * u - midY) * drop}
                    stroke={c.hair}
                    strokeWidth={stroke}
                  />
                </g>
              );
            })}
            {split < 1 ? (
              <rect
                x={center + (segs[0].x - center) * barIn}
                y={barY}
                width={Math.max(
                  0,
                  (segs[n - 1].x + segs[n - 1].w - segs[0].x) * barIn,
                )}
                height={barH}
                rx={barH / 2}
                fill={`url(#${gradId})`}
                opacity={interpolate(split, [0, 0.35], [1, 0], CLAMP)}
              />
            ) : null}
            {split > 0
              ? segs.map((s, i) => {
                  const w = s.w * barIn;
                  const cx = center + (s.x - center) * barIn;
                  return (
                    <rect
                      key={i}
                      x={cx}
                      y={barY}
                      width={Math.max(0, w)}
                      height={barH}
                      rx={barH / 2}
                      fill={`url(#${gradId})`}
                    />
                  );
                })
              : null}
          </svg>

          {parts.map((p, i) => {
            const s = segs[i];
            const start = dropAt[i] + 6;
            const e = interpolate(t, [start, start + 16], [0, 1], {
              ...CLAMP,
              easing: EASE_LAND,
            });
            const count = interpolate(t, [start, start + 24], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const lab = interpolate(t, [start + 4, start + 18], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.cx - 150 * u,
                  width: 300 * u,
                  top: valTop,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ overflow: "hidden", paddingBottom: 2 * u }}>
                  <div
                    style={{
                      fontFamily,
                      fontWeight: 400,
                      fontSize: valF,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      fontVariantNumeric: "tabular-nums",
                      color: i === 0 ? accent : fg,
                      transform: `translateY(${(1 - e) * 108}%)`,
                    }}
                  >
                    {Math.round(p.value * count)}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 10 * u,
                    fontFamily: sans,
                    fontWeight: 400,
                    fontSize: 19 * u,
                    lineHeight: 1,
                    letterSpacing: "0",
                    color: c.muted,
                    whiteSpace: "nowrap",
                    opacity: lab,
                    transform: `translateY(${(1 - lab) * 8 * u}px)`,
                  }}
                >
                  {p.label}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      </ScaleLayer>
      {grain ? <Grain opacity={c.grain} /> : null}
    </AbsoluteFill>
  );
}
