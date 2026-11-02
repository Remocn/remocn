"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const figtree = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const sans = figtree.fontFamily;

export interface StoryTextProps {
  text?: string;
  measure?: number;
  accent?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const FONT_PX = 100;
const TRACK = -0.012;

const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#F2EDE6",
  colors: ["#F58C3D", "#F7C79B", "#E889B5", "#FFF6EC"],
};

const THEMES = {
  dark: {
    ground: "static-sunset" as GshPresetId,
    base: "#0A0510",
    fg: "#FBF7F1",
    sticker: "#FBF7F1",
    onFill: "#17120E",
    scrim: "10,5,16",
    scrimA: 0.34,
    lift: "rgba(20,6,12,0.38)",
    shadow: "0 2px 22px rgba(10,5,16,0.45)",
  },
  light: {
    ground: undefined,
    base: "#F2EDE6",
    fg: "#17140F",
    sticker: "#17140F",
    onFill: "#FBF7F1",
    scrim: "242,237,230",
    scrimA: 0.3,
    lift: "rgba(80,40,20,0.22)",
    shadow: "0 1px 16px rgba(242,237,230,0.6)",
  },
} as const;

const FIRST_WORD = -2;
const WORD_GAP = 5;
const WORD_IN = 8;

function measureWith(_version: number) {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `400 ${FONT_PX}px "${sans}"`;
      cache[s] = ctx.measureText(s).width / FONT_PX + TRACK * [...s].length;
    }
    return cache[s];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("story-text: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      figtree.waitUntilDone(),
      document.fonts.load(`400 ${FONT_PX}px "${sans}"`),
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
  return useMemo(() => measureWith(version), [version]);
}

function wrap(widths: number[], space: number, max: number) {
  const lineOf: number[] = [];
  let line = 0;
  let run = 0;
  widths.forEach((w, i) => {
    const next = run === 0 ? w : run + space + w;
    if (run > 0 && next > max) {
      line += 1;
      run = w;
    } else {
      run = next;
    }
    lineOf[i] = line;
  });
  return lineOf;
}

type Pt = [number, number];

function roundedPath(raw: Pt[], R: number) {
  const pts: Pt[] = [];
  for (const p of raw) {
    const q = pts[pts.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.25) pts.push(p);
  }
  if (pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= 0.25) pts.pop();
  }
  const clean = pts.filter((v, i) => {
    const p = pts[(i - 1 + pts.length) % pts.length];
    const n = pts[(i + 1) % pts.length];
    const cross = (v[0] - p[0]) * (n[1] - v[1]) - (v[1] - p[1]) * (n[0] - v[0]);
    return Math.abs(cross) > 0.01;
  });
  const N = clean.length;
  if (N < 3) return "";
  let d = "";
  clean.forEach((v, i) => {
    const p = clean[(i - 1 + N) % N];
    const n = clean[(i + 1) % N];
    const lin = Math.hypot(v[0] - p[0], v[1] - p[1]);
    const lout = Math.hypot(n[0] - v[0], n[1] - v[1]);
    const r = Math.min(R, lin / 2, lout / 2);
    const a: Pt = [
      v[0] + ((p[0] - v[0]) / lin) * r,
      v[1] + ((p[1] - v[1]) / lin) * r,
    ];
    const b: Pt = [
      v[0] + ((n[0] - v[0]) / lout) * r,
      v[1] + ((n[1] - v[1]) / lout) * r,
    ];
    const cross = (v[0] - p[0]) * (n[1] - v[1]) - (v[1] - p[1]) * (n[0] - v[0]);
    const sweep = cross > 0 ? 1 : 0;
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)} ${a[1].toFixed(2)}`;
    d += `A${r.toFixed(2)} ${r.toFixed(2)} 0 0 ${sweep} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  });
  return `${d}Z`;
}

