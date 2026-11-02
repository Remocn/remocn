"use client";

import { loadVariableFont } from "@remotion/google-fonts/RobotoFlex";
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

const flex = loadVariableFont("oblique 0deg 10deg", { subsets: ["latin"] });

export interface WidthLockProps {
  before?: string;
  words?: string[];
  after?: string;
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const LIMB = ["#e9ecff", "#8a8bff", "#4b2bd6", "#160c3a"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    ink: "#F4F3F0",
    hl: (a: string) =>
      `linear-gradient(100deg, ${LIMB[0]} 0%, ${LIMB[1]} 30%, color-mix(in oklab, ${a} 78%, ${LIMB[1]}) 62%, ${LIMB[0]} 100%)`,
    haze: (a: string) =>
      [
        `radial-gradient(64% 52% at 50% 122%, color-mix(in oklab, ${LIMB[2]} 46%, transparent) 0%, color-mix(in oklab, ${LIMB[3]} 50%, transparent) 50%, transparent 80%)`,
        `radial-gradient(30% 22% at 50% 106%, color-mix(in oklab, ${a} 24%, transparent) 0%, transparent 80%)`,
      ].join(", "),
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    ink: "#111113",
    hl: (a: string) =>
      `linear-gradient(100deg, ${LIMB[3]} 0%, ${LIMB[2]} 34%, ${a} 64%, ${LIMB[3]} 100%)`,
    haze: (a: string) =>
      `radial-gradient(60% 48% at 50% 120%, color-mix(in oklab, ${LIMB[1]} 34%, transparent) 0%, color-mix(in oklab, ${a} 8%, transparent) 50%, transparent 80%)`,
    grain: 0.035,
  },
} as const;

const WDTH_MIN = 25;
const WDTH_MAX = 151;
const SAMPLES = [25, 35, 50, 65, 80, 100, 115, 130, 151];
const WGHT = 480;
const TRACK = -0.02;
const MAX_EXTRA_TRACK = 0.04;
const LONGEST_AT = 46;
const LINE = 0.98;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 0.85, 0.35);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const LOCK_SPRING = { damping: 13, stiffness: 120, mass: 0.9 };

const fvs = (wdth: number) =>
  `"wdth" ${wdth.toFixed(2)}, "wght" ${WGHT}, "slnt" 0, "opsz" 72`;

type Curve = number[];

function widthAt(curve: Curve, wdth: number) {
  const w = Math.min(WDTH_MAX, Math.max(WDTH_MIN, wdth));
  for (let i = 0; i < SAMPLES.length - 1; i++) {
    if (w <= SAMPLES[i + 1]) {
      const k = (w - SAMPLES[i]) / (SAMPLES[i + 1] - SAMPLES[i]);
      return curve[i] + (curve[i + 1] - curve[i]) * k;
    }
  }
  return curve[curve.length - 1];
}

function solveWdth(curve: Curve, target: number) {
  if (target <= curve[0]) return WDTH_MIN;
  for (let i = 0; i < SAMPLES.length - 1; i++) {
    if (target <= curve[i + 1]) {
      const k = (target - curve[i]) / Math.max(1e-6, curve[i + 1] - curve[i]);
      return SAMPLES[i] + (SAMPLES[i + 1] - SAMPLES[i]) * k;
    }
  }
  return WDTH_MAX;
}

function measure(strings: string[]): Curve[] {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${flex.fontFamily}"`,
    fontStyle: "normal",
    fontSize: "100px",
    lineHeight: "1",
    letterSpacing: `${TRACK}em`,
  });
  document.body.appendChild(probe);
  const curves = strings.map((s) =>
    SAMPLES.map((wd) => {
      probe.style.fontVariationSettings = fvs(wd);
      probe.textContent = s;
      return probe.getBoundingClientRect().width / 100 - TRACK;
    }),
  );
  probe.remove();
  return curves;
}

