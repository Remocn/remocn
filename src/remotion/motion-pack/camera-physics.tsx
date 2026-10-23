import { ClothReveal } from "@/registry/remocn/cloth-reveal";
import { DollyZoom } from "@/registry/remocn/dolly-zoom";
import { ExplodedView } from "@/registry/remocn/exploded-view";
import { GravityPile } from "@/registry/remocn/gravity-pile";
import { hyperspace } from "@/registry/remocn/hyperspace";
import { ImpactShake } from "@/registry/remocn/impact-shake";
import { ParallaxDepth } from "@/registry/remocn/parallax-depth";
import { TinyPlanet } from "@/registry/remocn/tiny-planet";
import { Turntable } from "@/registry/remocn/turntable";
import {
  DemoLogo,
  type DraftEntry,
  TransitionDemo,
  transitionDemoDuration,
} from "./shared";

const HYPERSPACE = 56;

export const cameraPhysicsDrafts: DraftEntry[] = [
  {
    id: "hyperspace",
    component: () => (
      <TransitionDemo
        presentation={hyperspace()}
        transitionFrames={HYPERSPACE}
      />
    ),
    durationInFrames: transitionDemoDuration(HYPERSPACE),
  },
  {
    id: "parallax-depth",
    component: () => <ParallaxDepth />,
    durationInFrames: 80,
  },
  {
    id: "dolly-zoom",
    component: () => <DollyZoom />,
    durationInFrames: 60,
  },
  {
    id: "turntable",
    component: () => <Turntable />,
    durationInFrames: 90,
  },
  {
    id: "gravity-pile",
    component: () => <GravityPile />,
    durationInFrames: 90,
  },
  {
    id: "cloth-reveal",
    component: () => (
      <ClothReveal>
        <DemoLogo />
      </ClothReveal>
    ),
    durationInFrames: 60,
  },
  {
    id: "exploded-view",
    component: () => <ExplodedView />,
    durationInFrames: 64,
  },
  {
    id: "tiny-planet",
    component: () => <TinyPlanet />,
    durationInFrames: 100,
  },
  {
    id: "impact-shake",
    component: () => (
      <ImpactShake>
        <DemoLogo />
      </ImpactShake>
    ),
    durationInFrames: 40,
  },
];
