"use client";

import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  DEFAULT_LOG,
  type HotStageElementId,
  hotStageTimeline,
  stageLines,
} from "./timeline";

const grotesk = loadSpaceGrotesk("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const mono = loadSpaceMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface HotStageProps {
  lines?: string[];
  log?: string[];
  stage?: number;
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  background?: string;
  /** Typeface for the lines. Load it yourself; Space Grotesk by default. */
  fontFamily?: string;
  /** Frames the first line holds alone before the next one ignites. */
  hold?: number;
  /** Size of the foreground, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  /**
   * Moves, trims or stretches single lines igniting and the log entries
   * lighting up, by the ids in `./timeline`. Frames on the scene timeline,
   * after `delay` and `speed`.
   */
  timing?: Timing<HotStageElementId>;
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#FFFFFF",
    spent: "rgba(255,255,255,0.3)",
    rule: "rgba(255,255,255,0.22)",
  },
  light: {
    bg: "#FFFFFF",
    ink: "#000000",
    spent: "rgba(0,0,0,0.28)",
    rule: "rgba(0,0,0,0.2)",
  },
} as const;

const TRACK = -0.03;
const PROBE_PX = 200;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_FALL = Easing.bezier(0.5, 0, 0.85, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  widths: number[];
  log: number;
  cap: number;
  base: number;
}

function measure(lines: string[], log: string[], fontFamily: string): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx)
    return {
      widths: lines.map((l) => l.length * 0.55),
      log: 10,
      cap: 0.7,
      base: 0.8,
    };
  ctx.font = `400 ${PROBE_PX}px "${fontFamily}"`;
  const widths = lines.map(
    (l) =>
      ctx.measureText(l).width / PROBE_PX +
      TRACK * Math.max(0, Array.from(l).length - 1),
  );
  const m = ctx.measureText("H");
  const asc = m.fontBoundingBoxAscent / PROBE_PX;
  const desc = m.fontBoundingBoxDescent / PROBE_PX;
  ctx.font = `400 ${PROBE_PX}px "${mono.fontFamily}"`;
  const logW = Math.max(
    0,
    ...log.map((s) => ctx.measureText(s).width / PROBE_PX),
  );
  return {
    widths,
    log: logW,
    cap: m.actualBoundingBoxAscent / PROBE_PX,
    base: (1 - (asc + desc)) / 2 + asc,
  };
}

