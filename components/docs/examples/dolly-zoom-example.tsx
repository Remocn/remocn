"use client";

import { DollyZoom, type DollyZoomProps } from "@/registry/remocn/dolly-zoom";

export function DollyZoomExampleScene(props: DollyZoomProps) {
  return <DollyZoom {...props} />;
}

export const dollyZoomExampleCode = (
  values: Record<string, unknown>,
): string => {
  const intensity = (values.intensity as number) ?? 1;
  const reverse = (values.reverse as boolean) ?? false;
  const door = (values.doorColor as string) ?? "#E5322D";
  const figure = (values.figureColor as string) ?? "#FFFFFF";
  const line = (values.lineColor as string) ?? "#FFFFFF";
  const speed = (values.speed as number) ?? 1;
  const reverseLine = reverse ? "\n    reverse" : "";
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { DollyZoom } from "@/components/remocn/dolly-zoom";

export const MyScene = () => (
  <DollyZoom
    intensity={${intensity}}${reverseLine}
    doorColor="${door}"
    figureColor="${figure}"
    lineColor="${line}"${speedLine}
  />
);`;
};
