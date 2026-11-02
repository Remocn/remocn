"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface KeycapKey {
  label: string;
  sub?: string;
  width?: number;
}

export interface KeycapPressProps {
  keys?: (string | KeycapKey)[];
  label?: string;
  material?: "dark" | "light";
  theme?: "dark" | "light";
  accent?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const DEFAULT_KEYS: KeycapKey[] = [
  { label: "⌘", sub: "command", width: 1.25 },
  { label: "K" },
];

const LIGHT_GLASS: Partial<GradientParams> = {
  colors: ["#a9bbff", "#3b5bfd", "#1a2a9e", "#8fa6ff"],
};
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const MATERIALS = {
  dark: {
    top: [0x36, 0x36, 0x3c],
    sideTop: [0x2e, 0x2e, 0x34],
    sideBottom: [0x10, 0x10, 0x13],
    legend: "#ECEBE7",
    sub: "#8F8E95",
    rim: 0.3,
    dish: 0.34,
    sheen: 0.11,
    front: 0.4,
    left: 0.07,
    right: 0.45,
    shadow: "rgba(0,0,0,0.95)",
  },
  light: {
    top: [0xf7, 0xf6, 0xf2],
    sideTop: [0xe9, 0xe7, 0xe1],
    sideBottom: [0xa9, 0xa5, 0x9b],
    legend: "#2A2A2E",
    sub: "#8C8981",
    rim: 0.9,
    dish: 0.07,
    sheen: 0.5,
    front: 0.14,
    left: 0.35,
    right: 0.16,
    shadow: "rgba(58,48,32,0.5)",
  },
} as const;

const STAGES = {
  dark: {
    base: "#04050A",
    fg: "#F3F2EF",
    muted: "rgba(243,242,239,0.5)",
    ripple: "255,255,255",
    scrim: "4,5,10",
    scrimA: 0.42,
    glowA: 0.34,
    glowBlend: "screen",
  },
  light: {
    base: "#EEF0F6",
    fg: "#121214",
    muted: "rgba(18,18,20,0.5)",
    ripple: "96,88,74",
    scrim: "244,244,247",
    scrimA: 0.4,
    glowA: 0.16,
    glowBlend: "multiply",
  },
} as const;

const SYMBOLS: Record<string, string> = {
  "⌘": "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",
  "⌥": "M3 5h6l6 14h6M14 5h7",
  "⇧": "M9 19v-6H5l7-8 7 8h-4v6z",
};

type Material = (typeof MATERIALS)[keyof typeof MATERIALS];

function rgb(c: readonly number[]) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function mix(a: readonly number[], b: readonly number[], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const SLICES = 18;

function profile(tt: number) {
  const fillet = Math.max(0, (tt - 0.72) / 0.28) ** 2;
  return tt * 0.68 + fillet * 0.32;
}

function Keycap({
  w,
  d,
  h,
  keyDef,
  m,
  unit,
}: {
  w: number;
  d: number;
  h: number;
  keyDef: KeycapKey;
  m: Material;
  unit: number;
}) {
  const side = unit * 0.13;
  const front = unit * 0.17;
  const back = unit * 0.08;
  const r0 = unit * 0.1;
  const r1 = unit * 0.085;
  const slices: React.ReactNode[] = [];
  for (let k = 0; k < SLICES; k++) {
    const tt = k / (SLICES - 1);
    const p = profile(tt);
    const base = mix(m.sideBottom, m.sideTop, Math.min(1, tt * 1.15));
    const rim = Math.max(0, (tt - 0.7) / 0.3);
    slices.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: side * p,
          right: side * p,
          top: back * p,
          bottom: front * p,
          borderRadius: r0 + (r1 - r0) * tt,
          transform: `translateZ(${tt * h}px)`,
          background: [
            `linear-gradient(180deg, rgba(255,255,255,${m.rim * rim * 0.5}) 0%, transparent 40%, rgba(0,0,0,${m.front * (1 - rim * 0.5)}) 100%)`,
            `linear-gradient(90deg, rgba(255,255,255,${m.left + rim * m.rim * 0.25}) 0%, transparent 30%, transparent 62%, rgba(0,0,0,${m.right}) 100%)`,
            rgb(base),
          ].join(", "),
        }}
      />,
    );
  }
  const topInset = profile(1);
  const legendSize = unit * (keyDef.label.length > 1 ? 0.2 : 0.36);
  return (
    <div
      style={{
        position: "absolute",
        left: -w / 2,
        top: -d / 2,
        width: w,
        height: d,
        transformStyle: "preserve-3d",
      }}
    >
      {slices}
      <div
        style={{
          position: "absolute",
          left: side * topInset,
          right: side * topInset,
          top: back * topInset,
          bottom: front * topInset,
          borderRadius: r1,
          transform: `translateZ(${h + 0.5}px)`,
          background: [
            `radial-gradient(ellipse 72% 64% at 50% 54%, rgba(0,0,0,${m.dish * 0.5}) 0%, rgba(0,0,0,${m.dish * 0.18}) 55%, transparent 100%)`,
            `linear-gradient(160deg, rgba(255,255,255,${m.sheen}) 0%, transparent 45%)`,
            rgb(m.top),
          ].join(", "),
          boxShadow: `inset 0 ${unit * 0.012}px 0 rgba(255,255,255,${m.rim * 0.5}), inset 0 -${unit * 0.02}px ${unit * 0.03}px rgba(0,0,0,${m.dish * 0.5})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: legendSize,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: m.legend,
            paddingBottom: keyDef.sub ? unit * 0.06 : 0,
          }}
        >
          {SYMBOLS[keyDef.label] ? (
            <svg
              width={legendSize * 0.86}
              height={legendSize * 0.86}
              viewBox="0 0 24 24"
              fill="none"
              stroke={m.legend}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={SYMBOLS[keyDef.label]} />
            </svg>
          ) : (
            keyDef.label
          )}
        </div>
        {keyDef.sub ? (
          <div
            style={{
              position: "absolute",
              left: unit * 0.09,
              bottom: unit * 0.07,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: unit * 0.085,
              letterSpacing: "0.01em",
              color: m.sub,
            }}
          >
            {keyDef.sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function KeycapPress({
  keys = DEFAULT_KEYS,
  label = "Everything, one shortcut away",
  material = "dark",
  theme,
  accent = "#3B5BFD",
  ground,
  groundParams,
  speed = 1,
}: KeycapPressProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const u = tall ? width / 760 : Math.min(width / 1280, height / 720);
  const m = MATERIALS[material];
  const look = theme ?? material;
  const stage = STAGES[look];
  const resolvedGround: GshPresetId | undefined =
    ground ??
    (groundParams ? undefined : look === "dark" ? "spotlight" : "glasswork");
  const acc = hexToRgb(accent);

  const defs: KeycapKey[] = keys.map((k) =>
    typeof k === "string" ? { label: k } : k,
  );
  const unit = 205 * u * (tall ? 1.22 : 1) * (defs.length > 2 ? 0.82 : 1);
  const gap = unit * 0.1;
  const widths = defs.map((k) => (k.width ?? 1) * unit);
  const total = widths.reduce((s, x) => s + x, 0) + gap * (defs.length - 1);
  const centers: number[] = [];
  let cursor = -total / 2;
  for (const w of widths) {
    centers.push(cursor + w / 2);
    cursor += w + gap;
  }
  const depth = unit;
  const capH = unit * 0.44;
  const travel = unit * 0.13;
  const n = defs.length;
  const pressGap = n > 2 ? 10 : 12;
  const pressAt = defs.map((_, i) => 36 + i * pressGap);
  const chord = pressAt[n - 1];
  const releaseAt = defs.map((_, i) => chord + 22 + (n - 1 - i) * 4);
  const settle = spring({
    frame: t,
    fps,
    config: HEAVY,
    durationInFrames: 54,
  });
  const lift = interpolate(t, [chord + 2, chord + 34], [0, 1], {
    ...CLAMP,
    easing: CAMERA,
  });
  const rotX = 50 - settle * 8 - lift * 3;
  const rotZ = interpolate(t, [0, 135], [-9, -4], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 1.04 - settle * 0.04 - lift * 0.06;
  const kick = interpolate(t, [chord, chord + 3, chord + 14], [0, 1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const keysY =
    height * ((tall ? 0.42 : 0.46) - lift * (tall ? 0.05 : 0.08)) +
    kick * 2 * u;
  const perspective = 1800 * u;

  const keyState = defs.map((_, i) => {
    const rise = spring({
      frame: t - (-8 + i * 5),
      fps,
      config: CARD,
    });
    const down = Math.min(
      1.06,
      spring({
        frame: t - pressAt[i],
        fps,
        config: { mass: 0.4, damping: 14, stiffness: 320 },
      }),
    );
    const up = spring({
      frame: t - releaseAt[i],
      fps,
      config: CHIP,
    });
    const press = down * (1 - up);
    return { rise, press };
  });

  const camera = (children: React.ReactNode) => (
    <AbsoluteFill
      style={{
        perspective,
        perspectiveOrigin: `50% ${(keysY / height) * 100}%`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: keysY,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `scale(${camScale}) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
  const ripples: React.ReactNode[] = [];
  defs.forEach((_, i) => {
    const age = t - pressAt[i];
    if (age < 0 || age > 34) return;
    const p = interpolate(age, [0, 34], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const size = widths[i] * (1.05 + p * 1.5);
    const sizeY = depth * (1.05 + p * 1.5);
    ripples.push(
      <div
        key={`r${i}`}
        style={{
          position: "absolute",
          left: centers[i] - size / 2,
          top: -sizeY / 2 + depth * 0.04,
          width: size,
          height: sizeY,
          borderRadius: unit * (0.2 + p * 0.5),
          border: `${unit * 0.035}px solid rgba(${stage.ripple},${(1 - p) * 0.12})`,
          boxShadow: `0 0 ${unit * 0.1}px rgba(${acc},${(1 - p) * 0.22})`,
          filter: `blur(${unit * (0.012 + p * 0.03)}px)`,
        }}
      />,
    );
  });
  const chordAge = t - chord;
  if (chordAge >= 0 && chordAge < 50) {
    for (const [lag, strength] of [
      [0, 1],
      [7, 0.55],
    ] as const) {
      const a = chordAge - lag;
      if (a < 0) continue;
      const p = interpolate(a, [0, 44], [0, 1], { ...CLAMP, easing: EASE_OUT });
      const sx = total * (1.1 + p * 1.6);
      const sy = depth * (1.1 + p * 2.6);
      ripples.push(
        <div
          key={`c${lag}`}
          style={{
            position: "absolute",
            left: -sx / 2,
            top: -sy / 2 + depth * 0.05,
            width: sx,
            height: sy,
            borderRadius: "50%",
            border: `${unit * 0.04}px solid rgba(${stage.ripple},${(1 - p) * 0.1 * strength})`,
            boxShadow: `0 0 ${unit * 0.14}px rgba(${acc},${(1 - p) * 0.22 * strength}), inset 0 0 ${unit * 0.14}px rgba(${acc},${(1 - p) * 0.14 * strength})`,
            filter: `blur(${unit * (0.015 + p * 0.035)}px)`,
          }}
        />,
      );
    }
  }
  const poolFlash = interpolate(chordAge, [0, 3, 30], [0, 1, 0], CLAMP);
  const glowRest = interpolate(t, [6, 40], [0, 0.35], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const glowHold = interpolate(chordAge, [0, 4, 40], [0, 1, 0.7], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const glow = Math.max(glowRest, glowHold);
  const glowSpread =
    1 +
    0.12 *
      interpolate(chordAge, [0, 40], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
  const gx = 50 + Math.sin(t / 47) * 1.5;
  const underglow = `radial-gradient(closest-side at ${gx}% 50%, rgba(${acc},${stage.glowA}) 0%, rgba(${acc},${stage.glowA * 0.45}) 55%, transparent 100%)`;

  const floor = camera(
    <>
      <div
        style={{
          position: "absolute",
          left: -total,
          top: -depth * 1.4,
          width: total * 2,
          height: depth * 2.8,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, rgba(${acc},${0.16 * poolFlash}), transparent)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -total * 0.95 * glowSpread,
          top: -depth * 1.1 * glowSpread + depth * 0.05,
          width: total * 1.9 * glowSpread,
          height: depth * 2.2 * glowSpread,
          background: underglow,
          opacity: glow,
          mixBlendMode: stage.glowBlend,
          filter: `blur(${unit * 0.12}px)`,
        }}
      />
      {ripples}
      {defs.map((_, i) => {
        const { rise, press } = keyState[i];
        const w = widths[i];
        const tight = press;
        const spread = (1 - tight) * 0.5 + 0.5;
        return (
          <div key={`s${i}`}>
            <div
              style={{
                position: "absolute",
                left: centers[i] - w * 0.55 + unit * 0.04,
                top: -depth * 0.5 + depth * 0.14,
                width: w * 1.1,
                height: depth * 1.1,
                borderRadius: unit * 0.24,
                background: m.shadow,
                opacity: 0.55 * rise * (0.85 + tight * 0.15),
                filter: `blur(${unit * (0.16 + spread * 0.12)}px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: centers[i] - w * 0.48,
                top: -depth * 0.48 + depth * 0.03,
                width: w * 0.96,
                height: depth * 0.96,
                borderRadius: unit * 0.12,
                background: m.shadow,
                opacity: (0.6 + tight * 0.3) * rise,
                filter: `blur(${unit * (0.045 + (1 - tight) * 0.04)}px)`,
              }}
            />
          </div>
        );
      })}
    </>,
  );

  const caps = camera(
    defs.map((k, i) => {
      const { rise, press } = keyState[i];
      const off = 1 - rise;
      const z = unit * 0.035 - press * travel - off * unit * 0.6;
      const y = off * unit * 2.6;
      const tilt = off * -24;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: centers[i],
            top: 0,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translate3d(0, ${y}px, ${z}px) rotateX(${tilt}deg)`,
          }}
        >
          <Keycap
            w={widths[i] - unit * 0.02}
            d={depth}
            h={capH}
            keyDef={k}
            m={m}
            unit={unit}
          />
        </div>
      );
    }),
  );
  const words = label.split(" ");
  const word = (i: number) =>
    interpolate(t, [chord + 6 + i * 3, chord + 26 + i * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  return (
    <AbsoluteFill style={{ background: stage.base, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={groundParams ?? (look === "light" ? LIGHT_GLASS : undefined)}
        timeOffset={look === "dark" ? 2 : 5}
        timeScale={0.45}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at 50% ${tall ? 42 : 46}%, rgba(${stage.scrim},${stage.scrimA}) 0%, rgba(${stage.scrim},${stage.scrimA * 0.4}) 100%)`,
        }}
      />
      {floor}
      {caps}
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          top: height * (tall ? 0.6 : 0.7),
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 300,
          fontSize: (tall ? 72 : 60) * u,
          lineHeight: 1.08,
          letterSpacing: "-0.04em",
          color: stage.fg,
          textWrap: "balance",
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: word(i),
              transform: `translateY(${(1 - word(i)) * 14 * u}px)`,
              filter: `blur(${(1 - word(i)) * 5 * u}px)`,
            }}
          >
            {i < words.length - 1 ? `${w} ` : w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}
