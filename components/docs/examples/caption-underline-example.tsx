"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionUnderline } from "@/registry/remocn/caption-underline";

interface CaptionUnderlineExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  underlineColor?: string;
  thickness?: number;
  underlineOffset?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionUnderlineExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  underlineColor,
  thickness,
  underlineOffset,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionUnderlineExampleProps) {
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
      <CaptionUnderline
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        underlineColor={underlineColor}
        thickness={thickness}
        underlineOffset={underlineOffset}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionUnderlineExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const underlineColor = (values.underlineColor as string) ?? "#facc15";
  const thickness = (values.thickness as number) ?? 0.08;
  const underlineOffset = (values.underlineOffset as number) ?? 0.02;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    thickness !== 0.08 ? `      thickness={${thickness}}` : null,
    underlineOffset !== 0.02
      ? `      underlineOffset={${underlineOffset}}`
      : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionUnderline } from "@/components/remocn/caption-underline";
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
    <CaptionUnderline
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      underlineColor="${underlineColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
