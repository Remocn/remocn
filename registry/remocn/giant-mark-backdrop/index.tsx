"use client";

import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});
const instrument = loadInstrument("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const R_W = 124.06;
const R_H = 134.26;
const EM = 100;
const R_WE = (0.76 * R_W) / R_H;
const GAP_E = 0.04;
const TRACK = -0.025;
const WORD = "emocn";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const FLOOD = Easing.bezier(0.83, 0, 0.17, 1);
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const BALLOON = { mass: 1, damping: 20, stiffness: 110 };

const B = {
  mark: -3,
  type: 6,
  typeStep: 3,
  flood: 40,
  floodLen: 16,
  balloon: 42,
  card: 54,
  prompt: 66,
  promptEnd: 94,
  send: 100,
  end: 126,
};

export const GIANT_MARK_BACKDROP_DURATION = B.end;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function useWordWidth() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() =>
    delayRender("giant-mark-backdrop: measuring"),
  );
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      manrope.waitUntilDone(),
      instrument.waitUntilDone(),
      document.fonts.load(`600 ${EM}px "${manrope.fontFamily}"`),
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
  return useMemo(() => measureWord(version), [version]);
}

function measureWord(_version: number) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 2.95;
  ctx.font = `600 ${EM}px "${manrope.fontFamily}"`;
  return ctx.measureText(WORD).width / EM + TRACK * WORD.length;
}

type Palette = {
  mark: string;
  word: string;
  floodBg: string;
  giant: string;
  giantMark: string;
  grain: number;
  panel: string;
  ink: string;
  muted: string;
  faint: string;
  hairline: string;
  highlight: string;
  row: string;
  shadow: string;
  send: string;
  accent: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  backdrop: string;
};

const THEMES: Record<"dark" | "light", Palette> = {
  dark: {
    mark: "#4a6bff",
    word: "#f3f4f8",
    floodBg: "#f1ece3",
    giant: "#3b5bfd",
    giantMark: "#3b5bfd",
    grain: 0.07,
    panel: "#ffffff",
    ink: "#15161c",
    muted: "rgba(21,22,28,0.56)",
    faint: "rgba(21,22,28,0.34)",
    hairline: "rgba(20,22,40,0.09)",
    highlight: "inset 0 1px 0 rgba(255,255,255,1)",
    row: "rgba(24,28,52,0.05)",
    shadow: "54,44,30",
    send: "#15161c",
    accent: "#3b5bfd",
    ground: "velvet-hour",
    groundParams: undefined,
    backdrop: "#03040b",
  },
  light: {
    mark: "#2f4ff0",
    word: "#14161d",
    floodBg: "#2a47ea",
    giant: "#f2eee6",
    giantMark: "#f2eee6",
    grain: 0.09,
    panel: "#ffffff",
    ink: "#15161c",
    muted: "rgba(21,22,28,0.56)",
    faint: "rgba(21,22,28,0.34)",
    hairline: "rgba(20,22,40,0.08)",
    highlight: "inset 0 1px 0 rgba(255,255,255,1)",
    row: "rgba(24,28,52,0.05)",
    shadow: "8,16,70",
    send: "#15161c",
    accent: "#2f4ff0",
    ground: "glasswork",
    groundParams: undefined,
    backdrop: "#f3f2ef",
  },
};

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  plus: "M12 5v14M5 12h14",
  clip: "M15.5 7.5l-6.4 6.4a2 2 0 002.8 2.8l7-7a4 4 0 00-5.6-5.6l-7 7a6 6 0 008.5 8.5l5.2-5.2",
  styles:
    "M12 4a8 8 0 100 16c1.1 0 1.6-.8 1.3-1.7-.4-1.1.3-2.3 1.5-2.3H17a3 3 0 003-3c0-5-3.6-9-8-9zM7.5 12.5h.01M9.5 8h.01M14.5 8h.01",
  mic: "M12 4a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-5 0v-5A2.5 2.5 0 0112 4zM6.5 11a5.5 5.5 0 0011 0M12 16.5V20",
  send: "M12 19V5M6 11l6-6 6 6",
};

