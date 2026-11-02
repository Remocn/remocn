"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface UptimeStripProps {
  value?: string;
  days?: number;
  incidents?: number[];
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

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
    soft: "#6A696F",
    track: "rgba(255,255,255,0.09)",
    bar: "#4A494F",
    flash: "#E9E8E4",
    dim: "#3A393F",
    grain: 0.06,
    // gradients.sh "aurora": bg #03050b, [#a0f0c8, #3fb5a3, #5147b6, #b25c9c]
    aurora: ["#5147b6", "#3fb5a3", "#a0f0c8"],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    soft: "#9A9893",
    track: "rgba(18,18,20,0.09)",
    bar: "#C4C2BC",
    flash: "#2A2927",
    dim: "#D9D7D1",
    grain: 0.045,
    aurora: ["#5147b6", "#2f9c8c", "#3fb5a3"],
  },
} as const;

const SWEEP_START = 6;
const SWEEP_LEN = 34;
const GROW = 12;
const SETTLE = 54;
const SETTLE_SPREAD = 16;
const LAND = 60;

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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function RisingText({
  text,
  t,
  start,
  stagger,
  fontSize,
  color,
  family,
  italic = false,
}: {
  text: string;
  t: number;
  start: number;
  stagger: number;
  fontSize: number;
  color: string;
  family: string;
  italic?: boolean;
}) {
  const side = fontSize * (italic ? 0.12 : 0.06);
  return (
    <span
      style={{
        display: "inline-flex",
        color,
        fontFamily: family,
        fontStyle: italic ? "italic" : "normal",
      }}
    >
      {Array.from(text).map((ch, i) => {
        const k = interpolate(
          t,
          [start + i * stagger, start + i * stagger + 22],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: fontSize * 0.08,
              marginBottom: -fontSize * 0.08,
              paddingLeft: side,
              paddingRight: side,
              marginLeft: -side,
              marginRight: -side,
            }}
          >
            <span
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                transform: `translateY(${(1 - k) * 0.7 * fontSize}px)`,
                opacity: interpolate(k, [0, 0.45], [0, 1], CLAMP),
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function UptimeStrip({
  value = "99.99%",
  days = 90,
  incidents = [27, 63],
  label = "uptime",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: UptimeStripProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const n = Math.max(7, Math.min(180, Math.round(days)));
  const down = new Set(incidents.map((i) => Math.round(i)));

  const stripW = width * 0.72;
  const pitch = stripW / n;
  const barW = Math.max(2 * u, pitch * 0.56);
  const barH = 74 * u;
  const left = (width - stripW) / 2 + (pitch - barW) / 2;

  const glide = interpolate(t, [SETTLE - 6, SETTLE + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stripY = height / 2 + glide * 64 * u;
  const push = interpolate(t, [0, 130], [0.965, 1.005], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const stage = interpolate(t, [0, 8], [0.45, 1], CLAMP);

  const gid = `up${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drift = interpolate(t, [SETTLE, 130], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const frontAt = (i: number) =>
    SWEEP_START + (n > 1 ? (i / (n - 1)) * SWEEP_LEN : 0);
  const settleAt = (i: number) =>
    SETTLE + (n > 1 ? (i / (n - 1)) * SETTLE_SPREAD : 0);

  const front = interpolate(
    t,
    [SWEEP_START, SWEEP_START + SWEEP_LEN],
    [0, 1],
    CLAMP,
  );
  const frontX = left + front * (n - 1) * pitch + barW / 2;
  const scanO =
    interpolate(t, [SWEEP_START, SWEEP_START + 4], [0, 1], CLAMP) *
    interpolate(
      t,
      [SWEEP_START + SWEEP_LEN, SWEEP_START + SWEEP_LEN + 10],
      [1, 0],
      CLAMP,
    );

  const headSize = 132 * u;
  const headTop = stripY - barH / 2 - 44 * u - headSize * 0.92;
  const valueChars = Array.from(value).length;
  const wordStart = LAND + valueChars * 2 + 4;

  const capA = interpolate(t, [4, 18], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const capB = interpolate(
    t,
    [SWEEP_START + SWEEP_LEN - 4, SWEEP_START + SWEEP_LEN + 10],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: "50% 55%",
          opacity: stage,
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
              id={gid}
              gradientUnits="userSpaceOnUse"
              x1={left - stripW * 0.06 * drift}
              y1={stripY + barH}
              x2={left + stripW * (1.02 - 0.04 * drift)}
              y2={stripY - barH}
            >
              <stop offset={0} stopColor={p.aurora[0]} />
              <stop offset={0.55} stopColor={p.aurora[1]} />
              <stop offset={1} stopColor={p.aurora[2]} />
            </linearGradient>
          </defs>
          {Array.from({ length: n }, (_, i) => {
            const x = left + i * pitch;
            const isDown = down.has(i);
            const g = interpolate(t, [frontAt(i), frontAt(i) + GROW], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const flash = interpolate(
              t,
              [frontAt(i), frontAt(i) + 2, frontAt(i) + 16],
              [0, 1, 0],
              CLAMP,
            );
            const s = interpolate(t, [settleAt(i), settleAt(i) + 10], [0, 1], {
              ...CLAMP,
              easing: EASE_IO,
            });
            const bump = Math.sin(Math.PI * s) * 0.09;
            const full = isDown ? barH * 0.4 : barH;
            const h = (barW + (full - barW) * g) * (1 + bump);
            const base = isDown ? p.dim : p.bar;
            const neutral = interpolateColors(
              flash,
              [0, 1],
              [base, isDown ? p.soft : p.flash],
            );
            const opacity = isDown ? 1 - 0.35 * s : 1;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={stripY - barH / 2}
                  width={barW}
                  height={barH}
                  rx={barW / 2}
                  fill={p.track}
                  opacity={1 - g}
                />
                <rect
                  x={x}
                  y={stripY - h / 2}
                  width={barW}
                  height={h}
                  rx={barW / 2}
                  fill={neutral}
                  opacity={g > 0 ? opacity : 0}
                />
                {!isDown && s > 0 ? (
                  <rect
                    x={x}
                    y={stripY - h / 2}
                    width={barW}
                    height={h}
                    rx={barW / 2}
                    fill={`url(#${gid})`}
                    opacity={s}
                  />
                ) : null}
              </g>
            );
          })}
          <line
            x1={frontX + pitch * 0.9}
            y1={stripY - barH * 0.78}
            x2={frontX + pitch * 0.9}
            y2={stripY + barH * 0.78}
            stroke={accent}
            strokeWidth={Math.max(1, 1.5 * u)}
            opacity={scanO * 0.8}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: headTop,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: headSize * 0.2,
            fontWeight: 400,
            fontSize: headSize,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <RisingText
            text={value}
            t={t}
            start={LAND}
            stagger={2}
            fontSize={headSize}
            color={p.fg}
            family={sans}
          />
          <span
            style={{ fontSize: headSize * 1.12, letterSpacing: "-0.015em" }}
          >
            <RisingText
              text={label}
              t={t}
              start={wordStart}
              stagger={1}
              fontSize={headSize * 1.12}
              color={p.muted}
              family={serif}
              italic
            />
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: (width - stripW) / 2 + (pitch - barW) / 2,
            width: stripW - (pitch - barW),
            top: stripY + barH / 2 + 20 * u,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 17 * u,
            letterSpacing: "0",
            color: p.muted,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              opacity: capA,
              transform: `translateY(${(1 - capA) * 8 * u}px)`,
            }}
          >
            {n} days ago
          </span>
          <span
            style={{
              opacity: capB,
              transform: `translateY(${(1 - capB) * 8 * u}px)`,
            }}
          >
            Today
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 62%, ${p.bg} 100%)`,
          opacity: 0.6,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
