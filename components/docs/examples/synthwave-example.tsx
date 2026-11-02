"use client";

import { Synthwave, synthwaveDefaults } from "@/registry/remocn/synthwave";

interface SynthwaveExampleProps {
  grid?: string;
  sunTop?: string;
  sunBottom?: string;
  skyHorizon?: string;
  gridSpeed?: number;
  horizon?: number;
  sunStripes?: boolean;
  speed?: number;
}

export function SynthwaveExampleScene(props: SynthwaveExampleProps) {
  return <Synthwave {...props} />;
}

export const synthwaveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const d = synthwaveDefaults;
  const grid = (values.grid as string) ?? d.colors.grid;
  const sunTop = (values.sunTop as string) ?? d.colors.sunTop;
  const sunBottom = (values.sunBottom as string) ?? d.colors.sunBottom;
  const skyHorizon = (values.skyHorizon as string) ?? d.colors.skyHorizon;
  const gridSpeed = (values.gridSpeed as number) ?? d.gridSpeed;
  const horizon = (values.horizon as number) ?? d.horizon;
  const sunStripes = (values.sunStripes as boolean) ?? d.sunStripes;
  const speed = (values.speed as number) ?? 1;
  return `import { Synthwave } from "@/components/remocn/synthwave";

export const MyBackground = () => (
  <Synthwave
    grid="${grid}"
    sunTop="${sunTop}"
    sunBottom="${sunBottom}"
    skyHorizon="${skyHorizon}"
    gridSpeed={${gridSpeed}}
    horizon={${horizon}}
    sunStripes={${sunStripes}}
    speed={${speed}}
  />
);`;
};
