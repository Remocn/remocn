"use client";

import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const outfit = loadOutfit("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export interface ZeroStretchProps {
  value?: string;
  label?: string;
  caption?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0A0A0B", ink: "#F4F3F0", muted: "#8E8D94", grain: 0.05 },
  light: { bg: "#F5F4F0", ink: "#111113", muted: "#6E6C67", grain: 0.035 },
} as const;

const MESH = {
  bg: "#0a0d24",
  colors: ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"],
} as const;

const TRACK = -0.03;
const LABEL_TRACK = -0.015;
const LABEL_SIZE = 0.36;

const RISE_AT = 2;
const RISE_LEN = 18;
const RISE_GAP = 3;
const STRETCH_AT = 34;
const LABEL_AT = 50;
const CAPTION_AT = 72;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface ZeroShape {
  adv: number;
  cx: number;
  oTop: number;
  iTop: number;
  iBot: number;
  oBot: number;
  rx: number;
}

interface Metrics {
  zero: ZeroShape;
  adv: number[];
  label: number;
  caption: number;
  baseline: number;
}

const FONT_PX = 1000;

function scanZero(ctx: CanvasRenderingContext2D, glyph: string): ZeroShape {
  const W = 1600;
  const H = 1600;
  const x0 = 300;
  const base = 1250;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.letterSpacing = "0px";
  ctx.fillText(glyph, x0, base);
  const data = ctx.getImageData(0, 0, W, H).data;
  const ink = (x: number, y: number) => data[(y * W + x) * 4 + 3] > 127;
  let top = -1;
  let bot = -1;
  for (let y = 0; y < H && top < 0; y++)
    for (let x = 0; x < W; x += 2)
      if (ink(x, y)) {
        top = y;
        break;
      }
  for (let y = H - 1; y >= 0 && bot < 0; y--)
    for (let x = 0; x < W; x += 2)
      if (ink(x, y)) {
        bot = y;
        break;
      }
  const midY = Math.round((top + bot) / 2);
  const row: number[] = [];
  let prev = false;
  for (let x = 0; x < W; x++) {
    const v = ink(x, midY);
    if (v !== prev) row.push(x);
    prev = v;
  }
  const oL = row[0] ?? x0;
  const iL = row[1] ?? oL;
  const iR = row[2] ?? iL;
  const oR = row[3] ?? iR;
  const cx = Math.round((oL + oR) / 2);
  const col: number[] = [];
  prev = false;
  for (let y = 0; y < H; y++) {
    const v = ink(cx, y);
    if (v !== prev) col.push(y);
    prev = v;
  }
  const oT = col[0] ?? top;
  const iT = col[1] ?? oT;
  const iB = col[2] ?? iT;
  const oB = col[3] ?? bot;
  const em = (v: number) => v / FONT_PX;
  return {
    adv: em(ctx.measureText(glyph).width),
    cx: em(cx - x0),
    oTop: em(oT - base),
    iTop: em(iT - base),
    iBot: em(iB - base),
    oBot: em(oB - base),
    rx: em(iR - iL) / 2,
  };
}

