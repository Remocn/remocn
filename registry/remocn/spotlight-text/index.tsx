"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const geist = loadGeist("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface SpotlightTextProps {
  /** The headline the light travels across. One line. */
  title?: string;
  /** Tiny mono label above the headline's left edge. Empty to hide. */
  eyebrow?: string;
  /** Faint tint at the rim of the spotlight, and the eyebrow marker. */
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0A",
    dim: "#2E2E31",
    lit: "#FFFFFF",
    muted: "#6E6E73",
    /** How much accent goes into the spotlight's rim. */
    tint: 0.2,
    washAlpha: 0.05,
  },
  light: {
    bg: "#FAFAF9",
    dim: "#DADAD7",
    lit: "#0A0A0A",
    muted: "#8E8E92",
    tint: 0.22,
    washAlpha: 0.035,
  },
} as const;

const MAX_SIZE = 128;
const FILL = 0.84; // headline width as a share of the frame
const TRACK = -0.045;
const LINE = 1.2;
const PAD_Y = 0.1; // em, so descenders stay inside the clip box

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GLIDE = Easing.bezier(0.45, 0, 0.4, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const T = {
  inStart: 0,
  inDur: 26,
  glideStart: 14,
  glideEnd: 92,
  widenEnd: 132,
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6),
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number, alpha = 1) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const ch = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgba(${ch[0]},${ch[1]},${ch[2]},${alpha})`;
}

/** Headline advance width in em at the display weight. */
function useTitleWidth(title: string) {
  const [width, setWidth] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("spotlight-text: measuring"));
  const released = useRef(false);

  useEffect(() => {
    let live = true;
    const font = `500 100px "${geist.fontFamily}"`;
    Promise.all([geist.waitUntilDone(), document.fonts.load(font)])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const ctx = document.createElement("canvas").getContext("2d");
        let w = [...title].length * 0.5;
        if (ctx) {
          ctx.font = font;
          w = ctx.measureText(title).width / 100 + TRACK * [...title].length;
        }
        setWidth(w);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [title, handle]);

  return width ?? [...title].length * 0.5;
}

export function SpotlightText({
  title = "Launch videos, in code.",
  eyebrow = "remocn 2.0",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: SpotlightTextProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const s = Math.min(W / 1280, H / 720);

  const em = useTitleWidth(title);
  const fontSize = Math.min(MAX_SIZE * s, (W * FILL) / em);
  // Clip box of the lit layer, in px. Tracking adds trailing space after the
  // last glyph; trim it so the box hugs the ink.
  const boxW = em * fontSize - TRACK * fontSize;
  const boxH = (LINE + PAD_Y * 2) * fontSize;
  const left = (W - boxW) / 2;
  const top = H / 2 - boxH / 2 + 0.04 * H;

  // Entrance of the dim line.
  const enter = interpolate(frame, [T.inStart, T.inStart + T.inDur], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // Spotlight: glide left → right, then ease back to centre while widening.
  const r0 = 1.25 * fontSize;
  const glide = interpolate(frame, [T.glideStart, T.glideEnd], [0, 1], {
    ...CLAMP,
    easing: EASE_GLIDE,
  });
  const widen = interpolate(frame, [T.glideEnd - 6, T.widenEnd], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const glideX = -0.14 * boxW + glide * 0.98 * boxW;
  const x = glideX + (0.5 * boxW - glideX) * widen;
  // A gentle vertical drift while it travels, gone once it widens.
  const drift = Math.sin(glide * Math.PI * 1.5) * 0.14 * fontSize * (1 - widen);
  const y = boxH / 2 + drift;
  const radius = r0 + (0.95 * boxW - r0) * widen;
  const core = 0.3 + (0.66 - 0.3) * widen;
  const rim = core + (1 - core) * 0.5;
  const lightIn = interpolate(
    frame,
    [T.glideStart - 4, T.glideStart + 14],
    [0, 1],
    CLAMP,
  );

  const tintRim = mix(c.lit, accent, c.tint, 0.85);
  const gradient = `radial-gradient(circle ${radius}px at ${x}px ${y}px, ${c.lit} 0%, ${c.lit} ${core * 100}%, ${tintRim} ${rim * 100}%, ${mix(c.lit, accent, c.tint, 0)} 100%)`;

  // A barely-there wash on the stage under the light.
  const washR = radius * 2.2;
  const washA = c.washAlpha * lightIn * (1 - 0.5 * widen);
  const wash = `radial-gradient(circle ${washR}px at ${left + x}px ${top + y}px, ${mix(c.bg, accent, 0.5, washA)} 0%, ${mix(c.bg, accent, 0.5, 0)} 70%)`;

  const eyebrowIn = interpolate(frame, [8, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const textStyle: CSSProperties = {
    fontFamily: geist.fontFamily,
    fontWeight: 500,
    fontSize,
    letterSpacing: `${TRACK}em`,
    lineHeight: LINE,
    padding: `${PAD_Y}em 0`,
    whiteSpace: "pre",
    fontKerning: "normal",
    width: boxW,
    height: boxH,
    boxSizing: "border-box",
  };

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: wash }} />

      {eyebrow ? (
        <div
          style={{
            position: "absolute",
            left: left + 0.04 * fontSize,
            top: top - 30 * s,
            display: "flex",
            alignItems: "center",
            gap: 8 * s,
            fontFamily: geistMono.fontFamily,
            fontWeight: 400,
            fontSize: 13 * s,
            letterSpacing: "0.02em",
            lineHeight: 1,
            color: c.muted,
            opacity: eyebrowIn,
            filter: `blur(${(1 - eyebrowIn) * 8 * s}px)`,
            transform: `translateY(${(1 - eyebrowIn) * 10 * s}px)`,
          }}
        >
          <span
            style={{
              width: 5 * s,
              height: 5 * s,
              background: accent,
              display: "block",
            }}
          />
          {eyebrow}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left,
          top,
          width: boxW,
          height: boxH,
          opacity: enter,
          filter: `blur(${(1 - enter) * 10 * s}px)`,
          transform: `translateY(${(1 - enter) * 18 * s}px)`,
        }}
      >
        <div
          style={{ ...textStyle, position: "absolute", inset: 0, color: c.dim }}
        >
          {title}
        </div>
        <div
          style={{
            ...textStyle,
            position: "absolute",
            inset: 0,
            color: "transparent",
            backgroundImage: gradient,
            backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            opacity: lightIn,
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
}
