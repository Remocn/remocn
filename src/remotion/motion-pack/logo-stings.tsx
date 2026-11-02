import { AccordionUnfold } from "@/registry/remocn/accordion-unfold";
import { AnamorphicFlare } from "@/registry/remocn/anamorphic-flare";
import { Inflate } from "@/registry/remocn/inflate";
import { LiquidFill } from "@/registry/remocn/liquid-fill";
import { NeonSign } from "@/registry/remocn/neon-sign";
import { OrbitLock } from "@/registry/remocn/orbit-lock";
import { PuzzleSnap } from "@/registry/remocn/puzzle-snap";
import { Spotlight } from "@/registry/remocn/spotlight";
import { DemoLogo, type DraftEntry, FONT, INK, PAPER } from "./shared";

// Mark-building stings draw their own mark, so they only take the wordmark.
function Wordmark() {
  return (
    <span
      style={{
        fontFamily: FONT,
        fontSize: 104,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        color: PAPER,
      }}
    >
      remocn
    </span>
  );
}

const HOLD = 30;

export const logoStingDrafts: DraftEntry[] = [
  {
    id: "orbit-lock",
    component: () => (
      <OrbitLock>
        <DemoLogo />
      </OrbitLock>
    ),
    durationInFrames: 48 + HOLD,
  },
  {
    id: "puzzle-snap",
    component: () => (
      <PuzzleSnap>
        <Wordmark />
      </PuzzleSnap>
    ),
    durationInFrames: 36 + HOLD,
  },
  {
    id: "spotlight",
    component: () => (
      <Spotlight>
        <DemoLogo />
      </Spotlight>
    ),
    durationInFrames: 50 + HOLD,
  },
  {
    id: "neon-sign",
    component: () => <NeonSign />,
    durationInFrames: 40 + HOLD,
  },
  {
    id: "inflate",
    component: () => (
      <Inflate>
        <Wordmark />
      </Inflate>
    ),
    durationInFrames: 36 + HOLD,
  },
  {
    id: "liquid-fill",
    component: () => (
      <LiquidFill>
        <Wordmark />
      </LiquidFill>
    ),
    durationInFrames: 48 + HOLD,
  },
  {
    id: "accordion-unfold",
    component: () => (
      <AccordionUnfold>
        <DemoLogo scale={0.8} color={INK} />
      </AccordionUnfold>
    ),
    durationInFrames: 36 + HOLD,
  },
  {
    id: "anamorphic-flare",
    component: () => (
      <AnamorphicFlare>
        <DemoLogo />
      </AnamorphicFlare>
    ),
    durationInFrames: 40 + HOLD,
  },
];
