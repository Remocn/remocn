"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_QUOTES,
  type TestimonialStackElementId,
  type TestimonialStackQuote,
  testimonialStackTimeline,
} from "./timeline";

const { fontFamily: instrumentSans } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export type TestimonialQuote = TestimonialStackQuote;

export interface TestimonialStackProps {
  quotes?: TestimonialQuote[];
  ending?: "pile" | "fan";
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  title?: string;
  framesPerQuote?: number;
  /** Text color of the cards and title; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the cards and title. Load it yourself; Instrument Sans by default. */
  fontFamily?: string;
  /** Corner radius of the cards, in px. */
  radius?: number;
  /** Rotation of the piled cards; 0 lays them straight. */
  tilt?: number;
  /** Size of the stack, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches single quote cards and the finale, by the ids
   * in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<TestimonialStackElementId>;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const MORPH = { damping: 200 };
const ramp = (f: number, a: number, b: number, ease = ENTER) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const CARD_W = 560;
const CARD_H = 252;
const RADIUS = 20;
const PAD = 30;

const THEMES = {
  light: {
    ground: "paper-crease" as GshPresetId,
    base: "#EEECE8",
    card: "#FFFFFF",
    ink: "#141416",
    body: "rgba(20,20,22,0.5)",
    muted: "rgba(20,20,22,0.55)",
    hairline: "rgba(20,20,22,0.08)",
    avatar: "#EDEBE6",
    avatarInk: "rgba(20,20,22,0.7)",
    star: "#141416",
    starOff: "rgba(20,20,22,0.12)",
    title: "#141416",
    shadow: (air: number) =>
      `0 0 0 1px rgba(20,20,30,0.06), 0 1px 2px rgba(20,20,30,0.05), 0 ${10 + air * 24}px ${28 + air * 32}px -8px rgba(30,30,60,${0.14 + air * 0.05})`,
  },
  dark: {
    ground: "charcoal-satin" as GshPresetId,
    base: "#050506",
    card: "#141416",
    ink: "#EDEDEF",
    body: "rgba(237,237,239,0.48)",
    muted: "rgba(237,237,239,0.52)",
    hairline: "rgba(255,255,255,0.07)",
    avatar: "#232327",
    avatarInk: "rgba(237,237,239,0.75)",
    star: "#EDEDEF",
    starOff: "rgba(255,255,255,0.14)",
    title: "#F4F4F5",
    shadow: (air: number) =>
      `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.08), 0 ${12 + air * 24}px ${36 + air * 32}px -8px rgba(0,0,0,0.7)`,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.6l2.85 5.95 6.55.8-4.83 4.5 1.24 6.48L12 17.2l-5.81 3.13 1.24-6.48-4.83-4.5 6.55-.8z"
        fill={color}
      />
    </svg>
  );
}

function QuoteCard({
  quote,
  lit,
  c,
  dim,
  fontFamily,
  fg,
}: {
  quote: TestimonialQuote;
  lit: number;
  c: Palette;
  dim: number;
  fontFamily: string;
  fg: string;
}) {
  const idx = quote.highlight ? quote.text.indexOf(quote.highlight) : -1;
  const before = idx >= 0 ? quote.text.slice(0, idx) : quote.text;
  const marked = idx >= 0 ? (quote.highlight as string) : "";
  const after = idx >= 0 ? quote.text.slice(idx + marked.length) : "";
  const markColor = interpolateColors(lit, [0, 1], [c.body, fg]);
  const sub = quote.handle ? `${quote.handle} · ${quote.role}` : quote.role;

  return (
    <div
      style={{
        width: CARD_W,
        minHeight: CARD_H,
        boxSizing: "border-box",
        padding: `${PAD}px ${PAD}px ${PAD - 6}px`,
        display: "flex",
        flexDirection: "column",
        fontFamily,
        fontWeight: 400,
        color: fg,
        WebkitFontSmoothing: "antialiased",
        opacity: 1 - dim * 0.9,
      }}
    >
      {quote.stars ? (
        <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
          {[0, 1, 2, 3, 4].map((s) => (
            <Star
              key={s}
              size={17}
              color={s < (quote.stars ?? 0) ? c.star : c.starOff}
            />
          ))}
        </div>
      ) : null}
      <div
        style={{
          position: "relative",
          fontSize: 25,
          lineHeight: 1.36,
          letterSpacing: "-0.018em",
          color: c.body,
          textWrap: "pretty",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: -16,
            top: -3,
            fontFamily: serif,
            fontSize: 40,
            lineHeight: 1,
            color: c.muted,
          }}
        >
          “
        </span>
        {before}
        {marked ? <span style={{ color: markColor }}>{marked}</span> : null}
        {after}”
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: `1px solid ${c.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            flexShrink: 0,
            background: c.avatar,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.avatarInk,
            fontSize: 15,
            letterSpacing: "0.02em",
          }}
        >
          {initials(quote.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, lineHeight: 1.25 }}>{quote.name}</div>
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.3,
              color: c.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        </div>
        {quote.date ? (
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: 18,
              lineHeight: 1.25,
              color: c.muted,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {quote.date}
          </div>
        ) : null}
      </div>
    </div>
  );
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

export function TestimonialStack(props: TestimonialStackProps) {
  const {
    quotes = DEFAULT_QUOTES,
    ending = "pile",
    title = "What builders said after launch week",
    theme = "light",
    speed = 1,
    ink,
    background,
    fontFamily = instrumentSans,
    radius = RADIUS,
    tilt = 1,
    scale: sceneScale = 1,
    delay = 0,
    ground,
    groundParams,
    timing,
  } = props;
  const rawFrame = Math.max(0, useSceneFrame() - delay);
  const { fps, width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    testimonialStackTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const frame = rawFrame * speed;
  const tall = height > width;
  const SW = tall ? 700 : 1280;
  const k = width / SW;
  const stageH = height / k;
  const c = THEMES[theme];

  const n = quotes.length;
  const cards = quotes.map((_, i) => tl.get(`quote:${i}`));
  const finale = tl.get("finale");

  const lands = cards.map((e) =>
    spring({ frame: frame - e.start, fps, config: CARD }),
  );
  const covers = cards.map((e) =>
    ramp(frame, e.start + e.beat("coverAt"), e.start + e.beat("cover")),
  );

  const fanStart = finale.start;
  const cols = tall ? 1 : n <= 3 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / cols);
  const gap = tall ? 20 : 22;
  const titleBlock = title ? (tall ? 120 : 64) : 0;
  const fanScale = Math.min(
    tall ? 1 : 0.88,
    (SW - (tall ? 60 : 220) - gap * (cols - 1)) / (cols * CARD_W),
    (stageH - (tall ? 200 : 70) - titleBlock - gap * (rows - 1)) /
      (rows * CARD_H),
  );
  const cellW = CARD_W * fanScale + gap;
  const cellH = CARD_H * fanScale + gap;
  const wallH = titleBlock + rows * cellH - gap;
  const wallTop = -wallH / 2;
  const fanOf = (i: number) =>
    ending === "fan"
      ? spring({
          frame: frame - fanStart - (n - 1 - i) * finale.beat("stagger"),
          fps,
          config: MORPH,
          durationInFrames: finale.beat("morph"),
        })
      : 0;
  const fanAll =
    ending === "fan"
      ? spring({
          frame: frame - fanStart,
          fps,
          config: MORPH,
          durationInFrames:
            finale.beat("morph") + (n - 1) * finale.beat("stagger"),
        })
      : 0;
  const titleIn =
    ending === "fan"
      ? ramp(
          frame,
          fanStart + finale.beat("titleAt"),
          fanStart + finale.beat("title"),
        )
      : 0;

  const camScale = interpolate(
    frame,
    [0, fanStart + finale.beat("push")],
    [1.02, 1.06],
    {
      extrapolateRight: "clamp",
    },
  );
  const cam = interpolate(fanAll, [0, 1], [camScale, 1]);
  const pileScale = 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background === undefined ? c.base : undefined,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <GshGround
          preset={groundParams ? undefined : (ground ?? c.ground)}
          params={groundParams}
          timeOffset={theme === "dark" ? 6 : 4}
          timeScale={0.35}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={sceneScale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SW,
            height: stageH,
            transform: `scale(${k})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${cam})`,
              transformOrigin: "50% 50%",
            }}
          >
            {ending === "fan" && title ? (
              <div
                style={{
                  position: "absolute",
                  left: tall ? 30 : 0,
                  right: tall ? 30 : 0,
                  top: stageH / 2 + wallTop,
                  textAlign: "center",
                  fontFamily,
                  fontSize: tall ? 44 : 38,
                  lineHeight: 1.1,
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  textWrap: "balance",
                  WebkitFontSmoothing: "antialiased",
                  color: ink ?? c.title,
                  opacity: titleIn,
                  transform: `translateY(${(1 - titleIn) * 10}px)`,
                  filter:
                    titleIn < 1 ? `blur(${(1 - titleIn) * 4}px)` : undefined,
                }}
              >
                {title}
              </div>
            ) : null}
            {quotes.map((quote, i) => {
              const card = cards[i];
              if (frame < card.start) return null;
              const p = lands[i];
              const dx = i % 2 === 0 ? -1 : 1;
              const finalRot = dx * (1 + hash(i + 1) * 1.8) * tilt;
              const jitterX = (hash(i + 7) - 0.5) * (tall ? 20 : 36);
              const jitterY = (hash(i + 13) - 0.5) * 10;

              let depth = 0;
              for (let j = i + 1; j < n; j++) depth += covers[j];
              const visibleDepth = Math.min(depth, 3);

              let x = interpolate(p, [0, 1], [dx * SW * 0.78, jitterX]);
              let y =
                interpolate(
                  p,
                  [0, 1],
                  [stageH * 0.58 + hash(i + 3) * 120, jitterY],
                ) -
                visibleDepth * 12;
              let rot = interpolate(
                p,
                [0, 1],
                [finalRot + dx * 12 * tilt, finalRot],
              );
              let scale =
                interpolate(p, [0, 1], [1.06, 1]) *
                (1 - visibleDepth * 0.045) *
                pileScale;
              let dim = Math.min(1, depth);
              let opacity = depth > 3 ? Math.max(0, 4 - depth) : 1;

              if (ending === "fan") {
                const f = fanOf(i);
                const col = i % cols;
                const r = Math.floor(i / cols);
                const tx = (col - (cols - 1) / 2) * cellW;
                const ty =
                  wallTop + titleBlock + r * cellH + (CARD_H * fanScale) / 2;
                x = interpolate(f, [0, 1], [x, tx]);
                y = interpolate(f, [0, 1], [y, ty]);
                rot = interpolate(f, [0, 1], [rot, 0]);
                scale = interpolate(f, [0, 1], [scale, fanScale]);
                dim = interpolate(f, [0, 1], [dim, 0]);
                opacity = interpolate(f, [0, 1], [opacity, 1]);
              }

              const air = 1 - Math.min(1, p);
              const lit = ramp(
                frame - card.start,
                card.beat("litAt"),
                card.beat("lit"),
                MOVE,
              );

              return (
                <div
                  key={`${quote.name}-${i}`}
                  style={{
                    position: "absolute",
                    left: SW / 2,
                    top: stageH / 2,
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
                    opacity,
                    zIndex: i,
                    borderRadius: radius,
                    background: c.card,
                    boxShadow: c.shadow(air),
                  }}
                >
                  <QuoteCard
                    quote={quote}
                    lit={lit}
                    c={c}
                    dim={dim}
                    fontFamily={fontFamily}
                    fg={ink ?? c.ink}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
