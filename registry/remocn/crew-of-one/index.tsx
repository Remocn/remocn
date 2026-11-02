"use client";

import { loadFont } from "@remotion/google-fonts/Gabarito";
import type React from "react";
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

const gabarito = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface CrewOfOneProps {
  roles?: string[];
  name?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#3B1E6E", ink: "#FFFFFF", accent: "#FF7A6B" },
  light: { bg: "#EDE7FB", ink: "#3B1E6E", accent: "#D9483A" },
} as const;

const ROLE_W = 400;
const NAME_W = 500;
const TRACK = -0.02;
const NAME_TRACK = -0.03;
const FONT_PX = 200;
const NAME_SCALE = 2.3;
const LINE = 1.32;
const STACK_LINE = 1.06;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  roles: number;
  name: number;
  asc: number;
  desc: number;
}

function measure(roles: string[], name: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("crew-of-one: no 2d context");
  ctx.font = `${ROLE_W} ${FONT_PX}px "${gabarito.fontFamily}"`;
  let widest = 0.1;
  for (const r of roles) {
    widest = Math.max(
      widest,
      ctx.measureText(r).width / FONT_PX + TRACK * Array.from(r).length,
    );
  }
  const fm = ctx.measureText("Hxg");
  ctx.font = `${NAME_W} ${FONT_PX}px "${gabarito.fontFamily}"`;
  const nameW =
    ctx.measureText(name).width / FONT_PX +
    NAME_TRACK * Array.from(name).length;
  return {
    roles: widest,
    name: nameW,
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(roles: string[], name: string) {
  const key = [name, ...roles].join("\u0001");
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("crew-of-one: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      gabarito.waitUntilDone(),
      document.fonts.load(`${ROLE_W} 100px "${gabarito.fontFamily}"`),
      document.fonts.load(`${NAME_W} 100px "${gabarito.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const [n, ...rs] = key.split("\u0001");
        setState({ key, m: measure(rs, n) });
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

export function CrewOfOne({
  roles = [
    "Written by",
    "Directed by",
    "Edited by",
    "Motion by",
    "Captions by",
    "Shipped by",
  ],
  name = "you",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: CrewOfOneProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const t = frame * speed;
  const D = Math.max(90, durationInFrames);
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const list = roles.length > 0 ? roles : ["Made by"];
  const m = useMetrics(list, name);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const n = list.length;
  const portrait = H > W * 1.1;
  const margin = W * (portrait ? 0.07 : 0.06);
  const gap = W * (portrait ? 0.035 : 0.025);
  const gutter = W * (portrait ? 0.56 : 0.54);
  const leftRoom = gutter - gap / 2 - margin;
  const rightRoom = W - margin - (gutter + gap / 2);
  const stackFit = (H * 0.86) / (n * STACK_LINE);
  const F = Math.min(
    H * (portrait ? 0.055 : 0.13),
    leftRoom / m.roles,
    rightRoom / (m.name * NAME_SCALE),
    stackFit,
  );
  const NF = F * NAME_SCALE;
  const mid = H / 2;
  const baseline = mid + F * 0.36;
  const top = (base: number, size: number) =>
    base - ((1 - m.asc - m.desc) / 2 + m.asc) * size;

  const introEnd = 18;
  const rollStart = 30;
  const rollEnd = Math.max(rollStart + (n - 1) * 10, D * 0.6);
  const step = n > 1 ? (rollEnd - rollStart) / (n - 1) : 1;
  const move = Math.min(13, step * 0.55);
  let p = 0;
  for (let k = 1; k < n; k++) {
    const s = rollStart + (k - 1) * step + (step - move);
    p += interpolate(t, [s, s + move], [0, 1], { ...CLAMP, easing: EASE_IO });
  }
  const cStart = rollEnd + 12;
  const cLen = 24;
  const gather = interpolate(t, [cStart, cStart + cLen], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const intro = interpolate(t, [0, introEnd], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const nameIn = interpolate(t, [8, 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const LS = F * LINE;
  const LS2 = F * STACK_LINE;
  const stackTop = -((n - 1) / 2) * LS2;

  const roleStyle: React.CSSProperties = {
    position: "absolute",
    right: W - (gutter - gap / 2),
    height: F,
    lineHeight: `${F}px`,
    whiteSpace: "pre",
    fontFamily: gabarito.fontFamily,
    fontWeight: ROLE_W,
    fontSize: F,
    letterSpacing: `${TRACK}em`,
    color: c.ink,
    textAlign: "right",
  };

  const nodes: React.ReactNode[] = list.map((r, i) => {
    const d = i - p;
    const rollY = d * LS + (1 - intro) * LS * 0.9;
    const stackY = stackTop + i * LS2;
    const y = rollY + (stackY - rollY) * gather;
    const ad = Math.abs(d);
    const rollA =
      interpolate(ad, [0, 0.55, 1, 2.6], [1, 0.42, 0.3, 0], CLAMP) * intro;
    const a = rollA + (1 - rollA) * gather;
    return (
      <div
        key={`r${i}`}
        style={{
          ...roleStyle,
          top: top(baseline + y, F),
          opacity: a,
        }}
      >
        {r}
      </div>
    );
  });

  const nameTop = top(baseline, NF);
  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
      <div
        style={{
          position: "absolute",
          left: gutter + gap / 2,
          top: nameTop - NF * 0.15,
          height: NF * 1.35,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            top: NF * 0.15,
            height: NF,
            lineHeight: `${NF}px`,
            whiteSpace: "pre",
            fontFamily: gabarito.fontFamily,
            fontWeight: NAME_W,
            fontSize: NF,
            letterSpacing: `${NAME_TRACK}em`,
            color: hi,
            transform: `translateY(${((1 - nameIn) * NF * 1.3).toFixed(2)}px)`,
          }}
        >
          {name}
        </div>
      </div>
    </AbsoluteFill>
  );
}