export function StoryText({
  text = "okay, it’s live — the update you kept asking for is finally here",
  measure,
  accent = "#3B5BFD",
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: StoryTextProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const width = useMeasure();
  const tall = H > W;

  const words = text.split(/\s+/).filter(Boolean);
  const F = tall ? W * 0.115 : H * 0.125;
  const space = width(" ");
  const widths = words.map((w) => width(w));
  const lineOf = wrap(
    widths,
    space,
    (W * (measure ?? (tall ? 0.8 : 0.76))) / F,
  );
  const lineCount = (lineOf[lineOf.length - 1] ?? 0) + 1;

  const lh = F * 1.34;
  const padX = F * 0.36;
  const R = lh * 0.3;

  const appear = words.map((_, i) =>
    Math.max(
      0,
      spring({
        frame: frame - (FIRST_WORD + i * WORD_GAP),
        fps,
        config: CARD,
      }),
    ),
  );
  const ink = words.map((_, i) =>
    interpolate(
      frame,
      [FIRST_WORD + i * WORD_GAP + 2, FIRST_WORD + i * WORD_GAP + WORD_IN + 1],
      [0, 1],
      { ...CLAMP, easing: ENTER },
    ),
  );
  const typedEnd = FIRST_WORD + (words.length - 1) * WORD_GAP + WORD_IN;

  const C1 = typedEnd + 14;
  const C2 = C1 + 22;
  const C3 = C2 + 22;
  const step = (a: number) =>
    interpolate(frame, [a, a + 9], [0, 1], { ...CLAMP, easing: MOVE });
  const toOutline = step(C1);
  const toNone = step(C2);
  const toFill = step(C3);
  const fillAmt = 1 - toOutline + toFill;
  const strokeAmt = toOutline * (1 - toNone);
  const textColor = interpolateColors(fillAmt, [0, 1], [t.fg, t.onFill]);
  const pop = spring({ frame: frame - C3, fps, config: CARD });
  const settle =
    frame >= C3 ? 1 + 0.035 * Math.sin(Math.min(1, pop) * Math.PI) : 1;

  const lines = Array.from({ length: lineCount }, (_, l) => {
    const idx = words.map((_, i) => i).filter((i) => lineOf[i] === l);
    let w = 0;
    const xs: number[] = [];
    idx.forEach((i, k) => {
      const a = appear[i];
      if (k > 0) w += space * F * Math.min(1, a * 3);
      xs.push(w);
      w += widths[i] * F * a;
    });
    const grow = appear[idx[0]] ?? 0;
    return { idx, xs, w, grow };
  });
  const lineH = (g: number) => lh * MOVE(Math.min(1, g * 1.6));
  const totalH = lines.reduce((acc, l) => acc + lineH(l.grow), 0);
  let y = H / 2 - totalH / 2;
  const geo = lines.map((l) => {
    const h = lineH(l.grow);
    const top = y;
    y += h;
    const half = l.w / 2 + padX * Math.min(1, l.grow * 2);
    return { ...l, top, h, x0: W / 2 - half, x1: W / 2 + half };
  });
  const shown = geo.filter((g) => g.h > 0.5 && g.x1 - g.x0 > 1);

  let path = "";
  if (shown.length) {
    const pts: Pt[] = [];
    const first = shown[0];
    pts.push([first.x0, first.top], [first.x1, first.top]);
    shown.forEach((g, i) => {
      pts.push([g.x1, g.top + g.h]);
      const next = shown[i + 1];
      if (next) pts.push([next.x1, g.top + g.h]);
    });
    const last = shown[shown.length - 1];
    pts.push([last.x0, last.top + last.h]);
    for (let i = shown.length - 1; i > 0; i--) {
      pts.push([shown[i].x0, shown[i].top], [shown[i - 1].x0, shown[i].top]);
    }
    path = roundedPath(pts, R);
  }

  const caretOpacity = interpolate(
    frame,
    [typedEnd - 2, typedEnd + 6],
    [1, 0],
    { ...CLAMP, easing: EXIT },
  );
  let caret: { x: number; top: number } | null = null;
  for (let i = words.length - 1; i >= 0; i--) {
    if (appear[i] > 0 || i === 0) {
      const g = geo[lineOf[i]];
      const k = g.idx.indexOf(i);
      caret = {
        x: W / 2 - g.w / 2 + g.xs[k] + widths[i] * F * appear[i] + F * 0.06,
        top: g.top + (lh - F * 1.08) / 2,
      };
      break;
    }
  }

  const push = interpolate(frame, [0, 200], [1, 1.04], CLAMP);

  return (
    <AbsoluteFill style={{ background: t.base, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <GshGround
          preset={groundParams ? undefined : (ground ?? t.ground)}
          params={
            groundParams ??
            (theme === "light" && !ground ? LIGHT_GROUND : undefined)
          }
          timeOffset={theme === "dark" ? 3 : 5}
          timeScale={0.4}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${tall ? "90% 40%" : "60% 55%"} at 50% 50%, rgba(${t.scrim},${t.scrimA}) 0%, rgba(${t.scrim},0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${settle})`, transformOrigin: "50% 50%" }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          {path ? (
            <>
              <defs>
                <filter
                  id={`${uid}-lift`}
                  x="-20%"
                  y="-40%"
                  width="140%"
                  height="180%"
                >
                  <feDropShadow
                    dx="0"
                    dy={F * 0.12}
                    stdDeviation={F * 0.22}
                    floodColor={t.lift}
                  />
                </filter>
              </defs>
              <path
                d={path}
                fill={t.sticker}
                opacity={Math.min(1, fillAmt)}
                filter={`url(#${uid}-lift)`}
              />
              <path
                d={path}
                fill="none"
                stroke={t.fg}
                strokeWidth={Math.max(2, F * 0.045)}
                opacity={strokeAmt}
              />
            </>
          ) : null}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            fontFamily: sans,
            fontWeight: 400,
            clipPath: path ? `path("${path}")` : undefined,
          }}
        >
          {geo.map((g) =>
            g.idx.map((i, k) => {
              const a = ink[i];
              if (a <= 0) return null;
              return (
                <span
                  key={`w-${i}`}
                  style={{
                    position: "absolute",
                    left: W / 2 - g.w / 2 + g.xs[k],
                    top: g.top + (lh - F) / 2,
                    fontSize: F,
                    lineHeight: 1,
                    letterSpacing: `${TRACK}em`,
                    whiteSpace: "pre",
                    color: textColor,
                    textShadow: fillAmt < 0.5 ? t.shadow : undefined,
                    opacity: a,
                    transformOrigin: "0% 80%",
                    transform: `translateY(${(1 - a) * F * 0.22}px) scale(${0.9 + 0.1 * a})`,
                  }}
                >
                  {words[i]}
                </span>
              );
            }),
          )}
          {caret ? (
            <div
              style={{
                position: "absolute",
                left: caret.x,
                top: caret.top,
                width: Math.max(2, F * 0.045),
                height: F * 1.08,
                borderRadius: F,
                background: accent,
                opacity: caretOpacity,
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
