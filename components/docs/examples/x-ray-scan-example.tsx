"use client";

import {
  XRayScan,
  type XRayScanProps,
  xRayScanDefaults,
} from "@/registry/remocn/x-ray-scan";

interface XRayScanExampleProps {
  direction?: XRayScanProps["direction"];
  shell?: string;
  accent?: string;
  line?: string;
  background?: string;
  speed?: number;
}

export function XRayScanExampleScene(props: XRayScanExampleProps) {
  return <XRayScan {...props} />;
}

export const xRayScanExampleCode = (
  values: Record<string, unknown>,
): string => {
  const d = xRayScanDefaults;
  const direction = (values.direction as string) ?? d.direction;
  const shell = (values.shell as string) ?? d.colors.shell;
  const accent = (values.accent as string) ?? d.colors.accent;
  const line = (values.line as string) ?? d.colors.line;
  const background = (values.background as string) ?? d.colors.background;
  const speed = (values.speed as number) ?? 1;
  return `import { XRayScan } from "@/components/remocn/x-ray-scan";

export const MyScene = () => (
  <XRayScan
    direction="${direction}"
    shell="${shell}"
    accent="${accent}"
    line="${line}"
    background="${background}"
    speed={${speed}}
  />
);`;
};
