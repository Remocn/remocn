"use client";

import {
  TinyPlanet,
  type TinyPlanetProps,
} from "@/registry/remocn/tiny-planet";

export function TinyPlanetExampleScene(props: TinyPlanetProps) {
  return <TinyPlanet {...props} />;
}

export const tinyPlanetExampleCode = (
  values: Record<string, unknown>,
): string => {
  const buildings = (values.buildings as number) ?? 26;
  const spin = (values.spin as number) ?? 0.7;
  const seed = (values.seed as number) ?? 4;
  const sky = (values.skyColor as string) ?? "#111111";
  const sun = (values.sunColor as string) ?? "#E5322D";
  const building = (values.buildingColor as string) ?? "#FFFFFF";
  const ground = (values.groundColor as string) ?? "#262626";
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { TinyPlanet } from "@/components/remocn/tiny-planet";

export const MyScene = () => (
  <TinyPlanet
    buildings={${buildings}}
    spin={${spin}}
    seed={${seed}}
    skyColor="${sky}"
    sunColor="${sun}"
    buildingColor="${building}"
    groundColor="${ground}"${speedLine}
  />
);`;
};
