"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont } from "@remotion/google-fonts/Onest";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface UpCloseProps {
  close?: string;
  wide?: string;
  src?: string;
  aspect?: number;
  focus?: { x: number; y: number };
  zoom?: number;
  accent?: string;
  background?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    preset: "film-blue" as GshPresetId,
    bg: "#03070f",
    ink: "#F3F6FA",
    dim: "rgba(243,246,250,0.42)",
    faint: "rgba(243,246,250,0.22)",
    accent: "#9CC8FF",
    well: "#0B1320",
    scrim: "linear-gradient(180deg, rgba(3,7,15,0) 40%, rgba(3,7,15,0.7) 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.09), 0 2px 6px rgba(0,0,0,0.35), 0 24px 60px -18px rgba(0,0,0,0.7), 0 60px 140px -50px rgba(0,0,0,0.85)",
  },
  light: {
    preset: "paper-crease" as GshPresetId,
    bg: "#eeece8",
    ink: "#12131A",
    dim: "rgba(18,19,26,0.42)",
    faint: "rgba(18,19,26,0.2)",
    accent: "#2742C9",
    well: "#D9DCE8",
    scrim:
      "linear-gradient(180deg, rgba(238,236,232,0) 40%, rgba(238,236,232,0.7) 100%)",
    shadow:
      "0 0 0 1px rgba(26,31,74,0.08), 0 2px 4px rgba(26,31,74,0.06), 0 22px 50px -18px rgba(26,31,74,0.24), 0 60px 120px -50px rgba(26,31,74,0.32)",
  },
} as const;

const WGHT = 400;
const TRACK = -0.03;
const PX = 200;
const LEADING = 1.12;

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Widths = (s: string) => number;

function buildWidths(_version: number): Widths {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `${WGHT} ${PX}px "${onest.fontFamily}"`;
      cache[s] = ctx.measureText(s).width / PX + TRACK * Array.from(s).length;
    }
    return cache[s];
  };
}

function useWidths() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("up-close: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      onest.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${onest.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle]);
  return useMemo(() => buildWidths(version), [version]);
}

function wrap(
  words: string[],
  w: Widths,
  sp: number,
  size: number,
  maxW: number,
) {
  const lines: string[][] = [[]];
  let run = 0;
  for (const wd of words) {
    const line = lines[lines.length - 1];
    const add = (line.length > 0 ? sp : 0) + w(wd);
    if (line.length > 0 && (run + add) * size > maxW) {
      lines.push([wd]);
      run = w(wd);
    } else {
      line.push(wd);
      run += add;
    }
  }
  return lines.map((l) => l.join(" "));
}