function useMetrics(lines: string[], log: string[], fontFamily: string) {
  const key = `${lines.join("\u0001")}\u0002${log.join("\u0001")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("hot-stage: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      grotesk.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`),
      document.fonts.load(`400 100px "${mono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [l, g] = key.split("\u0002");
        setState({
          key,
          m: measure(l.split("\u0001"), g ? g.split("\u0001") : [], fontFamily),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle, fontFamily]);
  return state && state.key === key ? state.m : null;
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

export function HotStage(props: HotStageProps) {
  const {
    lines = DEFAULT_LINES,
    log = DEFAULT_LOG,
    accent,
    ink,
    background,
    fontFamily = grotesk.fontFamily,
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
    hotStageTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const vent = accent ?? fg;
  const list = stageLines(lines);
  const m = useMetrics(list, log, fontFamily);

  const transparent = background === "transparent";
  const stageFill = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stageFill }} />
    );
  }

  const portrait = H > W * 1.1;
  const minDim = Math.min(W, H);
  const marginX = W * (portrait ? 0.08 : 0.07);
  const marginY = H * (portrait ? 0.08 : 0.11);
  const logFs = Math.max(minDim * 0.024, Math.min(minDim * 0.03, 22));
  const split = portrait ? marginX : W * 0.32;
  const x0 = portrait ? marginX : split + W * 0.045;
  const measureW = W - marginX - x0;
  const widest = Math.max(0.1, ...m.widths);
  const F = Math.min(measureW / widest, H * (portrait ? 0.07 : 0.15));
  const stroke = Math.max(1, minDim * 0.0018);

  const pitch = F * 1.18;
  const y0 = portrait ? H * 0.56 : H / 2 + (m.cap * F) / 2;
  const n = list.length;
  const last = n - 1;
  const lineEls = list.map((_, i) => tl.get(`line:${i}`));

  type Pose = {
    y: number;
    opacity: number;
    spent: number;
  };

  const pose = (i: number, f = t): Pose | null => {
    const el = lineEls[i];
    if (f < el.start) return null;
    let y: number;
    let opacity: number;
    if (i === 0) {
      const e = interpolate(f, [el.start, el.end], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      y = y0 + (1 - e) * F * 0.4;
      opacity = e;
    } else {
      const s = el.start;
      const e = interpolate(f, [s, s + el.beat("fade")], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const pair = interpolate(f, [s, s + el.beat("pair")], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      const settle = interpolate(f, [s + el.beat("settle"), el.end], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      y = y0 - pitch + (pitch / 2) * pair + (pitch / 2) * settle;
      opacity = e;
    }
    let spent = 0;
    if (i < last) {
      // The next line's ignition pushes this one out.
      const next = lineEls[i + 1];
      const s = next.start;
      const pair = interpolate(f, [s, s + next.beat("pair")], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      y += (pitch / 2) * pair;
      spent = interpolate(
        f,
        [s + next.beat("spent"), s + next.beat("spentEnd")],
        [0, 1],
        { ...CLAMP, easing: EASE_IO },
      );
      const fall = interpolate(
        f,
        [s + next.beat("fall"), s + next.beat("fallEnd")],
        [0, 1],
        { ...CLAMP, easing: EASE_FALL },
      );
      y += fall * H * 0.6;
      opacity *= interpolate(fall, [0.4, 1], [1, 0], CLAMP);
      if (fall >= 1) return null;
    }
    return { y, opacity, spent };
  };

  const vents = (i: number) => {
    if (i === 0) return null;
    const el = lineEls[i];
    const s = el.start;
    const upper = pose(i);
    const lower = pose(i - 1);
    if (!upper || !lower) return null;
    const on = interpolate(
      t,
      [
        s,
        s + el.beat("ventOn"),
        s + el.beat("ventBurn"),
        s + el.beat("ventOut"),
      ],
      [0, 1, 1, 0],
      CLAMP,
    );
    if (on <= 0.001) return null;
    const draw = interpolate(t, [s, s + el.beat("ventDraw")], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const yTop = upper.y + F * 0.12;
    const yBot = lower.y - m.cap * F - F * 0.1;
    if (yBot - yTop < 2) return null;
    const span = m.widths[i - 1] * F * draw;
    const count = Math.max(8, Math.round((m.widths[i - 1] * F) / (F * 0.16)));
    const ticks = [];
    for (let k = 0; k <= count; k++) {
      const x = (k / count) * m.widths[i - 1] * F;
      if (x > span) break;
      const flick = 0.55 + 0.45 * Math.abs(Math.sin(k * 1.73 + t * 1.9));
      ticks.push(
        <line
          key={k}
          x1={x0 + x}
          x2={x0 + x}
          y1={yTop}
          y2={yTop + (yBot - yTop) * flick}
          stroke={vent}
          strokeWidth={stroke}
        />,
      );
    }
    return (
      <g key={`v${i}`} opacity={on}>
        {ticks}
      </g>
    );
  };

  let active = 0;
  for (let i = 1; i < n; i++) if (t >= lineEls[i].start) active = i;
  const logTop = portrait ? marginY : H - marginY - log.length * logFs * 1.9;

  return (
    <AbsoluteFill style={{ background: stageFill, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        {portrait ? (
          <div
            style={{
              position: "absolute",
              left: marginX,
              right: marginX,
              top: logTop + log.length * logFs * 1.9 + logFs,
              height: stroke,
              background: c.rule,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              left: split,
              top: marginY,
              bottom: marginY,
              width: stroke,
              background: c.rule,
            }}
          />
        )}
        {log.map((entry, i) => {
          const entryEl = tl.get(`entry:${i}`);
          const p = interpolate(t, [entryEl.start, entryEl.end], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={`${entry}${i}`}
              style={{
                position: "absolute",
                left: marginX,
                top: logTop + i * logFs * 1.9,
                whiteSpace: "pre",
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: logFs,
                lineHeight: 1,
                color: i === Math.min(active, log.length - 1) ? fg : c.spent,
                opacity: p,
              }}
            >
              {entry}
            </div>
          );
        })}
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {list.map((_, i) => vents(i))}
        </svg>
        {list.map((line, i) => {
          const p = pose(i);
          if (!p) return null;
          // Layout rounds a baseline to whole pixels, so a line eased by `top`
          // clicks along pixel by pixel. It is laid out where it settles and
          // the pairing, settle and fall are a transform on top.
          const dy = p.y - y0;
          const yAt = (f: number) => pose(i, f)?.y ?? p.y;
          const moving =
            Math.abs(yAt(t + speed) - p.y) > 1e-3 ||
            Math.abs(p.y - yAt(t - speed)) > 1e-3;
          return (
            <div
              key={`${line}${i}`}
              style={{
                position: "absolute",
                left: x0,
                top: y0 - m.base * F,
                // Kept at 0 once settled: the lean rides on it.
                transform: `translateY(${Math.abs(dy) > 1e-3 ? dy : 0}px)${glide(moving)}`,
                height: F,
                lineHeight: `${F}px`,
                whiteSpace: "pre",
                fontFamily,
                fontWeight: 400,
                fontSize: F,
                letterSpacing: `${TRACK}em`,
                color: fg,
                opacity: p.opacity * (1 - 0.7 * p.spent),
              }}
            >
              {line}
            </div>
          );
        })}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
