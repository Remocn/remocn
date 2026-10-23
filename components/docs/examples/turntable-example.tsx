"use client";

import { Turntable, type TurntableProps } from "@/registry/remocn/turntable";

export function TurntableExampleScene(props: TurntableProps) {
  return <Turntable {...props} />;
}

export const turntableExampleCode = (
  values: Record<string, unknown>,
): string => {
  const thickness = (values.thickness as number) ?? 22;
  const turns = (values.turns as number) ?? 1;
  const tilt = (values.tilt as number) ?? 8;
  const front = (values.frontColor as string) ?? "#E5322D";
  const edge = (values.edgeColor as string) ?? "#A3201C";
  const back = (values.backColor as string) ?? "#F2F2F2";
  const background = (values.backgroundColor as string) ?? "#111111";
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { Turntable } from "@/components/remocn/turntable";

export const MyScene = () => (
  <Turntable
    thickness={${thickness}}
    turns={${turns}}
    tilt={${tilt}}
    frontColor="${front}"
    edgeColor="${edge}"
    backColor="${back}"
    backgroundColor="${background}"${speedLine}
  />
);`;
};
