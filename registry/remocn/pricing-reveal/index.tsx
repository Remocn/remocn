"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
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

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });

export interface PricingPlan {
  name: string;
  price: number | string;
  /** Previous price, struck through and replaced by `price` on the featured plan. */
  was?: number | string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface PricingRevealProps {
  plans?: PricingPlan[];
  currency?: string;
  discountLabel?: string;
  badgeLabel?: string;
  eyebrow?: string;
  heading?: string;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: 0,
    period: "/mo",
    description: "For side projects and your first launch video.",
    features: [
      "40 core components",
      "1080p renders",
      "Community templates",
      "MIT licensed source",
      "Discord support",
    ],
    cta: "Get started",
  },
  {
    name: "Pro",
    price: 29,
    was: 45,
    period: "/mo",
    description: "For solo builders shipping a launch every month.",
    features: [
      "Everything in Starter",
      "All 128 components",
      "4K renders, no watermark",
      "Premium launch templates",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Team",
    price: 79,
    period: "/mo",
    description: "For small teams reviewing cuts together.",
    features: [
      "Everything in Pro",
      "Up to 5 seats",
      "Shared brand tokens",
      "Review links with comments",
      "Invoice billing",
    ],
    cta: "Talk to sales",
  },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const B = {
  head: 0,
  cards: 6,
  stagger: 3,
  features: 16,
  lift: 30,
  strike: 36,
  roll: 42,
  press: 58,
  fill: 61,
  tag: 66,
};

interface Pal {
  text: string;
  muted: string;
  faint: string;
  card: string;
  ring: string;
  rule: string;
  depth: string;
  ink: string;
  inkText: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Pal {
  return theme === "dark"
    ? {
        text: "#f2f3f5",
        muted: "#a4a8b3",
        faint: "#6c707c",
        card: "rgba(14,15,20,0.84)",
        ring: "rgba(255,255,255,0.09)",
        rule: "rgba(255,255,255,0.07)",
        depth:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 60px -24px rgba(0,0,0,0.7)",
        ink: "#f2f3f5",
        inkText: "#0b0c10",
        dark: true,
      }
    : {
        text: "#16171b",
        muted: "#5d606a",
        faint: "#93959e",
        card: "#ffffff",
        ring: "rgba(22,23,27,0.07)",
        rule: "rgba(22,23,27,0.07)",
        depth:
          "0 1px 2px rgba(22,23,27,0.04), 0 18px 40px -18px rgba(22,23,27,0.18)",
        ink: "#16171b",
        inkText: "#ffffff",
        dark: false,
      };
}

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function Check({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        d="M5 12.5l4.2 4.2L19 7"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RollingNumber({
  value,
  frame,
  start,
  lineHeight,
}: {
  value: string;
  frame: number;
  start: number;
  lineHeight: number;
}) {
  return (
    <span style={{ display: "inline-flex", height: lineHeight }}>
      {value.split("").map((ch, i) => {
        const p = interpolate(
          frame,
          [start + i * 2, start + i * 2 + 14],
          [0, 1],
          { ...clamp, easing: LIGHT },
        );
        if (!/\d/.test(ch)) return <span key={`${ch}-${i}`}>{ch}</span>;
        const pos = Number(ch) + (2 + i) * (1 - p);
        const shown = Math.round(pos);
        const off = pos - shown;
        return (
          <span
            key={`${ch}-${i}`}
            style={{
              display: "inline-block",
              width: "0.6em",
              textAlign: "center",
              lineHeight: `${lineHeight}px`,
              opacity: 1 - Math.abs(off) * 0.9,
              transform: `translateY(${off * lineHeight * 0.18}px)`,
            }}
          >
            {shown % 10}
          </span>
        );
      })}
    </span>
  );
}

function pressScale(frame: number, at: number, fps: number) {
  const down = spring({ frame: frame - at, fps, config: CHIP });
  const up = spring({ frame: frame - at - 4, fps, config: CHIP });
  return 1 - 0.04 * (down - up);
}

interface CardProps {
  plan: PricingPlan;
  index: number;
  pal: Pal;
  accent: string;
  currency: string;
  discountLabel: string;
  badgeLabel: string;
  frame: number;
  fps: number;
  width: number;
  height: number;
  compact: boolean;
}

function PlanCard({
  plan,
  index,
  pal,
  accent,
  currency,
  discountLabel,
  badgeLabel,
  frame,
  fps,
  width,
  height,
  compact,
}: CardProps) {
  const featured = !!plan.featured;
  const enterAt = B.cards + index * B.stagger;
  const rise = spring({ frame: frame - enterAt, fps, config: CARD });
  const fade = interpolate(frame, [enterAt, enterAt + 10], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const lift = spring({ frame: frame - B.lift, fps, config: HEAVY });
  const recede = featured
    ? 0
    : spring({ frame: frame - B.lift, fps, config: MORPH });
  const strike = featured
    ? interpolate(frame, [B.strike, B.strike + 9], [0, 1], {
        ...clamp,
        easing: MOVE,
      })
    : 0;
  const settle = featured
    ? spring({ frame: frame - B.roll, fps, config: MORPH })
    : 0;
  const fill = featured
    ? interpolate(frame, [B.fill, B.fill + 8], [0, 1], {
        ...clamp,
        easing: ENTER,
      })
    : 0;
  const tag = featured
    ? spring({ frame: frame - B.tag, fps, config: CHIP })
    : 0;
  const press = featured ? pressScale(frame, B.press, fps) : 1;
  const hasWas = featured && plan.was !== undefined;

  const priceSize = compact ? 48 : 64;
  const lh = Math.round(priceSize * 1.04);
  const strap = 26;
  const blockH = hasWas || !compact ? lh + strap : lh;
  const oldScale = interpolate(settle, [0, 1], [1, 0.32]);
  const oldY = interpolate(settle, [0, 1], [strap, 0]);
  const liftY = featured ? -10 * lift : 6 * recede;

  const price = (value: number | string, faded = false) => (
    <span
      style={{
        fontSize: priceSize,
        fontWeight: 300,
        letterSpacing: "-0.045em",
        lineHeight: `${lh}px`,
        fontVariantNumeric: "tabular-nums",
        color: faded ? pal.faint : pal.text,
      }}
    >
      {currency}
      {value}
    </span>
  );

  const period = (o = 1) => (
    <span
      style={{
        fontFamily: mono.fontFamily,
        fontSize: 16,
        lineHeight: "20px",
        color: pal.faint,
        marginLeft: 10,
        marginBottom: 8,
        alignSelf: "flex-end",
        opacity: o,
        whiteSpace: "nowrap",
      }}
    >
      {plan.period}
    </span>
  );

  const priceBlock = (
    <div
      style={{
        position: "relative",
        height: blockH,
        width: compact ? 200 : undefined,
        flexShrink: 0,
      }}
    >
      {hasWas ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: oldY,
              transformOrigin: "0 0",
              transform: `scale(${oldScale})`,
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ position: "relative" }}>
              {price(plan.was as number | string, settle > 0.5)}
              <span
                style={{
                  position: "absolute",
                  left: -4,
                  top: "52%",
                  height: 3 / Math.max(0.4, oldScale),
                  width: `calc(${strike * 100}% + ${8 * strike}px)`,
                  background: accent,
                  borderRadius: 4,
                  transformOrigin: "0 50%",
                }}
              />
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: strap,
              display: "flex",
              alignItems: "center",
              opacity: interpolate(frame, [B.roll + 1, B.roll + 5], [0, 1], {
                ...clamp,
                easing: ENTER,
              }),
            }}
          >
            <span
              style={{
                display: "inline-flex",
                fontSize: priceSize,
                fontWeight: 300,
                letterSpacing: "-0.045em",
                lineHeight: `${lh}px`,
                fontVariantNumeric: "tabular-nums",
                color: pal.text,
              }}
            >
              <span style={{ opacity: settle }}>{currency}</span>
              <RollingNumber
                value={String(plan.price)}
                frame={frame}
                start={B.roll + 2}
                lineHeight={lh}
              />
            </span>
            {period(settle)}
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: -2,
              height: 28,
              padding: "0 9px",
              borderRadius: 6,
              background: accent,
              color: "#fff",
              fontSize: 16,
              lineHeight: "28px",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              opacity: interpolate(tag, [0, 0.25], [0, 1], clamp),
              transformOrigin: "100% 50%",
              transform: `translateY(${(1 - tag) * -14}px) rotate(${(1 - tag) * -8 - 2}deg) scale(${0.8 + 0.2 * tag})`,
            }}
          >
            {discountLabel}
          </div>
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            left: compact ? undefined : 0,
            right: compact ? 0 : undefined,
            bottom: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          {price(plan.price)}
          {period()}
        </div>
      )}
    </div>
  );

  const button = (
    <div
      style={{
        height: 46,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 16,
        flexShrink: 0,
        background: featured ? (fill > 0 ? accent : pal.ink) : "transparent",
        color: featured ? (fill > 0 ? "#fff" : pal.inkText) : pal.text,
        boxShadow: featured
          ? `inset 0 1px 0 rgba(255,255,255,${0.18 * fill})`
          : `inset 0 0 0 1px ${pal.dark ? "rgba(255,255,255,0.14)" : "rgba(22,23,27,0.14)"}`,
        transform: `scale(${press})`,
      }}
    >
      {plan.cta}
      {featured ? <Arrow /> : null}
    </div>
  );

  const ring =
    featured && lift > 0.01
      ? `0 0 0 ${1 + 0.5 * lift}px ${withAlpha(accent, 0.25 + 0.75 * lift)}`
      : `0 0 0 1px ${pal.ring}`;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        opacity: fade * (1 - 0.32 * recede),
        transform: `translateY(${(1 - rise) * 56 + liftY}px) scale(${(0.96 + 0.04 * rise) * (1 + 0.025 * (featured ? lift : -recede * 0.6))})`,
        zIndex: featured ? 2 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: pal.card,
          backdropFilter: pal.dark ? "blur(24px)" : undefined,
          boxShadow: `${ring}, ${pal.depth}`,
          padding: compact ? "22px 26px" : "24px 26px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: compact ? "row" : "column",
          alignItems: compact ? "center" : "stretch",
          gap: compact ? 24 : 0,
        }}
      >
        <div style={{ flex: compact ? 1 : undefined, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              fontSize: 22,
              color: pal.text,
              letterSpacing: "-0.01em",
            }}
          >
            {plan.name}
            {featured ? (
              <span
                style={{
                  fontFamily: mono.fontFamily,
                  fontSize: 16,
                  color: accent,
                  opacity: lift,
                }}
              >
                {badgeLabel}
              </span>
            ) : null}
          </div>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.4,
              color: pal.muted,
              marginTop: 6,
              height: compact ? undefined : 45,
              whiteSpace: compact ? "nowrap" : undefined,
              overflow: compact ? "hidden" : undefined,
              textOverflow: compact ? "ellipsis" : undefined,
              textWrap: "pretty",
            }}
          >
            {plan.description}
          </div>
        </div>
        {compact ? (
          priceBlock
        ) : (
          <>
            <div style={{ marginTop: 18 }}>{priceBlock}</div>
            <div style={{ marginTop: 18 }}>{button}</div>
            <div
              style={{
                height: 1,
                background: pal.rule,
                margin: "22px 0 12px",
                flexShrink: 0,
              }}
            />
            {plan.features.map((feat, j) => {
              const a = spring({
                frame: frame - (B.features + index * B.stagger + j * 2),
                fps,
                config: CARD,
              });
              return (
                <div
                  key={feat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 30,
                    fontSize: 16,
                    color: pal.text,
                    opacity: interpolate(a, [0, 0.6], [0, 1], clamp),
                    transform: `translateY(${(1 - a) * 10}px)`,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Check color={featured ? accent : pal.faint} />
                  {feat}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export function PricingReveal({
  plans = DEFAULT_PLANS,
  currency = "$",
  discountLabel = "−35% launch week",
  badgeLabel = "Most picked",
  eyebrow = "Billed monthly · cancel anytime",
  heading = "Simple pricing for every launch.",
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: PricingRevealProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const W = tall ? 720 : 1280;
  const H = tall ? 1280 : 720;
  const u = Math.min(width / W, height / H);
  const pal = palette(theme);

  const head = interpolate(frame, [B.head, B.head + 16], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const meta = interpolate(frame, [B.head + 6, B.head + 20], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  const camera = interpolate(frame, [0, 100], [1.035, 1], {
    ...clamp,
    easing: CAMERA,
  });

  const M = tall ? 48 : 72;
  const gap = tall ? 32 : 20;
  const cardW = tall ? W - M * 2 : (W - M * 2 - gap * 2) / 3;
  const fullH = tall ? 500 : 470;
  const compactH = 150;

  return (
    <AbsoluteFill
      style={{
        fontFamily: geist.fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <GshGround
        preset={ground ?? (pal.dark ? "earthshine" : "paper-crease")}
        params={groundParams}
        timeOffset={pal.dark ? 6 : 3}
        timeScale={0.4}
      />
      {pal.dark ? null : (
        <AbsoluteFill style={{ background: "rgba(240,238,234,0.38)" }} />
      )}
      <div
        style={{
          position: "absolute",
          left: (width - W * u) / 2,
          top: (height - H * u) / 2,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `scale(${u})`,
        }}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${camera})`,
            transformOrigin: "50% 60%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: M,
              right: M,
              top: tall ? 96 : 58,
              display: "flex",
              flexDirection: tall ? "column" : "row",
              alignItems: tall ? "flex-start" : "flex-end",
              justifyContent: "space-between",
              gap: tall ? 20 : 24,
            }}
          >
            <div
              style={{
                fontFamily: serif.fontFamily,
                fontWeight: 400,
                fontSize: tall ? 64 : 54,
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                color: pal.text,
                maxWidth: tall ? 560 : 720,
                textWrap: "balance",
                clipPath: "inset(-10% -5% -20% -5%)",
              }}
            >
              <div
                style={{
                  transform: `translateY(${(1 - head) * 40}px)`,
                  opacity: head,
                }}
              >
                {heading}
              </div>
            </div>
            <div
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 16,
                color: pal.muted,
                paddingBottom: tall ? 0 : 8,
                whiteSpace: "nowrap",
                opacity: meta,
                transform: `translateY(${(1 - meta) * 10}px)`,
              }}
            >
              {eyebrow}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: tall ? 340 : 186,
              left: M,
              right: M,
              display: "flex",
              flexDirection: tall ? "column" : "row",
              alignItems: "flex-start",
              gap,
            }}
          >
            {plans.map((plan, i) => {
              const compact = tall && !plan.featured;
              return (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  index={i}
                  pal={pal}
                  accent={accent}
                  currency={currency}
                  discountLabel={discountLabel}
                  badgeLabel={badgeLabel}
                  frame={frame}
                  fps={fps}
                  width={cardW}
                  height={compact ? compactH : fullH}
                  compact={compact}
                />
              );
            })}
          </div>
        </AbsoluteFill>
      </div>
    </AbsoluteFill>
  );
}
