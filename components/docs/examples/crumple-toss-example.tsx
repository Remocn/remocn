"use client";

import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  CrumpleToss,
  crumpleTossLanding,
  crumpleTossPose,
} from "@/registry/remocn/crumple-toss";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const INK = "#26242c";
const PENCIL = "rgba(38,36,44,0.55)";

const CARD_WIDTH = 380;
const CARD_HEIGHT = 220;

const BIN_WIDTH = 150;
const BIN_HEIGHT = 170;
const RIM_HEIGHT = 30;
const BIN_BODY = "#ded8ca";
const BIN_INSIDE = "#bdb6a5";
const BIN_RIB = "rgba(38,36,44,0.09)";

const Card = ({ title, body }: { title: string; body: string }) => (
  <div
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      padding: 28,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 10,
      background: "#fdfcf8",
      border: "1px solid rgba(38,36,44,0.12)",
      boxShadow: "0 8px 20px rgba(38,36,44,0.12)",
      fontFamily: FONT_FAMILY,
    }}
  >
    <div style={{ fontSize: 15, color: PENCIL }}>{title}</div>
    <div style={{ fontSize: 30, fontWeight: 600, color: INK, lineHeight: 1.2 }}>
      {body}
    </div>
  </div>
);

export function CrumpleTossExampleScene({
  at = 6,
  segments = 9,
  layers = 2,
  randomness = 0.6,
  crumpleSteps = 4,
  tossSteps = 5,
  direction = -35,
  distance = 440,
  spin = 220,
  crushTo = 0.34,
  seed = "toss",
  step = 3,
}: {
  at?: number;
  segments?: number;
  layers?: number;
  randomness?: number;
  crumpleSteps?: number;
  tossSteps?: number;
  direction?: number;
  distance?: number;
  spin?: number;
  crushTo?: number;
  seed?: string;
  step?: number;
}) {
  const frame = useCurrentFrame();
  const pose = crumpleTossPose({
    frame,
    at,
    crumpleSteps,
    tossSteps,
    step,
  });
  const binIsOut = pose.crush >= 1;

  const landing = crumpleTossLanding({ direction, distance });
  const binLeft = CARD_WIDTH / 2 + landing.x - BIN_WIDTH / 2;
  const binTop = CARD_HEIGHT / 2 + landing.y;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }}
      >
        {binIsOut ? (
          <div
            style={{
              position: "absolute",
              left: binLeft,
              top: binTop - RIM_HEIGHT / 2,
              width: BIN_WIDTH,
              height: RIM_HEIGHT,
              borderRadius: "50%",
              background: BIN_INSIDE,
            }}
          />
        ) : null}

        <div style={{ position: "absolute", inset: 0 }}>
          <CrumpleToss
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            segments={segments}
            layers={layers}
            randomness={randomness}
            at={at}
            crumpleSteps={crumpleSteps}
            tossSteps={tossSteps}
            direction={direction}
            distance={distance}
            spin={spin}
            crushTo={crushTo}
            seed={seed}
            step={step}
          >
            <Card
              title="How it used to work"
              body="Six steps and a wiki page"
            />
          </CrumpleToss>
        </div>

        {binIsOut ? (
          <div
            style={{
              position: "absolute",
              left: binLeft,
              top: binTop,
              width: BIN_WIDTH,
              height: BIN_HEIGHT,
              clipPath: "polygon(0% 0%, 100% 0%, 84% 100%, 16% 100%)",
              background: BIN_BODY,
            }}
          >
            {[0.3, 0.5, 0.7].map((rib) => (
              <div
                key={rib}
                style={{
                  position: "absolute",
                  left: `${rib * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: BIN_RIB,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

export const crumpleTossExampleCode = (
  values: Record<string, unknown>,
): string => {
  const at = (values.at as number) ?? 6;
  const segments = (values.segments as number) ?? 9;
  const layers = (values.layers as number) ?? 2;
  const randomness = (values.randomness as number) ?? 0.6;
  const crumpleSteps = (values.crumpleSteps as number) ?? 4;
  const tossSteps = (values.tossSteps as number) ?? 5;
  const direction = (values.direction as number) ?? -35;
  const distance = (values.distance as number) ?? 900;
  const spin = (values.spin as number) ?? 220;
  const crushTo = (values.crushTo as number) ?? 0.34;
  const seed = (values.seed as string) ?? "toss";
  const step = (values.step as number) ?? 3;
  return `import { CrumpleToss } from "@/components/remocn/crumple-toss";

export const MyScene = () => (
  <CrumpleToss
    width={${CARD_WIDTH}}
    height={${CARD_HEIGHT}}
    segments={${segments}}
    layers={${layers}}
    randomness={${randomness}}
    at={${at}}
    crumpleSteps={${crumpleSteps}}
    tossSteps={${tossSteps}}
    direction={${direction}}
    distance={${distance}}
    spin={${spin}}
    crushTo={${crushTo}}
    seed="${seed}"
    step={${step}}
  >
    <YourCard />
  </CrumpleToss>
);`;
};
