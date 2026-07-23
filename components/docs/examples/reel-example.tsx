"use client";

import { staticFile } from "remotion";
import { Reel } from "@/registry/remocn/reel";

const DEMO_IMAGES = [
  staticFile("reel/reel-1.jpg"),
  staticFile("reel/reel-2.jpg"),
  staticFile("reel/reel-3.jpg"),
  staticFile("reel/reel-4.jpg"),
  staticFile("reel/reel-5.jpg"),
  staticFile("reel/reel-6.jpg"),
];

export function ReelExampleScene({
  width,
  height,
  radius,
  step,
  reveal,
}: {
  width?: number;
  height?: number;
  radius?: number;
  step?: number;
  reveal?: number;
}) {
  return (
    <Reel
      images={DEMO_IMAGES}
      width={width}
      height={height}
      radius={radius}
      step={step}
      reveal={reveal}
    />
  );
}

export const reelExampleCode = (values: Record<string, unknown>): string => {
  const width = (values.width as number) ?? 1180;
  const height = (values.height as number) ?? 676;
  const radius = (values.radius as number) ?? 16;
  const step = (values.step as number) ?? 20;
  const reveal = (values.reveal as number) ?? 13;
  return `import { staticFile } from "remotion";
import { Reel } from "@/components/remocn/reel";

export const MyScene = () => (
  <Reel
    images={[
      staticFile("shot-1.png"),
      staticFile("shot-2.png"),
      staticFile("shot-3.png"),
    ]}
    width={${width}}
    height={${height}}
    radius={${radius}}
    step={${step}}
    reveal={${reveal}}
  />
);`;
};
