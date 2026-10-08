"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionSplitFlap } from "@/registry/remocn/caption-split-flap";

interface CaptionSplitFlapExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  tileColor?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
}

export function CaptionSplitFlapExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  tileColor,
  combineTokensWithinMilliseconds,
  holdMs,
}: CaptionSplitFlapExampleProps) {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * 0.1,
        paddingInline: width * 0.08,
      }}
    >
      <CaptionSplitFlap
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        tileColor={tileColor}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
      />
    </AbsoluteFill>
  );
}

export const captionSplitFlapExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 56;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const tileColor = (values.tileColor as string) ?? "#111111";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1000;
  const holdMs = (values.holdMs as number) ?? 600;
  const extra = [
    combine !== 1000
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionSplitFlap } from "@/components/remocn/caption-split-flap";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
      paddingInline: 154,
    }}
  >
    <CaptionSplitFlap
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      tileColor="${tileColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
