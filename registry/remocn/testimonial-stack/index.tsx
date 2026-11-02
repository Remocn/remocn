"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import {
  AbsoluteFill,
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

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface TestimonialQuote {
  text: string;
  highlight?: string;
  name: string;
  role: string;
  handle?: string;
  avatarColor?: string;
  stars?: number;
  date?: string;
  source?: "x" | "none";
}

export interface TestimonialStackProps {
  quotes?: TestimonialQuote[];
  ending?: "pile" | "fan";
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  title?: string;
  framesPerQuote?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_QUOTES: TestimonialQuote[] = [
  {
    text: "We shipped our launch video in a single afternoon. The motion looks like a design team spent weeks on it.",
    highlight: "looks like a design team spent weeks on it",
    name: "Maya Chen",
    role: "Founder, Kitebase",
    handle: "@mayachen",
    date: "Oct 14",
    source: "x",
  },
  {
    text: "Dropped three components into our Remotion project and the demo basically built itself. Owning the code is the right call.",
    highlight: "the demo basically built itself",
    name: "Leo Park",
    role: "Staff Engineer, Lumen",
    handle: "@leopark",
    date: "Oct 15",
    source: "x",
  },
  {
    text: "Our launch clip got 3.4× the replies of anything we posted this year. The best tool we added this quarter.",
    highlight: "3.4× the replies",
    name: "Priya Raman",
    role: "Head of Growth, Fernway",
    stars: 5,
    date: "Oct 16",
    source: "none",
  },
  {
    text: "I’m not a motion designer and it doesn’t matter anymore. Every scene is production-ready out of the box.",
    highlight: "production-ready out of the box",
    name: "Daniel Okafor",
    role: "Indie hacker",
    handle: "@danokafor",
    date: "Oct 18",
    source: "x",
  },
];

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
}: {
  quote: TestimonialQuote;
  lit: number;
  c: Palette;
  dim: number;
}) {
  const idx = quote.highlight ? quote.text.indexOf(quote.highlight) : -1;
  const before = idx >= 0 ? quote.text.slice(0, idx) : quote.text;
  const marked = idx >= 0 ? (quote.highlight as string) : "";
  const after = idx >= 0 ? quote.text.slice(idx + marked.length) : "";
  const markColor = interpolateColors(lit, [0, 1], [c.body, c.ink]);
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
        color: c.ink,
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

export function TestimonialStack({
  quotes = DEFAULT_QUOTES,
  ending = "pile",
  title = "What builders said after launch week",
  theme = "light",
  speed = 1,
  framesPerQuote = 50,
  ground,
  groundParams,
}: TestimonialStackProps) {
  const rawFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = rawFrame * speed;
  const tall = height > width;
  const SW = tall ? 700 : 1280;
  const k = width / SW;
  const stageH = height / k;
  const c = THEMES[theme];

  const n = quotes.length;
  const per = framesPerQuote;
  const startOf = (i: number) => (i === 0 ? -6 : 4 + i * per);

  const lands = quotes.map((_, i) =>
    spring({ frame: frame - startOf(i), fps, config: CARD }),
  );
  const covers = quotes.map((_, i) =>
    ramp(frame, startOf(i) + 4, startOf(i) + 16),
  );

  const fanStart = startOf(n - 1) + per - 6;
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
          frame: frame - fanStart - (n - 1 - i) * 3,
          fps,
          config: MORPH,
          durationInFrames: 22,
        })
      : 0;
  const fanAll =
    ending === "fan"
      ? spring({
          frame: frame - fanStart,
          fps,
          config: MORPH,
          durationInFrames: 22 + (n - 1) * 3,
        })
      : 0;
  const titleIn = ramp(frame, fanStart + 10, fanStart + 24);

  const camScale = interpolate(frame, [0, fanStart + 60], [1.02, 1.06], {
    extrapolateRight: "clamp",
  });
  const cam = interpolate(fanAll, [0, 1], [camScale, 1]);
  const pileScale = 1;

  return (
    <AbsoluteFill style={{ backgroundColor: c.base, overflow: "hidden" }}>
      <GshGround
        preset={groundParams ? undefined : (ground ?? c.ground)}
        params={groundParams}
        timeOffset={theme === "dark" ? 6 : 4}
        timeScale={0.35}
      />
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
                color: c.title,
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
            if (frame < startOf(i)) return null;
            const p = lands[i];
            const dx = i % 2 === 0 ? -1 : 1;
            const finalRot = dx * (1 + hash(i + 1) * 1.8);
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
            let rot = interpolate(p, [0, 1], [finalRot + dx * 12, finalRot]);
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
            const lit = ramp(frame - startOf(i), 14, 30, MOVE);

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
                  borderRadius: RADIUS,
                  background: c.card,
                  boxShadow: c.shadow(air),
                }}
              >
                <QuoteCard quote={quote} lit={lit} c={c} dim={dim} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
