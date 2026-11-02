"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
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

export interface Stat {
  /** The number itself, already formatted: "10,000", "99.9". */
  value: string;
  /** Set small and in the accent, top-aligned after the number: "+", "%", "★". */
  unit?: string;
  /** One or two words beside the number. */
  label: string;
  /** A muted qualifier under the label. */
  detail?: string;
}

export interface StatSequenceProps {
  stats?: Stat[];
  /** Product name in the corner lockup. */
  name?: string;
  /** Muted text after the lockup. */
  eyebrow?: string;
  /** Replaces the default remocn mark in the lockup. */
  logo?: React.ReactNode;
  /** Frames each stat owns before the next one cuts in. */
  beat?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_STATS: Stat[] = [
  {
    value: "10,000",
    unit: "+",
    label: "builders",
    detail: "shipping videos every week",
  },
  {
    value: "99.9",
    unit: "%",
    label: "uptime",
    detail: "render API, last 12 months",
  },
  { value: "4.9", unit: "★", label: "rating", detail: "from 1,200 reviews" },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
/** Ease-out that lands about 2% past the mark before settling. */
const EASE_LAND = Easing.bezier(0.2, 1.1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.3);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.13)",
    grain: 0.07,
    /** gradients.sh "mesh" (#ecdcf2 #8796ee #2e45b7 #0e1645), lit from above. */
    ink: "linear-gradient(180deg, #F6EEF9 6%, #D4CDF4 40%, #9AA6F1 74%, #6F82EA 100%)",
    bar: "linear-gradient(180deg, #ECDCF2, #8796EE 45%, #2E45B7)",
    mesh: [
      "radial-gradient(60% 75% at 22% 44%, rgba(46,69,183,0.30) 0%, transparent 68%)",
      "radial-gradient(45% 60% at 8% 92%, rgba(135,150,238,0.10) 0%, transparent 68%)",
      "radial-gradient(70% 80% at 30% 40%, rgba(14,22,69,0.85) 0%, transparent 70%)",
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.13)",
    grain: 0.045,
    /** the same "mesh" palette, inside the type on paper */
    ink: "linear-gradient(180deg, #5B6FE6 0%, #2E45B7 38%, #16205E 72%, #0E1645 100%)",
    bar: "linear-gradient(180deg, #8796EE, #2E45B7 55%, #0E1645)",
    mesh: [
      "radial-gradient(55% 70% at 24% 44%, rgba(236,220,242,0.75) 0%, transparent 68%)",
      "radial-gradient(45% 60% at 10% 90%, rgba(135,150,238,0.14) 0%, transparent 70%)",
      "radial-gradient(70% 80% at 30% 40%, rgba(255,255,255,0.7) 0%, transparent 70%)",
    ],
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.2l2.95 6.2 6.8.86-4.98 4.7 1.27 6.74L12 17.4l-6.04 3.3 1.27-6.74-4.98-4.7 6.8-.86z"
        fill={color}
        strokeLinejoin="round"
        stroke={color}
        strokeWidth={0.8}
      />
    </svg>
  );
}

/**
 * Per-glyph slot motion: each glyph rises from below the mask on `enter`,
 * leaves through the top on `exit`. Returns y in % of the line box and a
 * small blur while the glyph is travelling fast.
 */
function glyph(
  t: number,
  i: number,
  enter: number,
  exit: number,
  stagger: number,
) {
  const e = interpolate(
    t,
    [enter + i * stagger, enter + i * stagger + 12],
    [0, 1],
    { ...CLAMP, easing: EASE_LAND },
  );
  const x = interpolate(t, [exit + i * 0.4, exit + i * 0.4 + 5], [0, 1], {
    ...CLAMP,
    easing: EASE_IN,
  });
  const y = (1 - e) * 108 - x * 108;
  const raw = interpolate(
    t,
    [enter + i * stagger, enter + i * stagger + 6],
    [1, 0],
    CLAMP,
  );
  const blur = raw + x * (1 - x) * 4;
  return { y, blur, visible: e > 0 && x < 1 };
}

