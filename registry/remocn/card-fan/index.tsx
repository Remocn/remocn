"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/Onest";
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

const onest = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const serif = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

type Glyph = "launch" | "list" | "play" | "cursor" | "spark";

export interface FanCard {
  label: string;
  color: string;
  meta?: string;
  glyph?: Glyph;
}

export interface CardFanProps {
  title?: string;
  accentWord?: number;
  cards?: FanCard[];
  pick?: number;
  caption?: string;
  theme?: "dark" | "light";
  ink?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_CARDS: FanCard[] = [
  {
    label: "Launch",
    color: "#e0583f",
    meta: "24 scenes · 1:12",
    glyph: "launch",
  },
  {
    label: "Changelog",
    color: "#3a9e7c",
    meta: "18 scenes · 0:48",
    glyph: "list",
  },
  {
    label: "Teaser",
    color: "#4a58c4",
    meta: "12 scenes · 0:21",
    glyph: "play",
  },
  {
    label: "Demo",
    color: "#34363d",
    meta: "31 scenes · 2:05",
    glyph: "cursor",
  },
];

const THEMES = {
  dark: {
    ink: "#eef6f4",
    sub: "rgba(238,246,244,0.6)",
    card: "#141618",
    cardInk: "#f1f4f3",
    cardSub: "rgba(241,244,243,0.52)",
    ring: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.08)",
    ground: "riptide" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    shadowRgb: "0,8,8",
    shadowK: 1,
  },
  light: {
    ink: "#16171c",
    sub: "rgba(22,23,28,0.56)",
    card: "#fcfbf9",
    cardInk: "#16171c",
    cardSub: "rgba(22,23,28,0.5)",
    ring: "inset 0 0 0 1px rgba(0,0,0,0.06)",
    ground: "paper-crease" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    shadowRgb: "26,30,60",
    shadowK: 0.5,
  },
};

const BEATS = [
  { id: "title", at: 0 },
  { id: "drop", at: 4 },
  { id: "fan", at: 18 },
  { id: "pick", at: 60 },
  { id: "caption", at: 72 },
  { id: "end", at: 132 },
] as const;
const beat = (id: (typeof BEATS)[number]["id"]) =>
  BEATS.find((b) => b.id === id)?.at ?? 0;

const EASE_ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const SPRING_CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const SPRING_HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const SPRING_MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function shade(color: string, pct: number, to: string) {
  return `color-mix(in oklab, ${color} ${100 - pct}%, ${to})`;
}

