"use client";

import {
  GravityPile,
  type GravityPileProps,
} from "@/registry/remocn/gravity-pile";

export function GravityPileExampleScene(props: GravityPileProps) {
  return <GravityPile {...props} />;
}

export const gravityPileExampleCode = (
  values: Record<string, unknown>,
): string => {
  const count = (values.count as number) ?? 30;
  const gravity = (values.gravity as number) ?? 1;
  const seed = (values.seed as number) ?? 7;
  const accent = (values.accentColor as string) ?? "#E5322D";
  const background = (values.backgroundColor as string) ?? "#111111";
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { GravityPile } from "@/components/remocn/gravity-pile";

export const MyScene = () => (
  <GravityPile
    count={${count}}
    gravity={${gravity}}
    seed={${seed}}
    accentColor="${accent}"
    backgroundColor="${background}"${speedLine}
  />
);`;
};
