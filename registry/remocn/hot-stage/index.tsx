"use client";

import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

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
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
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

const ENTER_LEN = 16;
const FIRST_AT = 30;

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

function measure(lines: string[], log: string[]): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx)
    return {
      widths: lines.map((l) => l.length * 0.55),
      log: 10,
      cap: 0.7,
      base: 0.8,
    };
  ctx.font = `400 ${PROBE_PX}px "${grotesk.fontFamily}"`;
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

function useMetrics(lines: string[], log: string[]) {
  const key = `${lines.join("\u0001")}\u0002${log.join("\u0001")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("hot-stage: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      grotesk.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`400 100px "${grotesk.fontFamily}"`),
      document.fonts.load(`400 100px "${mono.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [l, g] = key.split("\u0002");
        setState({
          key,
          m: measure(l.split("\u0001"), g ? g.split("\u0001") : []),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

export function HotStage({
  lines = [
    "Storyboard the launch.",
    "Render on your laptop.",
    "Clear the tower.",
  ],
  log = ["T+00:00  Liftoff", "T+02:41  Hot staging", "T+08:32  Orbit"],
  stage = 44,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: HotStageProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const vent = accent ?? c.ink;
  const list = lines.length > 0 ? lines : [""];
  const m = useMetrics(list, log);

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
  const ign = (i: number) => FIRST_AT + (i - 1) * stage;

  type Pose = {
    y: number;
    opacity: number;
    spent: number;
  };

  const pose = (i: number): Pose | null => {
    const start = i === 0 ? 0 : ign(i);
    if (t < start) return null;
    let y: number;
    let opacity: number;
    if (i === 0) {
      const e = interpolate(t, [0, ENTER_LEN], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      y = y0 + (1 - e) * F * 0.4;
      opacity = e;
    } else {
      const s = ign(i);
      const e = interpolate(t, [s, s + 10], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const pair = interpolate(t, [s, s + 14], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      const settle = interpolate(t, [s + 16, s + 38], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      y = y0 - pitch + (pitch / 2) * pair + (pitch / 2) * settle;
      opacity = e;
    }
    let spent = 0;
    if (i < last) {
      const s = ign(i + 1);
      const pair = interpolate(t, [s, s + 14], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      y += (pitch / 2) * pair;
      spent = interpolate(t, [s + 6, s + 18], [0, 1], {
        ...CLAMP,
        easing: EASE_IO,
      });
      const fall = interpolate(t, [s + 16, s + 40], [0, 1], {
        ...CLAMP,
        easing: EASE_FALL,
      });
      y += fall * H * 0.6;
      opacity *= interpolate(fall, [0.4, 1], [1, 0], CLAMP);
      if (fall >= 1) return null;
    }
    return { y, opacity, spent };
  };

  const vents = (i: number) => {
    if (i === 0) return null;
    const s = ign(i);
    const upper = pose(i);
    const lower = pose(i - 1);
    if (!upper || !lower) return null;
    const on = interpolate(t, [s, s + 5, s + 16, s + 26], [0, 1, 1, 0], CLAMP);
    if (on <= 0.001) return null;
    const draw = interpolate(t, [s, s + 6], [0, 1], {
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
  for (let i = 1; i < n; i++) if (t >= ign(i)) active = i;
  const logTop = portrait ? marginY : H - marginY - log.length * logFs * 1.9;

  return (
    <AbsoluteFill style={{ background: stageFill, overflow: "hidden" }}>
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
        const at = i === 0 ? 0 : ign(i);
        const p = interpolate(t, [at, at + 8], [0, 1], {
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
              color: i === Math.min(active, log.length - 1) ? c.ink : c.spent,
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
        return (
          <div
            key={`${line}${i}`}
            style={{
              position: "absolute",
              left: x0,
              top: p.y - m.base * F,
              height: F,
              lineHeight: `${F}px`,
              whiteSpace: "pre",
              fontFamily: grotesk.fontFamily,
              fontWeight: 400,
              fontSize: F,
              letterSpacing: `${TRACK}em`,
              color: c.ink,
              opacity: p.opacity * (1 - 0.7 * p.spent),
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