function SlotText({
  text,
  t,
  enter,
  exit,
  stagger,
  u,
  style,
  glyphStyle,
}: {
  text: string;
  t: number;
  enter: number;
  exit: number;
  stagger: number;
  u: number;
  style?: React.CSSProperties;
  /** Per-glyph paint, e.g. a clip-text gradient (each glyph box is 1em tall). */
  glyphStyle?: React.CSSProperties;
}) {
  return (
    <span style={{ display: "inline-flex", whiteSpace: "pre", ...style }}>
      {[...text].map((ch, i) => {
        const g = glyph(t, i, enter, exit, stagger);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              ...glyphStyle,
              transform: `translateY(${g.y}%)`,
              filter: g.blur > 0.05 ? `blur(${g.blur * 3 * u}px)` : undefined,
              visibility: g.visible ? "visible" : "hidden",
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/** The monumental number + its small accent unit, inside one mask. */
function Figure({
  stat,
  t,
  enter,
  exit,
  size,
  u,
  c,
  accent,
}: {
  stat: Stat;
  t: number;
  enter: number;
  exit: number;
  size: number;
  u: number;
  c: Theme;
  accent: string;
}) {
  const unitIndex = [...stat.value].length;
  const ug = glyph(t, unitIndex + 1, enter, exit, 1.6);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        overflow: "hidden",
        padding: `${0.06 * size}px ${0.04 * size}px ${0.02 * size}px 0`,
        fontFamily: sans,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.042em",
        fontVariantNumeric: "tabular-nums",
        color: c.fg,
      }}
    >
      <SlotText
        text={stat.value}
        t={t}
        enter={enter}
        exit={exit}
        stagger={1.6}
        u={u}
        glyphStyle={{
          backgroundImage: c.ink,
          backgroundSize: "100% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      />
      {stat.unit ? (
        <span
          style={{
            display: "inline-flex",
            marginLeft: 0.04 * size,
            marginTop: 0.1 * size,
            transform: `translateY(${ug.y * 2.2}%)`,
            visibility: ug.visible ? "visible" : "hidden",
            color: accent,
            fontSize: 0.46 * size,
            lineHeight: 1,
            letterSpacing: 0,
          }}
        >
          {stat.unit === "★" ? (
            <Star size={0.42 * size} color={accent} />
          ) : (
            stat.unit
          )}
        </span>
      ) : null}
    </div>
  );
}

/** Label + detail, each line rising through its own mask. */
function Caption({
  stat,
  t,
  enter,
  exit,
  labelSize,
  detailSize = labelSize * 0.56,
  c,
}: {
  stat: Stat;
  t: number;
  enter: number;
  exit: number;
  labelSize: number;
  detailSize?: number;
  c: Theme;
}) {
  const line = (k: number) => {
    const e = interpolate(t, [enter + k * 3, enter + k * 3 + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const x = interpolate(t, [exit + k, exit + k + 5], [0, 1], {
      ...CLAMP,
      easing: EASE_IN,
    });
    return `translateY(${(1 - e) * 110 - x * 110}%)`;
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0.22 * labelSize,
      }}
    >
      <div style={{ overflow: "hidden", paddingBottom: 0.12 * labelSize }}>
        <div
          style={{
            transform: line(0),
            fontFamily: sans,
            fontWeight: 500,
            fontSize: labelSize,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: c.fg,
            whiteSpace: "nowrap",
          }}
        >
          {stat.label}
        </div>
      </div>
      {stat.detail ? (
        <div style={{ overflow: "hidden", paddingBottom: 0.1 * labelSize }}>
          <div
            style={{
              transform: line(1),
              fontFamily: sans,
              fontWeight: 400,
              fontSize: detailSize,
              lineHeight: 1.2,
              letterSpacing: "-0.005em",
              color: c.muted,
              whiteSpace: "nowrap",
            }}
          >
            {stat.detail}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StatSequence({
  stats = DEFAULT_STATS,
  name = "remocn",
  eyebrow = "in numbers",
  logo,
  beat = 26,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: StatSequenceProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame * speed;
  const u = Math.min(width / 1280, height / 720);
  const c = THEMES[theme];
  const n = Math.max(1, stats.length);

  const START = 8;
  const inAt = (i: number) => START + i * beat;
  const lastIn = inAt(n - 1);
  const M = lastIn + 42; // the hero stat starts moving into the summary row
  const MORPH = 24;

  const F = 196 * u; // monumental size
  const L = width * 0.08; // left rule of the frame
  const pad = 30 * u;
  const colW = (width - 2 * L) / n;
  const S = Math.min(0.42, (colW - pad * 1.6) / (F * 3.4)); // summary scale
  const bigTop = height / 2 - F * 0.6;
  const rowTop = height / 2 - (F * S * 1.12 + 70 * u) / 2;

  const mp = interpolate(t, [M, M + MORPH], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  // slow camera drift over the whole shot
  const drift = interpolate(t, [0, M + MORPH + 40], [0, 1], CLAMP);

  // accent bar: the cut marker. Grows from below on the first stat, swipes
  // up-and-out / up-and-in on every cut, retires as the row assembles.
  const barTop = bigTop + 0.18 * F;
  const barH = 0.72 * F;
  let barScale = interpolate(t, [inAt(0) - 2, inAt(0) + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  let barOrigin = "bottom";
  for (let i = 1; i < n; i++) {
    const cut = inAt(i);
    if (t >= cut - 4 && t < cut + 1) {
      barScale = interpolate(t, [cut - 4, cut + 1], [1, 0], {
        ...CLAMP,
        easing: EASE_IN,
      });
      barOrigin = "top";
    } else if (t >= cut + 1 && t < cut + 10) {
      barScale = interpolate(t, [cut + 1, cut + 10], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      barOrigin = "bottom";
    }
  }
  if (t >= M - 2) {
    barScale = interpolate(t, [M - 2, M + 8], [1, 0], {
      ...CLAMP,
      easing: EASE_IN,
    });
    barOrigin = "top";
  }

  // index ticker, bottom left
  const idxSize = 15 * u;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      {/* mesh ground: three soft blobs that drift a few % over the shot */}
      <AbsoluteFill
        style={{
          background: c.mesh.join(", "),
          transform: `translate(${drift * 3}%, ${-drift * 2}%) scale(${1.04 + drift * 0.04})`,
        }}
      />

      <AbsoluteFill
        style={{
          transform: `scale(${1 + drift * 0.025}) translateX(${-drift * 6 * u}px)`,
          transformOrigin: "40% 50%",
        }}
      >
        {/* corner lockup */}
        <div
          style={{
            position: "absolute",
            left: L,
            top: 52 * u,
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            fontFamily: sans,
            fontSize: 17 * u,
            lineHeight: 1,
            opacity: interpolate(t, [0, 12], [0, 1], CLAMP),
            transform: `translateY(${interpolate(t, [0, 16], [8, 0], { ...CLAMP, easing: EASE_OUT }) * u}px)`,
          }}
        >
          {logo ??
            (name.trim().toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={21 * u} color={c.fg} />
            ) : (
              <span
                style={{
                  color: c.fg,
                  fontWeight: 500,
                  fontSize: 19 * u,
                  letterSpacing: "-0.02em",
                }}
              >
                {name}
              </span>
            ))}
          <span
            style={{
              width: Math.max(1, u),
              height: 16 * u,
              background: c.hair,
              margin: `0 ${2 * u}px`,
            }}
          />
          <span style={{ color: c.muted, fontWeight: 400 }}>{eyebrow}</span>
        </div>

        {/* the accent cut bar */}
        <div
          style={{
            position: "absolute",
            left: L,
            top: barTop,
            width: 5 * u,
            height: barH,
            borderRadius: 3 * u,
            background: c.bar,
            transform: `scaleY(${barScale})`,
            transformOrigin: barOrigin,
          }}
        />

        {/* one monumental stat at a time */}
        {stats.map((stat, i) => {
          const isLast = i === n - 1;
          const enter = inAt(i);
          const exit = isLast ? 1e9 : inAt(i + 1) - 5;
          if (t < enter - 1 || t > exit + 14) return null;
          const tx = isLast ? (n - 1) * colW * mp : 0;
          const ty = isLast ? (rowTop - bigTop) * mp : 0;
          const sc = isLast ? 1 + (S - 1) * mp : 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: L + pad,
                top: bigTop,
                display: "flex",
                alignItems: "flex-end",
                gap: 34 * u,
                transformOrigin: "0 0",
                transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
              }}
            >
              <Figure
                stat={stat}
                t={t}
                enter={enter}
                exit={exit}
                size={F}
                u={u}
                c={c}
                accent={accent}
              />
              <div style={{ paddingBottom: 0.2 * F }}>
                <Caption
                  stat={stat}
                  t={t}
                  enter={enter + 5}
                  exit={isLast ? M - 6 : exit}
                  labelSize={34 * u}
                  c={c}
                />
              </div>
            </div>
          );
        })}

        {/* summary row: column rules, the other figures, labels below */}
        {stats.map((stat, i) => {
          const colLeft = L + i * colW;
          const ruleP = interpolate(
            t,
            [M + 6 + i * 3, M + 24 + i * 3],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          );
          const isLast = i === n - 1;
          const figEnter = M + 8 + i * 4;
          return (
            <div key={`row-${i}`}>
              <div
                style={{
                  position: "absolute",
                  left: colLeft,
                  top: rowTop - 6 * u,
                  width: Math.max(1, u),
                  height: F * S + 120 * u,
                  background: c.hair,
                  transform: `scaleY(${ruleP})`,
                  transformOrigin: "top",
                }}
              />
              {!isLast && t >= figEnter - 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: colLeft + pad,
                    top: rowTop,
                    transformOrigin: "0 0",
                    transform: `scale(${S})`,
                  }}
                >
                  <Figure
                    stat={stat}
                    t={t}
                    enter={figEnter}
                    exit={1e9}
                    size={F}
                    u={u}
                    c={c}
                    accent={accent}
                  />
                </div>
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: colLeft + pad,
                  top: rowTop + F * S * 1.12 + 14 * u,
                }}
              >
                <Caption
                  stat={stat}
                  t={t}
                  enter={M + 16 + i * 4}
                  exit={1e9}
                  labelSize={22 * u}
                  detailSize={15 * u}
                  c={c}
                />
              </div>
            </div>
          );
        })}

        {/* index ticker */}
        <div
          style={{
            position: "absolute",
            left: L,
            bottom: 48 * u,
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontFamily: mono,
            fontWeight: 400,
            fontSize: idxSize,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            color: c.muted,
            opacity:
              interpolate(t, [2, 12], [0, 1], CLAMP) *
              interpolate(t, [M, M + 10], [1, 0], CLAMP),
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-block",
              overflow: "hidden",
              height: idxSize * 1.15,
              width: idxSize * 1.4,
              color: c.fg,
            }}
          >
            {stats.map((_, i) => (
              <span
                key={i}
                style={{ position: "absolute", left: 0, top: idxSize * 0.06 }}
              >
                <SlotText
                  text={String(i + 1).padStart(2, "0")}
                  t={t}
                  enter={i === 0 ? 2 : inAt(i)}
                  exit={i === n - 1 ? 1e9 : inAt(i + 1) - 5}
                  stagger={1}
                  u={u * 0.3}
                />
              </span>
            ))}
          </span>
          <span
            style={{
              width: 18 * u,
              height: Math.max(1, u),
              background: c.hair,
            }}
          />
          <span>{String(n).padStart(2, "0")}</span>
        </div>
      </AbsoluteFill>

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
