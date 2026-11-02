"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadSans("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface WaveformTitleProps {
  title?: string;
  /** How many trailing words are set in the italic serif accent. */
  accentWords?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "aurora" palette. Dark uses all four stops; light drops the
// pale mint so the line stays legible on the off-white stage.
const AURORA = ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"] as const;

const THEMES = {
  dark: {
    bg: "#03050b",
    fg: "#F3F2EF",
    wash: "rgba(255,255,255,0.04)",
    ghost: [0.22, 0.09],
    line: AURORA,
    haze: 0.42,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    wash: "rgba(255,255,255,0.75)",
    ghost: [0.2, 0.08],
    line: ["#2f9f8e", "#3fb5a3", "#5147b6", "#b25c9c"],
    haze: 0.22,
    grain: 0.045,
  },
} as const;

const OPEN = [0, 16] as const;
const SWEEP = [40, 82] as const;
const SETTLE = [82, 104] as const;
const RISE = 84;
const STAGGER = 4;
const SAMPLES = 360;

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

const SYLLABLES = Array.from({ length: 16 }, (_, i) => ({
  at: i * 0.09 + hash(i + 3) * 0.04,
  width: 0.018 + hash(i + 17) * 0.03,
  peak: hash(i + 41) < 0.12 ? 0 : 0.3 + hash(i + 59) * 0.7,
}));

function envelope(s: number, sec: number) {
  let e = 0.025;
  for (const syl of SYLLABLES) {
    const c = ((((syl.at - sec * 0.2) % 1.44) + 1.44) % 1.44) - 0.2;
    const d = (s - c) / syl.width;
    e = Math.max(e, syl.peak * Math.exp(-d * d * 0.8));
  }
  return e;
}

function wave(s: number, sec: number) {
  const carrier =
    0.5 * Math.sin(s * 270 - sec * 14 + 0.7) +
    0.3 * Math.sin(s * 433 + sec * 9 + 2.3) +
    0.2 * Math.sin(s * 88 - sec * 4.4 + 4.1);
  const env = envelope(s, sec);
  return env * carrier * (0.75 + 0.25 * Math.sin(s * 23 + sec * 2));
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function WaveformTitle({
  title = "Your voice, captioned",
  accentWords = 1,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: WaveformTitleProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = height / 720;
  const p = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const x0 = width * 0.1;
  const x1 = width * 0.9;
  const span = x1 - x0;
  const lineY = height * 0.6;

  const open = interpolate(t, OPEN, [0, 1], { ...CLAMP, easing: EASE_OUT });
  const sweep = interpolate(t, SWEEP, [0, 1], { ...CLAMP, easing: EASE_IO });
  const settle = interpolate(t, SETTLE, [0, 1], { ...CLAMP, easing: EASE_IO });
  const head = lerp(-0.04, 1.04, sweep);
  const centreY = lerp(height * 0.5, lineY, sweep);
  const amp = 150 * u * lerp(0.55, 1, open) * (1 - 0.35 * sweep);
  const reach = lerp(0.28, 1, open);

  const shape = (lag: number) => {
    const sec = Math.max(0, t - lag) / fps;
    const pts: string[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const s = i / SAMPLES;
      const fromMid = Math.abs(s - 0.5) * 2;
      if (fromMid > reach) continue;
      const taper =
        smooth(0, 0.1, s) *
        smooth(1, 0.9, s) *
        smooth(reach, reach - 0.12, fromMid);
      const calm = smooth(head - 0.02, head + 0.16, s);
      const y = centreY - amp * taper * calm * wave(s, sec);
      pts.push(
        `${pts.length ? "L" : "M"}${(x0 + s * span).toFixed(2)} ${y.toFixed(2)}`,
      );
    }
    return pts.join(" ");
  };

  const headX = x0 + Math.min(1, Math.max(0, head)) * span;
  const headO =
    interpolate(t, [SWEEP[0], SWEEP[0] + 6], [0, 1], CLAMP) *
    interpolate(t, [SWEEP[1] - 6, SWEEP[1] + 2], [1, 0], CLAMP);
  const handoff = t >= SETTLE[0];
  const words = title.split(" ");
  const serifFrom =
    words.length - Math.max(0, Math.min(accentWords, words.length));
  const fontSize = Math.max(
    92 * u,
    Math.min(112 * u, (span * 0.98) / (title.length * 0.5)),
  );
  const stroke = 4 * u;
  const lineGrad = `linear-gradient(90deg, ${p.line.join(", ")})`;
  const drift = Math.sin((t / fps) * 0.6) * 3;
  const hazeIn = interpolate(t, [0, 30], [0.35, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${width * 0.5}px ${height * 0.42}px at ${handoff ? width / 2 : headX}px ${centreY}px, ${p.wash}, transparent 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          opacity: p.haze * hazeIn,
          WebkitMaskImage: `linear-gradient(180deg, #000 ${(lineY / height) * 100 - 2}%, transparent ${(lineY / height) * 100 + 12}%)`,
          maskImage: `linear-gradient(180deg, #000 ${(lineY / height) * 100 - 2}%, transparent ${(lineY / height) * 100 + 12}%)`,
          background: [
            ...p.line.map(
              (c, i) =>
                `radial-gradient(30% 42% at ${15 + (70 * i) / (p.line.length - 1) + drift * (i % 2 ? 1 : -1)}% ${(lineY / height) * 100 - 12 + (i % 2) * 5}%, color-mix(in oklab, ${c} 75%, transparent) 0%, transparent 70%)`,
            ),
            `linear-gradient(180deg, transparent 18%, color-mix(in oklab, ${p.line[1]} 30%, transparent) ${(lineY / height) * 100 - 2}%, transparent ${(lineY / height) * 100 + 8}%)`,
          ].join(", "),
        }}
      />

      {!handoff && (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${id}s`}
              gradientUnits="userSpaceOnUse"
              x1={x0}
              y1={0}
              x2={x1}
              y2={0}
            >
              {p.line.map((c, i) => (
                <stop
                  key={c + i}
                  offset={i / (p.line.length - 1)}
                  stopColor={c}
                />
              ))}
            </linearGradient>
          </defs>
          <path
            d={shape(6)}
            fill="none"
            stroke={p.fg}
            strokeWidth={1.2 * u}
            opacity={p.ghost[1] * (1 - sweep)}
          />
          <path
            d={shape(3)}
            fill="none"
            stroke={p.fg}
            strokeWidth={1.3 * u}
            opacity={p.ghost[0] * (1 - sweep)}
          />
          <path
            d={shape(0)}
            fill="none"
            stroke={`url(#${id}s)`}
            strokeWidth={lerp(2 * u, stroke, sweep)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={headX}
            cy={centreY}
            r={4.5 * u}
            fill={accent}
            opacity={headO}
          />
        </svg>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: lineY,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              overflow: "hidden",
              paddingBottom: 30 * u,
              paddingTop: 10 * u,
              maxWidth: span,
            }}
          >
            <div
              style={{
                fontFamily: display,
                fontWeight: 500,
                fontSize,
                lineHeight: 1,
                letterSpacing: "-0.035em",
                color: p.fg,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {words.map((w, i) => {
                const k = interpolate(
                  t,
                  [RISE + i * STAGGER, RISE + i * STAGGER + 22],
                  [0, 1],
                  {
                    ...CLAMP,
                    easing: EASE_OUT,
                  },
                );
                const isSerif = i >= serifFrom;
                return (
                  <span
                    key={`${w}-${i}`}
                    style={{
                      display: "inline-block",
                      marginRight: i < words.length - 1 ? "0.22em" : 0,
                      transform: `translateY(${(1 - k) * fontSize * 1.6}px)`,
                      ...(isSerif
                        ? {
                            fontFamily: serif,
                            fontStyle: "italic",
                            fontWeight: 400,
                            fontSize: "1.12em",
                            letterSpacing: "-0.02em",
                            lineHeight: 0.9,
                          }
                        : null),
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
          {handoff && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: -stroke / 2,
                height: stroke,
                borderRadius: stroke,
                backgroundImage: lineGrad,
                width: `calc(${settle * 100}% + ${(1 - settle) * span}px)`,
                transform: "translateX(-50%)",
              }}
            />
          )}
        </div>
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, ${p.bg} 100%)`,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
