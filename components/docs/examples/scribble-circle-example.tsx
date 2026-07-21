"use client";

import { AbsoluteFill } from "remotion";
import { ScribbleCircle } from "@/registry/remocn/scribble-circle";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const INK = "#26242c";
const MUTED = "rgba(38,36,44,0.55)";

const CARD_WIDTH = 460;
const CARD_PAD = 24;
const ROW_PAD = 18;
const ROW_HEIGHT = 84;
const PRICE_WIDTH = 76;

const PLANS = [
  { name: "Hobby", price: "Free" },
  { name: "Pro", price: "$19" },
  { name: "Team", price: "$49" },
];

const TARGET = 1;

const CIRCLE_WIDTH = 108;
const CIRCLE_HEIGHT = 62;

const PRICE_LEFT = CARD_WIDTH - CARD_PAD - ROW_PAD - PRICE_WIDTH;
const CIRCLE_LEFT = PRICE_LEFT + (PRICE_WIDTH - CIRCLE_WIDTH) / 2;
const CIRCLE_TOP =
  CARD_PAD + TARGET * ROW_HEIGHT + (ROW_HEIGHT - CIRCLE_HEIGHT) / 2;

export function ScribbleCircleExampleScene({
  laps,
  strokeWidth,
  pressure,
  grain,
  durationSteps,
  color,
  seed,
  step,
}: {
  laps?: number;
  strokeWidth?: number;
  pressure?: number;
  grain?: number;
  durationSteps?: number;
  color?: string;
  seed?: string;
  step?: number;
}) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: CARD_WIDTH,
          padding: CARD_PAD,
          borderRadius: 18,
          background: "#fdfcf8",
          fontFamily: FONT_FAMILY,
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: ROW_HEIGHT,
              padding: `0 ${ROW_PAD}px`,
              color: INK,
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 600 }}>{plan.name}</span>
            <span
              style={{
                display: "inline-block",
                width: PRICE_WIDTH,
                textAlign: "center",
                fontSize: 26,
                color: MUTED,
              }}
            >
              {plan.price}
            </span>
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: CIRCLE_LEFT,
            top: CIRCLE_TOP,
          }}
        >
          <ScribbleCircle
            width={CIRCLE_WIDTH}
            height={CIRCLE_HEIGHT}
            laps={laps}
            strokeWidth={strokeWidth}
            pressure={pressure}
            grain={grain}
            durationSteps={durationSteps}
            color={color}
            seed={seed}
            step={step}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const scribbleCircleExampleCode = (
  values: Record<string, unknown>,
): string => {
  const laps = (values.laps as number) ?? 1.15;
  const strokeWidth = (values.strokeWidth as number) ?? 14;
  const pressure = (values.pressure as number) ?? 0.2;
  const grain = (values.grain as number) ?? 1;
  const durationSteps = (values.durationSteps as number) ?? 10;
  const color = (values.color as string) ?? "#6f7f35";
  const seed = (values.seed as string) ?? "scribble";
  const step = (values.step as number) ?? 3;
  return `import { ScribbleCircle } from "@/components/remocn/scribble-circle";

export const MyScene = () => (
  <div style={{ position: "relative" }}>
    <PricingCard />
    <div style={{ position: "absolute", left: ${CIRCLE_LEFT}, top: ${CIRCLE_TOP} }}>
      <ScribbleCircle
        width={${CIRCLE_WIDTH}}
        height={${CIRCLE_HEIGHT}}
        laps={${laps}}
        strokeWidth={${strokeWidth}}
        pressure={${pressure}}
        grain={${grain}}
        durationSteps={${durationSteps}}
        color="${color}"
        seed="${seed}"
        step={${step}}
      />
    </div>
  </div>
);`;
};
