"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionRise } from "@/registry/remocn/caption-rise";

interface CaptionRiseExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionRiseExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionRiseExampleProps) {
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
      <CaptionRise
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionRiseExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionRise } from "@/components/remocn/caption-rise";
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
    <CaptionRise
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
