"use client";

import { AbsoluteFill } from "remotion";
import { InkArrow } from "@/registry/remocn/ink-arrow";

const INK = "#26242c";
const PENCIL = "rgba(38,36,44,0.55)";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

const CARD_WIDTH = 420;
const CARD_HEIGHT = 112;
const HEAD_CLEARANCE = 64;
const GROUP_HEIGHT = 380;

const LABEL_SIZE = 40;
const LABEL_WIDTH = 220;
const LABEL_HEIGHT = Math.round(LABEL_SIZE * 1.2);
const LABEL_GAP = 28;

const CARD_TOP = (GROUP_HEIGHT - CARD_HEIGHT) / 2;

const FROM = { x: LABEL_WIDTH / 2, y: LABEL_HEIGHT + LABEL_GAP };
const TO = { x: 328, y: CARD_TOP + CARD_HEIGHT / 2 };

const CARD_LEFT = TO.x + HEAD_CLEARANCE;
const GROUP_WIDTH = CARD_LEFT + CARD_WIDTH;

export function InkArrowExampleScene({
  curvature,
  color,
  strokeWidth,
  pressure,
  release,
  grain,
  drawDur,
  headSize,
  headDur,
  seed,
  step,
}: {
  curvature?: number;
  color?: string;
  strokeWidth?: number;
  pressure?: number;
  release?: number;
  grain?: number;
  drawDur?: number;
  headSize?: number;
  headDur?: number;
  seed?: string;
  step?: number;
}) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: GROUP_WIDTH,
          height: GROUP_HEIGHT,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: LABEL_WIDTH,
            height: LABEL_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_FAMILY,
            fontSize: LABEL_SIZE,
            fontWeight: 600,
            color: INK,
          }}
        >
          Start here
        </div>

        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <InkArrow
            from={FROM}
            to={TO}
            curvature={curvature}
            color={color}
            strokeWidth={strokeWidth}
            pressure={pressure}
            release={release}
            grain={grain}
            drawDur={drawDur}
            headSize={headSize}
            headDur={headDur}
            seed={seed}
            step={step}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: CARD_LEFT,
            top: CARD_TOP,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
            background: "#fdfcf8",
            border: "1px solid rgba(38,36,44,0.12)",
            borderRadius: 4,
            padding: "0 32px",
            boxShadow: "0 8px 20px rgba(38,36,44,0.12)",
            fontFamily: FONT_FAMILY,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 600, color: INK }}>
            The thing it points at
          </div>
          <div style={{ fontSize: 18, color: PENCIL, marginTop: 6 }}>
            Positioned by you, drawn by the pen
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const inkArrowExampleCode = (
  values: Record<string, unknown>,
): string => {
  const curvature = (values.curvature as number) ?? 0.35;
  const color = (values.color as string) ?? "#26242c";
  const strokeWidth = (values.strokeWidth as number) ?? 8;
  const pressure = (values.pressure as number) ?? 0.2;
  const release = (values.release as number) ?? 1;
  const grain = (values.grain as number) ?? 1;
  const drawDur = (values.drawDur as number) ?? 36;
  const headSize = (values.headSize as number) ?? 24;
  const headDur = (values.headDur as number) ?? 12;
  const seed = (values.seed as string) ?? "arrow";
  const step = (values.step as number) ?? 3;
  return `import { InkArrow } from "@/components/remocn/ink-arrow";

const to = { x: ${TO.x}, y: ${TO.y} };
const headClearance = ${HEAD_CLEARANCE};

export const MyScene = () => (
  <div
    style={{
      position: "relative",
      width: ${GROUP_WIDTH},
      height: ${GROUP_HEIGHT},
    }}
  >
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <InkArrow
        from={{ x: ${FROM.x}, y: ${FROM.y} }}
        to={to}
        curvature={${curvature}}
        color="${color}"
        strokeWidth={${strokeWidth}}
        pressure={${pressure}}
        release={${release}}
        grain={${grain}}
        drawDur={${drawDur}}
        headSize={${headSize}}
        headDur={${headDur}}
        seed="${seed}"
        step={${step}}
      />
    </div>

    <div
      style={{
        position: "absolute",
        left: to.x + headClearance,
        top: ${CARD_TOP},
        width: ${CARD_WIDTH},
        height: ${CARD_HEIGHT},
      }}
    >
      <YourCard />
    </div>
  </div>
);`;
};