function Wordmark({
  word,
  frame,
  typed,
}: {
  word: string;
  frame: number;
  typed: boolean;
}) {
  const chars = Array.from(WORD);
  return (
    <text
      x={(R_WE + GAP_E) * EM}
      y={0}
      fill={word}
      style={{
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize: EM,
        letterSpacing: `${TRACK}em`,
      }}
    >
      {chars.map((c, i) => {
        const t = typed
          ? 1
          : interpolate(
              frame,
              [B.type + i * B.typeStep, B.type + i * B.typeStep + 3],
              [0, 1],
              CLAMP,
            );
        return (
          <tspan key={`${c}-${i.toString()}`} fillOpacity={t}>
            {c}
          </tspan>
        );
      })}
    </text>
  );
}

export interface GiantMarkBackdropProps {
  theme?: "dark" | "light";
  accent?: string;
  prompt?: string;
  placeholder?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function GiantMarkBackdrop({
  theme = "dark",
  accent,
  prompt = "Make a launch film for our v2 release",
  placeholder = "Describe your launch film",
  ground,
  groundParams,
}: GiantMarkBackdropProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const base = THEMES[theme];
  const c = accent ? { ...base, accent, mark: accent } : base;
  const tall = H > W * 1.1;
  const u = tall ? W / 600 : H / 720;
  const wordW = useWordWidth();
  const TW = R_WE + GAP_E + wordW;

  const F0 = tall ? W * 0.2 : W * 0.112;
  const F1 = tall ? W * 1.12 : W / 1.75;
  const a0 = { x: TW / 2, y: -0.38 };
  const a1 = { x: R_WE + GAP_E + wordW * 0.43, y: -0.265 };
  const s0 = { x: W / 2, y: H / 2 };
  const s1 = { x: tall ? W * 0.5 : W / 2, y: tall ? H * 0.5 : H * 0.36 };

  const markIn = spring({ frame: frame - B.mark, fps, config: CHIP });
  const balloon = spring({ frame: frame - B.balloon, fps, config: BALLOON });
  const pushA = interpolate(frame, [0, B.balloon], [1, 1.04], CLAMP);
  const pushB = interpolate(frame, [B.balloon + 12, B.end], [1, 1.07], {
    ...CLAMP,
    easing: Easing.bezier(0.33, 0, 0.4, 1),
  });
  const F = F0 * (F1 / F0) ** balloon * mix(pushA, 1, balloon) * pushB;
  const ax = mix(a0.x, a1.x, balloon);
  const ay = mix(a0.y, a1.y, balloon);
  const sx = mix(s0.x, s1.x, balloon);
  const sy = mix(s0.y, s1.y, balloon);
  const markScale = 0.78 + 0.22 * markIn;
  const k = F / EM;
  const rot = tall ? -90 * balloon : 0;
  const logoTransform = `translate(${sx.toFixed(2)} ${sy.toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${k.toFixed(5)}) translate(${(-ax * EM).toFixed(3)} ${(-ay * EM).toFixed(3)})`;
  const markTransform = `translate(${(R_WE * EM) / 2} ${-0.38 * EM}) scale(${markScale.toFixed(4)}) translate(${(-R_WE * EM) / 2} ${0.38 * EM})`;

  const flood = interpolate(frame, [B.flood, B.flood + B.floodLen], [0, 1], {
    ...CLAMP,
    easing: FLOOD,
  });
  const fcx = W * 0.5;
  const fcy = H * 1.2;
  const reach = Math.hypot(W * 0.5, fcy) * 1.02;
  const fr = mix(H * 0.2, reach, flood);
  const clip = `circle(${fr.toFixed(2)}px at ${fcx.toFixed(2)}px ${fcy.toFixed(2)}px)`;

  const card = spring({ frame: frame - B.card, fps, config: CARD });
  const typedN = Math.floor(
    interpolate(frame, [B.prompt, B.promptEnd], [0, prompt.length], CLAMP),
  );
  const done = typedN >= prompt.length;
  const caretOn = !done || Math.floor((frame - B.promptEnd) / 8) % 2 === 0;
  const send = spring({ frame: frame - B.send, fps, config: CHIP });
  const sendOn = frame >= B.send;
  const cardW = tall ? W * 0.88 : W * 0.56;
  const cardH = tall ? H * 0.16 : H * 0.29;
  const cardX = (W - cardW) / 2;
  const cardY = tall ? H * 0.53 : H * 0.49;
  const cardPush = pushB;
  const fs = (tall ? 27 : 24) * u;
  const small = (tall ? 21 : 17) * u;
  const br = 20 * u;
  const pad = 18 * u;

  const svgLogo = (mark: string, word: string, typed: boolean, id: string) => (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", left: 0, top: 0 }}
      aria-hidden
      key={id}
    >
      <g transform={logoTransform}>
        <g
          transform={markTransform}
          opacity={interpolate(markIn, [0, 0.3], [0, 1], CLAMP)}
        >
          <path
            d={REMOCN_R_PATH}
            fill={mark}
            transform={`translate(0 ${-0.76 * EM}) scale(${(0.76 * EM) / R_H})`}
          />
        </g>
        <Wordmark word={word} frame={frame} typed={typed} />
      </g>
    </svg>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: c.backdrop, overflow: "hidden" }}>
      {flood < 1 ? (
        <AbsoluteFill>
          <GshGround
            preset={ground ?? (groundParams ? undefined : c.ground)}
            params={groundParams ?? (ground ? undefined : c.groundParams)}
            timeOffset={5}
            timeScale={0.7}
          />
          {svgLogo(c.mark, c.word, false, "outer")}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill
        style={{
          clipPath: flood > 0 ? clip : "circle(0px at 50% 120%)",
          WebkitClipPath: flood > 0 ? clip : "circle(0px at 50% 120%)",
          backgroundColor: c.floodBg,
        }}
      >
        {svgLogo(c.giantMark, c.giant, false, "inner")}
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", left: 0, top: 0, opacity: c.grain }}
          aria-hidden
        >
          <filter id="giant-mark-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={2}
              seed={3}
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W} height={H} filter="url(#giant-mark-grain)" />
        </svg>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          borderRadius: 22 * u,
          backgroundColor: c.panel,
          boxShadow: `inset 0 0 0 1px ${c.hairline}, ${c.highlight}, 0 2px 4px rgba(${c.shadow},0.1), 0 18px 40px rgba(${c.shadow},0.18), 0 50px 110px rgba(${c.shadow},0.26)`,
          fontFamily: instrument.fontFamily,
          color: c.ink,
          opacity: interpolate(card, [0, 0.25], [0, 1], CLAMP),
          transformOrigin: `${W / 2 - cardX}px ${s1.y - cardY}px`,
          transform: `translateY(${((1 - card) * H * 0.32).toFixed(2)}px) scale(${cardPush.toFixed(4)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: pad + 4 * u,
            right: pad + 4 * u,
            top: pad + 2 * u,
            fontSize: fs,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: 1.32,
            color: typedN > 0 ? c.ink : c.faint,
          }}
        >
          {typedN > 0 ? prompt.slice(0, typedN) : placeholder}
          <span
            style={{
              display: "inline-block",
              width: Math.max(2, 2 * u),
              height: fs * 1.05,
              marginLeft: 2 * u,
              verticalAlign: "-0.18em",
              backgroundColor: c.accent,
              opacity: caretOn ? 1 : 0,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad,
            bottom: pad,
            height: br * 2,
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontSize: small,
            color: c.muted,
          }}
        >
          <div
            style={{
              width: 36 * u,
              height: 36 * u,
              borderRadius: 99,
              boxShadow: `inset 0 0 0 1px ${c.hairline}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon d={ICONS.plus} size={17 * u} color={c.muted} />
          </div>
          {[
            { label: "Attach", icon: ICONS.clip },
            { label: "Styles", icon: ICONS.styles },
          ].map((chip) => (
            <div
              key={chip.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6 * u,
                padding: `${7 * u}px ${12 * u}px`,
                borderRadius: 99,
                boxShadow: `inset 0 0 0 1px ${c.hairline}`,
              }}
            >
              <Icon d={chip.icon} size={15 * u} color={c.muted} />
              {chip.label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <Icon d={ICONS.mic} size={19 * u} color={c.muted} />
          <div
            style={{
              width: br * 2,
              height: br * 2,
              borderRadius: 99,
              backgroundColor: sendOn ? c.accent : done ? c.send : c.row,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${(1 + 0.14 * Math.sin(Math.min(1, send) * Math.PI)).toFixed(4)})`,
              boxShadow: done
                ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                : `inset 0 0 0 1px ${c.hairline}`,
            }}
          >
            <Icon
              d={ICONS.send}
              size={18 * u}
              color={done ? "#ffffff" : c.faint}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
