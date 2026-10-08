"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionSubtitle } from "@/registry/remocn/caption-subtitle";

interface CaptionSubtitleExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  box?: boolean;
  boxColor?: string;
  boxOpacity?: number;
}

export function CaptionSubtitleExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  combineTokensWithinMilliseconds,
  holdMs,
  box,
  boxColor,
  boxOpacity,
}: CaptionSubtitleExampleProps) {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * 0.1,
        paddingInline: width * 0.2,
      }}
    >
      <CaptionSubtitle
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        box={box}
        boxColor={boxColor}
        boxOpacity={boxOpacity}
      />
    </AbsoluteFill>
  );
}

export const captionSubtitleExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 44;
  const fontWeight = (values.fontWeight as number) ?? 600;
  const color = (values.color as string) ?? "#ffffff";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 2500;
  const holdMs = (values.holdMs as number) ?? 600;
  const box = (values.box as boolean) ?? true;
  const boxColor = (values.boxColor as string) ?? "#000000";
  const boxOpacity = (values.boxOpacity as number) ?? 0.72;
  const extra = [
    combine !== 2500
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    box ? null : "      box={false}",
    box && boxColor !== "#000000" ? `      boxColor="${boxColor}"` : null,
    box && boxOpacity !== 0.72 ? `      boxOpacity={${boxOpacity}}` : null,
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionSubtitle } from "@/components/remocn/caption-subtitle";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
      paddingInline: 384,
    }}
  >
    <CaptionSubtitle
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
