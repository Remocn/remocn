"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionTypewriter } from "@/registry/remocn/caption-typewriter";

interface CaptionTypewriterExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  caret?: boolean;
  shadow?: boolean;
}

export function CaptionTypewriterExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  combineTokensWithinMilliseconds,
  holdMs,
  caret,
  shadow,
}: CaptionTypewriterExampleProps) {
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
      <CaptionTypewriter
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        caret={caret}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionTypewriterExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const caret = (values.caret as boolean) ?? true;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    caret ? null : "      caret={false}",
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionTypewriter } from "@/components/remocn/caption-typewriter";
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
    <CaptionTypewriter
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