function ZoomReadout({
  value,
  progress,
  size,
  ink,
  dim,
  faint,
}: {
  value: number;
  progress: number;
  size: number;
  ink: string;
  dim: string;
  faint: string;
}) {
  const ticks = 25;
  const rulerW = size * 4;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: size * 0.3 }}>
      <div
        style={{
          fontFamily: mono.fontFamily,
          fontWeight: 400,
          fontSize: size * 0.36,
          letterSpacing: "0.04em",
          color: dim,
          textTransform: "uppercase",
        }}
      >
        Zoom
      </div>
      <div
        style={{
          fontFamily: onest.fontFamily,
          fontWeight: 300,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toFixed(1)}×
      </div>
      <div
        style={{
          position: "relative",
          width: rulerW,
          height: size * 0.34,
          marginTop: size * 0.1,
        }}
      >
        {Array.from({ length: ticks }, (_, i) => (
          <span
            key={i.toString()}
            style={{
              position: "absolute",
              left: (i / (ticks - 1)) * rulerW,
              bottom: 0,
              width: 1,
              height: i % 6 === 0 ? size * 0.26 : size * 0.14,
              background: faint,
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            left: (1 - progress) * rulerW - 1,
            bottom: 0,
            width: 2,
            height: size * 0.34,
            borderRadius: 1,
            background: ink,
          }}
        />
      </div>
    </div>
  );
}

export function UpClose({
  close = "Up close, it’s code.",
  wide = "From here, it’s your launch.",
  src,
  aspect = 1200 / 630,
  focus = { x: 0.58, y: 0.52 },
  zoom = 3,
  accent,
  background,
  ground,
  groundParams,
  speed = 1,
  theme = "dark",
}: UpCloseProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames: D, fps } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const transparent = background === "transparent";
  const image = src ?? staticFile("hero.png");
  const widths = useWidths();

  const closeWords = close.split(/\s+/).filter(Boolean);
  const wideWords = wide.split(/\s+/).filter(Boolean);

  const k = Math.min(1.6, Math.max(0.6, D / 125));
  const t = frame * speed;
  const portrait = H > W * 1.1;
  const sp = widths(" ");
  const lerp = (a: number, b: number, q: number) => a + (b - a) * q;

  const textX = W * (portrait ? 0.08 : 0.065);
  const maxW = W * (portrait ? 0.84 : 0.86);
  let size = portrait ? W * 0.078 : H * 0.072;
  let closeLines = wrap(closeWords, widths, sp, size, maxW);
  let wideLines = wrap(wideWords, widths, sp, size, maxW);
  for (let guard = 0; guard < 10; guard++) {
    if (closeLines.length + wideLines.length <= (portrait ? 5 : 3)) break;
    size *= 0.92;
    closeLines = wrap(closeWords, widths, sp, size, maxW);
    wideLines = wrap(wideWords, widths, sp, size, maxW);
  }
  const step = LEADING * size;
  const bottom = H * (portrait ? 0.92 : 0.9);
  const wideTop = bottom - size - (wideLines.length - 1) * step;
  const closeFinalTop = wideTop - closeLines.length * step;
  const closeStartTop = bottom - size - (closeLines.length - 1) * step;

  const margin = W * (portrait ? 0.11 : 0.065);
  const finalW = portrait ? W - margin * 2 : W * 0.6;
  const finalAspect = portrait ? Math.min(aspect, 0.82) : aspect;
  const finalTopY = H * (portrait ? 0.2 : 0.08);
  const finalH = Math.min(
    finalW / finalAspect,
    closeFinalTop - size * 0.6 - finalTopY,
  );
  const finalWFit = finalH * finalAspect;
  const win0 = {
    x: 0,
    y: 0,
    w: W,
    h: closeStartTop - size * 0.62,
  };
  const win1 = {
    x: portrait ? (W - finalWFit) / 2 : W - margin - finalWFit,
    y: finalTopY,
    w: finalWFit,
    h: finalH,
  };

  const PULL_AT = 44 * k;
  const WIDE_AT = PULL_AT + 20 * k;

  const q = Math.min(1, spring({ frame: t - PULL_AT, fps, config: HEAVY }));
  const win = {
    x: lerp(win0.x, win1.x, q),
    y: lerp(win0.y, win1.y, q),
    w: lerp(win0.w, win1.w, q),
    h: lerp(win0.h, win1.h, q),
  };
  const radius = lerp(0, Math.min(W, H) * 0.018, q);

  const creep = interpolate(t, [0, PULL_AT], [1.05, 1], CLAMP);
  const settle = interpolate(t, [PULL_AT, D], [1.03, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const z = zoom ** (1 - q) * lerp(creep, settle, q);
  const coverW = Math.max(win.w, win.h * aspect);
  const coverH = coverW / aspect;
  const imgW = coverW * z;
  const imgH = coverH * z;
  const ax = lerp(focus.x, 0.5, q);
  const ay = lerp(focus.y, 0.5, q);
  const left = Math.min(0, Math.max(win.w - imgW, win.w / 2 - ax * imgW));
  const top = Math.min(0, Math.max(win.h - imgH, win.h / 2 - ay * imgH));

  const fadeIn = interpolate(t, [0, 8 * k], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const closeIn = interpolate(t, [6 * k, 20 * k], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const lift = interpolate(t, [WIDE_AT - 6 * k, WIDE_AT + 12 * k], [0, 1], {
    ...CLAMP,
    easing: MOVE,
  });
  const wideIn = interpolate(t, [WIDE_AT, WIDE_AT + 14 * k], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const readoutIn = interpolate(t, [PULL_AT, PULL_AT + 10 * k], [0, 1], {
    ...CLAMP,
    easing: ENTER,
  });
  const closeTop = lerp(closeStartTop, closeFinalTop, lift);
  const readSize = portrait ? W * 0.075 : H * 0.085;

  const text = {
    position: "absolute" as const,
    left: textX,
    fontFamily: onest.fontFamily,
    fontWeight: WGHT,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  };
  const rise = (p: number) => (1 - p) * size * 0.32;
  const blur = (p: number) =>
    p < 1 ? `blur(${(1 - p) * size * 0.08}px)` : undefined;

  const [lastWide, ...restRev] = [...wideLines].reverse();
  const wideHead = restRev.reverse();

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? c.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <AbsoluteFill>
          <GshGround
            preset={ground ?? c.preset}
            params={groundParams}
            timeOffset={1.5}
            timeScale={0.4}
          />
          <AbsoluteFill style={{ background: c.scrim }} />
        </AbsoluteFill>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: win.x,
          top: win.y,
          width: win.w,
          height: win.h,
          borderRadius: radius,
          overflow: "hidden",
          background: c.well,
          boxShadow: q > 0.01 ? c.shadow : "none",
          opacity: fadeIn,
        }}
      >
        <Img
          src={image}
          style={{
            position: "absolute",
            left,
            top,
            width: imgW,
            height: imgH,
            maxWidth: "none",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: textX,
          top: portrait ? H * 0.06 : finalTopY,
          opacity: readoutIn,
          transform: `translateY(${(1 - readoutIn) * readSize * 0.3}px)`,
        }}
      >
        <ZoomReadout
          value={1 + (zoom - 1) * (1 - q)}
          progress={q}
          size={readSize}
          ink={c.ink}
          dim={c.dim}
          faint={c.faint}
        />
      </div>
      {closeLines.map((ln, i) => (
        <div
          key={`c${i.toString()}`}
          style={{
            ...text,
            top: closeTop + i * step + rise(closeIn),
            opacity: closeIn,
            filter: blur(closeIn),
            color: lift > 0 ? mix(c.ink, c.dim, lift) : c.ink,
          }}
        >
          {ln}
        </div>
      ))}
      {wideHead.map((ln, i) => (
        <div
          key={`w${i.toString()}`}
          style={{
            ...text,
            top: wideTop + i * step + rise(wideIn),
            opacity: wideIn,
            filter: blur(wideIn),
            color: c.ink,
          }}
        >
          {ln}
        </div>
      ))}
      {lastWide !== undefined ? (
        <div
          style={{
            ...text,
            top: wideTop + wideHead.length * step + rise(wideIn),
            opacity: wideIn,
            filter: blur(wideIn),
            color: c.ink,
          }}
        >
          <Accented line={lastWide} color={hi} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function Accented({ line, color }: { line: string; color: string }) {
  const m = line.match(/^(.*?)([\p{L}\p{N}'’-]+)([^\p{L}\p{N}]*)$/u);
  if (!m) return <>{line}</>;
  return (
    <>
      {m[1]}
      <span style={{ color }}>{m[2]}</span>
      {m[3]}
    </>
  );
}

function mix(a: string, b: string, q: number) {
  return `color-mix(in oklab, ${a} ${Math.round((1 - q) * 100)}%, ${b})`;
}
