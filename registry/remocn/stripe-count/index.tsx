"use client";

import { loadFont as loadFamiljen } from "@remotion/google-fonts/FamiljenGrotesk";
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

const familjen = loadFamiljen("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface StripeCountProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  stripes?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const ORANGE = "#FF4F00";

const THEMES = {
  dark: { field: "#1E1E1E", ink: "#FFE7D6", inkOnAccent: "#1E1E1E" },
  light: { field: "#FFE7D6", ink: "#1E1E1E", inkOnAccent: "#1E1E1E" },
} as const;

const TRACK = -0.03;
const RISE_AT = 0;
const RISE_LEN = 16;
const PAINT_AT = 16;
const PAINT_END = 76;
const LABEL_AT = 66;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  figH: number;
  label: number;
  width: (s: string) => number;
}

function format(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function measureAll(label: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("stripe-count: no 2d context");
  const fam = `"${familjen.fontFamily}"`;
  ctx.font = `500 100px ${fam}`;
  const figH = ctx.measureText("0123456789").actualBoundingBoxAscent / 100;
  const cache = new Map<string, number>();
  const width = (raw: string) => {
    const s = raw.replace(/[0-9]/g, "0");
    const hit = cache.get(s);
    if (hit !== undefined) return hit;
    ctx.font = `500 100px ${fam}`;
    const w = ctx.measureText(s).width / 100 + TRACK * Array.from(s).length;
    cache.set(s, w);
    return w;
  };
  ctx.font = `400 100px ${fam}`;
  const labelW = label ? ctx.measureText(label).width / 100 : 0;
  return { figH, label: labelW, width };
}

function useMetrics(label: string) {
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("stripe-count: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      familjen.waitUntilDone(),
      document.fonts.load(`500 100px "${familjen.fontFamily}"`),
      document.fonts.load(`400 100px "${familjen.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key: label, m: measureAll(label) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [label, handle]);
  return state && state.key === label ? state.m : null;
}

export function StripeCount({
  value = 184,
  from = 0,
  prefix = "",
  suffix = "",
  label = "scenes that take your brand colour from one prop",
  stripes = 12,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: StripeCountProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const m = useMetrics(label);

  const transparent = background === "transparent";
  const hot = accent ?? ORANGE;
  const field = transparent ? c.field : (background ?? c.field);

  if (!m) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: transparent ? "transparent" : field,
        }}
      />
    );
  }

  const portrait = H > W * 1.1;
  const s = portrait ? W / 1080 : Math.min(W / 1280, H / 720);
  const pad = Math.min(W, H) * 0.075;

  const paint = (time: number) =>
    interpolate(time, [PAINT_AT, PAINT_END], [0, 1], {
      ...CLAMP,
      easing: EASE_IN_OUT,
    });
  const p = paint(t);
  const text = `${prefix}${format(from + (value - from) * paint(t))}${suffix}`;
  const finalText = `${prefix}${format(value)}${suffix}`;
  const wFinal = m.width(finalText);

  const labelFs = (portrait ? 50 : 36) * s;
  const labelW = Math.min(W - pad * 2, labelFs * (portrait ? 16 : 22));
  const labelLines = Math.max(1, Math.ceil((m.label * labelFs) / labelW));
  const bandH = label
    ? pad * 2 + labelFs * 1.22 * labelLines
    : H * (portrait ? 0.2 : 0.24);

  const F = Math.min((W - pad * 2) / wFinal, (H - bandH - pad * 2) / m.figH);
  const figH = m.figH * F;
  const baseY = H - pad;
  const right = W - pad;

  const rise = interpolate(t, [RISE_AT, RISE_AT + RISE_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const top = baseY - figH - F * 0.06;
  const bottom = Math.min(H, baseY + F * 0.16);
  const bandClipH = bottom - top;
  const dy = (1 - rise) * bandClipH;

  const n = Math.max(4, Math.round(stripes));
  const pitch = (figH + F * 0.06) / n;
  const firstY = baseY - figH - F * 0.06;
  const rows = Math.ceil(bandClipH / pitch);
  const reach = 0.55;
  const minK = 0.07;

  const outline = 1 - interpolate(p, [0.78, 1], [0, 1], CLAMP);
  const strokeW = Math.max(1.2, F * 0.0065);
  const ink = transparent ? c.ink : c.inkOnAccent;

  const labelWords = label ? label.split(" ") : [];

  const textProps = {
    x: right,
    y: baseY + dy,
    textAnchor: "end" as const,
    fontFamily: familjen.fontFamily,
    fontWeight: 500,
    fontSize: F,
    letterSpacing: `${TRACK}em`,
    style: { fontVariantNumeric: "tabular-nums" as const },
  };

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : hot,
        overflow: "hidden",
      }}
    >
      {transparent ? null : (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: bandH,
            background: field,
          }}
        />
      )}

      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={`${uid}t`}>
            <text {...textProps}>{text}</text>
          </clipPath>
          <filter id={`${uid}o`} x="-5%" y="-20%" width="110%" height="140%">
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius={strokeW}
              result="in"
            />
            <feComposite in="SourceGraphic" in2="in" operator="out" />
          </filter>
          <clipPath id={`${uid}b`}>
            <rect x={0} y={top} width={W} height={bandClipH} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}b)`}>
          <g clipPath={`url(#${uid}t)`}>
            {Array.from({ length: rows }, (_, k) => {
              const local = interpolate(
                p * (1 + reach) - (k / Math.max(1, rows - 1)) * reach,
                [0, 1],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              const th = pitch * (minK + (1.04 - minK) * local);
              const yc = firstY + dy + pitch * (k + 0.5);
              return (
                <rect
                  key={`s${k}`}
                  x={0}
                  y={yc - th / 2}
                  width={W}
                  height={th}
                  style={{ fill: ink }}
                />
              );
            })}
          </g>
          {outline > 0 ? (
            <text
              {...textProps}
              filter={`url(#${uid}o)`}
              opacity={outline}
              style={{ ...textProps.style, fill: ink }}
            >
              {text}
            </text>
          ) : null}
        </g>
      </svg>

      {label ? (
        <div
          style={{
            position: "absolute",
            left: pad,
            width: labelW,
            top: pad - labelFs * 0.12,
            display: "flex",
            flexWrap: "wrap",
            columnGap: "0.26em",
            fontFamily: familjen.fontFamily,
            fontWeight: 400,
            fontSize: labelFs,
            lineHeight: 1.22,
            letterSpacing: "-0.01em",
            color: c.ink,
          }}
        >
          {labelWords.map((w, k) => {
            const q = interpolate(
              t,
              [LABEL_AT + k * 2, LABEL_AT + k * 2 + 16],
              [0, 1],
              { ...CLAMP, easing: EASE_OUT },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  opacity: q,
                  transform: `translateY(${((1 - q) * labelFs * 0.7).toFixed(2)}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