function GlyphIcon({ glyph, size }: { glyph: Glyph; size: number }) {
  const paths: Record<Glyph, string> = {
    launch: "M7 17 17 7M9 7h8v8",
    list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
    play: "M8 5.5v13l10.5-6.5z",
    cursor: "M5.5 3.5 19 10l-6 2-2 6z",
    spark: "M12 3v5M12 16v5M3 12h5M16 12h5",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[glyph]} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function CardFan({
  title = "Your top formats",
  accentWord = 2,
  cards = DEFAULT_CARDS,
  pick = 0,
  caption = "Launch films are 41% of this month’s renders",
  theme = "dark",
  ink,
  ground,
  groundParams,
}: CardFanProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const light = theme === "light";
  const fg = ink ?? t.ink;
  const preset = ground ?? (groundParams ? undefined : t.ground);
  const gParams = groundParams ?? t.groundParams;
  const portrait = H > W;
  const N = Math.max(2, Math.min(6, cards.length));
  const list = cards.slice(0, N);
  const pickIdx = Math.min(Math.max(0, pick), N - 1);

  const cx = W / 2;
  const cardW = portrait ? W * 0.44 : W * 0.2;
  const pad = cardW * 0.045;
  const coverS = cardW - pad * 2;
  const cardH = pad + coverS + cardW * 0.31;
  const radius = cardW * 0.075;
  const cy = portrait ? H * 0.53 : H * 0.575;
  const spread = portrait ? cardW * 0.3 : cardW * 0.6;
  const titleSize = portrait ? W * 0.092 : W * 0.052;
  const titleY = portrait ? H * 0.15 : H * 0.14;
  const capSize = portrait ? W * 0.04 : H * 0.034;
  const capY = portrait ? H * 0.865 : H * 0.92;
  const pull = portrait ? 0.8 : 0.45;

  const drop = spring({
    frame: frame - beat("drop"),
    fps,
    config: SPRING_HEAVY,
  });
  const lift = spring({
    frame: frame - beat("pick"),
    fps,
    config: SPRING_CARD,
  });
  const liftSettle = spring({
    frame: frame - beat("pick"),
    fps,
    config: SPRING_MORPH,
  });
  const push = interpolate(frame, [0, beat("end")], [1, 1.035], {
    ...CLAMP,
    easing: EASE_CAMERA,
  });
  const sway = Math.sin(frame / 24) * 2;

  const titleWords = title.split(" ");
  const capWords = caption.split(" ");

  const cardState = (j: number) => {
    const m = N - 1 - j;
    const open = spring({
      frame: frame - (beat("fan") + m * 3),
      fps,
      config: SPRING_CARD,
    });
    const isFront = j === N - 1;
    const openX = cx + (j - (N - 1) / 2) * spread;
    const openY = cy + (portrait ? (j - (N - 1) / 2) * cardH * 0.1 : 0);
    const stackX = cx + m * 4;
    const stackY = cy + m * 3;
    let x = stackX + (openX - stackX) * open;
    let y = stackY + (openY - stackY) * open;
    let rz = (-3 - m * 1.5) * (1 - open) + (-9 + j * 2.2) * open;
    let ry = 3 * (1 - open) + (14 + sway) * open;
    let rx = 5 * open;
    let z = 0;
    let scale = 1;
    let blur = 0;
    let dim = 1;
    const fall = 1 - drop;
    y += fall * H * 0.7;
    rz += fall * 10;
    if (j === pickIdx) {
      const tx = x + (cx - x) * pull;
      x += (tx - x) * lift;
      y += -cardH * (portrait ? 0.1 : 0.12) * lift;
      rz += (-2 - rz) * liftSettle;
      ry += (4 - ry) * liftSettle;
      rx *= 1 - liftSettle;
      z = 140 * lift;
      scale = 1 + 0.1 * lift;
    } else {
      const side = j < pickIdx ? -1 : 1;
      x += side * cardW * (portrait ? 0.08 : 0.16) * lift;
      y += cardH * 0.06 * lift;
      z = -60 * lift;
      blur = 3 * Math.min(1, lift);
      dim = 1 - 0.3 * Math.min(1, lift);
    }
    const hidden = !isFront && frame < beat("drop") + 6;
    return { x, y, rz, ry, rx, z, scale, blur, dim, hidden };
  };

  const order = list
    .map((_, j) => j)
    .sort((a, b) =>
      a === pickIdx && lift > 0.3
        ? 1
        : b === pickIdx && lift > 0.3
          ? -1
          : a - b,
    );

  const k = t.shadowK;
  const shadow = `0 1px 2px rgba(${t.shadowRgb},${0.24 * k}), 0 ${cardH * 0.05}px ${cardH * 0.12}px rgba(${t.shadowRgb},${0.26 * k}), 0 ${cardH * 0.16}px ${cardH * 0.4}px rgba(${t.shadowRgb},${0.32 * k})`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={light ? 2.2 : 3}
        timeScale={0.6}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <AbsoluteFill
          style={{
            perspective: portrait ? 2200 : 1400,
            perspectiveOrigin: `50% ${(cy / H) * 100}%`,
          }}
        >
          {order.map((j) => {
            const c = list[j] as FanCard;
            const s = cardState(j);
            if (s.hidden) return null;
            return (
              <div
                key={`card-${c.label}-${j}`}
                style={{
                  position: "absolute",
                  left: s.x - cardW / 2,
                  top: s.y - cardH / 2,
                  width: cardW,
                  height: cardH,
                  borderRadius: radius,
                  transform: `translateZ(${s.z}px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) rotateZ(${s.rz}deg) scale(${s.scale})`,
                  filter:
                    s.blur > 0.01
                      ? `blur(${s.blur}px) brightness(${s.dim})`
                      : undefined,
                  boxShadow: shadow,
                  backgroundColor: t.card,
                  fontFamily: onest.fontFamily,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: pad,
                    top: pad,
                    width: coverS,
                    height: coverS,
                    borderRadius: radius - pad,
                    backgroundImage: `linear-gradient(160deg, ${shade(c.color, 18, "#fff")} 0%, ${c.color} 46%, ${shade(c.color, 38, "#000")} 100%)`,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.92)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: coverS * 0.09,
                      bottom: coverS * 0.09,
                    }}
                  >
                    <GlyphIcon
                      glyph={c.glyph ?? "spark"}
                      size={coverS * 0.24}
                    />
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: pad + cardW * 0.02,
                    right: pad,
                    top: pad + coverS + cardW * 0.06,
                    color: t.cardInk,
                  }}
                >
                  <div
                    style={{
                      fontSize: cardW * 0.1,
                      fontWeight: 400,
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}
                  </div>
                  {c.meta ? (
                    <div
                      style={{
                        marginTop: cardW * 0.025,
                        fontFamily: mono.fontFamily,
                        fontWeight: 400,
                        fontSize: Math.max(cardW * 0.066, H * 0.022),
                        letterSpacing: "-0.01em",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                        color: t.cardSub,
                      }}
                    >
                      {c.meta}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: titleY - titleSize * 0.55,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            columnGap: "0.24em",
            fontFamily: onest.fontFamily,
            fontWeight: 300,
            fontSize: titleSize,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            color: fg,
          }}
        >
          {titleWords.map((word, i) => {
            const s = beat("title") + i * 3;
            const p = interpolate(frame, [s, s + 14], [0, 1], {
              ...CLAMP,
              easing: EASE_ENTER,
            });
            const accent = i === accentWord;
            return (
              <span
                key={`${word}-${i}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  padding: "0.04em 0.08em 0.18em",
                  margin: "-0.04em -0.08em -0.18em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 120}%)`,
                    fontFamily: accent ? serif.fontFamily : undefined,
                    fontStyle: accent ? "italic" : undefined,
                    fontWeight: 400,
                    fontSize: accent ? "1.12em" : undefined,
                    letterSpacing: accent ? "-0.02em" : undefined,
                    lineHeight: 1,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: W * 0.08,
            width: W * 0.84,
            top: capY - capSize * 0.6,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: "0.26em",
            fontFamily: onest.fontFamily,
            fontWeight: 300,
            fontSize: capSize,
            letterSpacing: "-0.01em",
            fontVariantNumeric: "tabular-nums",
            color: t.sub,
          }}
        >
          {capWords.map((word, i) => {
            const s = beat("caption") + i * 2;
            const p = interpolate(frame, [s, s + 12], [0, 1], {
              ...CLAMP,
              easing: EASE_ENTER,
            });
            return (
              <span
                key={`${word}-${i}`}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  padding: "0.04em 0.04em 0.18em",
                  margin: "-0.04em -0.04em -0.18em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 120}%)`,
                    color: /\d/.test(word) ? fg : undefined,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default CardFan;