function useCurves(strings: string[]) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{ key: string; c: Curve[] } | null>(null);
  const [handle] = useState(() => delayRender("width-lock: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      flex.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${flex.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, c: measure(key.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.c : null;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `wl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Fit {
  wdth: number;
  extra: number;
}

const NATURAL: Fit = { wdth: 100, extra: 0 };

export function WidthLock({
  before = "Ship the",
  words = ["trailer", "transitions", "captions", "launch video"],
  after = "by tonight.",
  hold = 30,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: WidthLockProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const list = words.length > 0 ? words : ["launch video"];
  const strings = useMemo(
    () => [before, after, ...list].map((s) => s || " "),
    [before, after, list],
  );
  const curves = useCurves(strings);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!curves) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const measureW = W * (portrait ? 0.86 : 0.74);
  const rows = (before ? 1 : 0) + 1 + (after ? 1 : 0);

  const live = strings
    .map((s, i) => ({ s, curve: curves[i] }))
    .filter((r) => r.s.trim());
  const floor = Math.max(...live.map((r) => r.curve[0]));
  const ceil = Math.min(...live.map((r) => r.curve[r.curve.length - 1]));
  const pref = Math.max(...live.map((r) => widthAt(r.curve, LONGEST_AT)));
  const M =
    ceil >= floor
      ? Math.min(ceil, Math.max(floor, pref))
      : Math.max(floor, 0.1);
  const F = Math.min(
    measureW / M,
    (H * (portrait ? 0.5 : 0.72)) / (rows * LINE),
  );

  const fit = (i: number): Fit => {
    const curve = curves[i];
    const wdth = solveWdth(curve, M);
    const n = Math.max(1, Array.from(strings[i]).length - 1);
    const short = M - widthAt(curve, wdth);
    return {
      wdth,
      extra: short > 0.001 ? Math.min(MAX_EXTRA_TRACK, short / n) : 0,
    };
  };

  const LOCK_AT = 18;
  const FIRST_SWAP = 46;
  const STEP = Math.max(16, hold);
  const swapAt = (k: number) => FIRST_SWAP + (k - 1) * STEP;
  const OUT = 7;
  const IN_AT = 6;
  const IN = 10;
  const SWAP_LOCK = 13;

  const lineH = F * LINE;
  const blockH = rows * lineH;
  const top = H / 2 - blockH / 2 - F * 0.02;
  const cx = W / 2;

  const renderRun = (
    i: number,
    state: Fit,
    key: string,
    style: React.CSSProperties,
    gradient: boolean,
  ) => {
    const s = strings[i];
    const n = Math.max(1, Array.from(s).length - 1);
    const w = (widthAt(curves[i], state.wdth) + state.extra * n) * F;
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: 0,
          height: lineH * 1.24,
          lineHeight: `${lineH * 1.24}px`,
          whiteSpace: "pre",
          fontFamily: flex.fontFamily,
          fontStyle: "normal",
          fontSize: F,
          fontVariationSettings: fvs(state.wdth),
          letterSpacing: `${TRACK + state.extra}em`,
          color: c.ink,
          ...(gradient
            ? {
                backgroundImage: c.hl(accent),
                backgroundSize: `${Math.max(w, 1)}px 100%`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : null),
          ...style,
        }}
      >
        {s}
      </div>
    );
  };

  const lerpFit = (a: Fit, b: Fit, k: number): Fit => ({
    wdth: a.wdth + (b.wdth - a.wdth) * k,
    extra: Math.max(0, a.extra + (b.extra - a.extra) * k),
  });

  const lock = (start: number) =>
    spring({ frame: t - start, fps, config: LOCK_SPRING });

  const riseY = (start: number, len: number) => {
    const p = interpolate(t, [start, start + len], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return { y: (1 - p) * lineH * 0.34, o: p, blur: (1 - p) * F * 0.05 };
  };

  const band = (row: number, children: React.ReactNode, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: top + row * lineH - lineH * 0.12,
        height: lineH * 1.24,
      }}
    >
      {children}
    </div>
  );

  const bands: React.ReactNode[] = [];
  let row = 0;

  const fixed = (idx: number, enterAt: number) => {
    const r = riseY(enterAt, 18);
    const state = lerpFit(NATURAL, fit(idx), lock(LOCK_AT + row * 3));
    bands.push(
      band(
        row,
        renderRun(
          idx,
          state,
          `f${idx}`,
          {
            transform: `translateY(${r.y.toFixed(2)}px)`,
            opacity: r.o,
            filter: r.blur > 0.05 ? `blur(${r.blur.toFixed(2)}px)` : undefined,
          },
          false,
        ),
        `band${row}`,
      ),
    );
    row++;
  };

  if (before) fixed(0, 0);

  {
    const runs: React.ReactNode[] = [];
    list.forEach((_, k) => {
      const idx = 2 + k;
      const enterAt = k === 0 ? 3 : swapAt(k) + IN_AT;
      const lockAt = k === 0 ? LOCK_AT + row * 3 : swapAt(k) + SWAP_LOCK;
      const leaveAt = k < list.length - 1 ? swapAt(k + 1) : null;
      if (t < enterAt - 1) return;
      if (leaveAt !== null && t > leaveAt + OUT + 1) return;
      const r = riseY(enterAt, k === 0 ? 18 : IN);
      const state = lerpFit(NATURAL, fit(idx), lock(lockAt));
      let o = r.o;
      let blur = r.blur;
      let sx = 1;
      if (leaveAt !== null) {
        const p = interpolate(t, [leaveAt, leaveAt + OUT], [0, 1], {
          ...CLAMP,
          easing: EASE_IN,
        });
        sx = 1 - p * 0.94;
        o *= 1 - p;
        blur += p * F * 0.03;
      }
      runs.push(
        renderRun(
          idx,
          state,
          `w${k}`,
          {
            transform: `translateY(${r.y.toFixed(2)}px) scaleX(${sx.toFixed(4)})`,
            opacity: o,
            filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
          },
          true,
        ),
      );
    });
    bands.push(band(row, runs, `band${row}`));
    row++;
  }

  if (after) fixed(1, 6);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {transparent ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: c.haze(accent),
            opacity: interpolate(t, [0, 30], [0.4, 1], CLAMP),
          }}
        />
      )}
      {bands}
      {transparent ? null : <Grain opacity={c.grain} />}
    </AbsoluteFill>
  );
}