function measure(
  chars: string[],
  zeroGlyph: string,
  label: string,
  caption: string,
): Metrics {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("zero-stretch: no 2d context");
  const fam = `"${outfit.fontFamily}"`;
  ctx.font = `500 ${FONT_PX}px ${fam}`;
  ctx.textBaseline = "alphabetic";
  const zero = scanZero(ctx, zeroGlyph);
  const fm = ctx.measureText("0");
  const asc = fm.fontBoundingBoxAscent / FONT_PX;
  const desc = fm.fontBoundingBoxDescent / FONT_PX;
  const adv = chars.map((ch) => ctx.measureText(ch).width / FONT_PX + TRACK);
  ctx.font = `400 ${FONT_PX}px ${fam}`;
  const lab =
    ctx.measureText(label).width / FONT_PX +
    LABEL_TRACK * Array.from(label).length;
  const cap = caption ? ctx.measureText(caption).width / FONT_PX : 0;
  return {
    zero: { ...zero, adv: zero.adv + TRACK },
    adv,
    label: lab,
    caption: cap,
    baseline: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(
  chars: string[],
  zeroGlyph: string,
  label: string,
  caption: string,
) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("zero-stretch: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      outfit.waitUntilDone(),
      document.fonts.load(`500 100px "${outfit.fontFamily}"`),
      document.fonts.load(`400 100px "${outfit.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, zeroGlyph, label, caption));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, zeroGlyph, label, caption, handle]);
  return metrics;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `zs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        mixBlendMode: "overlay",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={7}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function ZeroStretch({
  value = "200",
  label = "components",
  caption = "Ready to ship. Copy one in, own every frame.",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ZeroStretchProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];

  const chars = useMemo(() => Array.from(value), [value]);
  const zi = useMemo(() => {
    for (let i = chars.length - 1; i >= 0; i--)
      if (/[0oO]/.test(chars[i])) return i;
    return -1;
  }, [chars]);
  const zeroGlyph = zi >= 0 ? chars[zi] : "0";
  const m = useMetrics(chars, zeroGlyph, label, caption);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const z = m.zero;
  const innerH = z.iBot - z.iTop;
  const ry = innerH / 2;
  const labelEm = LABEL_SIZE * innerH;
  const gapEm = Math.max(0, m.label * labelEm + innerH * 0.62 - 2 * z.rx * 0.9);

  const glyphs = chars.map((ch, i) => ({
    ch,
    adv: m.adv[i],
    zero: i === zi,
    lead: 0,
  }));
  if (zi < 0) glyphs.push({ ch: zeroGlyph, adv: z.adv, zero: true, lead: 0.2 });

  const restEm = glyphs.reduce((s, g) => s + g.adv + g.lead, 0) - TRACK;
  const F = Math.min(H * 0.5, (W * 0.86) / (restEm + gapEm));

  const open = spring({
    frame: t - STRETCH_AT,
    fps,
    config: { damping: 14, stiffness: 70, mass: 1 },
  });
  const gap = gapEm * F * open;
  const totalW = restEm * F + gap;

  const midEm = (z.oTop + z.oBot) / 2;
  const centerY = caption ? H * 0.46 : H * 0.5;
  const baseY = centerY - midEm * F;
  const left0 = (W - totalW) / 2;

  const fillOn = interpolate(t, [STRETCH_AT + 2, STRETCH_AT + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const drift = t / 30;
  const blob = (bx: number, by: number, k: number) =>
    `${(bx + Math.sin(drift * 0.7 + k) * 6).toFixed(2)}% ${(by + Math.cos(drift * 0.55 + k * 1.3) * 8).toFixed(2)}%`;
  const meshColors = [
    "color-mix(in oklab, #ecdcf2 62%, transparent)",
    MESH.colors[1],
    accent,
    MESH.colors[3],
  ];
  const meshPos = [
    [16, 20],
    [84, 26],
    [72, 86],
    [22, 80],
  ];
  const field = [
    ...meshColors.map(
      (col, i) =>
        `radial-gradient(70% 120% at ${blob(meshPos[i][0], meshPos[i][1], i)}, ${col} 0%, transparent 68%)`,
    ),
    MESH.bg,
  ].join(", ");

  let x = left0;
  const lineTop = baseY - m.baseline * F;
  const maskTop = baseY + z.oTop * F - F * 0.06;
  const maskBot = baseY + z.oBot * F + F * 0.02;

  const pieces = glyphs.map((g, i) => {
    const gx = x + g.lead * F;
    x = gx + g.adv * F + (g.zero ? gap : 0);
    const riseAt = g.lead > 0 ? STRETCH_AT - 6 : RISE_AT + i * RISE_GAP;
    const p = interpolate(t, [riseAt, riseAt + RISE_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const dy = (1 - p) * (maskBot - maskTop) * 1.05;
    const glyphStyle: React.CSSProperties = {
      position: "absolute",
      top: lineTop - maskTop + dy,
      fontFamily: outfit.fontFamily,
      fontWeight: 500,
      fontSize: F,
      lineHeight: `${F}px`,
      letterSpacing: `${TRACK}em`,
      color: c.ink,
      whiteSpace: "pre",
    };
    if (!g.zero) {
      return (
        <div key={`${g.ch}-${i}`} style={{ ...glyphStyle, left: gx }}>
          {g.ch}
        </div>
      );
    }
    const cxPx = z.cx * F;
    const rail = (y0: number, y1: number, key: string) => (
      <div
        key={key}
        style={{
          position: "absolute",
          left: gx + cxPx - 1,
          width: gap + 2,
          top: baseY + y0 * F - maskTop + dy,
          height: (y1 - y0) * F,
          background: c.ink,
        }}
      />
    );
    const e = (z.iTop - z.oTop) * F * 0.4;
    const winL = gx + cxPx - z.rx * F - e;
    const winT = baseY + z.iTop * F - maskTop + dy - e;
    const winW = 2 * z.rx * F + gap + 2 * e;
    const winH = innerH * F + 2 * e;
    const rX = z.rx * F + e;
    const rY = ry * F + e;
    const labelSize = labelEm * F;
    const words = label.split(" ");
    return (
      <div key={`zero-${i}`}>
        <div
          style={{
            position: "absolute",
            left: winL,
            top: winT,
            width: winW,
            height: winH,
            clipPath: `inset(0 round ${rX}px / ${rY}px)`,
            background: field,
            opacity: fillOn,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: winL,
            top: winT,
            width: winW,
            height: winH,
            clipPath: `inset(0 round ${rX}px / ${rY}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: outfit.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            letterSpacing: `${LABEL_TRACK}em`,
            lineHeight: 1,
            color: "#F7F5FF",
            whiteSpace: "pre",
          }}
        >
          {words.map((w, k) => {
            const lp = interpolate(
              t,
              [LABEL_AT + k * 3, LABEL_AT + k * 3 + 16],
              [0, 1],
              {
                ...CLAMP,
                easing: EASE_OUT,
              },
            );
            return (
              <span
                key={`${w}-${k}`}
                style={{
                  display: "inline-block",
                  opacity: lp,
                  transform: `translateY(${((1 - lp) * labelSize * 0.7).toFixed(2)}px)`,
                }}
              >
                {w}
                {k < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: gx,
            top: 0,
            width: cxPx + 0.5,
            height: maskBot - maskTop,
            overflow: "hidden",
          }}
        >
          <div style={{ ...glyphStyle, left: 0 }}>{g.ch}</div>
        </div>
        <div
          style={{
            position: "absolute",
            left: gx + cxPx + gap - 0.5,
            top: 0,
            width: g.adv * F - cxPx + F * 0.1,
            height: maskBot - maskTop,
            overflow: "hidden",
          }}
        >
          <div style={{ ...glyphStyle, left: -cxPx + 0.5 }}>{g.ch}</div>
        </div>
        {gap > 0.5 ? rail(z.oTop, z.iTop, "top") : null}
        {gap > 0.5 ? rail(z.iBot, z.oBot, "bot") : null}
      </div>
    );
  });

  const capSize = Math.min(
    Math.max(F * 0.1, H * 0.034),
    H * 0.046,
    (W * 0.86) / Math.max(0.1, m.caption),
  );
  const capP = interpolate(t, [CAPTION_AT, CAPTION_AT + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: maskTop,
          height: maskBot - maskTop,
          overflow: "hidden",
        }}
      >
        {pieces}
      </div>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: maskBot + Math.max(F * 0.16, H * 0.05),
            textAlign: "center",
            fontFamily: outfit.fontFamily,
            fontWeight: 300,
            fontSize: capSize,
            letterSpacing: "-0.005em",
            color: c.muted,
            opacity: capP,
            transform: `translateY(${((1 - capP) * capSize * 0.6).toFixed(2)}px)`,
          }}
        >
          {caption}
        </div>
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
