"use client";

import { Backdrop } from "@/registry/remocn/backdrop";
import { Confetti } from "@/registry/remocn/confetti";
import { RollingNumber } from "@/registry/remocn/rolling-number";

export const RollingNumberConfettiExampleScene = () => (
  <Backdrop fill={{ type: "color", value: "#ffffff" }} shadow="0">
    <RollingNumber from={0} to={24813} fontSize={120} />
    <Confetti
      startFrame={168}
      originY={0.5}
      particleCount={160}
      lifetime={42}
      seed={1}
    />
  </Backdrop>
);

export const rollingNumberConfettiExampleCode = `import { Composition } from "remotion";
import { Backdrop } from "@/components/remocn/backdrop";
import { Confetti } from "@/components/remocn/confetti";
import { RollingNumber } from "@/components/remocn/rolling-number";

const RollingNumberConfetti = () => (
  <Backdrop fill={{ type: "color", value: "#ffffff" }} shadow="0">
    <RollingNumber from={0} to={24813} fontSize={120} />
    <Confetti startFrame={168} originY={0.5} particleCount={160} lifetime={42} seed={1} />
  </Backdrop>
);

export const RemotionRoot = () => (
  <Composition
    id="RollingNumberConfetti"
    component={RollingNumberConfetti}
    durationInFrames={210}
    fps={30}
    width={1280}
    height={720}
  />
);`;
