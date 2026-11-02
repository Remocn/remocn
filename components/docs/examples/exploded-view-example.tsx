"use client";

import {
  ExplodedView,
  type ExplodedViewProps,
} from "@/registry/remocn/exploded-view";

const DEFAULT_LABELS = "Interface, Engine, Storage, Hardware";

// The customizer edits labels as one comma-separated string.
const toLabels = (text: string) => text.split(",").map((label) => label.trim());

type ExplodedViewExampleProps = Omit<ExplodedViewProps, "labels"> & {
  labels?: string;
};

export function ExplodedViewExampleScene({
  labels = DEFAULT_LABELS,
  ...props
}: ExplodedViewExampleProps) {
  return <ExplodedView {...props} labels={toLabels(labels)} />;
}

export const explodedViewExampleCode = (
  values: Record<string, unknown>,
): string => {
  const layers = (values.layers as number) ?? 4;
  const highlight = (values.highlight as number) ?? 1;
  const labels = toLabels((values.labels as string) ?? DEFAULT_LABELS);
  const background = (values.backgroundColor as string) ?? "#111111";
  const label = (values.labelColor as string) ?? "#FFFFFF";
  const speed = (values.speed as number) ?? 1;
  const speedLine = speed === 1 ? "" : `\n    speed={${speed}}`;
  return `import { ExplodedView } from "@/components/remocn/exploded-view";

export const MyScene = () => (
  <ExplodedView
    layers={${layers}}
    highlight={${highlight}}
    labels={${JSON.stringify(labels)}}
    backgroundColor="${background}"
    labelColor="${label}"${speedLine}
  />
);`;
};
