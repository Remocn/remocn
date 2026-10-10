"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionBlurIn } from "@/registry/remocn/caption-blur-in";

interface CaptionBlurInExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  blur?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionBlurInExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  blur,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionBlurInExampleProps) {
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
      <CaptionBlurIn
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        blur={blur}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionBlurInExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const blur = (values.blur as number) ?? 12;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    blur !== 12 ? `      blur={${blur}}` : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionBlurIn } from "@/components/remocn/caption-blur-in";
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
    <CaptionBlurIn
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
