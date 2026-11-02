"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const figtree = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

export interface FigureReelsProps {
  from?: number;
  to?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  images?: string[];
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#f3f1f4",
  colors: ["#e9defc", "#c9b8f2", "#f6d2c4", "#f3f1f4"],
  speed: 0.8,
  loopSeconds: 14,
  scale: 0.9,
  warp: 0.45,
  blur: 0.7,
  grain: 0.2,
  seed: 21,
};

const THEMES = {
  dark: {
    ink: "#f4f1fb",
    dim: "rgba(244,241,251,0.6)",
    accent: "#c6b4ff",
    ground: "nightfold" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 4,
    scrim: "4,3,9",
    scrimAlpha: 0.45,
    shade: "4,3,9",
    tileShadow:
      "0 1px 2px rgba(0,0,0,0.35), 0 10px 24px rgba(0,0,0,0.35), 0 30px 60px rgba(0,0,0,0.35)",
    tileEdge: "inset 0 0 0 1px rgba(255,255,255,0.1)",
  },
  light: {
    ink: "#17141f",
    dim: "rgba(23,20,31,0.55)",
    accent: "#6a48e8",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "243,241,244",
    scrimAlpha: 0.4,
    shade: "243,241,244",
    tileShadow:
      "0 1px 2px rgba(40,30,70,0.1), 0 10px 24px rgba(40,30,70,0.12), 0 30px 60px rgba(40,30,70,0.14)",
    tileEdge: "inset 0 0 0 1px rgba(255,255,255,0.25)",
  },
};

const DEFAULT_IMAGES = [
  "reel/reel-1.jpg",
  "reel/reel-2.jpg",
  "templates/launch-anything/horizon.jpg",
  "templates/product-showcase/courtyard.jpg",
  "reel/reel-4.jpg",
  "reel/reel-5.jpg",
  "reel/reel-6.jpg",
  "reel/reel-3.jpg",
];

const BEAT = {
  steps: [[8], [-3, 17], [-3, 11, 23], [-3, 9, 19, 27]],
  stepLen: 7,
  carry: 40,
  carryStep: 2,
  pull: 48,
  reelSpin: 30,
  reelStart: 22,
  label: 69,
  accentOut: 96,
  step: 100,
};

