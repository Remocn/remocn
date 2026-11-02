"use client";

import {
  ParallaxDepth,
  type ParallaxDepthProps,
} from "@/registry/remocn/parallax-depth";

type ParallaxDepthExampleProps = Omit<ParallaxDepthProps, "direction"> & {
  // The customizer edits direction as an enum.
  direction?: "right" | "left";
};

export function ParallaxDepthExampleScene({
  direction = "right",
  ...props
}: ParallaxDepthExampleProps) {
  return <ParallaxDepth {...props} direction={direction === "left" ? -1 : 1} />;
}

export const parallaxDepthExampleCode = (
  values: Record<string, unknown>,
): string => {
  const distance = (values.distance as number) ?? 0.5;
  const push = (values.push as number) ?? 0.16;
  const direction = values.direction === "left" ? -1 : 1;
  const seed = (values.seed as number) ?? 3;
  const sky = (values.skyColor as string) ?? "#111111";
  const sun = (values.sunColor as string) ?? "#E5322D";
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { ParallaxDepth } from "@/components/remocn/parallax-depth";

export const MyScene = () => (
  <ParallaxDepth
    distance={${distance}}
    push={${push}}
    direction={${direction}}
    seed={${seed}}
    skyColor="${sky}"
    sunColor="${sun}"${speedLine}
  />
);`;
};
