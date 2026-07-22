"use client";

import { AbsoluteFill } from "remotion";
import { CheckList } from "@/registry/remocn/check-list";

const WIDTH = 820;

export const ITEMS = [
  "Render on your own machine",
  "No watermark, ever",
  "Every component MIT",
  { text: "Ships as source", checked: false },
];

const ITEMS_SOURCE = `[
  "Render on your own machine",
  "No watermark, ever",
  "Every component MIT",
  { text: "Ships as source", checked: false },
]`;

export function CheckListExampleScene({
  fontSize,
  itemGap,
  closeGap,
  perStep,
  strokeWidth,
  color,
  tickColor,
  step,
}: {
  fontSize?: number;
  itemGap?: number;
  closeGap?: number;
  perStep?: number;
  strokeWidth?: number;
  color?: string;
  tickColor?: string;
  step?: number;
}) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <CheckList
        items={ITEMS}
        width={WIDTH}
        fontSize={fontSize}
        itemGap={itemGap}
        closeGap={closeGap}
        perStep={perStep}
        strokeWidth={strokeWidth}
        color={color}
        tickColor={tickColor}
        step={step}
      />
    </AbsoluteFill>
  );
}

export const checkListExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 40;
  const itemGap = (values.itemGap as number) ?? 18;
  const closeGap = (values.closeGap as number) ?? 9;
  const perStep = (values.perStep as number) ?? 1.6;
  const strokeWidth = (values.strokeWidth as number) ?? 3;
  const color = (values.color as string) ?? "#26242c";
  const tickColor = (values.tickColor as string) ?? "#6f7f35";
  const step = (values.step as number) ?? 3;
  return `import { AbsoluteFill } from "remotion";
import { CheckList } from "@/components/remocn/check-list";

const items = ${ITEMS_SOURCE};

export const MyScene = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <CheckList
      items={items}
      width={${WIDTH}}
      fontSize={${fontSize}}
      itemGap={${itemGap}}
      closeGap={${closeGap}}
      perStep={${perStep}}
      strokeWidth={${strokeWidth}}
      color="${color}"
      tickColor="${tickColor}"
      step={${step}}
    />
  </AbsoluteFill>
);`;
};