const FONT_PX = 200;
const ROLL = Easing.bezier(0.83, 0, 0.17, 1);
const LABEL_IN = Easing.bezier(0.32, 0.72, 0, 1);
const COLOR = Easing.bezier(0.65, 0, 0.35, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const REEL = { mass: 1.2, damping: 20, stiffness: 52 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Metrics {
  slot: number;
  text: (s: string, weight: number) => number;
}

function buildMetrics(_version: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  const text = (s: string, weight: number) => {
    const key = `${weight}|${s}`;
    if (cache[key] === undefined) {
      if (!ctx) return s.length * 0.55;
      ctx.font = `${weight} ${FONT_PX}px "${figtree.fontFamily}"`;
      cache[key] = ctx.measureText(s).width / FONT_PX;
    }
    return cache[key];
  };
  let slot = 0;
  for (let d = 0; d < 10; d++) slot = Math.max(slot, text(String(d), 300));
  return { slot, text };
}

function useMetrics() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("figure-reels: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      figtree.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`300 100px "${figtree.fontFamily}"`),
      document.fonts.load(`400 100px "${figtree.fontFamily}"`),
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
  return useMemo(() => buildMetrics(version), [version]);
}

function BlurDefs({ items }: { items: { id: string; y: number }[] }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      {items.map((it) => (
        <filter
          key={it.id}
          id={it.id}
          x="-40%"
          y="-60%"
          width="180%"
          height="220%"
        >
          <feGaussianBlur stdDeviation={`0 ${it.y.toFixed(2)}`} />
        </filter>
      ))}
    </svg>
  );
}

function colPos(v: number, k: number) {
  const p = 10 ** k;
  if (k === 0) return v;
  const base = Math.floor(v / p);
  const rem = v - base * p;
  return base + Math.max(0, rem - (p - 1));
}

export function FigureReels({
  from = 396,
  to = 400,
  prefix = "$",
  suffix = "M",
  label = "Announcing",
  images = DEFAULT_IMAGES,
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: FigureReelsProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMetrics();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const portrait = H > W * 1.1;

  const target = Math.max(1, Math.round(to));
  const start = Math.max(0, Math.min(target - 1, Math.round(from)));
  const digits = String(target).length;
  const grouped = digits > 4;

  const range = target - 1 - start;
  const nSteps = Math.min(BEAT.steps.length, range);
  const weights = [0.5, 0.25, 0.15, 0.1].slice(0, nSteps);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const deltas: number[] = [];
  let left = range;
  for (let i = 0; i < nSteps; i++) {
    const d =
      i === nSteps - 1
        ? left
        : range <= BEAT.steps.length
          ? 1
          : Math.max(1, Math.round((range * weights[i]) / wSum));
    deltas.push(d);
    left -= d;
  }
  const stepStarts = BEAT.steps[Math.max(0, nSteps - 1)];

  const valueAt = (f: number, k: number) => {
    let v = start;
    for (let i = 0; i < nSteps; i++) {
      v +=
        deltas[i] *
        interpolate(f, [stepStarts[i], stepStarts[i] + BEAT.stepLen], [0, 1], {
          ...CLAMP,
          easing: ROLL,
        });
    }
    const carry = spring({
      frame: f - BEAT.carry - k * BEAT.carryStep,
      fps,
      config: CHIP,
    });
    return v + carry;
  };

  const pool = images.length > 0 ? images : DEFAULT_IMAGES;
  const topImgs = pool.filter((_, i) => i % 2 === 0);
  const botImgs = pool.filter((_, i) => i % 2 === 1);
  const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));

  const blurItems: { id: string; y: number }[] = [];
  let content: React.ReactNode = <div />;

  if (m) {
    const cx = W / 2;
    const cy = H / 2;
    const preW = prefix ? m.text(prefix, 300) : 0;
    const sufW = suffix ? m.text(suffix, 300) : 0;
    const sepW = m.text(",", 300) * 0.9;
    const seps = grouped ? Math.floor((digits - 1) / 3) : 0;
    const figEm = preW + sufW + digits * m.slot + seps * sepW;

    const S = Math.min(
      portrait ? W * 0.21 : H * 0.18,
      (W * (portrait ? 0.8 : 0.5)) / figEm,
    );
    const FW = figEm * S;
    const Zc = (W * (portrait ? 0.9 : 0.86)) / FW;
    const lh = S * 1.06;

    const tw = portrait
      ? W * 0.66
      : Math.max(W * 0.3, Math.min(W * 0.36, FW * 1.12));
    const th = Math.min(tw * (portrait ? 0.68 : 0.5), portrait ? H : H * 0.27);
    const e = S * 0.24;
    const bandTop = cy - lh * 0.5 - S * 0.14 - e - S * 0.34;
    const bandBot = cy + lh * 0.5 + S * 0.3;
    const topCy = bandTop - th / 2;
    const botCy = bandBot + th / 2;
    const eyebrowCy = cy - lh * 0.5 - S * 0.14 - e / 2;

    const pull = spring({ frame: frame - BEAT.pull, fps, config: HEAVY });
    const pullPrev = spring({
      frame: frame - 1 - BEAT.pull,
      fps,
      config: HEAVY,
    });
    const push = interpolate(frame, [0, durationInFrames], [1, 1.04], CLAMP);
    const lnZ = Math.log(Zc) * (1 - pull);
    const Z = Math.exp(lnZ) * push;
    const zoomVel = Math.abs(Math.log(Zc) * (pull - pullPrev));
    const zoomBlur = Math.min(6, zoomVel * 40);

    const colorP =
      interpolate(frame, [BEAT.carry, BEAT.carry + 6], [0, 1], {
        ...CLAMP,
        easing: COLOR,
      }) *
      (1 -
        interpolate(frame, [BEAT.accentOut, BEAT.accentOut + 18], [0, 1], {
          ...CLAMP,
          easing: COLOR,
        }));
    const figColor = `color-mix(in oklab, ${hi} ${(colorP * 100).toFixed(1)}%, ${inkC})`;

    const cells: React.ReactNode[] = [];
    let x = cx - FW / 2;
    const glyph = (s: string, w: number, key: string) => {
      cells.push(
        <div
          key={key}
          style={{
            position: "absolute",
            left: x,
            top: cy - lh / 2,
            width: w * S,
            height: lh,
            lineHeight: `${lh}px`,
            fontSize: S,
            textAlign: "center",
          }}
        >
          {s}
        </div>,
      );
      x += w * S;
    };
    if (prefix) glyph(prefix, preW, "pre");
    for (let j = 0; j < digits; j++) {
      const k = digits - 1 - j;
      const p = colPos(valueAt(frame, k), k);
      const pPrev = colPos(valueAt(frame - 1, k), k);
      const vel = Math.abs(p - pPrev);
      const blur = Math.min(lh * 0.1, vel * lh * 0.28);
      const fid = `${uid}c${j}`;
      blurItems.push({ id: fid, y: blur });
      const base = Math.floor(p);
      const leading = k > 0 && valueAt(frame, k) < 10 ** k;
      const nodes: React.ReactNode[] = [];
      const boxH = lh * 1.7;
      const boxPad = (boxH - lh) / 2;
      for (let q = base - 1; q <= base + 2; q++) {
        const off = (q - p) * lh;
        const d = ((q % 10) + 10) % 10;
        nodes.push(
          <div
            key={q}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: boxPad + off,
              height: lh,
              opacity:
                (leading && d === 0 && q <= 0 ? 0 : 1) *
                Math.max(0, Math.min(1, 1.15 - Math.abs(q - p) * 1.15)),
            }}
          >
            {d}
          </div>,
        );
      }
      cells.push(
        <div
          key={`d${j}`}
          style={{
            position: "absolute",
            left: x - m.slot * S * 0.3,
            top: cy - boxH / 2,
            width: m.slot * S * 1.6,
            height: boxH,
            lineHeight: `${lh}px`,
            fontSize: S,
            textAlign: "center",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 4%, #000 26%, #000 74%, transparent 96%)",
            maskImage:
              "linear-gradient(180deg, transparent 4%, #000 26%, #000 74%, transparent 96%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              filter: blur > 0.15 ? `url(#${fid})` : undefined,
            }}
          >
            {nodes}
          </div>
        </div>,
      );
      x += m.slot * S;
      if (grouped && k > 0 && k % 3 === 0) glyph(",", sepW, `s${j}`);
    }
    if (suffix) glyph(suffix, sufW, "suf");

    const reelSpin = (f: number, delay: number) =>
      spring({ frame: f - BEAT.reelStart - delay, fps, config: REEL });
    const stepSpring = (f: number) =>
      spring({ frame: f - BEAT.step, fps, config: CARD });
    const reelPos = (f: number, delay: number) =>
      -BEAT.reelSpin * 0.25 * (1 - reelSpin(f, delay)) + stepSpring(f);

    const alpha = 32;
    const R = th / (2 * Math.sin(((alpha / 2) * Math.PI) / 180));

    const reach = 1 - Math.min(1, Math.max(0, pull));
    const reelShift = reach * H * 0.55;
    const reelOpacity = interpolate(pull, [0, 0.25], [0, 1], CLAMP);
    const margin = S * 0.3;

    const reel = (
      imgs: string[],
      ccy0: number,
      dir: 1 | -1,
      delay: number,
      key: string,
    ) => {
      const ccy = ccy0 + dir * reelShift;
      const s = reelPos(frame, delay);
      const sPrev = reelPos(frame - 1, delay);
      const vel = Math.abs(s - sPrev);
      const blur = Math.min(th * 0.12, vel * th * 0.22);
      const fid = `${uid}${key}`;
      blurItems.push({ id: fid, y: blur });
      const tiles: React.ReactNode[] = [];
      const base = Math.floor(s);
      for (let j = base - 4; j <= base + 4; j++) {
        const theta = (j - s) * alpha * dir;
        if (Math.abs(theta) > 84) continue;
        const cosT = Math.cos((theta * Math.PI) / 180);
        const figureSide = dir === -1 ? theta > 0 : theta < 0;
        const sideFade = figureSide
          ? Math.max(0, Math.min(1, 1 - (Math.abs(theta) / alpha - 0.3) / 0.45))
          : 1;
        const img = imgs[((j % imgs.length) + imgs.length) % imgs.length];
        tiles.push(
          <div
            key={j}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateZ(${(-R).toFixed(2)}px) rotateX(${(-theta).toFixed(3)}deg) translateZ(${R.toFixed(2)}px)`,
              backfaceVisibility: "hidden",
              opacity: sideFade,
              borderRadius: tw * 0.05,
              overflow: "hidden",
              boxShadow: `${c.tileShadow}, ${c.tileEdge}`,
            }}
          >
            <Img
              src={src(img)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(${c.shade},${Math.min(0.92, (1 - cosT) * 1.5).toFixed(3)})`,
              }}
            />
          </div>,
        );
      }
      return (
        <div
          key={key}
          style={{
            position: "absolute",
            left: cx - tw / 2,
            top: ccy - th / 2,
            width: tw,
            height: th,
            opacity: reelOpacity,
            filter: blur > 0.2 ? `url(#${fid})` : undefined,
            clipPath:
              dir === -1
                ? `inset(-400% -40% ${(-margin).toFixed(1)}px -40%)`
                : `inset(${(-margin).toFixed(1)}px -40% -400% -40%)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              perspective: R * 3.2,
              transformStyle: "preserve-3d",
            }}
          >
            {tiles}
          </div>
        </div>
      );
    };

    const labelIn = interpolate(frame, [BEAT.label, BEAT.label + 15], [0, 1], {
      ...CLAMP,
      easing: LABEL_IN,
    });
    const logoIn = spring({ frame: frame - BEAT.label + 3, fps, config: CHIP });
    const logoE = Math.min(1, Math.max(0, logoIn));
    const labelPx = m.text(label, 400) * e;
    const logoW = e * 3.9;
    const gapL = e * 0.5;
    const rowW = logoW + (label ? gapL + labelPx : 0);

    const eyebrow = (
      <div
        style={{
          position: "absolute",
          left: cx - rowW / 2,
          top: eyebrowCy - e / 2,
          height: e,
          display: "flex",
          alignItems: "center",
          gap: gapL,
        }}
      >
        <div
          style={{
            opacity: logoE,
            transform: `translateY(${((1 - logoIn) * e * 0.8).toFixed(2)}px) scale(${(0.8 + 0.2 * logoIn).toFixed(4)})`,
          }}
        >
          <RemocnLogo fontSize={e} color={inkC} />
        </div>
        {label ? (
          <div
            style={{
              clipPath: `inset(-20% ${((1 - labelIn) * 100).toFixed(2)}% -20% 0)`,
              fontFamily: figtree.fontFamily,
              fontWeight: 400,
              fontSize: e,
              lineHeight: 1,
              letterSpacing: "-0.005em",
              color: c.dim,
              whiteSpace: "pre",
              transform: `translateX(${((1 - labelIn) * -e * 0.8).toFixed(2)}px)`,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    );

    content = (
      <AbsoluteFill
        style={{
          filter: zoomBlur > 0.1 ? `blur(${zoomBlur.toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformOrigin: "0 0",
            transform: `translate(${cx}px, ${cy}px) scale(${Z.toFixed(5)}) translate(${-cx}px, ${-cy}px)`,
          }}
        >
          {reel(topImgs, topCy, -1, 0, "rt")}
          {reel(botImgs, botCy, 1, 3, "rb")}
          <div
            style={{
              position: "absolute",
              inset: 0,
              fontFamily: figtree.fontFamily,
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: figColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {cells}
          </div>
          {eyebrow}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "90% 50%" : "60% 70%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      <BlurDefs items={blurItems} />
      {content}
    </AbsoluteFill>
  );
}

export default FigureReels;
