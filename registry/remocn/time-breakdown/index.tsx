"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
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

// gradients.sh "aurora": soft curtains over a near-black base, plus the
// horizontal band. Lives only inside the freed-time panel.
const BRAND_TAIL = /remocn$/i;

const AURORA = ["#A0F0C8", "#3FB5A3", "#5147B6", "#B25C9C"];

function auroraFill(base: string, drift: number) {
  const n = AURORA.length;
  const curtains = AURORA.map((c, i) => {
    const x = 12 + (76 * i) / (n - 1) + Math.sin(drift + i * 1.9) * 4;
    const h = 150 + Math.cos(drift * 0.8 + i * 1.3) * 20;
    return `radial-gradient(34% ${h}% at ${x}% 100%, color-mix(in oklab, ${c} 80%, transparent) 0%, transparent 72%)`;
  });
  return [
    ...curtains,
    `linear-gradient(180deg, color-mix(in oklab, ${AURORA[0]} 18%, transparent) 0%, transparent 60%)`,
    base,
  ].join(", ");
}

export interface TimeSegment {
  label: string;
  value: number;
}

export interface TimeBreakdownProps {
  before?: TimeSegment[];
  after?: TimeSegment[];
  title?: string;
  beforeLabel?: string;
  afterLabel?: string;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_BEFORE: TimeSegment[] = [
  { label: "Editing", value: 62 },
  { label: "Rendering", value: 24 },
  { label: "Export", value: 14 },
];

const DEFAULT_AFTER: TimeSegment[] = [
  { label: "Editing", value: 6 },
  { label: "Rendering", value: 24 },
  { label: "Export", value: 14 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    faint: "#5A595F",
    hair: "rgba(255,255,255,0.3)",
    base: "#4A494F",
    tones: ["#77767C", "#4E4D53", "#36353A", "#2A292E"],
    stage: "rgba(255,255,255,0.05)",
    aurora: "#03050B",
    auroraEdge: "rgba(255,255,255,0.14)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#A3A099",
    hair: "rgba(18,18,20,0.32)",
    base: "#BDBBB4",
    tones: ["#8E8C86", "#B3B1AA", "#CFCDC6", "#DEDCD6"],
    stage: "rgba(255,255,255,0.7)",
    aurora: "#FFFFFF",
    auroraEdge: "rgba(18,18,20,0.10)",
    grain: 0.045,
  },
} as const;

const T_SPLIT = 22;
const T_SWITCH = 66;
const T_COLLAPSE = 74;
const COLLAPSE_LEN = 36;
const T_DONE = T_COLLAPSE + COLLAPSE_LEN;

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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Hero({
  text,
  t,
  size,
  color,
}: {
  text: string;
  t: number;
  size: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        whiteSpace: "pre",
        fontFamily: sans,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.045em",
        fontVariantNumeric: "tabular-nums",
        color,
      }}
    >
      {Array.from(text).map((ch, i) => {
        const p = interpolate(t, [i * 3, i * 3 + 22], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: size * 0.06,
              marginBottom: -size * 0.06,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 0.7 * size}px)`,
                opacity: interpolate(p, [0, 0.4], [0, 1], CLAMP),
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function TimeBreakdown({
  before = DEFAULT_BEFORE,
  after = DEFAULT_AFTER,
  title = "Where the time goes",
  beforeLabel = "Before",
  afterLabel = "With remocn",
  caption = "less time per video",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: TimeBreakdownProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const th = THEMES[theme];
  const clipId = `h${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const segs = before.slice(0, 5).map((b, i) => ({
    label: b.label,
    from: Math.max(0, b.value),
    to: Math.max(0, after[i]?.value ?? b.value),
  }));
  const totalBefore = segs.reduce((s, x) => s + x.from, 0) || 1;
  const totalAfter = segs.reduce((s, x) => s + x.to, 0);
  const saved = Math.max(0, Math.round((1 - totalAfter / totalBefore) * 100));
  const focus = segs.reduce(
    (best, s, i) =>
      s.from - s.to > segs[best].from - segs[best].to ? i : best,
    0,
  );

  const margin = width * 0.085;
  const x0 = margin;
  const barW = width - margin * 2;
  const barH = 84 * u;
  const barTop = height * 0.52;
  const radius = 12 * u;

  const reveal = interpolate(t, [-4, 24], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const split = interpolate(t, [T_SPLIT, T_SPLIT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const gap = 6 * u * split;
  const sw = interpolate(t, [T_SWITCH, T_SWITCH + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const tint = interpolate(t, [T_COLLAPSE - 4, T_COLLAPSE + 6], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const c = interpolate(t, [T_COLLAPSE, T_DONE], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const usable = barW - gap * (segs.length - 1);
  const unitW = usable / totalBefore;
  const geom: { x: number; w: number; v: number }[] = [];
  let cursor = x0;
  segs.forEach((s) => {
    const v = s.from + (s.to - s.from) * c;
    const w = v * unitW;
    geom.push({ x: cursor, w, v });
    cursor += w + gap;
  });
  const usedEnd = cursor - gap;
  const freedX = usedEnd + gap;
  const freedW = Math.max(0, x0 + barW - freedX);
  const freedIn = interpolate(t, [T_COLLAPSE + 6, T_COLLAPSE + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const finalFreedX =
    x0 + segs.reduce((s, x) => s + x.to * unitW, 0) + 6 * u * segs.length;

  const labelEnds: number[] = [];
  const labelX = geom.map((g, i) => {
    const min = i > 0 ? labelEnds[i - 1] + 18 * u : g.x;
    const x = Math.max(g.x, min);
    // Schibsted Grotesk advances: ~0.53em lowercase at 18px, ~0.6em digits at 42px.
    const nameW = segs[i].label.length * 0.53 * 18 * u;
    const pctW =
      (String(Math.round((g.v / totalBefore) * 100)).length + 1) * 0.6 * 42 * u;
    labelEnds.push(x + Math.max(nameW, pctW));
    return x;
  });

  const heroT = t - (T_DONE - 4);
  const heroSize = Math.min(160 * u, width * 0.125);
  const capIn = interpolate(heroT, [12, 32], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const bracketIn = interpolate(heroT, [-6, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const titleIn = interpolate(t, [-6, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = interpolate(t, [0, T_DONE + 60], [1.025, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const bracketY = barTop - 22 * u;
  const auroraDrift = interpolate(
    t,
    [T_COLLAPSE, T_DONE + 80],
    [0, 1.6],
    CLAMP,
  );
  const tick = 8 * u;

  return (
    <AbsoluteFill style={{ background: th.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 70% at 40% 45%, ${th.stage}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${drift})`, transformOrigin: "50% 55%" }}
      >
        <div
          style={{
            position: "absolute",
            left: x0,
            top: height * 0.2,
            fontFamily: sans,
            fontSize: 22 * u,
            fontWeight: 500,
            color: th.muted,
            whiteSpace: "nowrap",
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 8 * u}px)`,
          }}
        >
          {title}
        </div>

        <div
          style={{
            position: "absolute",
            left: x0,
            top: barTop - 70 * u,
            width: barW * 0.45,
            height: 40 * u,
            opacity: titleIn,
          }}
        >
          {[beforeLabel, afterLabel].map((lbl, i) => {
            const a =
              i === 0
                ? interpolate(sw, [0, 0.6], [1, 0], CLAMP)
                : interpolate(sw, [0.35, 1], [0, 1], CLAMP);
            const y = i === 0 ? -sw * 14 * u : (1 - sw) * 14 * u;
            return (
              <div
                key={lbl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: 40 * u,
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  opacity: a,
                  transform: `translateY(${y}px)`,
                  filter: a < 0.98 ? `blur(${(1 - a) * 4 * u}px)` : undefined,
                  fontFamily: sans,
                  fontSize: 30 * u,
                  fontWeight: 400,
                  letterSpacing: "-0.025em",
                  color: th.fg,
                  whiteSpace: "nowrap",
                }}
              >
                {i === 1 && BRAND_TAIL.test(lbl) ? (
                  <>
                    {lbl.replace(BRAND_TAIL, "").trim()}
                    <span style={{ marginLeft: 2 * u, marginTop: 2 * u }}>
                      <RemocnLogo fontSize={31 * u} color={th.fg} />
                    </span>
                  </>
                ) : (
                  <>
                    {i === 1 ? (
                      <span
                        style={{
                          width: 10 * u,
                          height: 10 * u,
                          borderRadius: "50%",
                          background: accent,
                        }}
                      />
                    ) : null}
                    {lbl}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {freedW > 1 ? (
          <div
            style={{
              position: "absolute",
              left: freedX,
              top: barTop,
              width: freedW,
              height: barH,
              borderRadius: radius,
              overflow: "hidden",
              opacity: freedIn,
              background: auroraFill(th.aurora, auroraDrift),
              boxShadow: `inset 0 0 0 ${Math.max(1, u)}px ${th.auroraEdge}`,
            }}
          />
        ) : null}

        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <clipPath id={`${clipId}c`}>
              <rect
                x={x0}
                y={barTop - 4 * u}
                width={barW * reveal}
                height={barH + 8 * u}
              />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId}c)`}>
            {geom.map((g, i) => {
              const tone = th.tones[Math.min(i, th.tones.length - 1)];
              const split3 = interpolateColors(split, [0, 1], [th.base, tone]);
              const fill =
                i === focus
                  ? interpolateColors(tint, [0, 1], [split3, accent])
                  : split3;
              const first = i === 0;
              const last = i === geom.length - 1;
              const rl = first ? radius : radius * split * 0.35;
              const rr = last ? radius : radius * split * 0.35;
              const w = Math.max(g.w, 2 * u);
              const rlc = Math.min(rl, w / 2);
              const rrc = Math.min(rr, w / 2);
              const x = g.x;
              const y = barTop;
              const h = barH;
              const d = [
                `M ${x + rlc} ${y}`,
                `H ${x + w - rrc}`,
                `Q ${x + w} ${y} ${x + w} ${y + rrc}`,
                `V ${y + h - rrc}`,
                `Q ${x + w} ${y + h} ${x + w - rrc} ${y + h}`,
                `H ${x + rlc}`,
                `Q ${x} ${y + h} ${x} ${y + h - rlc}`,
                `V ${y + rlc}`,
                `Q ${x} ${y} ${x + rlc} ${y}`,
                "Z",
              ].join(" ");
              return <path key={segs[i].label} d={d} fill={fill} />;
            })}
          </g>

          {saved > 0 ? (
            <g
              opacity={bracketIn}
              stroke={th.hair}
              strokeWidth={Math.max(1, 1.25 * u)}
            >
              <line
                x1={finalFreedX}
                x2={finalFreedX + (x0 + barW - finalFreedX) * bracketIn}
                y1={bracketY}
                y2={bracketY}
              />
              <line
                x1={finalFreedX}
                x2={finalFreedX}
                y1={bracketY - tick}
                y2={bracketY + tick}
              />
              <line
                x1={x0 + barW}
                x2={x0 + barW}
                y1={bracketY - tick}
                y2={bracketY + tick}
                opacity={interpolate(bracketIn, [0.85, 1], [0, 1], CLAMP)}
              />
            </g>
          ) : null}
        </svg>

        {geom.map((g, i) => {
          const a = interpolate(
            t,
            [T_SPLIT + 6 + i * 4, T_SPLIT + 26 + i * 4],
            [0, 1],
            {
              ...CLAMP,
              easing: EASE_OUT,
            },
          );
          const countIn = interpolate(
            t,
            [T_SPLIT + 6 + i * 4, T_SPLIT + 34 + i * 4],
            [0, 1],
            { ...CLAMP, easing: Easing.bezier(0.22, 1, 0.36, 1) },
          );
          const isFocus = i === focus;
          const pct = Math.round((g.v / totalBefore) * 100 * countIn);
          return (
            <div
              key={segs[i].label}
              style={{
                position: "absolute",
                left: labelX[i],
                top: barTop + barH + 20 * u,
                display: "flex",
                flexDirection: "column",
                gap: 2 * u,
                opacity: a,
                transform: `translateY(${(1 - a) * 10 * u}px)`,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 18 * u,
                  fontWeight: 500,
                  color: isFocus
                    ? interpolateColors(tint, [0, 1], [th.muted, accent])
                    : th.muted,
                }}
              >
                {segs[i].label}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 42 * u,
                  fontWeight: 400,
                  letterSpacing: "-0.035em",
                  fontVariantNumeric: "tabular-nums",
                  color: th.fg,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}

        {saved > 0 ? (
          <div
            style={{
              position: "absolute",
              left: finalFreedX - heroSize * 0.04,
              top: bracketY - 22 * u,
              transform: "translateY(-100%)",
              display: "flex",
              alignItems: "baseline",
              gap: 18 * u,
            }}
          >
            <Hero text={`${saved}%`} t={heroT} size={heroSize} color={th.fg} />
            <span
              style={{
                fontFamily: sans,
                fontSize: 32 * u,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: th.muted,
                whiteSpace: "nowrap",
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 10 * u}px)`,
              }}
            >
              {caption}
            </span>
          </div>
        ) : null}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, ${th.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={th.grain} />
    </AbsoluteFill>
  );
}
