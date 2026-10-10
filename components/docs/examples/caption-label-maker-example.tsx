"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionLabelMaker } from "@/registry/remocn/caption-label-maker";

interface CaptionLabelMakerExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  tapeColor?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
}

export function CaptionLabelMakerExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  tapeColor,
  combineTokensWithinMilliseconds,
  holdMs,
}: CaptionLabelMakerExampleProps) {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * 0.1,
        paddingInline: width * 0.1,
      }}
    >
      <CaptionLabelMaker
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        tapeColor={tapeColor}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
      />
    </AbsoluteFill>
  );
}

export const captionLabelMakerExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const tapeColor = (values.tapeColor as string) ?? "#18181b";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1000;
  const holdMs = (values.holdMs as number) ?? 600;
  const extra = [
    combine !== 1000
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionLabelMaker } from "@/components/remocn/caption-label-maker";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
      paddingInline: 192,
    }}
  >
    <CaptionLabelMaker
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      tapeColor="${tapeColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
