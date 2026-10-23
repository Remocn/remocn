"use client";

import { RisoPrint, risoPrintDefaults } from "@/registry/remocn/riso-print";

interface RisoPrintExampleProps {
  keyInk?: string;
  accentInk?: string;
  paper?: string;
  grain?: number;
  jitter?: number;
  marks?: boolean;
  speed?: number;
}

export function RisoPrintExampleScene(props: RisoPrintExampleProps) {
  return <RisoPrint {...props} />;
}

export const risoPrintExampleCode = (
  values: Record<string, unknown>,
): string => {
  const keyInk = (values.keyInk as string) ?? risoPrintDefaults.inks[0];
  const accentInk = (values.accentInk as string) ?? risoPrintDefaults.inks[1];
  const paper = (values.paper as string) ?? risoPrintDefaults.paper;
  const grain = (values.grain as number) ?? risoPrintDefaults.grain;
  const jitter = (values.jitter as number) ?? risoPrintDefaults.jitter;
  const marks = (values.marks as boolean) ?? risoPrintDefaults.marks;
  const speed = (values.speed as number) ?? 1;
  return `import { RisoPrint } from "@/components/remocn/riso-print";

export const MyScene = () => (
  <RisoPrint
    keyInk="${keyInk}"
    accentInk="${accentInk}"
    paper="${paper}"
    grain={${grain}}
    jitter={${jitter}}
    marks={${marks}}
    speed={${speed}}
  />
);`;
};
