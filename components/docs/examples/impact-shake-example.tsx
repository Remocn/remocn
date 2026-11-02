"use client";

import {
  ImpactShake,
  type ImpactShakeProps,
} from "@/registry/remocn/impact-shake";

export function ImpactShakeExampleScene(props: ImpactShakeProps) {
  return <ImpactShake {...props} />;
}

export const impactShakeExampleCode = (
  values: Record<string, unknown>,
): string => {
  const text = (values.text as string) ?? "LAUNCH";
  const intensity = (values.intensity as number) ?? 1;
  const impact = (values.impact as number) ?? 7;
  const foreground = (values.foregroundColor as string) ?? "#FFFFFF";
  const background = (values.backgroundColor as string) ?? "#111111";
  const seed = (values.seed as number) ?? 1;
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { ImpactShake } from "@/components/remocn/impact-shake";

export const MyScene = () => (
  <ImpactShake
    text=${JSON.stringify(text)}
    intensity={${intensity}}
    impact={${impact}}
    foregroundColor="${foreground}"
    backgroundColor="${background}"
    seed={${seed}}${speedLine}
  />
);`;
};
