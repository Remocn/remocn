"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_LINES,
  linesOf,
  type MonoSettleElementId,
  monoSettleTimeline,
} from "./timeline";

const geist = loadGeist("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geistMono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface MonoSettleProps {
  lines?: string[];
  highlight?: string;
  /** Frame the mono letters start settling into the sans. */
  settleAt?: number;
  /** Frames the settle wave takes to cross a line. */
  sweep?: number;
  accent?: string;
  /** Text color of the settled sans; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface the letters settle into. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the text block, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches each line's rise, the settle wave and the
   * highlight, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<MonoSettleElementId>;
}

const THEMES = {
  dark: {
    pink: "#F472B6",
    bg: "#14151A",
    ink: "#FBF0DF",
    mono: "rgba(251,240,223,0.72)",
  },
  light: {
    pink: "#C2185B",
    bg: "#FBF0DF",
    ink: "#14151A",
    mono: "rgba(20,21,26,0.7)",
  },
} as const;

const TRACK = -0.035;
const LEADING = 1.04;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface LineMetrics {
  xm: number[];
  xp: number[];
  wm: number;
  wp: number;
}

interface Metrics {
  lines: LineMetrics[];
  capP: number;
  baseP: number;
  baseM: number;
}

const baseOf = (asc: number, desc: number) => (1 - (asc + desc)) / 2 + asc;

function measure(lines: string[], family: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("mono-settle: no 2d context");
  const run = (s: string, font: string, track: number) => {
    ctx.font = font;
    const chars = Array.from(s);
    const xs: number[] = [];
    let prefix = "";
    for (let i = 0; i < chars.length; i++) {
      xs.push(prefix ? ctx.measureText(prefix).width / 100 + track * i : 0);
      prefix += chars[i];
    }
    const total = ctx.measureText(s).width / 100 + track * (chars.length - 1);
    return { xs, total };
  };
  const monoFont = `400 100px "${geistMono.fontFamily}"`;
  const propFont = `500 100px "${family}"`;
  const out = lines.map((s) => {
    const mm = run(s, monoFont, 0);
    const pp = run(s, propFont, TRACK);
    return { xm: mm.xs, xp: pp.xs, wm: mm.total, wp: pp.total };
  });
  ctx.font = propFont;
  const hp = ctx.measureText("H");
  ctx.font = monoFont;
  const hm = ctx.measureText("H");
  return {
    lines: out,
    capP: hp.actualBoundingBoxAscent / 100,
    baseP: baseOf(
      hp.fontBoundingBoxAscent / 100,
      hp.fontBoundingBoxDescent / 100,
    ),
    baseM: baseOf(
      hm.fontBoundingBoxAscent / 100,
      hm.fontBoundingBoxDescent / 100,
    ),
  };
}

function useMetrics(lines: string[], family: string) {
  const key = lines.join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("mono-settle: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      geistMono.waitUntilDone(),
      document.fonts.load(`500 100px "${family}"`),
      document.fonts.load(`400 100px "${geistMono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key: key + family,
          m: measure(key.split("\u0001"), family),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, family, handle]);
  return state && state.key === key + family ? state.m : null;
}

function highlightMask(lines: string[], needle: string) {
  const masks = lines.map((l) => Array.from(l).map(() => false));
  const n = needle.trim();
  if (!n) return masks;
  lines.forEach((l, li) => {
    const at = l.indexOf(n);
    if (at < 0) return;
    const start = Array.from(l.slice(0, at)).length;
    const len = Array.from(n).length;
    for (let i = start; i < start + len; i++) masks[li][i] = true;
  });
  return masks;
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

export function MonoSettle(props: MonoSettleProps) {
  const {
    lines = DEFAULT_LINES,
    highlight = "the edit.",
    accent,
    ink,
    background,
    fontFamily = geist.fontFamily,
    scale = 1,
    delay = 0,
    speed = 1,
    theme = "dark",
    timing,
  } = props;
  const glide = useGlide();
  const t = Math.max(0, useSceneFrame() - delay) * speed;
  const { width: W, height: H, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    monoSettleTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const spot = accent ?? c.pink;
  const fg = ink ?? c.ink;
  const list = useMemo(() => linesOf(lines), [lines]);
  const m = useMetrics(list, fontFamily);
  const hlMask = useMemo(
    () => highlightMask(list, highlight),
    [list, highlight],
  );

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);
  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const margin = Math.min(W, H) * (portrait ? 0.08 : 0.085);
  const measureW = W - 2 * margin;
  const maxMono = Math.max(...m.lines.map((l) => l.wm));

  const wave = tl.get("settle");
  const prog = m.lines.map((l, li) =>
    l.xm.map((x) => {
      const at =
        wave.start +
        (x / Math.max(0.001, maxMono)) * wave.beat("sweep") +
        li * wave.beat("lag");
      return interpolate(t, [at, at + wave.beat("morph")], [0, 1], CLAMP);
    }),
  );
  const capF = H * (portrait ? 0.12 : 0.24) * (list.length > 2 ? 0.75 : 1);
  const lastBase = H - margin;
  const layoutAt = (pr: number[][]) => {
    const xs = m.lines.map((l, li) => {
      const out: number[] = [];
      let run = 0;
      for (let i = 0; i < l.xm.length; i++) {
        out.push(run);
        const am = (i + 1 < l.xm.length ? l.xm[i + 1] : l.wm) - l.xm[i];
        const ap = (i + 1 < l.xp.length ? l.xp[i + 1] : l.wp) - l.xp[i];
        run += am + (ap - am) * EASE_IO(pr[li][i]);
      }
      out.push(run);
      return out;
    });
    const widest = Math.max(...xs.map((x) => x[x.length - 1]));
    const F = Math.min(capF, measureW / widest);
    const lineH = F * LEADING;
    return { xs, F, lineH, firstBase: lastBase - lineH * (list.length - 1) };
  };
  const { xs, F, lineH, firstBase } = layoutAt(prog);
  // Each box is laid out where it lands, for its whole life, and the way
  // there is a transform: layout rounds a box to whole pixels, so a box eased
  // by `left`/`top` clicks along pixel by pixel, and a box handed back to
  // layout when it stops jumps by what rounding takes off.
  const morphing = prog.some((l) => l.some((p) => p > 0 && p < 1));
  const settled = layoutAt(prog.map((l) => l.map(() => 1)));

  const hl = tl.get("highlight");
  const hlP = interpolate(t, [hl.start, hl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const glyphs = list.flatMap((line, li) => {
    const chars = Array.from(line);
    const baseY = firstBase + li * lineH;
    const riseEl = tl.get(`rise:${li}`);
    return chars.map((ch, i) => {
      if (ch === " ") return null;
      const e = EASE_IO(prog[li][i]);
      const x = margin + xs[li][i] * F;
      const liftAt = (tt: number) =>
        (1 -
          interpolate(
            tt,
            [
              riseEl.start + i * riseEl.beat("gap"),
              riseEl.start + i * riseEl.beat("gap") + riseEl.beat("rise"),
            ],
            [0, 1],
            { ...CLAMP, easing: EASE_OUT },
          )) *
        F *
        1.1;
      // The rise is a transform, not part of `top`, for the same reason as
      // the settle above.
      const lift = liftAt(t);
      const rising =
        Math.abs(liftAt(t + speed) - lift) > 1e-3 ||
        Math.abs(lift - liftAt(t - speed)) > 1e-3;
      // The glyph grows with F while the letters settle, and its line box
      // puts the baseline on a whole pixel at every size. So it is laid out
      // once at the size it lands at and scaled there instead.
      const RF = settled.F;
      const k = F / RF;
      const glyphAt = (base: number) => {
        const dy = (F - RF) * (1.05 - base) + lift;
        return {
          top: RF * 1.05 - base * RF,
          height: RF,
          lineHeight: `${RF}px`,
          fontSize: RF,
          transform: `translateY(${dy}px) scale(${k})`,
          transformOrigin: "0 0",
        };
      };
      const sansColor = hlMask[li][i]
        ? `color-mix(in oklab, ${spot} ${(hlP * 100).toFixed(1)}%, ${fg})`
        : fg;
      const top = baseY - F * 1.05;
      const h = F * 1.3;
      const cut = (1 - e) * h;
      const restX = margin + settled.xs[li][i] * settled.F;
      const restTop = settled.firstBase + li * settled.lineH - settled.F * 1.05;
      return (
        <div
          key={`${li}-${i}`}
          style={{
            position: "absolute",
            left: restX,
            top: restTop,
            width: F,
            height: h,
            overflow: "hidden",
            transform: `translate(${x - restX}px, ${top - restTop}px)${glide(morphing || rising)}`,
          }}
        >
          {e < 0.999 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                ...glyphAt(m.baseM),
                fontFamily: geistMono.fontFamily,
                fontWeight: 400,
                whiteSpace: "pre",
                color: c.mono,
                clipPath: `inset(${(Math.max(0, h - cut - (F * 1.05 - m.baseM * F)) / k).toFixed(2)}px 0 0 0)`,
              }}
            >
              {ch}
            </div>
          ) : null}
          {e > 0.001 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                ...glyphAt(m.baseP),
                fontFamily,
                fontWeight: 500,
                whiteSpace: "pre",
                color: sansColor,
                clipPath:
                  e >= 0.999
                    ? undefined
                    : `inset(0 0 ${(Math.max(0, F - (h - cut - (F * 1.05 - m.baseP * F))) / k).toFixed(2)}px 0)`,
              }}
            >
              {ch}
            </div>
          ) : null}
        </div>
      );
    });
  });

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>{glyphs}</ScaleLayer>
    </AbsoluteFill>
  );
}
