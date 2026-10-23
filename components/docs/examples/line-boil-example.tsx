"use client";

import { LineBoil, lineBoilDefaults } from "@/registry/remocn/line-boil";

interface LineBoilExampleProps {
  line?: string;
  fill?: string;
  background?: string;
  boilEvery?: number;
  drawings?: number;
  amplitude?: number;
  strokeWidth?: number;
  size?: number;
  speed?: number;
}

export function LineBoilExampleScene(props: LineBoilExampleProps) {
  return <LineBoil {...props} />;
}

export const lineBoilExampleCode = (
  values: Record<string, unknown>,
): string => {
  const d = lineBoilDefaults;
  const line = (values.line as string) ?? d.colors.line;
  const fill = (values.fill as string) ?? d.colors.fill;
  const background = (values.background as string) ?? d.colors.background;
  const boilEvery = (values.boilEvery as number) ?? d.boilEvery;
  const drawings = (values.drawings as number) ?? d.drawings;
  const amplitude = (values.amplitude as number) ?? d.amplitude;
  const strokeWidth = (values.strokeWidth as number) ?? d.strokeWidth;
  const size = (values.size as number) ?? d.size;
  const speed = (values.speed as number) ?? 1;
  return `import { LineBoil } from "@/components/remocn/line-boil";

export const MyScene = () => (
  <LineBoil
    line="${line}"
    fill="${fill}"
    background="${background}"
    boilEvery={${boilEvery}}
    drawings={${drawings}}
    amplitude={${amplitude}}
    strokeWidth={${strokeWidth}}
    size={${size}}
    speed={${speed}}
  />
);`;
};
