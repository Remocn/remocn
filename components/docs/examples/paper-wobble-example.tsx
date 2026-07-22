"use client";

import { AbsoluteFill } from "remotion";
import { PaperWobble } from "@/registry/remocn/paper-wobble";

const INK = "#26242c";
const PENCIL = "rgba(38,36,44,0.55)";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Card() {
  return (
    <div
      style={{
        background: "#fdfcf8",
        border: "1px solid rgba(38,36,44,0.12)",
        borderRadius: 4,
        padding: "24px 32px",
        boxShadow: "0 8px 20px rgba(38,36,44,0.12)",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 600, color: INK }}>
        Shot on a desk
      </div>
      <div style={{ fontSize: 18, color: PENCIL, marginTop: 6 }}>
        Every pose is placed by hand
      </div>
    </div>
  );
}

export function PaperWobbleExampleScene({
  amp,
  rotAmp,
  seed = "wobble",
  step,
}: {
  amp?: number;
  rotAmp?: number;
  seed?: string;
  step?: number;
}) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <PaperWobble seed={`${seed}:title`} amp={amp} rotAmp={rotAmp} step={step}>
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fontWeight: 600,
            color: INK,
          }}
        >
          Paper Wobble
        </div>
      </PaperWobble>
      <PaperWobble seed={`${seed}:card`} amp={amp} rotAmp={rotAmp} step={step}>
        <Card />
      </PaperWobble>
    </AbsoluteFill>
  );
}

export const paperWobbleExampleCode = (
  values: Record<string, unknown>,
): string => {
  const amp = (values.amp as number) ?? 1.4;
  const rotAmp = (values.rotAmp as number) ?? 0.35;
  const seed = (values.seed as string) ?? "wobble";
  const step = (values.step as number) ?? 3;
  return `import { PaperWobble } from "@/components/remocn/paper-wobble";

export const MyScene = () => (
  <>
    <PaperWobble seed="${seed}:title" amp={${amp}} rotAmp={${rotAmp}} step={${step}}>
      <h1>Paper Wobble</h1>
    </PaperWobble>
    <PaperWobble seed="${seed}:card" amp={${amp}} rotAmp={${rotAmp}} step={${step}}>
      <YourCard />
    </PaperWobble>
  </>
);`;
};
